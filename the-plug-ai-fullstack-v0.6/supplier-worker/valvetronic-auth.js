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
  function stillAuthScreen(url,body){return /authentication\/login|authentication\/code/i.test(url)||/enter.*code|verification code|one[- ]time|otp|sign in|log in/i.test(body)}

  async function settle(page){
    await page.waitForLoadState('domcontentloaded',{timeout:45000}).catch(()=>{});
    await page.waitForLoadState('networkidle',{timeout:12000}).catch(()=>{});
    await page.waitForTimeout(2500);
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
          const hint=JSON.stringify(attrs).toLowerCase();
          if(hint.includes('email'))return{frame,loc,selector:'generic-email'};
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
    return{url,body,on_auth_screen:stillAuthScreen(url,body)||emailField||codeField};
  }

  async function start(email){
    const dealerEmail=String(email||configuredEmail).trim();
    if(!dealerEmail)throw new Error('Valvetronic dealer email is not configured');
    const useExisting=hasVerifiedSession();
    const {browser,context}=await launch(useExisting?statePath:null);
    try{
      const page=await context.newPage();
      await page.goto(accountUrl,{waitUntil:'domcontentloaded',timeout:45000});
      await settle(page);
      let s=await pageState(page);
      if(useExisting&&!s.on_auth_screen){return{ok:true,connected:true,email:dealerEmail,awaiting_otp:false,verified:true}}
      if(useExisting&&s.on_auth_screen)clearVerified();
      const emailField=await findField(page,'email');
      if(!emailField){
        const title=await page.title().catch(()=> '');
        throw new Error(`Valvetronic email field was not found at ${page.url()} (${title||'untitled page'})`);
      }
      await emailField.loc.fill(dealerEmail);
      let submitted=false;
      for(const name of [/continue/i,/sign in/i,/submit/i,/email me/i,/send code/i]){
        const btn=emailField.frame.getByRole('button',{name}).first();
        if(await btn.count().catch(()=>0)){await btn.click({timeout:12000});submitted=true;break}
      }
      if(!submitted)await emailField.loc.press('Enter');
      await settle(page);
      s=await pageState(page);
      await save(context,loginStatePath);
      fs.writeFileSync(loginMetaPath,JSON.stringify({url:s.url,email:dealerEmail,started_at:new Date().toISOString()}));
      const awaiting=/code|verification|one-time|otp/i.test(s.body)||!!(await findField(page,'code'))||!!(await findCodeGroup(page));
      if(!awaiting)throw new Error(`Valvetronic did not show the verification-code step after submitting email. Current page: ${s.url}`);
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
      await settle(page);
      const codeField=await findField(page,'code');
      const codeGroup=codeField?null:await findCodeGroup(page);
      if(!codeField&&!codeGroup){
        const inputs=[];for(const frame of page.frames()){const n=await frame.locator('input').count().catch(()=>0);for(let i=0;i<Math.min(n,12);i++){const loc=frame.locator('input').nth(i);if(!(await loc.isVisible().catch(()=>false)))continue;inputs.push(await loc.evaluate(el=>({type:el.type||'',name:el.name||'',id:el.id||'',inputmode:el.inputMode||'',maxlength:el.maxLength,autocomplete:el.autocomplete||'',aria:el.getAttribute('aria-label')||''})).catch(()=>({})))}}
        throw new Error(`Valvetronic verification-code field was not found at ${page.url()}. Visible inputs: ${JSON.stringify(inputs)}`);
      }
      let submitFrame;
      if(codeField){await codeField.loc.fill(otp);submitFrame=codeField.frame}
      else{
        submitFrame=codeGroup.frame;
        for(let i=0;i<Math.min(otp.length,codeGroup.fields.length);i++){await codeGroup.fields[i].fill(otp[i])}
      }
      let submitted=false;
      for(const name of [/submit/i,/verify/i,/continue/i,/sign in/i]){
        const btn=submitFrame.getByRole('button',{name}).first();
        if(await btn.count().catch(()=>0)){await btn.click({timeout:12000});submitted=true;break}
      }
      if(!submitted){if(codeField)await codeField.loc.press('Enter');else await codeGroup.fields[codeGroup.fields.length-1].press('Enter')}
      await settle(page);
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
