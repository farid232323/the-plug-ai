(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const fmt=n=>new Intl.NumberFormat('en-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(Number(n||0));
  let FITMENT={productBrands:[],makes:{}};
  let selectedBrand=localStorage.getItem('plug-selected-brand')||'';
  let selectedVehicle=JSON.parse(localStorage.getItem('plug-selected-vehicle')||'null');

  if(!document.querySelector('link[href="storefront-v07.css"]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='storefront-v07.css';document.head.appendChild(l);
  }

  const extra=document.createElement('style');
  extra.textContent=`
    .tp-brand-menu{position:fixed;z-index:250;background:#fff;border:1px solid #e6e9ec;box-shadow:0 24px 70px rgba(19,33,53,.22);padding:18px;display:none;width:min(620px,calc(100vw - 30px))}.tp-brand-menu.open{display:block}.tp-brand-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.tp-brand-item{display:flex;align-items:center;gap:12px;border:1px solid #e8ebee;background:#fff;padding:14px;text-align:left}.tp-brand-item:hover{border-color:#8FC6E4;background:#f5fbfe}.tp-brand-item img{width:42px;height:42px;object-fit:contain}.tp-brand-item b{font-size:14px}.tp-menu-note{font-size:12px;color:#7a838c;margin:0 0 12px}
    .tp-car-mega{overflow:auto;max-height:calc(100vh - 130px)}.tp-car-family{min-width:0}.tp-car-option{line-height:1.25}.tp-car-meta{display:block;font-size:11px;color:#7b858d;margin-top:2px}.tp-home .tp-brand{cursor:pointer}.tp-home .tp-brand:hover{background:#F8FF66;color:#132135}.tp-filter-chip{display:inline-flex;align-items:center;gap:8px;background:#f1f8fc;border:1px solid #cfe7f4;padding:8px 11px;font-size:12px;margin:0 8px 10px 0}.tp-filter-chip button{border:0;background:none;font-weight:800}.tp-no-products{padding:35px 0;color:#68727b}
    @media(max-width:720px){.tp-brand-grid{grid-template-columns:1fr}.tp-brand-menu{left:15px!important;right:15px;width:auto}.tp-car-mega{max-height:100vh}}
  `;document.head.appendChild(extra);

  function routeTo(hash){location.hash=hash;window.dispatchEvent(new HashChangeEvent('hashchange'))}
  function productCard(p){return `<article class="product-card api-card" data-api-product="${p.id}"><div class="product-image"><img src="${esc(p.image||'assets/product-runningboard.png')}" alt="${esc(p.title)}"></div><div class="brandline">${esc(p.brand_name||'')}</div><h3>${esc(p.title)}</h3><div class="price"><strong>${fmt(p.price_sar)}</strong>${p.msrp_sar&&p.msrp_sar>p.price_sar?` <del>${fmt(p.msrp_sar)}</del>`:''}</div><button class="btn full api-open-product">Select options</button></article>`}
  async function fetchProducts(params=''){try{return await (await fetch('/api/products?limit=200'+params)).json()}catch{return []}}
  async function loadProduct(id){try{const p=await (await fetch('/api/products/'+id)).json();if(!p||p.error)return;const root=document.querySelector('#product .product-info');if(root){root.querySelector('.brandmark').textContent=p.brand_name||'';root.querySelector('h1').textContent=p.title||'';root.querySelector('.bigprice').textContent=fmt(p.price_sar);const b=root.querySelector('.brandline');if(b)b.textContent='MFG: '+(p.mfg_part_id||'—')+' · The Plug ID: '+(p.the_plug_id||'—')}const main=document.querySelector('#product .gallery-main img');if(main&&p.images?.[0])main.src=p.images[0].url;const desc=document.querySelector('#product .accordions .accordion p');if(desc)desc.textContent=p.description||'';window.__plugProduct=p}catch(e){console.warn(e)}}
  function bindProductButtons(scope=document){scope.querySelectorAll('.api-open-product').forEach(b=>b.onclick=e=>{const id=e.target.closest('[data-api-product]')?.dataset.apiProduct;if(id){routeTo('#product');loadProduct(id)}})}

  function unique(items){return [...new Set((items||[]).filter(Boolean))]}
  function normalizeFitmentData(){
    FITMENT.productBrands=(FITMENT.productBrands||[]).filter(b=>['AUTOID','P3','Valvetronic'].includes(b.name));
    if(FITMENT.makes?.Scion)delete FITMENT.makes.Scion;
    if(FITMENT.makes?.Subaru)delete FITMENT.makes.Subaru;

    if(FITMENT.makes?.Toyota){
      const supra=(FITMENT.makes.Toyota['GR Supra']||[]).filter(v=>/^GR Supra 3\.0(?: Premium)?\|/i.test(v));
      FITMENT.makes.Toyota=supra.length?{'GR Supra 3.0 (B58)':supra}:{};
      if(!supra.length)delete FITMENT.makes.Toyota;
    }

    const bmw=FITMENT.makes?.BMW;
    if(!bmw)return;

    const mSeries=[];
    const pull=(key,labelOverride)=>{
      (bmw[key]||[]).forEach(v=>{
        const [model,chassis='']=v.split('|');
        const label=labelOverride?`${labelOverride} — ${model}`:model;
        mSeries.push(`${label}|${chassis}`);
      });
    };

    pull('1 Series M Coupé','1M');
    ['M2','M3','M4','M5','M8'].forEach(k=>pull(k));

    // Some genuine M3 fitments are stored by suppliers under the regular 3 Series family.
    (bmw['3 Series']||[]).filter(v=>/^M3(?:\s|\||$)/i.test(v)).forEach(v=>mSeries.push(v));

    // Full M SUVs are also surfaced inside BMW M Series while remaining identifiable by model/chassis.
    ['X3 M','X4 M','X5 M','X6 M'].forEach(k=>pull(k));

    const xSeries=[];
    Object.keys(bmw).filter(k=>/^X\d/.test(k)).forEach(k=>{
      (bmw[k]||[]).forEach(v=>{const [model,chassis='']=v.split('|');xSeries.push(`${k} — ${model}|${chassis}`)})
    });
    const zSeries=[];
    Object.keys(bmw).filter(k=>/^Z\d/.test(k)).forEach(k=>{
      (bmw[k]||[]).forEach(v=>{const [model,chassis='']=v.split('|');zSeries.push(`${k} — ${model}|${chassis}`)})
    });

    const cleaned={};
    ['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series','7 Series','8 Series'].forEach(k=>{
      if(bmw[k])cleaned[k]=bmw[k].filter(v=>!(/^M3(?:\s|\||$)/i.test(v)&&k==='3 Series'));
    });
    if(mSeries.length)cleaned['M Series']=unique(mSeries);
    if(xSeries.length)cleaned['X Series']=unique(xSeries);
    if(zSeries.length)cleaned['Z Series']=unique(zSeries);
    Object.keys(bmw).forEach(k=>{
      if(cleaned[k]||['1 Series M Coupé','M2','M3','M4','M5','M8','X3 M','X4 M','X5 M','X6 M'].includes(k)||/^X\d/.test(k)||/^Z\d/.test(k))return;
      cleaned[k]=bmw[k];
    });
    FITMENT.makes.BMW=cleaned;
  }

  function rebuildHome(){
    const home=document.querySelector('#home');if(!home)return;
    home.innerHTML=`<div class="tp-home">
      <section class="tp-hero"><div class="tp-hero-inner"><div class="tp-hero-copyblock"><div class="tp-kicker">THE PLUG · ARRIVING IN STYLE</div><h1>Performance<br>Perfected<br>For Your Drive.</h1><p>Premium aftermarket parts curated for drivers who demand more from performance, style and reliability.</p><div class="tp-hero-actions"><a class="btn yellow" href="#shop">Shop now →</a><a class="btn dark tp-open-car" href="#">Shop by car</a></div></div><div class="tp-hero-side">Drive<br>Modify<br>Belong</div></div></section>
      <section class="tp-section"><div class="tp-container"><div class="tp-section-head"><h2>Shop by category</h2><a href="#shop">View all →</a></div><div class="tp-categories"><a class="tp-cat" href="#shop" data-category="Interior"><span>Interior</span></a><a class="tp-cat" href="#shop" data-category="Performance"><span>Performance</span></a><a class="tp-cat" href="#shop" data-category="Exterior"><span>Exterior</span></a><a class="tp-cat" href="#shop" data-category="Lifestyle"><span>Lifestyle</span></a></div></div></section>
      <section class="tp-brandbar"><div class="tp-container"><div class="tp-section-head"><h2>Shop the best from top brands</h2><a href="#" class="tp-open-brand">View all brands →</a></div><div class="tp-brands"><div class="tp-brand" data-brand="AUTOID">AUTOID</div><div class="tp-brand" data-brand="P3">P3</div><div class="tp-brand" data-brand="Valvetronic">VALVETRONIC</div></div></div></section>
      <section class="tp-section"><div class="tp-container"><div class="tp-section-head"><h2>Our top products</h2><a href="#shop">Shop all →</a></div><div class="tp-products" data-products="top"></div></div></section>
      <section class="tp-section tp-why"><div class="tp-container"><div class="tp-section-head"><h2>Why The Plug?</h2></div><div class="tp-why-grid"><div class="tp-why-card"><b>Premium parts only</b><p>Curated aftermarket products from trusted performance and styling brands.</p></div><div class="tp-why-card"><b>Exclusive deals</b><p>Competitive pricing and access to products chosen for the regional enthusiast market.</p></div><div class="tp-why-card"><b>Perfect fit</b><p>Vehicle-based shopping and fitment data help you find parts made for your exact car.</p></div></div></div></section>
      <section class="tp-section"><div class="tp-container tp-story"><div class="tp-story-img" role="img" aria-label="Performance automotive detail"></div><div class="tp-story-copy"><div class="tp-kicker" style="color:#132135!important">OUR STORY</div><h2>Crafted excellence.<br>Elevated upgrades.</h2><p>The Plug is where passion meets performance. We curate premium European aftermarket parts for owners who see their cars as expressions of style, power and individuality.</p><a class="btn outline" href="#about">Discover The Plug →</a></div></div></section>
    </div>`;
    document.querySelectorAll('.tp-open-car').forEach(a=>a.onclick=e=>{e.preventDefault();openCarMenu()});
    document.querySelectorAll('[data-brand]').forEach(x=>x.onclick=()=>applyBrand(x.dataset.brand));
    document.querySelectorAll('.tp-open-brand').forEach(x=>x.onclick=e=>{e.preventDefault();openBrandMenu(x)});
    document.querySelectorAll('[data-category]').forEach(x=>x.onclick=e=>{e.preventDefault();selectedBrand='';localStorage.removeItem('plug-selected-brand');routeTo('#shop');renderShop()});
  }

  function brandMenu(){let m=document.querySelector('.tp-brand-menu');if(m)return m;m=document.createElement('div');m.className='tp-brand-menu';document.body.appendChild(m);return m}
  function openBrandMenu(anchor){const m=brandMenu();m.innerHTML=`<p class="tp-menu-note">Brands currently available from the supplied product workbook.</p><div class="tp-brand-grid">${FITMENT.productBrands.map(b=>`<button class="tp-brand-item" data-brand="${esc(b.name)}"><img src="${esc(b.logo)}" alt="${esc(b.name)}"><b>${esc(b.name)}</b></button>`).join('')}</div>`;m.querySelectorAll('[data-brand]').forEach(b=>b.onclick=()=>{m.classList.remove('open');applyBrand(b.dataset.brand)});const r=anchor.getBoundingClientRect();m.style.left=Math.max(15,Math.min(innerWidth-m.offsetWidth-15,r.left))+'px';m.style.top=(r.bottom+10)+'px';m.classList.add('open')}
  async function applyBrand(brand){selectedBrand=brand;localStorage.setItem('plug-selected-brand',brand);selectedVehicle=null;localStorage.removeItem('plug-selected-vehicle');routeTo('#shop');await renderShop()}

  let currentMake='';
  function carShell(){let backdrop=document.querySelector('.tp-car-backdrop'),mega=document.querySelector('.tp-car-mega');if(!backdrop){backdrop=document.createElement('div');backdrop.className='tp-car-backdrop';document.body.appendChild(backdrop)}if(!mega){mega=document.createElement('div');mega.className='tp-car-mega';mega.innerHTML='<div class="tp-car-mega-inner"><aside class="tp-car-makes"></aside><section class="tp-car-models"></section></div><button class="tp-car-close-mobile" aria-label="Close">×</button>';document.body.appendChild(mega);mega.querySelector('.tp-car-close-mobile').onclick=closeCarMenu;backdrop.onclick=closeCarMenu}return mega}
  function cleanChassis(ch){return String(ch||'').replace(/^Audi /,'').replace(/\s*\(UKL1 Platform\)$/,'').replace(/\s*\(SAV\)$/,'').replace(/\s*\(SAC\)$/,'')}
  function renderCarMenu(){const mega=carShell();const makes=Object.keys(FITMENT.makes);if(!currentMake||!FITMENT.makes[currentMake])currentMake=makes[0]||'';mega.querySelector('.tp-car-makes').innerHTML=makes.map(m=>`<button class="tp-car-make ${m===currentMake?'active':''}" data-make="${esc(m)}">${esc(m)} <span>›</span></button>`).join('');mega.querySelectorAll('[data-make]').forEach(b=>b.onclick=()=>{currentMake=b.dataset.make;renderCarMenu();openCarMenu()});const groups=FITMENT.makes[currentMake]||{};mega.querySelector('.tp-car-models').innerHTML=Object.entries(groups).map(([family,items])=>`<div class="tp-car-family"><h3>${esc(family)}</h3>${items.map(v=>{const [model,chassis]=v.split('|');return `<button class="tp-car-option" data-car="${esc(currentMake)}|${esc(family)}|${esc(model)}|${esc(chassis||'')}">${esc(model)}${chassis?`<span class="tp-car-meta">${esc(cleanChassis(chassis))}</span>`:''}</button>`}).join('')}</div>`).join('');mega.querySelectorAll('[data-car]').forEach(b=>b.onclick=()=>selectCar(b.dataset.car));positionCarMenu()}
  function positionCarMenu(){const mega=document.querySelector('.tp-car-mega'),header=document.querySelector('.mainnav');if(mega&&header&&innerWidth>720)mega.style.top=Math.round(header.getBoundingClientRect().bottom)+'px'}
  function openCarMenu(){renderCarMenu();document.querySelector('.tp-car-mega')?.classList.add('open');document.querySelector('.tp-car-backdrop')?.classList.add('open');document.body.style.overflow='hidden'}
  function closeCarMenu(){document.querySelector('.tp-car-mega')?.classList.remove('open');document.querySelector('.tp-car-backdrop')?.classList.remove('open');document.body.style.overflow=''}
  async function selectCar(raw){const [make,family,model,chassis]=raw.split('|');selectedVehicle={make,family,model,chassis,label:`${make} ${model}${chassis?' · '+cleanChassis(chassis):''}`};localStorage.setItem('plug-selected-vehicle',JSON.stringify(selectedVehicle));selectedBrand='';localStorage.removeItem('plug-selected-brand');document.querySelectorAll('.selected-vehicle').forEach(x=>x.textContent=selectedVehicle.label);closeCarMenu();routeTo('#shop');await renderShop()}

  async function renderShop(){const grid=document.querySelector('.shop-products');if(!grid)return;let products=[];if(selectedBrand){products=await fetchProducts('&brand='+encodeURIComponent(selectedBrand))}else{products=await fetchProducts('')}
    if(selectedVehicle){try{const fits=await (await fetch('/api/admin/fitments')).json();const needle=selectedVehicle.model.replace(/^.*? — /,'').toLowerCase();const ch=(selectedVehicle.chassis||'').toLowerCase();const allowed=new Set(fits.filter(f=>String(f.car_brand||'').toLowerCase()===selectedVehicle.make.toLowerCase()&&(String(f.model||'').toLowerCase().includes(needle)||needle.includes(String(f.model||'').toLowerCase()))&&(!ch||String(f.chassis||'').toLowerCase().includes(ch)||ch.includes(String(f.chassis||'').toLowerCase()))).map(f=>String(f.product_id)));products=products.filter(p=>allowed.has(String(p.id)))}catch(e){console.warn(e)}}
    let chipbox=document.querySelector('#tpActiveFilters');if(!chipbox){chipbox=document.createElement('div');chipbox.id='tpActiveFilters';const target=document.querySelector('.shop-layout');target?.parentElement.insertBefore(chipbox,target)}chipbox.innerHTML=(selectedBrand?`<span class="tp-filter-chip">Brand: ${esc(selectedBrand)} <button data-clear-brand>×</button></span>`:'')+(selectedVehicle?`<span class="tp-filter-chip">Vehicle: ${esc(selectedVehicle.label)} <button data-clear-car>×</button></span>`:'');chipbox.querySelector('[data-clear-brand]')?.addEventListener('click',()=>{selectedBrand='';localStorage.removeItem('plug-selected-brand');renderShop()});chipbox.querySelector('[data-clear-car]')?.addEventListener('click',()=>{selectedVehicle=null;localStorage.removeItem('plug-selected-vehicle');document.querySelectorAll('.selected-vehicle').forEach(x=>x.textContent='Select your vehicle');renderShop()});grid.innerHTML=products.length?products.map(productCard).join(''):`<div class="tp-no-products">No matching products are available in the current fitment index.</div>`;bindProductButtons(grid)}

  function wireNav(){const nav=[...document.querySelectorAll('.staging-nav a')];const car=nav.find(a=>a.textContent.toLowerCase().includes('shop by car'));if(car){car.href='#';car.onclick=e=>{e.preventDefault();openCarMenu()}}const brand=nav.find(a=>a.textContent.toLowerCase().includes('shop by brand'));if(brand){brand.href='#';brand.onclick=e=>{e.preventDefault();openBrandMenu(brand)}}document.querySelectorAll('[data-vehicle]').forEach(b=>b.onclick=e=>{e.preventDefault();openCarMenu()});addEventListener('resize',positionCarMenu);document.addEventListener('click',e=>{const bm=document.querySelector('.tp-brand-menu');if(bm?.classList.contains('open')&&!bm.contains(e.target)&&!e.target.closest('.staging-nav'))bm.classList.remove('open')})}
  async function hydrateHome(){const ps=await fetchProducts('');const top=document.querySelector('[data-products="top"]');if(top){top.innerHTML=ps.slice(0,8).map(productCard).join('');bindProductButtons(top)}}

  async function init(){
    try{FITMENT=await (await fetch('/fitment-menu.json?v=3')).json()}catch(e){console.warn('Fitment data unavailable',e);FITMENT={productBrands:[{name:'AUTOID',logo:''},{name:'P3',logo:''},{name:'Valvetronic',logo:''}],makes:{}}}
    normalizeFitmentData();
    rebuildHome();wireNav();hydrateHome();if(selectedVehicle?.label)document.querySelectorAll('.selected-vehicle').forEach(x=>x.textContent=selectedVehicle.label);if(location.hash==='#shop')renderShop();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();