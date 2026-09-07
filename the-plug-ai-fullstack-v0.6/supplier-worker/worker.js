const http=require('http');
const fs=require('fs');
const path=require('path');
const { chromium }=require('playwright');
const createValvetronicAuth=require('./valvetronic-auth');

const PORT=Number(process.env.PORT||4180);
const SHARED_SECRET=process.env.SUPPLIER_WORKER_SECRET||'';
const STATE_PATH=process.env.VALVETRONIC_STATE_PATH||'/data/valvetronic-state.json';
const AUTO_ORDER_ENABLED=String(process.env.AUTO_ORDER_ENABLED||'false').toLowerCase()==='true';
const HEADLESS=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const DEALER_EMAIL=String(process.env.VALVETRONIC_DEALER_EMAIL||'').trim();
const BASE='https://valvetronic.com';
const ACCOUNT='https://account.valvetronic.com';
const otpAuth=createValvetronicAuth({accountUrl:ACCOUNT,statePath:STATE_PATH,headless:HEADLESS,email:DEALER_EMAIL});

function json(res,obj,status=200){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'content-type':'application/json','content-length':b.length,'cache-control':'no-store'});res.end(b)}
function readJson(req){return new Promise(resolve=>{const a=[];req.on('data',c=>a.push(c));req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(a).toString()||'{}'))}catch{resolve({})}});req.on('error',()=>resolve({}))})}
function auth(req,res){if(!SHARED_SECRET)return json(res,{error:'Supplier worker secret is not configured'},503),false;const h=String(req.headers.authorization||'');if(h!==`Bearer ${SHARED_SECRET}`){json(res,{error:'Unauthorized'},401);return false}return true}
function round2(n){return Math.round((Number(n||0)+Number.EPSILON)*100)/100}
function stateExists(){try{return fs.existsSync(STATE_PATH)&&fs.statSync(STATE_PATH).size>20}catch{return false}}
async function newContext(){const browser=await chromium.launch({headless:HEADLESS,args:['--no-sandbox','--disable-dev-shm-usage']});let context;try{context=stateExists()?await browser.newContext({storageState:STATE_PATH,locale:'en-US'}):await browser.newContext({locale:'en-US'})}catch{context=await browser.newContext({locale:'en-US'})}return{browser,context}}
async function saveState(context){try{fs.mkdirSync(path.dirname(STATE_PATH),{recursive:true});await context.storageState({path:STATE_PATH})}catch(e){console.error('Unable to save browser state',e.message)}}
async function accountStatus(){
  if(!otpAuth.hasVerifiedSession())return{connected:false,reauth_required:true,verified:false,dealer_email:DEALER_EMAIL||null,reason:'otp_not_verified'};
  let browser,context;
  try{
    ({browser,context}=await newContext());
    const page=await context.newPage();
    await page.goto(ACCOUNT,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(2500);
    const url=page.url();
    const body=(await page.locator('body').innerText().catch(()=>'' )).slice(0,4000);
    const emailField=await page.locator('input[type="email"],input[name="email"],input[autocomplete="email"]').count();
    const codeField=await page.locator('input[autocomplete="one-time-code"],input[inputmode="numeric"],input[name*="code" i],input[id*="code" i]').count();
    const authScreen=/authentication\/login/i.test(url)||/enter.*code|verification code|one[- ]time|otp|sign in|log in/i.test(body)||emailField>0||codeField>0;
    if(authScreen){otpAuth.clearVerified();return{connected:false,reauth_required:true,verified:false,url,dealer_email:DEALER_EMAIL||null,reason:'session_expired'}}
    return{connected:true,reauth_required:false,verified:true,url,dealer_email:DEALER_EMAIL||null};
  }catch(e){return{connected:false,reauth_required:true,verified:false,dealer_email:DEALER_EMAIL||null,reason:'status_check_failed',error:String(e.message||e)}}
  finally{if(browser)await browser.close().catch(()=>{})}
}
async function resolveProduct(page,item){const sku=String(item.sku||item.mfg_part_id||'').trim();const title=String(item.title||'').trim();if(item.url){await page.goto(item.url,{waitUntil:'domcontentloaded',timeout:45000});return page.url()}
  const q=encodeURIComponent(sku||title);await page.goto(`${BASE}/search?q=${q}`,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(1200);
  const links=page.locator('a[href*="/products/"]');const count=await links.count();if(!count)throw new Error(`Unable to find Valvetronic product for ${sku||title}`);
  let chosen=0;if(sku){for(let i=0;i<Math.min(count,20);i++){const href=await links.nth(i).getAttribute('href');const txt=(await links.nth(i).innerText().catch(()=>'' )).toLowerCase();if(txt.includes(sku.toLowerCase())){chosen=i;break}}}
  const href=await links.nth(chosen).getAttribute('href');await page.goto(new URL(href,BASE).toString(),{waitUntil:'domcontentloaded',timeout:45000});return page.url()}
async function detectStock(page){const text=(await page.locator('body').innerText().catch(()=>'' )).toLowerCase();if(/sold out|out of stock|unavailable/.test(text))return{available:false,status:'out_of_stock'};const disabled=await page.locator('button:has-text("Add to cart"):disabled,button:has-text("Add"):disabled').count();if(disabled)return{available:false,status:'out_of_stock'};return{available:true,status:'available'}}
async function addToCart(page,qty=1){for(let i=0;i<qty;i++){const btn=page.getByRole('button',{name:/add to cart|add$/i}).first();if(await btn.count()){await btn.click({timeout:10000});await page.waitForTimeout(900);continue}throw new Error('Could not find an Add to cart button for this product')}}
async function fillAddress(page,a){const fill=async(names,val)=>{if(!val)return;for(const n of names){const el=page.locator(`input[name="${n}"],input[id*="${n}" i],input[autocomplete="${n}"]`).first();if(await el.count()){await el.fill(String(val));return true}}return false};
  await fill(['email'],'dealer-order@theplug.inc');await fill(['given-name','firstName','first_name'],a.first_name||'The Plug');await fill(['family-name','lastName','last_name'],a.last_name||'Customer');await fill(['address-line1','address1','address_1'],a.address1||a.address||'');await fill(['address-line2','address2','address_2'],a.address2||'');await fill(['address-level2','city'],a.city||'');await fill(['postal-code','zip','postal_code'],a.postal_code||a.zip||'');await fill(['tel','phone'],a.phone||'');
  const country=page.locator('select[name*="country" i],select[id*="country" i]').first();if(await country.count()){await country.selectOption({label:/Saudi Arabia/i}).catch(async()=>{await country.selectOption('SA').catch(()=>{})})}
}
function parseMoney(text){const s=String(text||'').replace(/,/g,'');const m=s.match(/(?:SAR|ر\.س|SR|USD|\$)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);return m?Number(m[1]):null}
async function quoteValvetronic(payload){const items=Array.isArray(payload.items)?payload.items:[];if(!items.length)throw new Error('No items supplied');if(!otpAuth.hasVerifiedSession())return{ok:false,reauth_required:true,error:'Valvetronic dealer session has not been OTP-verified'};const {browser,context}=await newContext();try{const page=await context.newPage();await page.goto(ACCOUNT,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(1600);if(/authentication\/login/i.test(page.url())){otpAuth.clearVerified();return{ok:false,reauth_required:true,error:'Valvetronic dealer session is not authenticated'}};
    const stocks=[];for(const item of items){const url=await resolveProduct(page,item);const stock=await detectStock(page);stocks.push({product_id:item.product_id||null,sku:item.sku||item.mfg_part_id||'',url,...stock});if(!stock.available)return{ok:true,supplier:'Valvetronic Designs',available:false,stocks,shipping:null};await addToCart(page,Math.max(1,Number(item.qty||1)))}
    await page.goto(`${BASE}/cart`,{waitUntil:'domcontentloaded',timeout:45000});const checkout=page.getByRole('button',{name:/checkout/i}).first();if(await checkout.count())await checkout.click({timeout:12000});else{const link=page.getByRole('link',{name:/checkout/i}).first();if(await link.count())await link.click({timeout:12000});else throw new Error('Checkout button not found')}
    await page.waitForLoadState('domcontentloaded',{timeout:45000}).catch(()=>{});await fillAddress(page,payload.address||{});const cont=page.getByRole('button',{name:/continue|shipping|delivery/i}).first();if(await cont.count())await cont.click().catch(()=>{});await page.waitForTimeout(3500);
    const body=await page.locator('body').innerText().catch(()=>'' );const lines=body.split(/\n+/).map(x=>x.trim()).filter(Boolean);const shippingLines=lines.filter(x=>/shipping|delivery|fedex|ups|dhl|usps/i.test(x)&&/[0-9]/.test(x));let amount=null,method='Supplier shipping';for(const line of shippingLines){const v=parseMoney(line);if(v!==null){amount=v;method=line.slice(0,180);break}}
    await saveState(context);if(amount===null)return{ok:false,available:true,stocks,shipping:null,error:'Shipping rate could not be read automatically',diagnostic:{url:page.url(),shipping_lines:shippingLines.slice(0,10)}};
    return{ok:true,supplier:'Valvetronic Designs',available:true,stocks,shipping:{amount,source_currency:'USD',method,quoted_at:new Date().toISOString()},dealer_session:true};
  }finally{await browser.close()}}
async function orderValvetronic(payload){if(!AUTO_ORDER_ENABLED)return{ok:false,blocked:true,error:'Auto ordering is disabled while the Valvetronic connector is in validation mode'};return{ok:false,error:'Order submission is intentionally not enabled until quote validation is completed'}}

const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname==='/health')return json(res,{ok:true,service:'the-plug-supplier-worker',auto_order:AUTO_ORDER_ENABLED,state_present:stateExists(),dealer_email_configured:!!DEALER_EMAIL,otp_verified:otpAuth.hasVerifiedSession()});if(!auth(req,res))return;
  try{
    if(u.pathname==='/suppliers/valvetronic/status'&&req.method==='GET')return json(res,await accountStatus());
    if(u.pathname==='/suppliers/valvetronic/auth/start'&&req.method==='POST'){const d=await readJson(req);return json(res,await otpAuth.start(d.email));}
    if(u.pathname==='/suppliers/valvetronic/auth/verify'&&req.method==='POST'){const d=await readJson(req);return json(res,await otpAuth.verify(d.code));}
    if(u.pathname==='/suppliers/valvetronic/auth/cancel'&&req.method==='POST')return json(res,await otpAuth.clearPending());
    if(u.pathname==='/suppliers/valvetronic/quote'&&req.method==='POST')return json(res,await quoteValvetronic(await readJson(req)));
    if(u.pathname==='/suppliers/valvetronic/order'&&req.method==='POST')return json(res,await orderValvetronic(await readJson(req)));
    return json(res,{error:'Not found'},404)
  }catch(e){console.error(e);return json(res,{ok:false,error:String(e.message||e)},500)}});
server.listen(PORT,()=>console.log(`The Plug supplier worker listening on :${PORT}`));
