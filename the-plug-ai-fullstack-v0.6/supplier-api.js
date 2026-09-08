const crypto=require('crypto');

module.exports=function createSupplierApi({db,json,readJson,adminAuthorized,adminChallenge}){
  const WORKER_URL=String(process.env.SUPPLIER_WORKER_URL||'').replace(/\/$/,'');
  const WORKER_SECRET=String(process.env.SUPPLIER_WORKER_SECRET||'');
  const USD_SAR_RATE=Number(process.env.SUPPLIER_USD_SAR_RATE||3.75);
  const cache=new Map();
  const clean=v=>String(v??'').trim();
  const round2=n=>Math.round((Number(n||0)+Number.EPSILON)*100)/100;
  const normalize=v=>clean(v).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  function ready(){return !!WORKER_URL&&!!WORKER_SECRET}
  async function worker(pathname,opts={}){
    if(!ready())throw new Error('Supplier worker is not configured');
    const r=await fetch(WORKER_URL+pathname,{...opts,headers:{authorization:`Bearer ${WORKER_SECRET}`,'content-type':'application/json',...(opts.headers||{})}});
    let j={};try{j=await r.json()}catch{}
    if(!r.ok)throw new Error(j.error||`Supplier worker returned ${r.status}`);
    return j;
  }
  function normalizeAddress(a={}){return{first_name:clean(a.first_name),last_name:clean(a.last_name),address1:clean(a.address1||a.address),address2:clean(a.address2),city:clean(a.city),postal_code:clean(a.postal_code||a.zip),phone:clean(a.phone),country:'Saudi Arabia'}}
  function titleScore(a,b){
    const aa=normalize(a),bb=normalize(b);if(!aa||!bb)return 0;if(aa===bb)return 1;
    const A=new Set(aa.split(' ').filter(x=>x.length>1)),B=new Set(bb.split(' ').filter(x=>x.length>1));
    let common=0;for(const x of A)if(B.has(x))common++;
    const union=new Set([...A,...B]).size||1;
    const jaccard=common/union;
    const coverage=common/Math.max(1,Math.min(A.size,B.size));
    return jaccard*0.55+coverage*0.45;
  }
  function resolveProduct(item){
    const id=Number(item?.product_id||item?.id);
    if(Number.isFinite(id)){
      const row=db.prepare('SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE id=?').get(id);
      if(row)return row;
    }
    const sku=clean(item?.sku||item?.mfg_part_id||item?.mfg||item?.part_number);
    if(sku){
      const rows=db.prepare('SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE lower(mfg_part_id)=lower(?) ORDER BY id DESC LIMIT 5').all(sku);
      if(rows.length===1)return rows[0];
      const valv=rows.find(r=>/valvetronic/i.test(clean(r.brand_name)));if(valv)return valv;
    }
    const title=clean(item?.title||item?.name);
    if(title){
      const rows=db.prepare('SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE lower(title)=lower(?) ORDER BY id DESC LIMIT 5').all(title);
      const valv=rows.filter(r=>/valvetronic/i.test(clean(r.brand_name)));
      if(valv.length===1)return valv[0];
      if(rows.length===1)return rows[0];

      const normalizedTitle=normalize(title);
      const candidates=db.prepare("SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE lower(brand_name) LIKE '%valvetronic%' ORDER BY id DESC").all();
      const exactNormalized=candidates.filter(r=>normalize(r.title)===normalizedTitle);
      if(exactNormalized.length===1)return exactNormalized[0];
      const ranked=candidates.map(r=>({r,score:titleScore(title,r.title)})).sort((a,b)=>b.score-a.score);
      if(ranked[0]){
        const best=ranked[0],second=ranked[1]?.score||0;
        if(best.score>=0.88||(best.score>=0.72&&best.score-second>=0.10))return best.r;
      }
    }
    return null;
  }
  function cacheKey(items,address){return crypto.createHash('sha256').update(JSON.stringify({items:(items||[]).map(x=>[x.product_id||x.id||x.sku||x.title,x.qty||1]),address})).digest('hex')}
  function toSar(amount,currency){const n=round2(amount),c=String(currency||'USD').toUpperCase();if(c==='SAR')return n;if(c==='USD')return round2(n*USD_SAR_RATE);return null}
  async function quote(req,res){
    const d=await readJson(req),items=Array.isArray(d.items)?d.items:[],address=normalizeAddress(d.address||{});
    if(!items.length)return json(res,{error:'No products were supplied for shipping quote.'},400);
    if(!address.address1||!address.city||!address.postal_code)return json(res,{error:'Complete the delivery address to calculate supplier shipping.'},400);
    const resolved=items.map((item,index)=>({item,index,product:resolveProduct(item)}));
    const unresolved=resolved.filter(x=>!x.product);
    if(unresolved.length)return json(res,{error:'One or more cart items could not be matched to the product catalog. Please reopen the product from the store and add it to cart again.',unmatched_items:unresolved.map(x=>({index:x.index,title:clean(x.item?.title||x.item?.name),sku:clean(x.item?.sku||x.item?.mfg_part_id)}))},400);
    const rows=resolved.map(x=>x.product);
    const unsupported=rows.filter(x=>!/valvetronic/i.test(clean(x.brand_name)));
    if(unsupported.length)return json(res,{error:'Live supplier shipping is currently enabled for Valvetronic products only.',unsupported:unsupported.map(x=>({id:x.id,brand:x.brand_name,title:x.title}))},409);
    const payloadItems=resolved.map(({item,product:p})=>({product_id:p.id,sku:p.mfg_part_id,title:p.title,qty:Math.max(1,Number(item.qty||1))}));
    const key=cacheKey(payloadItems,address),hit=cache.get(key);if(hit&&Date.now()-hit.at<5*60*1000)return json(res,{...hit.value,cached:true});
    let q;try{q=await worker('/suppliers/valvetronic/quote',{method:'POST',body:JSON.stringify({items:payloadItems,address})})}catch(e){return json(res,{error:String(e.message||e),supplier:'Valvetronic Designs',quote_available:false},502)}
    if(q.reauth_required)return json(res,{error:'Valvetronic dealer account needs to be reauthenticated.',reauth_required:true,supplier:'Valvetronic Designs'},503);
    if(q.available===false){const value={supplier:'Valvetronic Designs',available:false,stocks:q.stocks||[],quote_available:true};cache.set(key,{at:Date.now(),value});return json(res,value)}
    if(!q.ok||!q.shipping||!Number.isFinite(Number(q.shipping.amount)))return json(res,{error:q.error||'Supplier shipping rate was not returned.',supplier:'Valvetronic Designs',diagnostic:q.diagnostic||null},502);
    const sourceCurrency=String(q.shipping.source_currency||'USD').toUpperCase();const sourceAmount=round2(q.shipping.amount);const amountSar=toSar(sourceAmount,sourceCurrency);if(amountSar===null)return json(res,{error:`Unsupported supplier shipping currency: ${sourceCurrency}`},502);
    const allRates=(Array.isArray(q.shipping.all_rates)?q.shipping.all_rates:[]).map(r=>{const c=String(r.currency||sourceCurrency).toUpperCase(),sar=toSar(r.price,c);return sar===null?null:{name:clean(r.name)||'Shipping',amount_sar:sar,source_amount:round2(r.price),source_currency:c}}).filter(Boolean).sort((a,b)=>a.amount_sar-b.amount_sar);
    const value={supplier:'Valvetronic Designs',available:true,amount_sar:amountSar,shipping:{amount_sar:amountSar,source_amount:sourceAmount,source_currency:sourceCurrency,method:q.shipping.method||'Supplier shipping',quoted_at:q.shipping.quoted_at||new Date().toISOString(),all_rates:allRates},stocks:q.stocks||[],quote_available:true,rate_source:q.rate_source||null};cache.set(key,{at:Date.now(),value});return json(res,value)
  }
  async function admin(req,res,u){
    if(!adminAuthorized(req))return adminChallenge(res);
    if(u.pathname==='/api/admin/suppliers/valvetronic/status'&&req.method==='GET'){try{return json(res,{configured:ready(),worker:await worker('/suppliers/valvetronic/status')})}catch(e){return json(res,{configured:ready(),error:String(e.message||e)},502)}}
    if(u.pathname==='/api/admin/suppliers/valvetronic/auth/start'&&req.method==='POST'){const d=await readJson(req);try{return json(res,await worker('/suppliers/valvetronic/auth/start',{method:'POST',body:JSON.stringify({email:clean(d.email)})}))}catch(e){return json(res,{error:String(e.message||e)},502)}}
    if(u.pathname==='/api/admin/suppliers/valvetronic/auth/verify'&&req.method==='POST'){const d=await readJson(req);try{return json(res,await worker('/suppliers/valvetronic/auth/verify',{method:'POST',body:JSON.stringify({code:clean(d.code)})}))}catch(e){return json(res,{error:String(e.message||e)},502)}}
    if(u.pathname==='/api/admin/suppliers/valvetronic/auth/cancel'&&req.method==='POST'){try{return json(res,await worker('/suppliers/valvetronic/auth/cancel',{method:'POST',body:'{}'}))}catch(e){return json(res,{error:String(e.message||e)},502)}}
    return false;
  }
  return{quote,admin};
};
