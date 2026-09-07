(()=>{
  const $=(s,c=document)=>c.querySelector(s);
  const EMAIL='f.abdo@theplug.inc';
  async function api(path,opts={}){const r=await fetch(path,{...opts,headers:{'content-type':'application/json',...(opts.headers||{})}});let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||'Request failed');return j}
  function toast(msg){const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}else alert(msg)}
  function ensure(){if($('#supplier-integrations'))return;
    const nav=$('.sidebar nav');if(nav){const b=document.createElement('button');b.dataset.view='supplier-integrations';b.textContent='⇄ Supplier Integrations';const settings=nav.querySelector('[data-view="settings"]');nav.insertBefore(b,settings||null);b.addEventListener('click',openView)}
    const main=$('.admin-main');if(!main)return;const section=document.createElement('section');section.className='admin-view';section.id='supplier-integrations';section.innerHTML=`
      <div class="page-title"><div><small>SUPPLIER AUTOMATION</small><h1>Supplier Integrations</h1><p>Connect dealer accounts for live availability, shipping quotes and automated supplier ordering.</p></div><button class="secondary" id="supplierRefresh">Refresh Status</button></div>
      <div class="panel" style="max-width:980px">
        <div class="panel-head"><div><h2 style="margin-bottom:4px">Valvetronic Designs</h2><span class="muted">Dealer portal automation · Validation mode</span></div><span id="vtStatusPill" class="pill">Checking…</span></div>
        <div class="grid2" style="align-items:start;margin-top:18px">
          <div class="form">
            <label>Dealer account<input id="vtDealerEmail" value="${EMAIL}" readonly></label>
            <div id="vtStatusText" class="muted" style="margin:8px 0 16px">Checking dealer session…</div>
            <div class="panel" style="box-shadow:none;border:1px solid #e5e9ed;margin:0 0 14px;padding:16px">
              <strong>Connect your Valvetronic session</strong>
              <ol style="margin:10px 0 0 20px;line-height:1.6">
                <li>Click <b>Open Valvetronic Login</b> and sign in normally using your email + OTP.</li>
                <li>Once signed in, open Chrome DevTools → Network → Doc.</li>
                <li>Right-click the signed-in <b>account.valvetronic.com</b> request → Copy → Copy as cURL.</li>
                <li>Paste it below and click <b>Connect Session</b>.</li>
              </ol>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap"><button class="primary" id="vtOpenLogin">Open Valvetronic Login</button></div>
            <label>Signed-in cURL request<textarea id="vtCurl" rows="7" placeholder="Paste the copied cURL here. It is sent directly to the secure supplier worker and is not stored in the admin page."></textarea></label>
            <button class="primary" id="vtImport">Connect Session</button>
          </div>
          <div><div class="panel" style="box-shadow:none;border:1px solid #e5e9ed;margin:0"><h3>Connector status</h3>
            <div style="display:grid;gap:10px;font-size:14px"><div style="display:flex;justify-content:space-between"><span>Live stock</span><strong>ON</strong></div><div style="display:flex;justify-content:space-between"><span>Live shipping</span><strong>ON</strong></div><div style="display:flex;justify-content:space-between"><span>Auto ordering</span><strong>OFF · Validation Mode</strong></div><div style="display:flex;justify-content:space-between"><span>Session storage</span><strong>Persistent Railway volume</strong></div></div>
            <p class="muted" style="margin-top:16px">Valvetronic blocks automated OTP login from cloud browsers, so authentication is completed in your normal browser and the signed-in session is then securely transferred to the worker.</p>
            <p class="muted">Automatic purchasing remains disabled until stock, SKU matching and Saudi shipping quotes are validated.</p>
          </div></div>
        </div>
      </div>`;main.appendChild(section);
    $('#supplierRefresh')?.addEventListener('click',refreshStatus);$('#vtOpenLogin')?.addEventListener('click',()=>window.open('https://account.valvetronic.com','_blank','noopener'));$('#vtImport')?.addEventListener('click',importSession);
  }
  function openView(){document.querySelectorAll('.admin-view').forEach(v=>v.classList.toggle('active',v.id==='supplier-integrations'));document.querySelectorAll('.sidebar [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='supplier-integrations'));refreshStatus()}
  function paint(connected,msg){const pill=$('#vtStatusPill'),text=$('#vtStatusText');if(pill){pill.textContent=connected?'Connected':'Reauthentication Required';pill.style.background=connected?'#e8f7ed':'#fff4d5'}if(text)text.textContent=msg||''}
  async function refreshStatus(){ensure();try{const r=await api('/api/admin/suppliers/valvetronic/status');const w=r.worker||{};paint(!!w.connected,w.connected?'Dealer session is authenticated and ready for live supplier quotes.':'Dealer session is not authenticated. Sign in to Valvetronic in your normal browser and connect the signed-in session below.')}catch(e){paint(false,'Unable to read supplier status: '+e.message)}}
  async function importSession(){const curl=String($('#vtCurl')?.value||'').trim();if(!curl)return toast('Paste the signed-in Valvetronic cURL request first');const btn=$('#vtImport');btn.disabled=true;btn.textContent='Connecting…';try{await api('/api/admin/suppliers/valvetronic/auth/import',{method:'POST',body:JSON.stringify({curl})});$('#vtCurl').value='';toast('Session imported. Checking connection…');await new Promise(r=>setTimeout(r,1200));await refreshStatus()}catch(e){toast(e.message);paint(false,'Could not connect session: '+e.message)}finally{btn.disabled=false;btn.textContent='Connect Session'}}
  function init(){ensure();const observer=new MutationObserver(ensure);observer.observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
