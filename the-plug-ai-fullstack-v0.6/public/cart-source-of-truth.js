(()=>{
  const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>'SAR '+Number(n||0).toLocaleString('en-SA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const readCart=()=>{try{const v=JSON.parse(localStorage.getItem('plug-cart')||'[]');return Array.isArray(v)?v:[]}catch{return []}};
  const q=x=>Math.max(1,Number(x?.qty||1));
  const p=x=>Number(x?.price_sar??x?.price??0)||0;
  const t=x=>String(x?.title||x?.name||'Product');
  const img=x=>String(x?.image||x?.img||x?.image_url||'assets/logo.png');
  const sku=x=>String(x?.mfg_part_id||x?.sku||'');
  let busy=false;

  function writeCart(items){
    localStorage.setItem('plug-cart',JSON.stringify(items));
    localStorage.removeItem('plug-supplier-shipping-quote');
    localStorage.removeItem('plug-checkout-total-state');
    window.dispatchEvent(new CustomEvent('plug-cart-changed'));
  }
  function removeAt(i){const items=readCart();if(i<0||i>=items.length)return;items.splice(i,1);writeCart(items)}

  function renderCounts(items){const count=items.reduce((s,x)=>s+q(x),0);$$('.count').forEach(x=>x.textContent=String(count));const c=$('#cartItemsCount');if(c)c.textContent=String(count)}
  function renderDrawer(items){const root=$('#drawerItems');if(!root)return;if(!items.length){root.innerHTML='<p>Your cart is empty.</p>';return}root.innerHTML=items.map((x,i)=>`<div class="drawer-item"><img src="${esc(img(x))}"><div><strong>${esc(t(x))}</strong><div class="price">${money(p(x)*q(x))}</div><div>Qty ${q(x)}</div><button type="button" data-tp-cart-remove="${i}" style="border:0;background:none;padding:0;text-decoration:underline">Remove</button></div></div>`).join('')}
  function renderCartPage(items){const root=$('#cartPageItems');if(!root)return;if(!items.length){root.innerHTML='<div class="empty-state"><div class="empty-art"></div><h2>Your cart is waiting for an upgrade.</h2><a class="btn" href="#shop">Start shopping</a></div>';return}root.innerHTML=items.map((x,i)=>`<div class="cart-item"><img src="${esc(img(x))}"><div><strong>${esc(t(x))}</strong><div class="sub">${esc(sku(x))}</div><div style="margin-top:10px">Qty ${q(x)} &nbsp; <button type="button" data-tp-cart-remove="${i}" style="border:0;background:none;text-decoration:underline">Remove</button></div></div><strong>${money(p(x)*q(x))}</strong></div>`).join('')}
  function renderCheckout(items){const summary=$('#checkout .checkout-summary');if(!summary)return;const heading=$$('h4',summary).find(h=>/your cart/i.test(h.textContent||''));if(!heading)return;$$('.checkout-cart-mini,.tp-checkout-empty',summary).forEach(n=>n.remove());let anchor=heading;if(!items.length){const e=document.createElement('p');e.className='tp-checkout-empty muted-note';e.textContent='Your cart is empty.';anchor.after(e);return}for(const x of items){const row=document.createElement('div');row.className='checkout-cart-mini';row.dataset.tpLiveCart='1';row.innerHTML=`<img src="${esc(img(x))}" alt="${esc(t(x))}"><div><b>${esc(t(x))}</b><small>Qty ${q(x)}</small><strong>${money(p(x)*q(x))}</strong></div>`;anchor.after(row);anchor=row}}
  function renderTotals(items){const subtotal=items.reduce((s,x)=>s+p(x)*q(x),0);const d=$('#drawerSubtotal');if(d)d.textContent=money(subtotal);const s=$('#subtotal');if(s)s.textContent=money(subtotal);const total=$('#total');if(total&&location.hash!=='#checkout')total.textContent=money(subtotal);const checkout=$('#checkout .checkout-summary');if(checkout){const rows=$$('.summary-row',checkout);const sub=rows.find(r=>/^subtotal$/i.test((r.firstElementChild?.textContent||'').trim()));if(sub?.lastElementChild)sub.lastElementChild.textContent=money(subtotal)}}
  function renderAll(){const items=readCart();renderCounts(items);renderDrawer(items);renderCartPage(items);renderCheckout(items);renderTotals(items)}

  // The legacy app keeps its own in-memory cart and used to overwrite localStorage
  // whenever #cart opened. Replace the legacy global renderCart/removeItem functions
  // so every route renders from plug-cart, which is the single source of truth.
  try{window.renderCart=renderAll;window.removeItem=i=>{removeAt(Number(i));renderAll()}}catch{}

  async function exactVisibleProduct(){
    const root=$('#product .product-info');if(!root)return null;
    const title=(root.querySelector('h1')?.textContent||'').trim();
    const brand=(root.querySelector('.brandmark')?.textContent||'').trim();
    const brandline=(root.querySelector('.brandline')?.textContent||'');
    const m=brandline.match(/MFG:\s*([^·]+)/i),mfg=(m?.[1]||'').trim();
    const r=await fetch('/api/products?limit=500');if(!r.ok)throw new Error('Could not load product catalog');const list=await r.json();const products=Array.isArray(list)?list:(list.products||[]);
    let hit=products.find(x=>mfg&&String(x.mfg_part_id||'').trim().toLowerCase()===mfg.toLowerCase());
    if(!hit)hit=products.find(x=>title&&String(x.title||'').trim().toLowerCase()===title.toLowerCase()&&(!brand||String(x.brand_name||'').trim().toLowerCase()===brand.toLowerCase()));
    if(!hit)throw new Error('Could not match the visible product to the catalog');
    try{const d=await fetch('/api/products/'+encodeURIComponent(hit.id));if(d.ok)hit=await d.json()}catch{}
    return hit;
  }
  async function addVisibleProduct(btn){
    if(busy)return;busy=true;btn.disabled=true;
    try{
      const product=await exactVisibleProduct();
      const qty=Math.max(1,Number($('#product .qty span')?.textContent||1));
      const item={id:product.id,product_id:product.id,title:product.title,name:product.title,brand_name:product.brand_name,mfg_part_id:product.mfg_part_id,sku:product.mfg_part_id,price_sar:Number(product.price_sar||0),price:Number(product.price_sar||0),qty,image:product.images?.[0]?.url||product.image||'assets/logo.png'};
      const items=readCart();const idx=items.findIndex(x=>String(x.product_id||x.id||'')===String(item.product_id));if(idx>=0)items[idx]={...items[idx],...item,qty:q(items[idx])+qty};else items.push(item);writeCart(items);renderAll();
      const toast=$('#toast');if(toast){toast.textContent='Added to cart';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
      const cartBtn=$('[data-cart-open]');if(cartBtn)setTimeout(()=>cartBtn.click(),0);
    }catch(e){console.error(e);alert(e.message||'Could not add this product to cart.')}finally{busy=false;btn.disabled=false}
  }

  document.addEventListener('click',e=>{
    const add=e.target.closest('#product .addcart');if(add){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();addVisibleProduct(add);return}
    const rem=e.target.closest('[data-tp-cart-remove]');if(rem){e.preventDefault();e.stopPropagation();removeAt(Number(rem.dataset.tpCartRemove));renderAll()}
  },true);

  const nativeSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){nativeSet.call(this,k,v);if(this===localStorage&&k==='plug-cart')window.dispatchEvent(new CustomEvent('plug-cart-changed'))};
  const nativeRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){nativeRemove.call(this,k);if(this===localStorage&&k==='plug-cart')window.dispatchEvent(new CustomEvent('plug-cart-changed'))};
  window.addEventListener('plug-cart-changed',()=>setTimeout(renderAll,0));window.addEventListener('storage',e=>{if(e.key==='plug-cart')renderAll()});window.addEventListener('hashchange',()=>setTimeout(renderAll,0));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderAll,{once:true});else renderAll();
})();
