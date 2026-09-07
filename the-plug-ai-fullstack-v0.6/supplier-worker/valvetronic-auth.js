const fs=require('fs');
const path=require('path');
const {chromium}=require('playwright');

module.exports=function createValvetronicAuth(opts={}){
  const accountUrl=opts.accountUrl||'https://account.valvetronic.com';
  const statePath=opts.statePath||'/data/valvetronic-state.json';
  const loginStatePath=opts.loginStatePath||'/data/valvetronic-login-state.json';
  const loginMetaPath=opts.loginMetaPath||'/data/valvetronic-login-meta.json';
  const verifiedPath=opts.verifiedPath||'/data/valvetronic-verified.json';
  const headless=opts.headless!==false;
  const configuredEmail=String(opts.email||'').trim();

  function exists(file){try{return fs.existsSync(file)&&fs.statSync(file).size>20}catch{return false}}
  function hasVerifiedSession(){return exists(statePath)&&exists(verifiedPath)}
  function clearVerified(){try{fs.unlinkSync(verifiedPath)}catch{}}
  async function launch(storage){const browser=await chromium.launch({headless,args:['--no-sandbox','--disable-dev-shm-usage']});let context;try{context=storage&&exists(storage)?await browser.newContext({storageState:storage,locale:'en-US'}):await browser.newContext({locale:'en-US'})}catch{context=await browser.newContext({locale:'en-US'})}return{browser,context}}
  async function save(context,file){fs.mkdirSync(path.dirname(file),{recursive:true});await context.storageState({path:file})}
  function stillAuthScreen(url,body){return /authentication\/login/i.test(url)||/enter.*code|verification code|one[- ]time|otp|sign in|log in/i.test(body)}
  async function pageState(page){const url=page.url();const body=(await page.locator('body').innerText().catch(()=>'' )).slice(0,5000);const emailField=await page.locator('input[type="email"],input[name="email"],input[autocomplete="email"]').count();const codeField=await page.locator('input[autocomplete="one-time-code"],input[inputmode="numeric"],input[name*="code" i],input[id*="code" i]').count();return{url,body,on_auth_screen:stillAuthScreen(url,body)||emailField>0||codeField>0}}

  async function start(email){
    const dealerEmail=String(email||configuredEmail).trim();
    if(!dealerEmail)throw new Error('Valvetronic dealer email is not configured');
    const useExisting=hasVerifiedSession();
    const {browser,context}=await launch(useExisting?statePath:null);
    try{
      const page=await context.newPage();
      await page.goto(accountUrl,{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForTimeout(1800);
      let s=await pageState(page);
      if(useExisting&&!s.on_auth_screen){return{ok:true,connected:true,email:dealerEmail,awaiting_otp:false,verified:true}}
      if(useExisting&&s.on_auth_screen)clearVerified();
      const input=page.locator('input[type="email"],input[name="email"],input[autocomplete="email"]').first();
      if(!(await input.count()))throw new Error('Valvetronic email field was not found');
      await input.fill(dealerEmail);
      const submit=page.getByRole('button',{name:/continue|sign in|submit|email me|send code/i}).first();
      if(await submit.count())await submit.click({timeout:12000});else await input.press('Enter');
      await page.waitForTimeout(2500);
      s=await pageState(page);
      await save(context,loginStatePath);
      fs.writeFileSync(loginMetaPath,JSON.stringify({url:s.url,email:dealerEmail,started_at:new Date().toISOString()}));
      const awaiting=/code|verification|one-time|otp/i.test(s.body)||await page.locator('input[autocomplete="one-time-code"],input[inputmode="numeric"],input[name*="code" i],input[id*="code" i]').count()>0;
      if(!awaiting)throw new Error('Valvetronic did not show the verification-code step. No connection has been recorded.');
      return{ok:true,connected:false,email:dealerEmail,awaiting_otp:true,verified:false};
    }finally{await browser.close()}
  }

  async function verify(code){
    const otp=String(code||'').trim();
    if(!/^\d{4,8}$/.test(otp))throw new Error('Enter the verification code sent by Valvetronic');
    if(!exists(loginStatePath))throw new Error('No pending Valvetronic verification session. Send a new code first.');
    const {browser,context}=await launch(loginStatePath);
    try{
      const page=await context.newPage();
      let target=accountUrl;
      try{const meta=JSON.parse(fs.readFileSync(loginMetaPath,'utf8'));if(meta.url)target=meta.url}catch{}
      await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForTimeout(1200);
      const codeInput=page.locator('input[autocomplete="one-time-code"],input[inputmode="numeric"],input[name*="code" i],input[id*="code" i]').first();
      if(!(await codeInput.count()))throw new Error('Valvetronic verification-code field was not found');
      await codeInput.fill(otp);
      const submit=page.getByRole('button',{name:/submit|verify|continue|sign in/i}).first();
      if(await submit.count())await submit.click({timeout:12000});else await codeInput.press('Enter');
      await page.waitForTimeout(3500);
      const s=await pageState(page);
      if(s.on_auth_screen)return{ok:false,connected:false,awaiting_otp:true,verified:false,error:'Valvetronic did not confirm the verification code'};
      await save(context,statePath);
      fs.writeFileSync(verifiedPath,JSON.stringify({email:configuredEmail||null,verified_at:new Date().toISOString(),url:s.url}));
      try{fs.unlinkSync(loginStatePath)}catch{}
      try{fs.unlinkSync(loginMetaPath)}catch{}
      return{ok:true,connected:true,awaiting_otp:false,verified:true,url:s.url};
    }finally{await browser.close()}
  }

  async function clearPending(){try{fs.unlinkSync(loginStatePath)}catch{}try{fs.unlinkSync(loginMetaPath)}catch{}return{ok:true}}
  return{start,verify,clearPending,configuredEmail,hasVerifiedSession,clearVerified};
};
