(()=>{
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const getUser=()=>{try{return JSON.parse(localStorage.getItem('plug-customer')||'null')}catch{return null}};
  const setUser=u=>{if(u)localStorage.setItem('plug-customer',JSON.stringify(u));else localStorage.removeItem('plug-customer')};
  async function api(path,opts={}){const r=await fetch(path,{...opts,headers:{'content-type':'application/json',...(opts.headers||{})}});let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||'Something went wrong.');return j}
  function toast(msg){const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1900)}else alert(msg)}
  function displayName(u){return u?.username||u?.first_name||String(u?.email||'Account').split('@')[0]||'Account'}
  function initials(name){const parts=String(name||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return'A';return parts.slice(0,2).map(x=>x[0]).join('').toUpperCase()}
  function replaceLegacyNames(root=document){const u=getUser();if(!u)return;const name=displayName(u);const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){return /Ahmed Ali/.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});const nodes=[];while(w.nextNode())nodes.push(w.currentNode);nodes.forEach(n=>n.nodeValue=(n.nodeValue||'').replace(/Ahmed Ali/g,name))}
  function patchSidebar(){const u=getUser();if(!u)return;const account=$('#account');if(!account)return;replaceLegacyNames(account);const candidates=$$('div,span,strong,p',account).filter(el=>(el.textContent||'').trim()==='AA');candidates.forEach(el=>el.textContent=initials(displayName(u)));}
  async function refreshUser(){const u=getUser();if(!u?.token)return u;try{const r=await api('/api/shop/me?token='+encodeURIComponent(u.token));setUser({...u,...r.customer});return {...u,...r.customer}}catch{return u}}
  async function renderRealOrders(){const u=getUser(),c=$('#accountContent');if(!u?.token||!c||!/^My Orders$/i.test(($('.pagehead',c)?.textContent||'').trim()))return;try{const r=await api('/api/shop/orders?token='+encodeURIComponent(u.token));const orders=r.orders||[];const tabs='<h1 class="pagehead">My Orders</h1><div class="orders-tabs"><button class="active">Active Orders</button><button>Order History</button></div>';
    if(!orders.length){c.innerHTML=tabs+'<div style="padding:34px 0;color:#66737d">You have no orders yet.</div>';return}
    c.innerHTML=tabs+orders.map(o=>`<div class="order-card"><h3>Order #${esc(o.order_no)} <span style="float:right">${esc((o.status||'placed').replace(/_/g,' '))}</span></h3><p>${esc(displayName(u))}</p><button class="btn outline" type="button">Order Details</button><div class="summary-row"><span>Total</span><strong>SR ${Number(o.total||0).toLocaleString('en-US',{maximumFractionDigits:2})}</strong></div></div>`).join('');
  }catch(e){console.warn('Unable to load account orders',e)}}
  function patchAccount(){if(location.hash!=='#account')return;patchSidebar();replaceLegacyNames($('#account')||document);renderRealOrders()}

  function bindAuthOverrides(){document.addEventListener('click',e=>{
    const choice=e.target.closest('[data-choice]');if(!choice)return;const type=choice.dataset.choice;if(type!=='login'&&type!=='register')return;e.preventDefault();e.stopImmediatePropagation();const modal=$('.tp-auth-modal'),body=$('.tp-auth-body',modal);if(!modal||!body)return;const h=$('.tp-auth-head h2',modal),p=$('.tp-auth-head p',modal);
    if(type==='login'){
      if(h)h.textContent='Log in';if(p)p.textContent='Use your username or email and password.';
      body.innerHTML=`<form class="tp-auth-form" id="tpModernLogin"><label>Username or email<input name="identifier" autocomplete="username" required></label><label>Password<input type="password" name="password" autocomplete="current-password" required></label><div class="tp-auth-actions"><button class="btn yellow" type="submit">Log in</button><button class="tp-auth-back" type="button">Back</button></div></form>`;
      $('.tp-auth-back',body).onclick=()=>location.reload();$('#tpModernLogin',body).onsubmit=async ev=>{ev.preventDefault();const btn=ev.submitter;btn.disabled=true;try{const d=Object.fromEntries(new FormData(ev.currentTarget));const r=await api('/api/shop/login',{method:'POST',body:JSON.stringify(d)});setUser(r.customer);toast('Logged in successfully');modal.classList.remove('open');$('.tp-auth-backdrop')?.classList.remove('open');location.hash='#account';setTimeout(patchAccount,100)}catch(err){toast(err.message)}finally{btn.disabled=false}};
    }else{
      if(h)h.textContent='Create account';if(p)p.textContent='Choose a username, enter your email, and create a password.';
      body.innerHTML=`<form class="tp-auth-form" id="tpModernRegister"><label>Username<input name="username" autocomplete="username" minlength="3" maxlength="40" pattern="[A-Za-z0-9._-]+" required><small style="display:block;margin-top:5px;color:#73808a">Letters, numbers, dots, hyphens and underscores only.</small></label><label>Email address<input type="email" name="email" autocomplete="email" required></label><label>Password<input type="password" name="password" autocomplete="new-password" minlength="8" required></label><label>Confirm password<input type="password" name="confirm" autocomplete="new-password" minlength="8" required></label><div class="tp-auth-actions"><button class="btn yellow" type="submit">Create account</button><button class="tp-auth-back" type="button">Back</button></div></form>`;
      $('.tp-auth-back',body).onclick=()=>location.reload();$('#tpModernRegister',body).onsubmit=async ev=>{ev.preventDefault();const btn=ev.submitter,d=Object.fromEntries(new FormData(ev.currentTarget));if(d.password!==d.confirm)return toast('Passwords do not match');btn.disabled=true;try{const r=await api('/api/shop/register',{method:'POST',body:JSON.stringify(d)});setUser(r.customer);toast('Account created successfully');modal.classList.remove('open');$('.tp-auth-backdrop')?.classList.remove('open');location.hash='#account';setTimeout(patchAccount,100)}catch(err){toast(err.message)}finally{btn.disabled=false}};
    }
  },true)}

  async function init(){await refreshUser();bindAuthOverrides();patchAccount();window.addEventListener('hashchange',()=>setTimeout(patchAccount,60));let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;patchAccount()})}).observe(document.documentElement,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
