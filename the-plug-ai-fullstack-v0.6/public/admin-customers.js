(()=>{
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>'SAR '+Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2});
  async function api(url,opt){const r=await fetch(url,opt);let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'Request failed');return d}
  function notify(t){const x=$('#toast');if(x){x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}}

  const style=document.createElement('style');style.textContent=`
    .cust-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}.cust-toolbar input,.cust-toolbar select{min-height:42px;border:1px solid #dfe5e9;padding:0 12px;background:#fff}.cust-toolbar input{min-width:280px;flex:1}.cust-pill{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800;background:#eef5f8;color:#132135}.cust-pill.suspended{background:#fff0f0;color:#a62323}.cust-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 18px}.cust-summary .stat{padding:16px;border:1px solid #e4e9ed;background:#fff}.cust-summary small{display:block;color:#75818a;margin-bottom:5px}.cust-summary b{font-size:22px;color:#132135}.cust-modal{position:fixed;inset:0;z-index:1200;background:rgba(7,16,27,.52);display:none;align-items:center;justify-content:center;padding:24px}.cust-modal.show{display:flex}.cust-card{width:min(920px,96vw);max-height:88vh;overflow:auto;background:#fff;padding:26px;position:relative}.cust-close{position:absolute;right:16px;top:14px;border:0;background:none;font-size:28px;cursor:pointer}.cust-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}.cust-field{border:1px solid #e5eaed;padding:13px}.cust-field small{display:block;color:#7b8790;margin-bottom:4px}.cust-order{display:grid;grid-template-columns:1.3fr .7fr .7fr .8fr;gap:10px;align-items:center;border-top:1px solid #edf0f2;padding:12px 0}.cust-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.cust-actions select{height:38px;border:1px solid #d8e0e5;padding:0 10px}.cust-link{border:0;background:none;text-decoration:underline;cursor:pointer;color:#132135;font-weight:800}@media(max-width:800px){.cust-summary{grid-template-columns:1fr 1fr}.cust-grid{grid-template-columns:1fr}.cust-order{grid-template-columns:1fr 1fr}.cust-toolbar input{min-width:100%}}
  `;document.head.appendChild(style);

  function install(){
    const nav=$('.sidebar nav');if(!nav||$('#customers'))return;
    const ordersBtn=[...nav.querySelectorAll('[data-view]')].find(b=>b.dataset.view==='orders');
    const btn=document.createElement('button');btn.dataset.view='customers';btn.innerHTML='👤 Customers';
    nav.insertBefore(btn,ordersBtn||null);
    const section=document.createElement('section');section.className='admin-view';section.id='customers';section.innerHTML=`<div class="page-title"><div><small>CUSTOMER DATA</small><h1>Customers</h1><p>View customer accounts, contact details, account status, order history and spend.</p></div></div><div id="custSummary" class="cust-summary"></div><div class="panel"><div class="cust-toolbar"><input id="custSearch" placeholder="Search username, name, email or phone…"><select id="custStatus"><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select><button class="secondary" id="custRefresh">Refresh</button></div><div class="table-wrap"><table><thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spend</th><th>Status</th><th>Joined</th><th></th></tr></thead><tbody id="custRows"></tbody></table></div></div>`;
    const orders=$('#orders');orders?.parentNode.insertBefore(section,orders);
    const modal=document.createElement('div');modal.className='cust-modal';modal.id='custModal';modal.innerHTML='<div class="cust-card"><button class="cust-close" aria-label="Close">×</button><div id="custModalBody"></div></div>';document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});$('.cust-close',modal).onclick=()=>modal.classList.remove('show');
    btn.onclick=()=>openCustomers();$('#custRefresh').onclick=loadCustomers;$('#custStatus').onchange=loadCustomers;let timer;$('#custSearch').oninput=()=>{clearTimeout(timer);timer=setTimeout(loadCustomers,220)};
  }

  function openCustomers(){
    $$('.admin-view').forEach(v=>v.classList.toggle('active',v.id==='customers'));
    $$('.sidebar [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='customers'));
    loadCustomers();
  }

  async function loadCustomers(){
    const q=encodeURIComponent($('#custSearch')?.value||''),status=encodeURIComponent($('#custStatus')?.value||'');
    try{const d=await api(`/api/admin/customer-accounts?q=${q}&status=${status}`);const rows=d.customers||[];
      $('#custSummary').innerHTML=`<div class="stat"><small>Total Customers</small><b>${Number(d.summary?.total||0).toLocaleString()}</b></div><div class="stat"><small>Active</small><b>${Number(d.summary?.active||0).toLocaleString()}</b></div><div class="stat"><small>Total Orders</small><b>${Number(d.summary?.orders||0).toLocaleString()}</b></div><div class="stat"><small>Customer Revenue</small><b>${money(d.summary?.revenue||0)}</b></div>`;
      $('#custRows').innerHTML=rows.length?rows.map(c=>`<tr><td><b>${esc(c.username||'—')}</b></td><td>${esc([c.first_name,c.last_name].filter(Boolean).join(' ')||'—')}</td><td>${esc(c.email||'—')}</td><td>${esc(c.phone||'—')}</td><td>${Number(c.order_count||0)}</td><td>${money(c.total_spend||0)}</td><td><span class="cust-pill ${c.status==='suspended'?'suspended':''}">${esc(c.status||'active')}</span></td><td>${esc(c.created_at||'—')}</td><td><button class="cust-link" data-cust-id="${c.id}">View</button></td></tr>`).join(''):'<tr><td colspan="9">No customer accounts found.</td></tr>';
      $$('[data-cust-id]').forEach(b=>b.onclick=()=>viewCustomer(b.dataset.custId));
    }catch(e){notify(e.message)}
  }

  async function viewCustomer(id){
    try{const d=await api('/api/admin/customer-accounts/'+id),c=d.customer||{},orders=d.orders||[],emails=d.email_events||[];const modal=$('#custModal'),body=$('#custModalBody');
      body.innerHTML=`<h2 style="margin-top:0">${esc(c.username||'Customer')}</h2><p style="color:#6e7b85">Customer ID #${esc(c.id)}</p><div class="cust-grid"><div class="cust-field"><small>Username</small><b>${esc(c.username||'—')}</b></div><div class="cust-field"><small>Account Status</small><b>${esc(c.status||'active')}</b></div><div class="cust-field"><small>First Name</small><b>${esc(c.first_name||'—')}</b></div><div class="cust-field"><small>Last Name</small><b>${esc(c.last_name||'—')}</b></div><div class="cust-field"><small>Email</small><b>${esc(c.email||'—')}</b></div><div class="cust-field"><small>Phone</small><b>${esc(c.phone||'—')}</b></div><div class="cust-field"><small>Joined</small><b>${esc(c.created_at||'—')}</b></div><div class="cust-field"><small>Total Spend</small><b>${money(c.total_spend||0)}</b></div></div><div class="cust-actions"><label>Status <select id="custDetailStatus"><option value="active">Active</option><option value="suspended">Suspended</option></select></label><button class="secondary" id="custSaveStatus">Save Status</button></div><h3 style="margin-top:26px">Orders (${orders.length})</h3>${orders.length?orders.map(o=>`<div class="cust-order"><b>${esc(o.order_no)}</b><span>${money(o.total)}</span><span>${esc(o.status)}</span><span>${esc(o.created_at||'')}</span></div>`).join(''):'<p class="muted">No orders yet.</p>'}<h3 style="margin-top:26px">Recent Email Activity</h3>${emails.length?emails.map(e=>`<div class="cust-order"><b>${esc(e.event_type)}</b><span>${esc(e.status)}</span><span>${esc(e.created_at||'')}</span><span>${esc(e.error||e.provider_id||'')}</span></div>`).join(''):'<p class="muted">No recorded email activity.</p>'}<p class="muted" style="margin-top:20px">Passwords are never displayed in the admin panel.</p>`;
      $('#custDetailStatus').value=c.status||'active';$('#custSaveStatus').onclick=async()=>{try{await api('/api/admin/customer-accounts/'+id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:$('#custDetailStatus').value})});notify('Customer status updated');modal.classList.remove('show');loadCustomers()}catch(e){notify(e.message)}};modal.classList.add('show');
    }catch(e){notify(e.message)}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
