const fs=require('fs');
const path=require('path');
const {chromium}=require('playwright');

module.exports=function createShopifyAdapter({headless=true,dataDir='/data'}={}){
  const clean=v=>String(v??'').trim();
  const statePath=s=>path.join(dataDir,`supplier-${s.slug}-state.json`);
  const hasState=s=>{try{return fs.existsSync(statePath(s))&&fs.statSync(statePath(s)).size>20}catch{return false}};
  async function contextFor(s){const browser=await chromium.launch({headless,args:['--no-sandbox','--disable-dev-shm-usage']});let context;try{context=hasState(s)?await browser.newContext({storageState:statePath(s),locale:'en-US'}):await browser.newContext({locale:'en-US'})}catch{context=await browser.newContext({locale:'en-US'})}return{browser,context}}
  async function save(s,context){try{fs.mkdirSync(dataDir,{recursive:true});await context.storageState({path:statePath(s)})}catch{}}

  function norm(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'')}
  function productCandidates(item){return [...new Set([clean(item.sku),clean(item.mfg_part_id),clean(item.title),clean(item.name)].filter(Boolean))]}
  function scoreProduct(product,candidates){
    const title=norm(product?.title);const handle=norm(product?.handle);let score=0;
    for(const c of candidates){const n=norm(c);if(!n)continue;if(title===n||handle===n)score=Math.max(score,100);else if(title.includes(n)||n.includes(title)||handle.includes(n))score=Math.max(score,60)}
    for(const v of product?.variants||[]){const sku=norm(v?.sku);for(const c of candidates){const n=norm(c);if(sku&&n&&sku===n)score=Math.max(score,200)}}
    return score;
  }
  async function shopifyJsonLookup(page,base,item){
    const candidates=productCandidates(item);
    // First try Shopify predictive search for each useful identifier/title, explicitly including variant SKU fields.
    for(const term of candidates){
      try{
        const u=`${base}/search/suggest.json?q=${encodeURIComponent(term)}&resources[type]=product&resources[limit]=10&resources[options][fields]=variants.sku,title&resources[options][unavailable_products]=show`;
        const r=await page.request.get(u,{timeout:15000,headers:{accept:'application/json'}});if(!r.ok())continue;
        const j=await r.json().catch(()=>null);const ps=j?.resources?.results?.products||[];if(!ps.length)continue;
        let best=ps.map(p=>({p,score:scoreProduct(p,candidates)})).sort((a,b)=>b.score-a.score)[0];
        if(!best?.p)best={p:ps[0]};
        const url=best.p.url||best.p.handle&&`/products/${best.p.handle}`;if(url)return new URL(url,base).toString();
      }catch{}
    }
    // Fallback to Shopify's public products JSON so exact variant SKU matches work even when site search ignores SKU.
    try{
      let pageNo=1,best=null;
      while(pageNo<=8){
        const r=await page.request.get(`${base}/products.json?limit=250&page=${pageNo}`,{timeout:20000,headers:{accept:'application/json'}});if(!r.ok())break;
        const j=await r.json().catch(()=>null),ps=j?.products||[];if(!ps.length)break;
        for(const p of ps){const sc=scoreProduct(p,candidates);if(!best||sc>best.score)best={p,score:sc};if(sc>=200)break}
        if(best?.score>=200||ps.length<250)break;pageNo++;
      }
      if(best?.p&&best.score>0)return `${base}/products/${best.p.handle}`;
    }catch{}
    return '';
  }
  async function p3CollectionLookup(page,base,item){
    const sku=norm(item.sku||item.mfg_part_id);if(!sku)return '';
    try{
      const r=await page.request.get(`${base}/collections/all/products.json?limit=250`,{timeout:20000,headers:{accept:'application/json'}});if(!r.ok())return '';
      const j=await r.json().catch(()=>null);const ps=j?.products||[];
      const hit=ps.find(p=>(p.variants||[]).some(v=>norm(v?.sku)===sku));
      return hit?.handle?`${base}/products/${hit.handle}`:'';
    }catch{return ''}
  }
  async function htmlSearchLookup(page,base,item){
    const candidates=productCandidates(item);
    for(const term of candidates){
      try{
        await page.goto(`${base}/search?q=${encodeURIComponent(term)}`,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(700);
        const links=page.locator('a[href*="/products/"]');const count=await links.count();if(!count)continue;
        let chosen=0,bestScore=-1;const n=norm(term);
        for(let i=0;i<Math.min(40,count);i++){
          const txt=norm(await links.nth(i).innerText().catch(()=>''));const href=norm(await links.nth(i).getAttribute('href').catch(()=>''));const sc=(txt===n||href.includes(n))?100:(txt.includes(n)||n.includes(txt)||href.includes(n)?50:0);if(sc>bestScore){bestScore=sc;chosen=i}
        }
        const href=await links.nth(chosen).getAttribute('href');if(href)return new URL(href,base).toString();
      }catch{}
    }
    return '';
  }
  async function resolveProduct(page,s,item){
    const base=s.base_url.replace(/\/$/,'');if(item.url){await page.goto(item.url,{waitUntil:'domcontentloaded',timeout:45000});return page.url()}
    let url=await shopifyJsonLookup(page,base,item);if(!url&&s.slug==='p3-gauges')url=await p3CollectionLookup(page,base,item);if(!url)url=await htmlSearchLookup(page,base,item);
    if(!url)throw new Error(`Unable to find ${s.name} product for ${clean(item.sku||item.mfg_part_id||item.title)}`);
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});return page.url();
  }
  async function stock(page){const text=(await page.locator('body').innerText().catch(()=>'' )).toLowerCase();if(/sold out|out of stock|unavailable/.test(text))return{available:false,status:'out_of_stock'};return{available:true,status:'available'}}
  async function add(page,qty){for(let i=0;i<qty;i++){const b=page.getByRole('button',{name:/add to cart|add$/i}).first();if(await b.count()){await b.click({timeout:12000});await page.waitForTimeout(700)}else throw new Error('Add to cart button not found')}}
  function amount(v){const n=Number(v);if(!Number.isFinite(n))return null;return n>10000?n/100:n}
  async function rates(page,s,a){
    const base=s.base_url.replace(/\/$/,'');const p=new URLSearchParams();p.set('shipping_address[country]','Saudi Arabia');p.set('shipping_address[country_code]','SA');p.set('shipping_address[province]',clean(a.region||a.province));p.set('shipping_address[city]',clean(a.city));p.set('shipping_address[zip]',clean(a.postal_code||a.zip));
    const r=await page.request.get(`${base}/cart/shipping_rates.json?${p}`,{timeout:30000});if(!r.ok())return[];const j=await r.json().catch(()=>null);return (j?.shipping_rates||[]).map(x=>({name:clean(x.name||x.title||x.code)||'Shipping',price:amount(x.price),currency:clean(x.currency||s.currency||'USD').toUpperCase(),source:'shopify'})).filter(x=>Number.isFinite(x.price)).sort((a,b)=>a.price-b.price)
  }
  async function quote(s,payload){
    if(!s.base_url)throw new Error('Supplier base URL is not configured');const items=Array.isArray(payload.items)?payload.items:[];if(!items.length)throw new Error('No items supplied');
    const {browser,context}=await contextFor(s);try{const page=await context.newPage();await page.goto(`${s.base_url.replace(/\/$/,'')}/cart/clear`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});const stocks=[];for(const item of items){const url=await resolveProduct(page,s,item),st=await stock(page);stocks.push({product_id:item.product_id||null,sku:item.sku||'',url,...st});if(!st.available)return{ok:true,supplier:s.name,available:false,stocks,shipping:null};await add(page,Math.max(1,Number(item.qty||1)))}const all=await rates(page,s,payload.address||{});await save(s,context);if(!all.length)return{ok:false,supplier:s.name,available:true,stocks,error:'No Shopify shipping rate was returned for this address'};const best=all[0];return{ok:true,supplier:s.name,available:true,stocks,shipping:{amount:best.price,source_currency:best.currency,method:best.name,all_rates:all,quoted_at:new Date().toISOString()},rate_source:'shopify_cart_api'}}finally{await browser.close()}
  }
  async function status(s){return{configured:!!s.base_url,connected:hasState(s),session_state:hasState(s)?'stored':'not_stored',adapter:'shopify',username:s.username||null,auth_mode:s.auth_mode||'account'}}
  return{quote,status,statePath};
};
