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

(()=>{
  const VAT_RATE=0.15;
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const round=n=>Math.round((Number(n||0)+Number.EPSILON)*100)/100;
  const money=n=>'SAR '+Number(n||0).toLocaleString('en-SA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const cart=()=>{try{return JSON.parse(localStorage.getItem('plug-cart')||'[]')}catch{return []}};
  const user=()=>{try{return JSON.parse(localStorage.getItem('plug-customer')||'null')}catch{return null}};
  const guest=()=>{try{return JSON.parse(localStorage.getItem('plug-guest')||'null')}catch{return null}};
  const subtotal=()=>round(cart().reduce((s,x)=>s+Number(x.price||x.price_sar||0)*Number(x.qty||1),0));
  const parseAmount=text=>{const m=String(text||'').replace(/,/g,'').match(/(-?\d+(?:\.\d+)?)/);return m?Number(m[1]):0};
  function storedQuote(){try{const q=JSON.parse(localStorage.getItem('plug-supplier-shipping-quote')||'null');return q&&Number.isFinite(Number(q.amount_sar))?q:null}catch{return null}}
  function checkout(){return $('#checkout .checkout-summary')}
  function rowByLabel(label){const root=checkout();if(!root)return null;return $$('.summary-row',root).find(r=>String(r.querySelector('span')?.textContent||'').trim().toLowerCase()===label.toLowerCase())||null}
  function currentShipping(){const q=storedQuote();if(q)return Math.max(0,round(q.amount_sar));const r=rowByLabel('Delivery')||rowByLabel('Shipping');return Math.max(0,round(parseAmount(r?.querySelector('strong')?.textContent||r?.textContent||0)))}
  function breakdown(){const product=subtotal(),shipping=currentShipping(),taxable=round(product+shipping),vat=round(taxable*VAT_RATE),total=round(taxable+vat);return{product,shipping,taxable,vat,total}}
  function ensureStyle(){if($('#tp-tax-style'))return;const s=document.createElement('style');s.id='tp-tax-style';s.textContent=`.tp-customs-note{margin:14px 0 16px;padding:12px 14px;background:#fff9df;border-left:4px solid #F8FF66;color:#37444d;font-size:12px;line-height:1.45}.tp-customs-note strong{color:#132135}.tp-shipping-source{display:block;font-size:10px;color:#7a858d;margin-top:3px}`;document.head.appendChild(s)}
  function render(){const root=checkout();if(!root)return;ensureStyle();const b=breakdown();let sub=rowByLabel('Subtotal');let ship=rowByLabel('Delivery')||rowByLabel('Shipping');let fees=rowByLabel('Fees')||rowByLabel('VAT (15%)');let total=$('.summary-total',root);
    if(sub){sub.querySelector('span').textContent='Subtotal';sub.querySelector('strong').textContent=money(b.product)}
    if(ship){ship.querySelector('span').textContent='Shipping';ship.querySelector('strong').textContent=money(b.shipping);const q=storedQuote();let note=ship.querySelector('.tp-shipping-source');if(!note){note=document.createElement('small');note.className='tp-shipping-source';ship.querySelector('span').appendChild(note)}note.textContent=q?(q.supplier?` Live quote from ${q.supplier}`:' Live supplier quote'):' Current checkout shipping rate'}
    if(fees){fees.querySelector('span').textContent='VAT (15%)';fees.querySelector('strong').textContent=money(b.vat)}
    if(total){const labels=total.querySelectorAll('span,strong');if(labels[0])labels[0].textContent='Total';if(labels[1])labels[1].textContent=money(b.total)}
    let notice=$('.tp-customs-note',root);if(!notice){notice=document.createElement('div');notice.className='tp-customs-note';const place=$('#placeOrderBtn',root);if(place)root.insertBefore(notice,place);else root.appendChild(notice)}notice.innerHTML='<strong>Customs fees are not included.</strong> Additional customs charges may be assessed by Saudi Customs and may be payable separately upon delivery.';
    root.dataset.tpTaxSubtotal=String(b.product);root.dataset.tpTaxShipping=String(b.shipping);root.dataset.tpTaxVat=String(b.vat);root.dataset.tpTaxTotal=String(b.total);
  }
  function toast(msg){const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1900)}else alert(msg)}
  async function api(path,opts={}){const r=await fetch(path,{...opts,headers:{'content-type':'application/json',...(opts.headers||{})}});let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||'Something went wrong.');return j}
  function bindPlace(){const place=$('#placeOrderBtn');if(!place||place.dataset.tpTaxBound==='1')return;place.dataset.tpTaxBound='1';place.onclick=async e=>{e.preventDefault();const items=cart();if(!items.length)return toast('Your cart is empty.');const u=user(),g=guest();if(!u&&!g){toast('Please continue as guest or sign in before placing your order.');return}const who=u||g,b=breakdown();place.disabled=true;try{const r=await api('/api/shop/order',{method:'POST',body:JSON.stringify({token:u?.token||'',customer_name:`${who.first_name||''} ${who.last_name||''}`.trim()||who.username||'Guest',email:who.email||'',phone:who.phone||'',subtotal:b.product,shipping:b.shipping,vat_rate:VAT_RATE,vat:b.vat,total:b.total,customs_excluded:true,items:items.map(x=>({product_id:x.id||x.product_id||null,title:x.name||x.title||'Product',qty:x.qty||1,price:Number(x.price||x.price_sar||0)}))})});localStorage.setItem('plug-last-order',JSON.stringify({...r,subtotal:b.product,shipping:b.shipping,vat:b.vat,total:b.total,customs_excluded:true}));localStorage.setItem('plug-cart','[]');$$('.count').forEach(x=>x.textContent='0');toast(`Order ${r.order_no} placed`);location.hash='#success'}catch(err){toast(err.message)}finally{place.disabled=false}}}
  function refresh(){if(location.hash==='#checkout'){render();bindPlace()}}
  window.ThePlugSupplierQuote={setShippingQuote(q){if(!q||!Number.isFinite(Number(q.amount_sar)))return false;localStorage.setItem('plug-supplier-shipping-quote',JSON.stringify({amount_sar:round(q.amount_sar),supplier:String(q.supplier||''),quoted_at:q.quoted_at||new Date().toISOString(),currency:'SAR'}));refresh();window.dispatchEvent(new CustomEvent('plug:shipping-quote'));return true},clearShippingQuote(){localStorage.removeItem('plug-supplier-shipping-quote');refresh()}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0),{once:true});else setTimeout(refresh,0);
  window.addEventListener('hashchange',()=>setTimeout(refresh,40));window.addEventListener('plug:shipping-quote',()=>setTimeout(refresh,0));
  let queued=false;new MutationObserver(()=>{if(location.hash!=='#checkout'||queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();bindPlace()})}).observe(document.documentElement,{childList:true,subtree:true});
})();