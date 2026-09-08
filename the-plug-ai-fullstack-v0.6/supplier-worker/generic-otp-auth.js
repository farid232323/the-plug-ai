const fs=require('fs');
const path=require('path');
const {chromium}=require('playwright');

module.exports=function createGenericOtpAuth({headless=true,dataDir='/data'}={}){
  const pending=new Map();
  const clean=v=>String(v??'').trim();
  const statePath=s=>path.join(dataDir,`supplier-${s.slug}-state.json`);
  const hasState=s=>{try{return fs.existsSync(statePath(s))&&fs.statSync(statePath(s)).size>20}catch{return false}};
  async function close(slug){const p=pending.get(slug);pending.delete(slug);if(p?.browser)await p.browser.close().catch(()=>{});return{ok:true}}
  async function start(s,email){
    await close(s.slug);if(!s.login_url)throw new Error('Supplier login URL is not configured');const user=clean(email||s.username);if(!user)throw new Error('Supplier username/email is required');
    const browser=await chromium.launch({headless,args:['--no-sandbox','--disable-dev-shm-usage']});const context=await browser.newContext({locale:'en-US'});const page=await context.newPage();
    try{
      await page.goto(s.login_url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(900);
      const emailField=page.locator('input[type="email"],input[name*="email" i],input[autocomplete="email"],input[name*="user" i]').first();if(!await emailField.count())throw new Error('Could not find the supplier email/username field');await emailField.fill(user);
      const send=page.getByRole('button',{name:/continue|send|code|log in|sign in|submit/i}).first();if(await send.count())await send.click({timeout:12000});else await emailField.press('Enter');
      await page.waitForTimeout(1500);const codeField=page.locator('input[autocomplete="one-time-code"],input[inputmode="numeric"],input[name*="code" i],input[id*="code" i],input[name*="otp" i]').first();
      if(!await codeField.count()){const body=(await page.locator('body').innerText().catch(()=>'' )).slice(0,3000);if(/password/i.test(body))throw new Error('This supplier login currently requires a password connector rather than OTP.');throw new Error('OTP input was not detected after submitting the supplier username.');}
      pending.set(s.slug,{browser,context,page,username:user,startedAt:Date.now()});return{ok:true,awaiting_code:true,supplier:s.name,username:user};
    }catch(e){await browser.close().catch(()=>{});throw e}
  }
  async function verify(s,code){
    const p=pending.get(s.slug);if(!p)throw new Error('No pending supplier OTP session. Start authentication again.');const value=clean(code);if(!/^\d{4,10}$/.test(value))throw new Error('Enter a valid OTP code');
    try{
      const field=p.page.locator('input[autocomplete="one-time-code"],input[inputmode="numeric"],input[name*="code" i],input[id*="code" i],input[name*="otp" i]').first();if(!await field.count())throw new Error('OTP input is no longer available');await field.fill(value);
      const submit=p.page.getByRole('button',{name:/verify|continue|submit|log in|sign in/i}).first();if(await submit.count())await submit.click({timeout:12000});else await field.press('Enter');await p.page.waitForTimeout(2200);
      const stillCode=await p.page.locator('input[autocomplete="one-time-code"],input[inputmode="numeric"],input[name*="code" i],input[name*="otp" i]').count();if(stillCode)throw new Error('Supplier did not accept the OTP code');
      fs.mkdirSync(dataDir,{recursive:true});await p.context.storageState({path:statePath(s)});pending.delete(s.slug);await p.browser.close().catch(()=>{});return{ok:true,connected:true,supplier:s.name,username:p.username};
    }catch(e){throw e}
  }
  async function ingest(s,code){return verify(s,code)}
  function status(s){return{connected:hasState(s),awaiting_code:pending.has(s.slug),username:s.username||pending.get(s.slug)?.username||null,state_path:statePath(s)}}
  return{start,verify,ingest,status,close,hasState,statePath};
};
