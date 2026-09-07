const crypto=require('crypto');

module.exports=function createSupplierApi({db,json,readJson,adminAuthorized,adminChallenge}){
  const WORKER_URL=String(process.env.SUPPLIER_WORKER_URL||'').replace(/\/$/,'');
  const WORKER_SECRET=String(process.env.SUPPLIER_WORKER_SECRET||'');
  const USD_SAR_RATE=Number(process.env.SUPPLIER_USD_SAR_RATE||3.75);
  const cache=new Map();
  const clean=v=>String(v??'').trim();
  const round2=n=>Math.round((Number(n||0)+Number.EPSILON)*100)/100;
  function ready(){return !!WORKER_URL&&!!WORKER_SECRET}
  async function worker(pathname,opts={}){
    if(!ready())throw new Error('Supplier worker is not configured');
    const r=await fetch(WORKER_URL+pathname,{...opts,headers:{authorization:`Bearer ${WORKER_SECRET}`,'content-type':'application/json',...(opts.headers||{})}});
    let j={};try{j=await r.json()}catch{}
    if(!r.ok)throw new Error(j.error||`Supplier worker returned ${r.status}`);
    return j;
  }
  function normalizeAddress(a={}){return{first_name:clean(a.first_name),last_name:clean(a.last_name),address1:clean(a.address1||a.address),address2:clean(a.address2),city:clean(a.city),postal_code:clean(a.postal_code||a.zip),phone:clean(a.phone),country:'Saudi Arabia'}}
  function productRows(items){const ids=[...new Set((items||[]).map(x=>Number(x.product_id||x.id)).filter(Number.isFinite))];if(!ids.length)return [];const qs=ids.map(()=>'?').join(',');return db.prepare(`SELECT id,brand_name,mfg_part_id,title,price_sar,status FROM products WHERE id IN (${qs})`).all(...ids)}
  function cacheKey(items,address){return crypto.createHash('sha256').update(JSON.stringify({items:(items||[]).map(x=>[x.product_id||x.id,x.qty||1]),address})).digest('hex')}
  async function quote(req,res){const d=await readJson(req),items=Array.isArray(d.items)?d.items:[],address=normalizeAddress(d.address||{});if(!items.length)return json(res,{error:'No products were supplied for shipping quote.'},400);if(!address.address1||!address.city||!address.postal_code)return json(res,{error:'Complete the delivery address to calculate supplier shipping.'},400);const rows=productRows(items),byId=new Map(rows.map(x=>[Number(x.id),x]));if(rows.length!==new Set(items.map(x=>Number(x.product_id||x.id)).filter(Number.isFinite)).size)return json(res,{error:'One or more products could not be matched to the catalog.'},400);const unsupported=rows.filter(x=>!/valvetronic/i.test(clean(x.brand_name)));if(unsupported.length)return json(res,{error:'Live supplier shipping is currently enabled for Valvetronic products only.',unsupported:unsupported.map(x=>({id:x.id,brand:x.brand_name,title:x.title}))},409);const payloadItems=items.map(x=>{const p=byId.get(Number(x.product_id||x.id));return{product_id:p.id,sku:p.mfg_part_id,title:p.title,qty:Math.max(1,Number(x.qty||1))}});const key=cacheKey(payloadItems,address),hit=cache.get(key);if(hit&&Date.now()-hit.at<5*60*1000)return json(res,{...hit.value,cached:true});let q;try{q=await worker('/suppliers/valvetronic/quote',{method:'POST',body:JSON.stringify({items:payloadItems,address})})}catch(e){return json(res,{error:String(e.message||e),supplier:'Valvetronic Designs',quote_available:false},502)}if(q.reauth_required)return json(res,{error:'Valvetronic dealer account needs to be reauthenticated.',reauth_required:true,supplier:'Valvetronic Designs'},503);if(q.available===false){const value={supplier:'Valvetronic Designs',available:false,stocks:q.stocks||[],quote_available:true};cache.set(key,{at:Date.now(),value});return json(res,value)}if(!q.ok||!q.shipping||!Number.isFinite(Number(q.shipping.amount)))return json(res,{error:q.error||'Supplier shipping rate was not returned.',supplier:'Valvetronic Designs',diagnostic:q.diagnostic||null},502);const sourceCurrency=String(q.shipping.source_currency||'USD').toUpperCase();const sourceAmount=round2(q.shipping.amount);const amountSar=sourceCurrency==='SAR'?sourceAmount:sourceCurrency==='USD'?round2(sourceAmount*USD_SAR_RATE):null;if(amountSar===null)return json(res,{error:`Unsupported supplier shipping currency: ${sourceCurrency}`},502);const value={supplier:'Valvetronic Designs',available:true,amount_sar:amountSar,shipping:{amount_sar:amountSar,source_amount:sourceAmount,source_currency:sourceCurrency,method:q.shipping.method||'Supplier shipping',quoted_at:q.shipping.quoted_at||new Date().toISOString()},stocks:q.stocks||[],quote_available:true};cache.set(key,{at:Date.now(),value});return json(res,value)}
  async function admin(req,res,u){
    if(!adminAuthorized(req))return adminChallenge(res);
    if(u.pathname==='/api/admin/suppliers/valvetronic/status'&&req.method==='GET'){try{return json(res,{configured:ready(),worker:await worker('/suppliers/valvetronic/status')})}catch(e){return json(res,{configured:ready(),error:String(e.message||e)},502)}}
    if(u.pathname==='/api/admin/suppliers/valvetronic/auth/start'&&req.method==='POST'){const d=await readJson(req);try{return json(res,await worker('/suppliers/valvetronic/auth/start',{method:'POST',body:JSON.stringify({email:clean(d.email)})}))}catch(e){return json(res,{error:String(e.message||e)},502)}}
    if(u.pathname==='/api/admin/suppliers/valvetronic/auth/verify'&&req.method==='POST'){const d=await readJson(req);try{return json(res,await worker('/suppliers/valvetronic/auth/verify',{method:'POST',body:JSON.stringify({code:clean(d.code)})}))}catch(e){return json(res,{error:String(e.message||e)},502)}}
    if(u.pathname==='/api/admin/suppliers/valvetronic/auth/import'&&req.method==='POST'){const d=await readJson(req);if(!clean(d.curl))return json(res,{error:'Paste the copied Valvetronic cURL request.'},400);try{return json(res,await worker('/suppliers/valvetronic/auth/import',{method:'POST',body:JSON.stringify({curl:String(d.curl)})}))}catch(e){return json(res,{error:String(e.message||e)},502)}}
    if(u.pathname==='/api/admin/suppliers/valvetronic/auth/cancel'&&req.method==='POST'){try{return json(res,await worker('/suppliers/valvetronic/auth/cancel',{method:'POST',body:'{}'}))}catch(e){return json(res,{error:String(e.message||e)},502)}}
    return false;
  }
  return{quote,admin};
};
