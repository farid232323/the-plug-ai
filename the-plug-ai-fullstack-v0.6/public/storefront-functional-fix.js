(()=>{
  const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>new Intl.NumberFormat('en-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(Number(n||0));
  const readVehicle=()=>{try{return JSON.parse(localStorage.getItem('plug-selected-vehicle')||'null')}catch{return null}};
  const cleanChassis=v=>String(v||'').replace(/^Audi /,'').replace(/\s*\([^)]*\)$/,'').trim();
  const state=()=>({brand:localStorage.getItem('plug-selected-brand')||'',category:localStorage.getItem('plug-selected-category')||'',vehicle:readVehicle(),q:localStorage.getItem('plug-shop-search')||''});
  let rendering=false;

  function card(p){return `<article class="product-card api-card tp-functional-card" data-api-product="${p.id}"><div class="product-image"><img src="${esc(p.image||'assets/product-runningboard.png')}" alt="${esc(p.title)}"></div><div class="brandline">${esc(p.brand_name||'')}</div><h3>${esc(p.title||'Product')}</h3><div class="price"><strong>${money(p.price_sar)}</strong>${p.msrp_sar&&Number(p.msrp_sar)>Number(p.price_sar)?` <del>${money(p.msrp_sar)}</del>`:''}</div><button class="btn full api-open-product" type="button">Select options</button></article>`}

  async function fetchCatalog(){const s=state(),u=new URL('/api/storefront/products',location.origin);u.searchParams.set('limit','1500');if(s.brand)u.searchParams.set('brand',s.brand);if(s.category)u.searchParams.set('category',s.category);if(s.q)u.searchParams.set('q',s.q);if(s.vehicle){if(s.vehicle.make)u.searchParams.set('make',s.vehicle.make);if(s.vehicle.model)u.searchParams.set('model',s.vehicle.model);if(s.vehicle.chassis)u.searchParams.set('chassis',cleanChassis(s.vehicle.chassis))}const r=await fetch(u);if(!r.ok)throw new Error('Could not load storefront products');const j=await r.json();return Array.isArray(j)?j:[]}

  function contextLabel(){const s=state();if(s.vehicle?.label)return `Parts for ${s.vehicle.label}`;if(s.brand)return s.brand==='P3'?'P3 Gauges':s.brand;if(s.category)return s.category;if(s.q)return `Search results for “${s.q}”`;return 'Shop all products'}

  async function renderShop(){if(rendering)return;const grid=$('.shop-products');if(!grid||location.hash!=='#shop')return;rendering=true;try{grid.innerHTML='<div class="tp-no-products">Loading products…</div>';const products=await fetchCatalog();grid.innerHTML=products.length?products.map(card).join(''):'<div class="tp-no-products">No matching products are available for this selection.</div>';const h=$('#shop .pagehead');if(h)h.textContent=contextLabel();const sub=$('#shop .breadcrumbs');if(sub)sub.textContent='Home / '+contextLabel();}catch(e){console.error(e);grid.innerHTML='<div class="tp-no-products">Products could not be loaded. Please refresh and try again.</div>'}finally{rendering=false}}

  async function openProduct(id){try{const r=await fetch('/api/products/'+encodeURIComponent(id));if(!r.ok)throw new Error('Product could not be loaded');const p=await r.json();window.__plugProduct=p;location.hash='#product';window.dispatchEvent(new HashChangeEvent('hashchange'));setTimeout(()=>{
      const root=$('#product .product-info');if(!root)return;
      const brand=$('.brandmark',root);if(brand)brand.textContent=p.brand_name||'';
      const title=$('h1',root);if(title)title.textContent=p.title||'';
      const price=$('.bigprice',root);if(price)price.textContent=money(p.price_sar);
      const line=$('.brandline',root);if(line)line.textContent='MFG: '+(p.mfg_part_id||'—')+' · The Plug ID: '+(p.the_plug_id||'—');
      const desc=$('p',root);if(desc)desc.textContent=p.short_description||p.description||'';
      const main=$('#product .gallery-main img');const imgs=(p.images||[]).filter(x=>x.url);if(main&&imgs[0]){main.src=imgs[0].url;main.alt=p.title||'Product image'}
      const thumbs=$('#product .thumbs');if(thumbs&&imgs.length){thumbs.innerHTML=imgs.map((x,i)=>`<button class="tp-gallery-thumb ${i===0?'active':''}" type="button" data-img="${esc(x.url)}"><img src="${esc(x.url)}" alt="${esc(x.alt_text||p.title||'Product image')}"></button>`).join('');$$('.tp-gallery-thumb',thumbs).forEach(b=>b.onclick=()=>{if(main)main.src=b.dataset.img})}
      const holder=$('#product .accordions');if(holder){const fits=p.fitments||[];holder.innerHTML=`<div class="accordion"><h3>Product Details</h3><p>${esc(p.description||p.short_description||'No description available.')}</p></div><div class="accordion"><h3>Specifications</h3><p><strong>Brand:</strong> ${esc(p.brand_name||'—')}<br><strong>MFG Part ID:</strong> ${esc(p.mfg_part_id||'—')}<br><strong>Category:</strong> ${esc(p.category||'—')}</p></div><div class="accordion"><h3>Compatible Vehicles (${fits.length})</h3>${fits.length?`<p>${fits.slice(0,40).map(f=>esc([f.car_brand,f.model,f.year_raw||f.year_from,cleanChassis(f.chassis)].filter(Boolean).join(' · '))).join('<br>')}</p>`:'<p>No fitment records available.</p>'}</div>`}
    },0)}catch(e){console.error(e);alert(e.message||'Could not open product.')}}

  function clearAll(){localStorage.removeItem('plug-selected-brand');localStorage.removeItem('plug-selected-category');localStorage.removeItem('plug-selected-vehicle');localStorage.removeItem('plug-shop-search')}
  function goShop(){if(location.hash!=='#shop')location.hash='#shop';else renderShop();setTimeout(renderShop,30)}

  document.addEventListener('click',e=>{
    const cat=e.target.closest('.tp-cat');if(cat){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const name=(cat.textContent||'').trim();localStorage.setItem('plug-selected-category',name);localStorage.removeItem('plug-selected-brand');localStorage.removeItem('plug-selected-vehicle');localStorage.removeItem('plug-shop-search');goShop();return}
    const brand=e.target.closest('[data-brand]');if(brand&&(brand.closest('.tp-brandbar')||brand.closest('.tp-brand-menu'))){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const raw=(brand.dataset.brand||brand.textContent||'').trim();const name=/^p3(?:\s+gauges?)?$/i.test(raw)?'P3':/^auto\s?id$/i.test(raw)?'AUTOID':/valvetronic/i.test(raw)?'Valvetronic':raw;localStorage.setItem('plug-selected-brand',name);localStorage.removeItem('plug-selected-category');localStorage.removeItem('plug-selected-vehicle');localStorage.removeItem('plug-shop-search');$('.tp-brand-menu')?.classList.remove('open');goShop();return}
    const car=e.target.closest('[data-car]');if(car){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const [make,family,model,chassis]=String(car.dataset.car||'').split('|');const v={make,family,model,chassis,label:`${make} ${model}${chassis?' · '+cleanChassis(chassis):''}`};localStorage.setItem('plug-selected-vehicle',JSON.stringify(v));localStorage.removeItem('plug-selected-brand');localStorage.removeItem('plug-selected-category');localStorage.removeItem('plug-shop-search');$$('.selected-vehicle').forEach(x=>x.textContent=v.label);$('.tp-car-mega')?.classList.remove('open');$('.tp-car-backdrop')?.classList.remove('open');document.body.style.overflow='';goShop();return}
    const prod=e.target.closest('.tp-functional-card .api-open-product,.tp-functional-card .product-image,.tp-functional-card h3');if(prod){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const id=prod.closest('[data-api-product]')?.dataset.apiProduct;if(id)openProduct(id);return}
    const shop=e.target.closest('.staging-nav a');if(shop&&/^shop$/i.test((shop.textContent||'').trim())){clearAll();setTimeout(renderShop,20)}
  },true);

  function doSearch(){const input=$('.searchbar input');const q=(input?.value||'').trim();if(!q)return;localStorage.setItem('plug-shop-search',q);localStorage.removeItem('plug-selected-brand');localStorage.removeItem('plug-selected-category');localStorage.removeItem('plug-selected-vehicle');goShop()}
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.searchbar input')){e.preventDefault();doSearch()}},true);
  document.addEventListener('click',e=>{if(e.target.closest('.searchbar button')){e.preventDefault();e.stopPropagation();doSearch()}},true);
  window.addEventListener('hashchange',()=>{if(location.hash==='#shop')setTimeout(renderShop,60)});

  async function refreshHomeProducts(){const top=$('[data-products="top"]');if(!top)return;try{const r=await fetch('/api/storefront/products?limit=60');const ps=await r.json();if(!Array.isArray(ps)||!ps.length)return;const groups={};for(const p of ps)(groups[p.brand_name]??=[]).push(p);const picked=[];for(const b of ['P3','Valvetronic','AUTOID'])picked.push(...(groups[b]||[]).slice(0,3));for(const p of ps)if(picked.length<9&&!picked.some(x=>x.id===p.id))picked.push(p);top.innerHTML=picked.slice(0,9).map(card).join('')}catch(e){console.warn(e)}}

  const init=()=>{setTimeout(refreshHomeProducts,300);if(location.hash==='#shop')setTimeout(renderShop,150)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
