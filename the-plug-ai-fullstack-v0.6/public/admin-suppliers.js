(()=>{
  const $=(s,c=document)=>c.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const EMAIL='f.abdo@theplug.inc';
  async function api(path,opts={}){const r=await fetch(path,{...opts,headers:{'content-type':'application/json',...(opts.headers||{})}});let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||'Request failed');return j}
  function toast(msg){const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}else alert(msg)}
  function ensure(){if($('#supplier-integrations'))return;
    const nav=$('.sidebar nav');if(nav){const b=document.createElement('button');b.dataset.view='supplier-integrations';b.textContent='⇄ Supplier Integrations';const settings=nav.querySelector('[data-view="settings"]');nav.insertBefore(b,settings||null);b.addEventListener('click',()=>openView())}
    const main=$('.admin-main');if(!main)return;const section=document.createElement('section');section.className='admin-view';section.id='supplier-integrations';section.innerHTML=`
      <div class="page-title"><div><small>SUPPLIER AUTOMATION</small><h1>Supplier Integrations</h1><p>Connect dealer accounts for live availability, shipping quotes and automated supplier ordering.</p></div><button class="secondary" id="supplierRefresh">Refresh Status</button></div>
      <div class="panel" style="max-width:980px">
        <div class="panel-head"><div><h2 style="margin-bottom:4px">Valvetronic Designs</h2><span class="muted">Dealer portal automation · Validation mode</span></div><span id="vtStatusPill" class="pill">Checking…</span></div>
        <div class="grid2" style="align-items:start;margin-top:18px">
          <div class="form">
            <label>Dealer account<input id="vtDealerEmail" value="${EMAIL}" readonly></label>
            <div id="vtStatusText" class="muted" style="margin:8px 0 16px">Checking dealer session…</div>
            <button class="primary" id="vtSendCode">Send verification code</button>
            <div id="vtVerifyBox" style="display:none;margin-top:16px">
              <label>Verification code<input id="vtOtp" inputmode="numeric" autocomplete="one-time-code" placeholder="Enter code from Valvetronic"></label>
              <div style="display:flex;gap:10px;margin-top:10px"><button class="primary" id="vtVerify">Verify & Connect</button><button class="secondary" id="vtCancel">Cancel</button></div>
            </div>
          </div>
          <div>
            <div class="panel" style="box-shadow:none;border:1px solid #e5e9ed;margin:0"><h3>Connector status</h3>
              <div style="display:grid;gap:10px;font-size:14px">
                <div style="display:flex;justify-content:space-between"><span>Live stock</span><strong>ON</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Live shipping</span><strong>ON</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Auto ordering</span><strong>OFF · Validation Mode</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Session storage</span><strong>Persistent Railway volume</strong></div>
              </div>
              <p class="muted" style="margin-top:16px">Automatic purchasing remains disabled until stock, SKU matching and Saudi shipping quotes are validated.</p>
            </div>
          </div>
        </div>
      </div>`;main.appendChild(section);
    $('#supplierRefresh')?.addEventListener('click',refreshStatus);$('#vtSendCode')?.addEventListener('click',sendCode);$('#vtVerify')?.addEventListener('click',verifyCode);$('#vtCancel')?.addEventListener('click',cancelAuth);
  }
  function openView(){document.querySelectorAll('.admin-view').forEach(v=>v.classList.toggle('active',v.id==='supplier-integrations'));document.querySelectorAll('.sidebar [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='supplier-integrations'));refreshStatus()}
  function paint(connected,msg){const pill=$('#vtStatusPill'),text=$('#vtStatusText');if(pill){pill.textContent=connected?'Connected':'Reauthentication Required';pill.style.background=connected?'#e8f7ed':'#fff4d5'}if(text)text.textContent=msg||'';const send=$('#vtSendCode');if(send)send.textContent=connected?'Reauthenticate dealer account':'Send verification code'}
  async function refreshStatus(){ensure();try{const r=await api('/api/admin/suppliers/valvetronic/status');const w=r.worker||{};paint(!!w.connected,w.connected?'Dealer session is authenticated and ready for live supplier quotes.':'Dealer session is not authenticated. Send a verification code to connect.')}catch(e){paint(false,'Unable to read supplier status: '+e.message)}}
  async function sendCode(){const btn=$('#vtSendCode');btn.disabled=true;btn.textContent='Sending…';try{const r=await api('/api/admin/suppliers/valvetronic/auth/start',{method:'POST',body:JSON.stringify({email:EMAIL})});if(r.connected){paint(true,'Dealer session is already authenticated.');$('#vtVerifyBox').style.display='none';toast('Valvetronic is already connected');return}$('#vtVerifyBox').style.display='block';$('#vtOtp').focus();paint(false,'Verification code sent. Enter the code received at '+EMAIL+'.');toast('Verification code sent')}catch(e){toast(e.message);paint(false,'Could not start authentication: '+e.message)}finally{btn.disabled=false;btn.textContent='Send verification code'}}
  async function verifyCode(){const code=String($('#vtOtp')?.value||'').trim();if(!/^\d{4,8}$/.test(code))return toast('Enter the verification code from Valvetronic');const btn=$('#vtVerify');btn.disabled=true;btn.textContent='Verifying…';try{const r=await api('/api/admin/suppliers/valvetronic/auth/verify',{method:'POST',body:JSON.stringify({code})});if(!r.connected)throw new Error(r.error||'Verification was not accepted');$('#vtVerifyBox').style.display='none';$('#vtOtp').value='';paint(true,'Dealer session is authenticated and saved to the persistent supplier-worker volume.');toast('Valvetronic connected successfully')}catch(e){toast(e.message)}finally{btn.disabled=false;btn.textContent='Verify & Connect'}}
  async function cancelAuth(){try{await api('/api/admin/suppliers/valvetronic/auth/cancel',{method:'POST',body:'{}'})}catch{}$('#vtVerifyBox').style.display='none';if($('#vtOtp'))$('#vtOtp').value='';toast('Verification cancelled')}
  function init(){ensure();const observer=new MutationObserver(()=>ensure());observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
