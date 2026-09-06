(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmt=n=>new Intl.NumberFormat('en-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(Number(n||0));

  /* Load the final storefront override after the legacy stylesheet. */
  if(!document.querySelector('link[href="storefront-v07.css"]')){
    const l=document.createElement('link'); l.rel='stylesheet'; l.href='storefront-v07.css'; document.head.appendChild(l);
  }

  /* Homepage: restore the original AI concept rather than the later mockup layout. */
  const home=document.querySelector('#home');
  if(home){
    home.innerHTML=`<div class="tp-home">
      <section class="tp-hero">
        <div class="tp-hero-inner">
          <div class="tp-hero-copyblock">
            <div class="tp-kicker">THE PLUG · ARRIVING IN STYLE</div>
            <h1>Performance<br>Perfected<br>For Your Drive.</h1>
            <p>Premium aftermarket parts curated for drivers who demand more from performance, style and reliability.</p>
            <div class="tp-hero-actions"><a class="btn yellow" href="#shop">Shop now →</a><a class="btn dark tp-open-car" href="#">Shop by car</a></div>
          </div>
          <div class="tp-hero-side">Drive<br>Modify<br>Belong</div>
        </div>
      </section>

      <section class="tp-section">
        <div class="tp-container">
          <div class="tp-section-head"><h2>Shop by category</h2><a href="#shop">View all →</a></div>
          <div class="tp-categories">
            <a class="tp-cat" href="#shop" style="background-image:url('assets/cat-interior.jpg')"><span>Interior</span></a>
            <a class="tp-cat" href="#shop" style="background-image:url('assets/cat-performance.jpg')"><span>Performance</span></a>
            <a class="tp-cat" href="#shop" style="background-image:url('assets/cat-exterior.jpg')"><span>Exterior</span></a>
            <a class="tp-cat" href="#shop" style="background-image:url('assets/story.jpg')"><span>Lifestyle</span></a>
          </div>
        </div>
      </section>

      <section class="tp-brandbar">
        <div class="tp-container">
          <div class="tp-section-head"><h2>Shop the best from top brands</h2><a href="#shop">View all brands →</a></div>
          <div class="tp-brands"><div class="tp-brand">VALVETRONIC</div><div class="tp-brand">AUTOID</div><div class="tp-brand">P3</div><div class="tp-brand">EVENTURI</div><div class="tp-brand">BREMBO</div><div class="tp-brand">RECARO</div><div class="tp-brand">KW</div><div class="tp-brand">BBS</div></div>
        </div>
      </section>

      <section class="tp-section">
        <div class="tp-container">
          <div class="tp-section-head"><h2>Our top products</h2><a href="#shop">Shop all →</a></div>
          <div class="tp-products" data-products="top"></div>
        </div>
      </section>

      <section class="tp-section tp-why">
        <div class="tp-container">
          <div class="tp-section-head"><h2>Why The Plug?</h2></div>
          <div class="tp-why-grid">
            <div class="tp-why-card"><b>Premium parts only</b><p>Curated aftermarket products from trusted performance and styling brands.</p></div>
            <div class="tp-why-card"><b>Exclusive deals</b><p>Competitive pricing and access to products chosen for the regional enthusiast market.</p></div>
            <div class="tp-why-card"><b>Perfect fit</b><p>Vehicle-based shopping and fitment data help you find parts made for your exact car.</p></div>
          </div>
        </div>
      </section>

      <section class="tp-section">
        <div class="tp-container tp-story">
          <div class="tp-story-img" role="img" aria-label="Performance automotive detail"></div>
          <div class="tp-story-copy"><div class="tp-kicker" style="color:#132135!important">OUR STORY</div><h2>Crafted excellence.<br>Elevated upgrades.</h2><p>The Plug is where passion meets performance. We curate premium European aftermarket parts for owners who see their cars as expressions of style, power and individuality.</p><a class="btn outline" href="#about">Discover The Plug →</a></div>
        </div>
      </section>
    </div>`;
  }

  const CAR_MENU={
    'BMW':{
      '1 Series':['M135i PRE-LCI (F20/F21)','M135i LCI (F20/F21)','M140i (F20/F21)','M135 xDrive (F70)'],
      '2 Series':['M235i (F22/F23)','M240i (F22/F23)','M240i (G42)','M235i xDrive (F44)'],
      'M2':['M2 (F87)','M2 Competition (F87C)','M2 (G87)'],
      '3 Series':['335i (F30/F31/F34)','340i (F30/F31/F34)','M340i (G20/G21)','335i (E90/E92/E93)'],
      'M3':['M3 (E90/E92/E93)','M3 (F80)','M3 Competition (F80)','M3 (G80/G81)','M3 Competition (G80/G81)'],
      '4 Series':['435i (F32/F33/F36)','440i (F32/F33/F36)','M440i (G22/G23/G26)'],
      'M4':['M4 (F82/F83)','M4 Competition (F82/F83)','M4 (G82/G83)','M4 Competition (G82/G83)'],
      '5 / 6 / 7 / 8 Series':['G30/G31/G38 (2017+)','G60 (2024+)','G32 (2017+)','G11/G12 (2015+)','G14/G15/G16 (2018+)'],
      'M5':['M5 (F10)','M5 (F90)','M5 Competition (F90)'],
      'M8':['M8 (F91/F92/F93)','M8 Competition (F91/F92/F93)'],
      'X Series':['X3 (G01)','X3 M (F97)','X4 (G02)','X4 M (F98)','X5 (G05)','X5 M (F95)','X6 (G06)','X6 M (F96)']
    },
    'Audi':{
      'A3 / S3 / RS3':['A3 (8V)','S3 (8V)','RS3 (8V)','A3 (8Y)','S3 (8Y)','RS3 (8Y)'],
      'A4 / S4 / RS4':['A4 (B8/B8.5)','S4 (B8/B8.5)','A4 (B9/B9.5)','S4 (B9/B9.5)','RS4 (B9/B9.5)'],
      'A5 / S5 / RS5':['A5 (B8/B8.5)','S5 (B8/B8.5)','A5 (B9/B9.5)','S5 (B9/B9.5)','RS5 (B9/B9.5)'],
      'A6 / S6 / RS6':['A6 (C7/C7.5)','S6 (C7/C7.5)','RS6 (C7/C7.5)','A6 (C8)','S6 (C8)','RS6 (C8)'],
      'A7 / S7 / RS7':['A7 (C7/C7.5)','S7 (C7/C7.5)','RS7 (C7/C7.5)','A7 (C8)','S7 (C8)','RS7 (C8)'],
      'Q5 / SQ5':['Q5 (8R)','SQ5 (8R)','Q5 (FY)','Q5 Sportback (FY)','SQ5 (FY)'],
      'Q7 / SQ7':['Q7 (4M)','SQ7 (4M)'],
      'TT':['TT (8S)','TTS (8S)','TT RS (8S)']
    },
    'Mercedes-Benz':{
      'A / CLA':['A250 (W176)','A45 AMG (W176)','CLA250 (C117)','CLA45 AMG (C117)','A35 AMG (W177)','A45 AMG (W177)'],
      'C-Class':['C250/C300 (W204)','C63 AMG (W204)','C300 (W205)','C43 AMG (W205)','C63 AMG (W205)','C300 (W206)','C43 AMG (W206)'],
      'E-Class':['E350 (W212)','E63 AMG (W212)','E300 (W213)','E53 AMG (W213)','E63 AMG (W213)'],
      'S-Class':['S500 (W222)','S560 (W222)','S63 AMG (W222)','S500 (W223)','S580 (W223)','S63 (W223)'],
      'GLC':['GLC300 (X253)','GLC43 AMG (X253)','GLC63 AMG (X253)','GLC300 (X254)','GLC43 AMG (X254)'],
      'GLE':['GLE400 (W166)','GLE43 AMG (W166)','GLE63 AMG (W166)','GLE450 (V167)','GLE53 AMG (V167)','GLE63 AMG (V167)'],
      'AMG GT':['AMG GT (C190)','AMG GT S (C190)','AMG GT R (C190)','AMG GT 55 (C192)','AMG GT 63 (C192)']
    },
    'Porsche':{
      '911':['Carrera (991)','Carrera S (991)','Turbo / Turbo S (991)','GT3 / GT3 RS (991)','Carrera (992)','Carrera S (992)','GTS (992)','Turbo / Turbo S (992)','GT3 / GT3 RS (992)'],
      '718':['Cayman / Boxster (982)','Cayman S / Boxster S (982)','GTS 4.0 (982)','GT4 / Spyder (982)'],
      'Cayenne':['Cayenne (958)','Cayenne S / GTS (958)','Cayenne Turbo (958)','Cayenne (9Y0)','Cayenne GTS (9Y0)','Cayenne Turbo GT (9Y0)'],
      'Macan':['Macan (95B)','Macan S (95B)','Macan GTS (95B)','Macan Turbo (95B)'],
      'Panamera':['Panamera (970)','Panamera GTS (970)','Panamera Turbo (970)','Panamera (971)','Panamera GTS (971)','Panamera Turbo (971)']
    },
    'Volkswagen':{
      'Golf':['Golf MK7','GTI MK7','Golf R MK7','Golf MK7.5','GTI MK7.5','Golf R MK7.5','Golf MK8','GTI MK8','Golf R MK8'],
      'Arteon':['Arteon (3H7)','Arteon R (3H7)'],
      'Tiguan':['Tiguan (AD/BW)'],
      'Touareg':['Touareg (CR)','Touareg R (CR)']
    }
  };

  let currentMake='BMW';
  function renderCarMenu(){
    let backdrop=document.querySelector('.tp-car-backdrop');
    let mega=document.querySelector('.tp-car-mega');
    if(!backdrop){backdrop=document.createElement('div');backdrop.className='tp-car-backdrop';document.body.appendChild(backdrop)}
    if(!mega){mega=document.createElement('div');mega.className='tp-car-mega';mega.innerHTML='<div class="tp-car-mega-inner"><aside class="tp-car-makes"></aside><section class="tp-car-models"></section></div><button class="tp-car-close-mobile" aria-label="Close">×</button>';document.body.appendChild(mega)}
    const makes=mega.querySelector('.tp-car-makes');
    makes.innerHTML=Object.keys(CAR_MENU).map(m=>`<button class="tp-car-make ${m===currentMake?'active':''}" data-make="${esc(m)}">${esc(m)} <span>›</span></button>`).join('');
    const models=mega.querySelector('.tp-car-models');
    models.innerHTML=Object.entries(CAR_MENU[currentMake]).map(([family,items])=>`<div class="tp-car-family"><h3>${esc(family)}</h3>${items.map(x=>`<button class="tp-car-option" data-car="${esc(currentMake)}|${esc(family)}|${esc(x)}">${esc(x)}</button>`).join('')}</div>`).join('');
    makes.querySelectorAll('[data-make]').forEach(b=>b.onclick=()=>{currentMake=b.dataset.make;renderCarMenu();openCarMenu()});
    mega.querySelectorAll('[data-car]').forEach(b=>b.onclick=()=>selectCar(b.dataset.car));
    mega.querySelector('.tp-car-close-mobile').onclick=closeCarMenu;backdrop.onclick=closeCarMenu;
    positionCarMenu();
  }
  function positionCarMenu(){const mega=document.querySelector('.tp-car-mega'),header=document.querySelector('.mainnav');if(mega&&header&&innerWidth>720)mega.style.top=Math.round(header.getBoundingClientRect().bottom)+'px'}
  function openCarMenu(){renderCarMenu();document.querySelector('.tp-car-mega')?.classList.add('open');document.querySelector('.tp-car-backdrop')?.classList.add('open');document.body.style.overflow='hidden'}
  function closeCarMenu(){document.querySelector('.tp-car-mega')?.classList.remove('open');document.querySelector('.tp-car-backdrop')?.classList.remove('open');document.body.style.overflow=''}
  function selectCar(raw){const [make,family,variant]=raw.split('|');const label=`${make} ${variant}`;localStorage.setItem('plug-selected-vehicle',JSON.stringify({make,model:family,variant}));document.querySelectorAll('.selected-vehicle').forEach(x=>x.textContent=label);closeCarMenu();location.hash='#shop'}

  /* Convert the existing Shop By Car navigation item into the mega finder. */
  const navCar=[...document.querySelectorAll('.staging-nav a')].find(a=>a.textContent.toLowerCase().includes('shop by car'));
  if(navCar){navCar.href='#';navCar.textContent='Shop By Car⌄';navCar.addEventListener('click',e=>{e.preventDefault();openCarMenu()})}
  document.querySelectorAll('.tp-open-car').forEach(a=>a.onclick=e=>{e.preventDefault();openCarMenu()});
  addEventListener('resize',positionCarMenu);

  const saved=JSON.parse(localStorage.getItem('plug-selected-vehicle')||'null');
  if(saved?.make){document.querySelectorAll('.selected-vehicle').forEach(x=>x.textContent=`${saved.make} ${saved.variant||saved.model||''}`.trim())}

  /* Keep the modal vehicle finder functional as a secondary precise selector. */
  const pane=document.querySelector('#vehiclePane');
  if(pane){
    pane.innerHTML=`<div class="vehicle-finder-head"><h2>Find your vehicle</h2><p>Choose a make, model and submodel/chassis.</p></div><div class="vehicle-grid"><div class="field"><label>Make</label><select id="makeSelect"><option value="">Select make</option>${Object.keys(CAR_MENU).map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>Model</label><select id="modelSelect" disabled><option>Select model</option></select></div><div class="field"><label>Submodel / chassis</label><select id="variantSelect" disabled><option>Select submodel</option></select></div></div><button id="vehicleSearch" class="btn full">View compatible products</button><div id="vehicleResult" class="fit-result"></div>`;
    const make=pane.querySelector('#makeSelect'),model=pane.querySelector('#modelSelect'),variant=pane.querySelector('#variantSelect'),result=pane.querySelector('#vehicleResult');
    make.onchange=()=>{const fs=make.value?Object.keys(CAR_MENU[make.value]):[];model.innerHTML='<option value="">Select model</option>'+fs.map(x=>`<option>${esc(x)}</option>`).join('');model.disabled=!fs.length;variant.innerHTML='<option value="">Select submodel</option>';variant.disabled=true};
    model.onchange=()=>{const vs=make.value&&model.value?CAR_MENU[make.value][model.value]:[];variant.innerHTML='<option value="">Select submodel / chassis</option>'+vs.map(x=>`<option>${esc(x)}</option>`).join('');variant.disabled=!vs.length};
    pane.querySelector('#vehicleSearch').onclick=()=>{if(!make.value||!model.value||!variant.value){result.className='fit-result bad';result.textContent='Please select your make, model and submodel.';return}selectCar(`${make.value}|${model.value}|${variant.value}`);result.className='fit-result good';result.textContent='Vehicle selected.';document.querySelector('#modalOverlay')?.classList.remove('show');document.querySelector('#vehicleModal')?.classList.remove('show')};
  }

  async function getProducts(limit=24){try{const r=await fetch('/api/products?limit='+limit);return r.ok?await r.json():[]}catch{return []}}
  function card(p){return `<article class="product-card api-card" data-api-product="${p.id}"><div class="product-image"><img src="${esc(p.image||'assets/product-runningboard.png')}" alt="${esc(p.title)}"></div><div class="brandline">${esc(p.brand_name||'')}</div><h3>${esc(p.title||'')}</h3><div class="rating">☆☆☆☆☆ <span>(0)</span></div><div class="price"><strong>${fmt(p.price_sar)}</strong>${p.msrp_sar&&p.msrp_sar>p.price_sar?` <del>${fmt(p.msrp_sar)}</del>`:''}</div><button class="btn full api-open-product">Select options</button></article>`}
  async function hydrate(){const ps=await getProducts(36);if(!ps.length)return;document.querySelectorAll('[data-products]').forEach((el,i)=>{let take=el.closest('#home')?ps.slice(0,4):(i===3?ps:ps.slice((i%5)*4,(i%5)*4+4));if(!take.length)take=ps.slice(0,4);el.innerHTML=take.map(card).join('')});document.querySelectorAll('.api-open-product').forEach(b=>b.onclick=e=>{const id=e.target.closest('[data-api-product]').dataset.apiProduct;location.hash='#product';loadProduct(id)})}
  async function loadProduct(id){try{const p=await (await fetch('/api/products/'+id)).json();const root=document.querySelector('#product .product-info');if(!root||p.error)return;root.querySelector('.brandmark').textContent=p.brand_name||'';root.querySelector('h1').textContent=p.title||'';root.querySelector('.bigprice').textContent=fmt(p.price_sar);const bid=root.querySelector('.brandline');if(bid)bid.textContent='MFG: '+(p.mfg_part_id||'—')+' · The Plug ID: '+(p.the_plug_id||'—');const main=document.querySelector('#product .gallery-main img');if(main&&p.images?.[0])main.src=p.images[0].url;const acc=document.querySelector('#product .accordions .accordion p');if(acc)acc.textContent=p.description||'';window.__plugProduct=p}catch(e){console.warn(e)}}
  hydrate();
})();
