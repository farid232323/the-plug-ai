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
  const PENDING_TTL_MS=15*60*1000;
  let pending=null;

  function exists(file){try{return fs.existsSync(file)&&fs.statSync(file).size>20}catch{return false}}
  function hasVerifiedSession(){return exists(statePath)&&exists(verifiedPath)}
  function clearVerified(){try{fs.unlinkSync(verifiedPath)}catch{}}
  async function launch(storage){const browser=await chromium.launch({headless,args:['--no-sandbox','--disable-dev-shm-usage']});let context;try{context=storage&&exists(storage)?await browser.newContext({storageState:storage,locale:'en-US'}):await browser.newContext({locale:'en-US'})}catch{context=await browser.newContext({locale:'en-US'})}return{browser,context}}
  async function save(context,file){fs.mkdirSync(path.dirname(file),{recursive:true});await context.storageState({path:file})}
  function stillAuthScreen(url,body){return /authentication\/login|authentication\/code/i.test(url)||/enter.*code|verification code|one[- ]time|otp|sign in|log in/i.test(body)}
  function humanChallenge(body){return /captcha|verify you are human|are you human|checking your browser|security check|turnstile|hcaptcha|recaptcha/i.test(String(body||''))}

  async function settle(page){
    await page.waitForLoadState('domcontentloaded',{timeout:45000}).catch(()=>{});
    await page.waitForLoadState('networkidle',{timeout:12000}).catch(()=>{});
    await page.waitForTimeout(1800);
  }

  async function findField(page,kind){
    const selectors=kind==='email'?
      ['input[type="email"]','input[name="email"]','input[name*="email" i]','input[autocomplete="email"]','input[placeholder*="email" i]','input[aria-label*="email" i]']:
      ['input[autocomplete="one-time-code"]','input[inputmode="numeric"]','input[name*="code" i]','input[id*="code" i]','input[placeholder*="code" i]','input[aria-label*="code" i]'];
    for(const frame of page.frames()){
      for(const sel of selectors){
        const loc=frame.locator(sel).first();
        if(await loc.count().catch(()=>0)){const visible=await loc.isVisible().catch(()=>false);if(visible)return{frame,loc,selector:sel}}
      }
    }
    if(kind==='email'){
      for(const frame of page.frames()){
        const candidates=frame.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"])');
        const count=await candidates.count().catch(()=>0);
        for(let i=0;i<Math.min(count,10);i++){
          const loc=candidates.nth(i);if(!(await loc.isVisible().catch(()=>false)))continue;
          const attrs=await loc.evaluate(el=>({type:el.type||'',name:el.name||'',placeholder:el.placeholder||'',aria:el.getAttribute('aria-label')||''})).catch(()=>({}));
          if(JSON.stringify(attrs).toLowerCase().includes('email'))return{frame,loc,selector:'generic-email'};
        }
      }
    }
    return null;
  }

  async function findCodeGroup(page){
    for(const frame of page.frames()){
      const candidates=frame.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"])');
      const count=await candidates.count().catch(()=>0);const visible=[];
      for(let i=0;i<Math.min(count,20);i++){
        const loc=candidates.nth(i);if(!(await loc.isVisible().catch(()=>false)))continue;
        const a=await loc.evaluate(el=>({type:el.type||'',inputmode:el.inputMode||'',maxlength:el.maxLength,name:el.name||'',id:el.id||'',autocomplete:el.autocomplete||'',aria:el.getAttribute('aria-label')||''})).catch(()=>({}));
        const numeric=/^(number|tel)$/.test(String(a.type).toLowerCase())||String(a.inputmode).toLowerCase()==='numeric'||/code|otp|digit/i.test(`${a.name} ${a.id} ${a.autocomplete} ${a.aria}`)||Number(a.maxlength)===1;
        if(numeric)visible.push(loc);
      }
      if(visible.length>=4&&visible.length<=8)return{frame,fields:visible};
    }
    return null;
  }

  async function pageState(page){
    const url=page.url();
    const body=(await page.locator('body').innerText().catch(()=>'' )).slice(0,5000);
    const emailField=!!(await findField(page,'email'));
    const codeField=!!(await findField(page,'code'))||!!(await findCodeGroup(page));
    return{url,body,emailField,codeField,on_auth_screen:stillAuthScreen(url,body)||emailField||codeField,challenge_required:humanChallenge(body)};
  }

  async function closePending(){
    const p=pending;pending=null;
    if(!p)return;
    try{await p.browser.close()}catch{}
  }
  function pendingValid(){return !!pending&&Date.now()<pending.expiresAt}

  async function start(email){
    const dealerEmail=String(email||configuredEmail).trim();
    if(!dealerEmail)throw new Error('Valvetronic dealer email is not configured');
    await closePending();
    const useExisting=hasVerifiedSession();
    const {browser,context}=await launch(useExisting?statePath:null);
    let keepOpen=false;
    try{
      const page=await context.newPage();
      await page.goto(accountUrl,{waitUntil:'domcontentloaded',timeout:45000});
      await settle(page);
      let s=await pageState(page);
      if(useExisting&&!s.on_auth_screen){return{ok:true,connected:true,email:dealerEmail,awaiting_otp:false,verified:true}}
      if(useExisting&&s.on_auth_screen)clearVerified();
      if(s.challenge_required)return{ok:false,connected:false,challenge_required:true,error:'Valvetronic is requiring a human verification check before login can continue.'};
      const emailField=await findField(page,'email');
      if(!emailField)throw new Error(`Valvetronic email field was not found at ${page.url()}`);
      await emailField.loc.fill(dealerEmail);
      let submitted=false;
      for(const name of [/continue/i,/sign in/i,/submit/i,/email me/i,/send code/i]){
        const btn=emailField.frame.getByRole('button',{name}).first();
        if(await btn.count().catch(()=>0)){await btn.click({timeout:12000});submitted=true;break}
      }
      if(!submitted)await emailField.loc.press('Enter');
      await settle(page);
      s=await pageState(page);
      if(s.challenge_required)return{ok:false,connected:false,challenge_required:true,error:'Valvetronic is requiring a human verification check before it will send the code.'};
      const awaiting=/code|verification|one-time|otp/i.test(s.body)||s.codeField;
      if(!awaiting)throw new Error(`Valvetronic did not show the verification-code step after submitting email. Current page: ${s.url}`);
      await save(context,loginStatePath).catch(()=>{});
      fs.writeFileSync(loginMetaPath,JSON.stringify({url:s.url,email:dealerEmail,started_at:new Date().toISOString()}));
      pending={browser,context,page,email:dealerEmail,expiresAt:Date.now()+PENDING_TTL_MS};
      keepOpen=true;
      return{ok:true,connected:false,email:dealerEmail,awaiting_otp:true,verified:false,expires_in_seconds:Math.floor(PENDING_TTL_MS/1000)};
    }finally{if(!keepOpen)await browser.close().catch(()=>{})}
  }

  async function verify(code){
    const otp=String(code||'').trim();
    if(!/^\d{4,8}$/.test(otp))throw new Error('Enter the verification code sent by Valvetronic');
    if(!pendingValid()){
      await closePending();
      throw new Error('The pending Valvetronic verification session expired or was interrupted. Click Send verification code again, then enter the new code without reloading the supplier worker.');
    }
    const {context,page}=pending;
    try{
      await settle(page);
      let s=await pageState(page);
      if(s.challenge_required)return{ok:false,connected:false,awaiting_otp:false,challenge_required:true,verified:false,error:'Valvetronic is requiring a human verification check before login can continue.'};
      const codeField=await findField(page,'code');
      const codeGroup=codeField?null:await findCodeGroup(page);
      if(!codeField&&!codeGroup){
        if(s.emailField)throw new Error('Valvetronic returned to the email login screen. Click Send verification code again and use the newest code.');
        throw new Error(`Valvetronic verification-code field was not found on the active OTP page at ${page.url()}`);
      }
      let submitFrame;
      if(codeField){await codeField.loc.fill(otp);submitFrame=codeField.frame}
      else{submitFrame=codeGroup.frame;for(let i=0;i<Math.min(otp.length,codeGroup.fields.length);i++)await codeGroup.fields[i].fill(otp[i])}
      let submitted=false;
      for(const name of [/submit/i,/verify/i,/continue/i,/sign in/i]){
        const btn=submitFrame.getByRole('button',{name}).first();
        if(await btn.count().catch(()=>0)){await btn.click({timeout:12000});submitted=true;break}
      }
      if(!submitted){if(codeField)await codeField.loc.press('Enter');else await codeGroup.fields[codeGroup.fields.length-1].press('Enter')}
      await settle(page);
      s=await pageState(page);
      if(s.challenge_required)return{ok:false,connected:false,awaiting_otp:false,challenge_required:true,verified:false,error:'Valvetronic requires a human verification check after the code was submitted.'};
      if(s.codeField||/enter.*code|verification code|one[- ]time|otp/i.test(s.body))return{ok:false,connected:false,awaiting_otp:true,verified:false,error:'Valvetronic did not accept that verification code. Use the newest code sent to your email.'};
      if(s.emailField)return{ok:false,connected:false,awaiting_otp:false,verified:false,error:'Valvetronic returned to the email login screen. Send a new code and try again.'};
      await save(context,statePath);
      fs.writeFileSync(verifiedPath,JSON.stringify({email:configuredEmail||pending.email||null,verified_at:new Date().toISOString(),url:s.url}));
      try{fs.unlinkSync(loginStatePath)}catch{}
      try{fs.unlinkSync(loginMetaPath)}catch{}
      await closePending();
      return{ok:true,connected:true,awaiting_otp:false,verified:true,url:s.url};
    }catch(e){
      if(!pendingValid())await closePending();
      throw e;
    }
  }

  async function clearPending(){await closePending();try{fs.unlinkSync(loginStatePath)}catch{}try{fs.unlinkSync(loginMetaPath)}catch{}return{ok:true}}
  return{start,verify,clearPending,configuredEmail,hasVerifiedSession,clearVerified};
};
