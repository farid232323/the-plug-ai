const http=require('http');
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const {chromium}=require('playwright');

const PORT=Number(process.env.PORT||4180);
const INNER_PORT=Number(process.env.SUPPLIER_INNER_PORT||4181);
const SECRET=String(process.env.SUPPLIER_WORKER_SECRET||'');
const STATE_PATH=process.env.VALVETRONIC_STATE_PATH||'/data/valvetronic-state.json';
const AUTH_PATH=process.env.VALVETRONIC_AUTH_PATH||'/data/valvetronic-auth.json';
const HEADLESS=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const ACCOUNT='https://account.valvetronic.com';

const child=spawn(process.execPath,['worker.js'],{cwd:__dirname,env:{...process.env,PORT:String(INNER_PORT)},stdio:'inherit'});
child.on('exit',code=>{console.error('Supplier inner worker exited',code);process.exit(code||1)});

function json(res,obj,status=200){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'content-type':'application/json','content-length':b.length,'cache-control':'no-store'});res.end(b)}
function readJson(req){return new Promise(resolve=>{const a=[];req.on('data',c=>a.push(c));req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(a).toString()||'{}'))}catch{resolve({})}});req.on('error',()=>resolve({}))})}
function authorized(req){return !!SECRET&&String(req.headers.authorization||'')===`Bearer ${SECRET}`}
function stateExists(){try{return fs.existsSync(STATE_PATH)&&fs.statSync(STATE_PATH).size>20}catch{return false}}
async function context(){const browser=await chromium.launch({headless:HEADLESS,args:['--no-sandbox','--disable-dev-shm-usage']});let ctx;try{ctx=stateExists()?await browser.newContext({storageState:STATE_PATH,locale:'en-US'}):await browser.newContext({locale:'en-US'})}catch{ctx=await browser.newContext({locale:'en-US'})}return{browser,ctx}}
async function save(ctx){fs.mkdirSync(path.dirname(STATE_PATH),{recursive:true});await ctx.storageState({path:STATE_PATH})}
function looksLoggedIn(url,text){return !/authentication\/login/i.test(url)&&!/verification code|enter code|sign in|log in/i.test(String(text||'').slice(0,2500))}
async function status(){const {browser,ctx}=await context();try{const p=await ctx.newPage();await p.goto(ACCOUNT,{waitUntil:'domcontentloaded',timeout:45000});await p.waitForTimeout(1800);const body=await p.locator('body').innerText().catch(()=> '');const connected=looksLoggedIn(p.url(),body);await save(ctx);return{connected,reauth_required:!connected,url:p.url()}}finally{await browser.close()}}
async function startAuth(email){email=String(email||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid dealer email address');const {browser,ctx}=await context();try{const p=await ctx.newPage();await p.goto(ACCOUNT,{waitUntil:'domcontentloaded',timeout:45000});await p.waitForTimeout(1200);let body=await p.locator('body').innerText().catch(()=> '');if(looksLoggedIn(p.url(),body)){await save(ctx);return{ok:true,connected:true,already_connected:true}}
  const emailBox=p.locator('input[type="email"],input[autocomplete="email"],input[name*="email" i]').first();if(!await emailBox.count())throw new Error('Could not find the Valvetronic email login field');await emailBox.fill(email);
  const submit=p.getByRole('button',{name:/continue|sign in|log in|send|email|submit/i}).first();if(await submit.count())await submit.click({timeout:12000});else await emailBox.press('Enter');
  await p.waitForTimeout(2200);await save(ctx);fs.mkdirSync(path.dirname(AUTH_PATH),{recursive:true});fs.writeFileSync(AUTH_PATH,JSON.stringify({url:p.url(),started_at:new Date().toISOString()}));
  body=await p.locator('body').innerText().catch(()=> '');return{ok:true,connected:false,awaiting_otp:true,url:p.url(),message:/code|verification/i.test(body)?'OTP requested':'Login request submitted'};
}finally{await browser.close()}}
async function verifyOtp(code){code=String(code||'').trim().replace(/\s+/g,'');if(!/^\d{4,8}$/.test(code))throw new Error('Enter the verification code from Valvetronic');const {browser,ctx}=await context();try{const p=await ctx.newPage();let target=ACCOUNT;try{const a=JSON.parse(fs.readFileSync(AUTH_PATH,'utf8'));if(a.url)target=a.url}catch{}await p.goto(target,{waitUntil:'domcontentloaded',timeout:45000});await p.waitForTimeout(800);
  const one=p.locator('input[autocomplete="one-time-code"],input[name*="code" i],input[id*="code" i],input[inputmode="numeric"]').first();if(await one.count())await one.fill(code);else{const digits=p.locator('input[maxlength="1"]');const n=await digits.count();if(n>=code.length){for(let i=0;i<code.length;i++)await digits.nth(i).fill(code[i])}else throw new Error('Could not find the Valvetronic OTP field')}
  const submit=p.getByRole('button',{name:/verify|continue|submit|sign in|log in/i}).first();if(await submit.count())await submit.click({timeout:12000});else await p.keyboard.press('Enter');
  await p.waitForTimeout(2800);const body=await p.locator('body').innerText().catch(()=> '');const connected=looksLoggedIn(p.url(),body);await save(ctx);if(connected){try{fs.unlinkSync(AUTH_PATH)}catch{}}return{ok:connected,connected,reauth_required:!connected,url:p.url(),error:connected?null:'Valvetronic did not accept the verification code or another step is required'};
}finally{await browser.close()}}
function proxy(req,res){const headers={...req.headers,host:`127.0.0.1:${INNER_PORT}`};const pr=http.request({hostname:'127.0.0.1',port:INNER_PORT,path:req.url,method:req.method,headers},pres=>{res.writeHead(pres.statusCode||500,pres.headers);pres.pipe(res)});pr.on('error',e=>{console.error('Supplier proxy error',e);if(!res.headersSent)res.writeHead(502);res.end('Bad gateway')});req.pipe(pr)}

const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname==='/health')return json(res,{ok:true,service:'the-plug-supplier-auth-worker',inner_port:INNER_PORT,state_present:stateExists()});if(u.pathname.startsWith('/suppliers/valvetronic/auth/')){if(!authorized(req))return json(res,{error:'Unauthorized'},401);try{if(u.pathname.endsWith('/start')&&req.method==='POST'){const d=await readJson(req);return json(res,await startAuth(d.email))}if(u.pathname.endsWith('/verify')&&req.method==='POST'){const d=await readJson(req);return json(res,await verifyOtp(d.code))}if(u.pathname.endsWith('/status')&&req.method==='GET')return json(res,await status());return json(res,{error:'Not found'},404)}catch(e){console.error('Valvetronic auth error',e);return json(res,{ok:false,error:String(e.message||e)},500)}}return proxy(req,res)});
server.listen(PORT,()=>console.log(`The Plug supplier auth worker listening on :${PORT}; inner worker on :${INNER_PORT}`));
