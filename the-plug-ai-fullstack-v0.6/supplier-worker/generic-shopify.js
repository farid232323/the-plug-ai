const fs=require('fs');
const path=require('path');
const {chromium}=require('playwright');

module.exports=function createShopifyAdapter({headless=true,dataDir='/data'}={}){
  const clean=v=>String(v??'').trim();
  const statePath=s=>path.join(dataDir,`supplier-${s.slug}-state.json`);
  const hasState=s=>{try{return fs.existsSync(statePath(s))&&fs.statSync(statePath(s)).size>20}catch{return false}};
  async function contextFor(s){const browser=await chromium.launch({headless,args:['--no-sandbox','--disable-dev-shm-usage']});let context;try{context=hasState(s)?await browser.newContext({storageState:statePath(s),locale:'en-US'}):await browser.newContext({locale:'en-US'})}catch{context=await browser.newContext({locale:'en-US'})}return{browser,context}}
  async function save(s,context){try{fs.mkdirSync(dataDir,{recursive:true});await context.storageState({path:statePath(s)})}catch{}}
  async function resolveProduct(page,s,item){
    const base=s.base_url.replace(/\/$/,'');if(item.url){await page.goto(item.url,{waitUntil:'domcontentloaded',timeout:45000});return page.url()}
    const q=encodeURIComponent(clean(item.sku||item.mfg_part_id||item.title));await page.goto(`${base}/search?q=${q}`,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(900);
    const links=page.locator('a[href*="/products/"]');const count=await links.count();if(!count)throw new Error(`Unable to find ${s.name} product for ${clean(item.sku||item.title)}`);
    let chosen=0;const needle=clean(item.sku||item.title).toLowerCase();for(let i=0;i<Math.min(30,count);i++){const txt=(await links.nth(i).innerText().catch(()=>'' )).toLowerCase();if(needle&&txt.includes(needle)){chosen=i;break}}
    const href=await links.nth(chosen).getAttribute('href');await page.goto(new URL(href,base).toString(),{waitUntil:'domcontentloaded',timeout:45000});return page.url();
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
