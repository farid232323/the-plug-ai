const crypto=require('crypto');

module.exports=function createSupplierApi({db,json,readJson,adminAuthorized,adminChallenge}){
  const WORKER_URL=String(process.env.SUPPLIER_WORKER_URL||'').replace(/\/$/,'');
  const WORKER_SECRET=String(process.env.SUPPLIER_WORKER_SECRET||'');
  const USD_SAR_RATE=Number(process.env.SUPPLIER_USD_SAR_RATE||3.75);
  const GBP_SAR_RATE=Number(process.env.SUPPLIER_GBP_SAR_RATE||0);
  const EUR_SAR_RATE=Number(process.env.SUPPLIER_EUR_SAR_RATE||0);
  const cache=new Map();
  const clean=v=>String(v??'').trim();
  const round2=n=>Math.round((Number(n||0)+Number.EPSILON)*100)/100;
  const normalize=v=>clean(v).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  function ready(){return !!WORKER_URL&&!!WORKER_SECRET}
  async function worker(pathname,opts={}){if(!ready())throw new Error('Supplier worker is not configured');const r=await fetch(WORKER_URL+pathname,{...opts,headers:{authorization:`Bearer ${WORKER_SECRET}`,'content-type':'application/json',...(opts.headers||{})}});let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||`Supplier worker returned ${r.status}`);return j}
  function normalizeAddress(a={}){return{first_name:clean(a.first_name),last_name:clean(a.last_name),address1:clean(a.address1||a.address),address2:clean(a.address2),district:clean(a.district),city:clean(a.city),region:clean(a.region),postal_code:clean(a.postal_code||a.zip),phone:clean(a.phone),country:'Saudi Arabia'}}
  function titleScore(a,b){const aa=normalize(a),bb=normalize(b);if(!aa||!bb)return 0;if(aa===bb)return 1;const A=new Set(aa.split(' ').filter(x=>x.length>1)),B=new Set(bb.split(' ').filter(x=>x.length>1));let common=0;for(const x of A)if(B.has(x))common++;const union=new Set([...A,...B]).size||1;return common/union*.55+common/Math.max(1,Math.min(A.size,B.size))*.45}
  function resolveProduct(item){
    const id=Number(item?.product_id||item?.id);if(Number.isFinite(id)){const row=db.prepare('SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE id=?').get(id);if(row)return row}
    const sku=clean(item?.sku||item?.mfg_part_id||item?.mfg||item?.part_number);if(sku){const rows=db.prepare('SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE lower(mfg_part_id)=lower(?) ORDER BY id DESC LIMIT 10').all(sku);if(rows.length===1)return rows[0]}
    const title=clean(item?.title||item?.name);if(title){const rows=db.prepare('SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE lower(title)=lower(?) ORDER BY id DESC LIMIT 10').all(title);if(rows.length===1)return rows[0];const brand=clean(item?.brand_name||item?.brand);const candidates=brand?db.prepare('SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE lower(brand_name)=lower(?) ORDER BY id DESC').all(brand):db.prepare('SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products ORDER BY id DESC LIMIT 1500').all();const ranked=candidates.map(r=>({r,score:titleScore(title,r.title)})).sort((a,b)=>b.score-a.score);if(ranked[0]){const second=ranked[1]?.score||0;if(ranked[0].score>=.9||(ranked[0].score>=.76&&ranked[0].score-second>=.1))return ranked[0].r}}
    return null
  }
  function cacheKey(items,address){return crypto.createHash('sha256').update(JSON.stringify({items:items.map(x=>[x.product_id,x.brand,x.sku,x.qty]),address})).digest('hex')}
  function toSar(amount,currency){const n=round2(amount),c=String(currency||'USD').toUpperCase();if(c==='SAR')return n;if(c==='USD')return round2(n*USD_SAR_RATE);if(c==='GBP'&&GBP_SAR_RATE>0)return round2(n*GBP_SAR_RATE);if(c==='EUR'&&EUR_SAR_RATE>0)return round2(n*EUR_SAR_RATE);return null}
  async function quoteOne(brand,items,address){const q=await worker('/suppliers/quote',{method:'POST',body:JSON.stringify({brand,items,address})});if(q.reauth_required)return{error:`${q.supplier||brand} account requires reauthentication.`,reauth_required:true,supplier:q.supplier||brand};if(q.available===false)return{supplier:q.supplier||brand,available:false,stocks:q.stocks||[],quote_available:true};if(!q.ok||!q.shipping||!Number.isFinite(Number(q.shipping.amount)))return{error:q.error||`${q.supplier||brand} did not return a shipping rate.`,supplier:q.supplier||brand,diagnostic:q.diagnostic||null};const sourceCurrency=String(q.shipping.source_currency||'USD').toUpperCase(),sourceAmount=round2(q.shipping.amount),amountSar=toSar(sourceAmount,sourceCurrency);if(amountSar===null)return{error:`Currency ${sourceCurrency} is not configured for SAR conversion. Add the supplier FX rate in Railway.`,supplier:q.supplier||brand,currency:sourceCurrency};return{supplier:q.supplier||brand,available:true,amount_sar:amountSar,shipping:{amount_sar:amountSar,source_amount:sourceAmount,source_currency:sourceCurrency,method:q.shipping.method||'Supplier shipping',quoted_at:q.shipping.quoted_at||new Date().toISOString()},stocks:q.stocks||[],quote_available:true,rate_source:q.rate_source||null}}
  async function quote(req,res){
    const d=await readJson(req),raw=Array.isArray(d.items)?d.items:[],address=normalizeAddress(d.address||{});if(!raw.length)return json(res,{error:'No products were supplied for shipping quote.'},400);if(!address.address1||!address.city||!address.postal_code)return json(res,{error:'Complete the delivery address to calculate supplier shipping.'},400);
    const resolved=raw.map((item,index)=>({item,index,product:resolveProduct(item)})),unresolved=resolved.filter(x=>!x.product);if(unresolved.length)return json(res,{error:'One or more cart items could not be matched to the product catalog. Please reopen the product from the store and add it to cart again.',unmatched_items:unresolved.map(x=>({index:x.index,title:clean(x.item?.title||x.item?.name),sku:clean(x.item?.sku||x.item?.mfg_part_id)}))},400);
    const groups=new Map();for(const {item,product:p} of resolved){const brand=clean(p.brand_name)||'Unknown';if(!groups.has(brand))groups.set(brand,[]);groups.get(brand).push({product_id:p.id,brand,sku:p.mfg_part_id,title:p.title,qty:Math.max(1,Number(item.qty||1))})}
    const flat=[...groups.entries()].flatMap(([brand,items])=>items.map(x=>({...x,brand}))),key=cacheKey(flat,address),hit=cache.get(key);if(hit&&Date.now()-hit.at<5*60*1000)return json(res,{...hit.value,cached:true});
    const breakdown=[];for(const [brand,items] of groups){let q;try{q=await quoteOne(brand,items,address)}catch(e){return json(res,{error:String(e.message||e),supplier:brand,quote_available:false},502)}if(q.error)return json(res,q,q.reauth_required?503:502);breakdown.push(q)}
    if(breakdown.some(x=>x.available===false)){const value={available:false,quote_available:true,suppliers:breakdown,stocks:breakdown.flatMap(x=>x.stocks||[])};cache.set(key,{at:Date.now(),value});return json(res,value)}
    const total=round2(breakdown.reduce((s,x)=>s+Number(x.amount_sar||0),0));const value={available:true,amount_sar:total,shipping:{amount_sar:total,method:breakdown.length>1?'Combined live supplier shipping':breakdown[0]?.shipping?.method||'Live supplier shipping',quoted_at:new Date().toISOString(),supplier_breakdown:breakdown.map(x=>({supplier:x.supplier,amount_sar:x.amount_sar,method:x.shipping?.method,source_amount:x.shipping?.source_amount,source_currency:x.shipping?.source_currency}))},suppliers:breakdown,stocks:breakdown.flatMap(x=>x.stocks||[]),quote_available:true};cache.set(key,{at:Date.now(),value});return json(res,value)
  }
  async function admin(req,res,u){
    if(!adminAuthorized(req))return adminChallenge(res);
    if(u.pathname==='/api/admin/suppliers'&&req.method==='GET'){try{return json(res,{configured:ready(),...(await worker('/suppliers'))})}catch(e){return json(res,{configured:ready(),error:String(e.message||e)},502)}}
    if(u.pathname==='/api/admin/suppliers/configure'&&req.method==='POST'){const d=await readJson(req);try{return json(res,await worker('/suppliers/configure',{method:'POST',body:JSON.stringify(d)}))}catch(e){return json(res,{error:String(e.message||e)},502)}}
    const m=u.pathname.match(/^\/api\/admin\/suppliers\/([^/]+)\/(status|auth\/start|auth\/verify|auth\/cancel|auth\/otp)$/);if(m){const slug=m[1],action=m[2];try{if(action==='status'&&req.method==='GET')return json(res,{configured:ready(),worker:await worker(`/suppliers/${slug}/status`)});if(req.method==='POST'){const d=await readJson(req);return json(res,await worker(`/suppliers/${slug}/${action}`,{method:'POST',body:JSON.stringify(d)}))}}catch(e){return json(res,{error:String(e.message||e)},502)}}
    return false
  }
  return{quote,admin};
};
