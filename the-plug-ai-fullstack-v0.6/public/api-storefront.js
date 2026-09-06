(()=>{
 const fmt=n=>new Intl.NumberFormat('en-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(Number(n||0));
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

 /* V0.7 storefront polish + vehicle hierarchy */
 const css=document.createElement('style');
 css.textContent=`
 /* --- homepage layout safeguards --- */
 .hero{min-height:620px;height:auto;padding:70px 0;background-position:center center;overflow:hidden}
 .hero .container{min-height:480px;height:auto;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(320px,.62fr);align-items:center;gap:clamp(42px,6vw,110px)}
 .hero h1{font-size:clamp(46px,5vw,82px);line-height:.94;max-width:760px;overflow-wrap:normal;word-break:normal;margin:0;position:relative;z-index:2}
 .hero-copy{align-self:center;margin:0;padding:26px 0 26px 30px;max-width:430px;background:linear-gradient(90deg,rgba(10,20,30,.40),rgba(10,20,30,.05));position:relative;z-index:2}
 .hero-copy p{margin:10px 0 24px;line-height:1.55}
 .story-grid{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(40px,6vw,90px);align-items:center}
 .story-text{min-width:0}.story-title{font-size:clamp(42px,4vw,62px);margin-bottom:44px}.story-image{min-height:460px;height:clamp(460px,42vw,620px)}
 .staging-categories{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);align-items:stretch}.cat-middle{display:grid;grid-template-rows:1fr 1fr;gap:7px;min-width:0}.staging-categories>.cat-card,.cat-middle .cat-card{height:auto;min-height:240px}.staging-categories>.cat-card{min-height:520px}.cat-card .label{padding:24px;font-size:clamp(22px,2vw,31px)}
 .product-card{min-width:0}.product-card h3,.product-card h4{overflow-wrap:anywhere}.api-card .product-image{height:280px;border:1px solid #eceeef;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff}.api-card .product-image img{width:88%;height:88%;object-fit:contain}
 .why-three{grid-template-columns:repeat(3,minmax(0,1fr))}
 /* --- vehicle finder --- */
 .vehicle-modal{max-height:min(88vh,760px);overflow:auto;border-radius:8px;box-shadow:0 24px 80px rgba(19,33,53,.28)}
 .vehicle-finder-head{margin-bottom:20px}.vehicle-finder-head h2{font-size:27px;margin:0 0 7px;text-transform:uppercase}.vehicle-finder-head p{margin:0;color:#68727b;font-size:14px}
 .vehicle-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}.vehicle-grid .field{margin:0}.vehicle-grid .field.full{grid-column:1/-1}.vehicle-grid select{width:100%;height:50px;border:1px solid #d8dde1;background:#fff;padding:0 13px}.vehicle-grid select:disabled{background:#f4f5f6;color:#9aa0a5}.vehicle-selection-summary{margin-top:18px;padding:14px 16px;background:#f5fbfe;border-left:3px solid #8FC6E4;font-size:14px;display:none}.vehicle-selection-summary.show{display:block}
 .vehicle-modal .fit-result{font-size:15px;margin-top:12px}.vehicle-modal #vehicleSearch{margin-top:20px}
 @media(max-width:1100px){.hero{min-height:560px;padding:54px 0}.hero .container{grid-template-columns:minmax(0,1fr);min-height:450px}.hero h1{font-size:clamp(46px,8vw,76px);max-width:760px}.hero-copy{display:block;max-width:580px;padding:20px 0 20px 24px}.story-grid{gap:42px}.staging-categories{grid-template-columns:1fr 1fr}.staging-categories>.cat-card{min-height:390px}.cat-middle{min-height:390px}.why-three{grid-template-columns:repeat(3,1fr)}}
 @media(max-width:720px){.hero{min-height:auto;padding:58px 0;background-position:62% center}.hero:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,18,28,.80) 0%,rgba(7,18,28,.52) 62%,rgba(7,18,28,.25) 100%)}.hero .container{position:relative;z-index:1;display:block;min-height:auto}.hero h1{font-size:clamp(40px,13vw,58px);line-height:.96;max-width:92%}.hero-copy{display:block;margin-top:28px;max-width:94%;padding:14px 0 14px 18px;background:transparent}.hero-copy p{font-size:14px;line-height:1.45}.story-grid{grid-template-columns:1fr}.story-title{margin-bottom:28px}.story-image{height:340px;min-height:340px}.staging-categories{grid-template-columns:1fr}.staging-categories>.cat-card,.cat-middle,.cat-middle .cat-card{min-height:300px}.cat-middle{display:grid;grid-template-rows:auto}.why-three{grid-template-columns:1fr}.vehicle-grid{grid-template-columns:1fr}.vehicle-grid .field.full{grid-column:auto}.modal-inner{padding:26px 20px}.modal-tabs button{font-size:15px}.product-grid,.shop-products{grid-template-columns:1fr}}
 `;
 document.head.appendChild(css);

 const VEHICLES={
  'BMW':{
   '1 Series':{'F20 / F21':{years:'2011-2019',engines:['116i 1.5T','118i 1.5T','120i 2.0T','M135i 3.0T','M140i 3.0T']},'F40':{years:'2019+',engines:['118i 1.5T','120i 2.0T','M135i xDrive 2.0T']}},
   '2 Series':{'F22 / F23':{years:'2014-2021',engines:['220i 2.0T','228i 2.0T','230i 2.0T','M235i 3.0T','M240i 3.0T']},'G42':{years:'2022+',engines:['220i 2.0T','230i 2.0T','M240i xDrive 3.0T']}},
   'M2':{'F87':{years:'2016-2021',engines:['M2 N55 3.0T','M2 Competition S55 3.0TT','M2 CS S55 3.0TT']},'G87':{years:'2023+',engines:['M2 S58 3.0TT']}},
   '3 Series':{'F30 / F31':{years:'2012-2019',engines:['320i 2.0T','328i 2.0T','330i 2.0T','335i 3.0T','340i 3.0T']},'G20 / G21':{years:'2019+',engines:['320i 2.0T','330i 2.0T','M340i xDrive 3.0T']}},
   'M3':{'F80':{years:'2014-2020',engines:['M3 S55 3.0TT']},'G80 / G81':{years:'2021+',engines:['M3 S58 3.0TT','M3 Competition S58 3.0TT','M3 CS S58 3.0TT']}},
   '4 Series':{'F32 / F33 / F36':{years:'2014-2020',engines:['420i 2.0T','428i 2.0T','430i 2.0T','435i 3.0T','440i 3.0T']},'G22 / G23 / G26':{years:'2021+',engines:['420i 2.0T','430i 2.0T','M440i xDrive 3.0T']}},
   'M4':{'F82 / F83':{years:'2015-2020',engines:['M4 S55 3.0TT','M4 Competition S55 3.0TT']},'G82 / G83':{years:'2021+',engines:['M4 S58 3.0TT','M4 Competition S58 3.0TT','M4 CSL S58 3.0TT']}},
   '5 Series':{'F10 / F11':{years:'2010-2017',engines:['520i 2.0T','528i 2.0T','535i 3.0T','550i 4.4TT']},'G30 / G31':{years:'2017-2023',engines:['520i 2.0T','530i 2.0T','540i 3.0T','M550i 4.4TT']}},
   'M5':{'F10':{years:'2012-2016',engines:['M5 S63 4.4TT']},'F90':{years:'2018-2023',engines:['M5 S63 4.4TT','M5 Competition S63 4.4TT','M5 CS S63 4.4TT']}},
   '8 Series':{'G14 / G15 / G16':{years:'2019+',engines:['840i 3.0T','M850i xDrive 4.4TT','Alpina B8 4.4TT']}},
   'X3':{'G01':{years:'2018+',engines:['xDrive30i 2.0T','M40i 3.0T','X3 M S58 3.0TT']}},
   'X4':{'G02':{years:'2019+',engines:['xDrive30i 2.0T','M40i 3.0T','X4 M S58 3.0TT']}},
   'X5':{'F15':{years:'2014-2018',engines:['xDrive35i 3.0T','xDrive50i 4.4TT']},'G05':{years:'2019+',engines:['xDrive40i 3.0T','M50i 4.4TT','X5 M S63 4.4TT']}}
  },
  'Audi':{
   'A3 / S3 / RS3':{'8V':{years:'2013-2020',engines:['A3 1.8T / 2.0T','S3 2.0T','RS3 2.5T']},'8Y':{years:'2021+',engines:['A3 2.0T','S3 2.0T','RS3 2.5T']}},
   'A4 / S4 / RS4':{'B8 / B8.5':{years:'2009-2016',engines:['A4 2.0T','S4 3.0T','RS4 4.2 V8']},'B9 / B9.5':{years:'2017+',engines:['A4 2.0T','S4 3.0T','RS4 2.9TT']}},
   'A5 / S5 / RS5':{'B8 / B8.5':{years:'2008-2017',engines:['A5 2.0T','S5 3.0T / 4.2','RS5 4.2 V8']},'B9 / B9.5':{years:'2018+',engines:['A5 2.0T','S5 3.0T','RS5 2.9TT']}},
   'A6 / S6 / RS6':{'C7 / C7.5':{years:'2012-2018',engines:['A6 2.0T / 3.0T','S6 4.0TT','RS6 4.0TT']},'C8':{years:'2019+',engines:['A6 2.0T / 3.0T','S6 2.9TT','RS6 4.0TT']}},
   'A7 / S7 / RS7':{'C7 / C7.5':{years:'2012-2018',engines:['A7 3.0T','S7 4.0TT','RS7 4.0TT']},'C8':{years:'2019+',engines:['A7 3.0T','S7 2.9TT','RS7 4.0TT']}},
   'Q5 / SQ5':{'8R':{years:'2009-2017',engines:['Q5 2.0T / 3.0T','SQ5 3.0T']},'FY':{years:'2018+',engines:['Q5 2.0T','Q5 PHEV','SQ5 3.0T']}},
   'Q7 / SQ7':{'4M':{years:'2016+',engines:['Q7 2.0T / 3.0T','SQ7 4.0TT']}},
   'TT / TTS / TT RS':{'8S':{years:'2015-2023',engines:['TT 2.0T','TTS 2.0T','TT RS 2.5T']}}
  },
  'Mercedes-Benz':{
   'A-Class / CLA':{'W176 / C117':{years:'2013-2018',engines:['A250 / CLA250 2.0T','A45 / CLA45 AMG 2.0T']},'W177 / C118':{years:'2019+',engines:['A250 / CLA250 2.0T','A35 / CLA35 AMG 2.0T','A45 / CLA45 AMG 2.0T']}},
   'C-Class':{'W204':{years:'2008-2014',engines:['C250 / C300','C350','C63 AMG 6.2 V8']},'W205':{years:'2015-2021',engines:['C200 / C300 2.0T','C43 AMG 3.0TT','C63 AMG 4.0TT']},'W206':{years:'2022+',engines:['C200 / C300 2.0T','C43 AMG 2.0T','C63 S E Performance']}},
   'E-Class':{'W212':{years:'2010-2016',engines:['E250 / E350','E400','E63 AMG 5.5TT']},'W213':{years:'2017-2023',engines:['E300 2.0T','E450 3.0T','E53 AMG 3.0T','E63 AMG 4.0TT']}},
   'S-Class':{'W222':{years:'2014-2020',engines:['S450 / S500','S560 4.0TT','S63 AMG 4.0TT']},'W223':{years:'2021+',engines:['S450 / S500 3.0T','S580 4.0TT','S63 E Performance']}},
   'GLC':{'X253':{years:'2016-2022',engines:['GLC300 2.0T','GLC43 AMG 3.0TT','GLC63 AMG 4.0TT']},'X254':{years:'2023+',engines:['GLC300 2.0T','GLC43 AMG 2.0T','GLC63 S E Performance']}},
   'GLE':{'W166':{years:'2016-2019',engines:['GLE350 / GLE400','GLE43 AMG','GLE63 AMG']},'V167':{years:'2020+',engines:['GLE450 3.0T','GLE53 AMG 3.0T','GLE63 AMG 4.0TT']}},
   'AMG GT':{'C190 / R190':{years:'2015-2023',engines:['AMG GT 4.0TT','AMG GT S 4.0TT','AMG GT R 4.0TT']},'C192':{years:'2024+',engines:['AMG GT 55 4.0TT','AMG GT 63 4.0TT']}}
  },
  'Porsche':{
   '911':{'991':{years:'2012-2019',engines:['Carrera / S','GTS','Turbo / Turbo S','GT3 / GT3 RS']},'992':{years:'2020+',engines:['Carrera / S','GTS','Turbo / Turbo S','GT3 / GT3 RS']}},
   '718 Cayman / Boxster':{'982':{years:'2017+',engines:['2.0T','2.5T S','4.0 GTS','GT4 / Spyder']}},
   'Cayenne':{'958':{years:'2011-2018',engines:['V6','S / GTS','Turbo']},'9Y0':{years:'2019+',engines:['V6','S / GTS','Turbo / Turbo GT']}},
   'Macan':{'95B':{years:'2015+',engines:['2.0T','S','GTS','Turbo']}},
   'Panamera':{'970':{years:'2010-2016',engines:['V6','S / GTS','Turbo']},'971':{years:'2017+',engines:['4 / 4S','GTS','Turbo / Turbo S']}}
  },
  'Volkswagen':{
   'Golf / GTI / R':{'MK7 / MK7.5':{years:'2013-2020',engines:['Golf 1.4T / 1.8T','GTI 2.0T','Golf R 2.0T']},'MK8':{years:'2021+',engines:['Golf 1.5T','GTI 2.0T','Golf R 2.0T']}},
   'Arteon':{'3H7':{years:'2017+',engines:['2.0T','R 2.0T']}},
   'Tiguan':{'AD / BW':{years:'2017+',engines:['1.4T','2.0T']}},
   'Touareg':{'CR':{years:'2019+',engines:['3.0 V6','R eHybrid']}}
  }
 };

 function options(select,items,placeholder){select.innerHTML=`<option value="">${placeholder}</option>`+items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');select.disabled=!items.length}
 function yearList(raw){if(!raw)return[];const m=raw.match(/(\d{4})(?:-(\d{4})|\+)?/);if(!m)return[];const a=+m[1],b=m[2]?+m[2]:new Date().getFullYear()+1;const out=[];for(let y=b;y>=a;y--)out.push(String(y));return out}
 function enhanceVehicleFinder(){
  const pane=document.querySelector('#vehiclePane');if(!pane)return;
  pane.innerHTML=`<div class="vehicle-finder-head"><h2>Shop by car</h2><p>Select your exact vehicle to see compatible products.</p></div><div class="vehicle-grid"><div class="field"><label>Make</label><select id="makeSelect"></select></div><div class="field"><label>Model</label><select id="modelSelect" disabled></select></div><div class="field"><label>Submodel / Chassis</label><select id="chassisSelect" disabled></select></div><div class="field"><label>Year</label><select id="yearSelect" disabled></select></div><div class="field full"><label>Engine / Trim</label><select id="engineSelect" disabled></select></div></div><div id="vehicleSummary" class="vehicle-selection-summary"></div><button id="vehicleSearch" class="btn full">Shop parts for this vehicle</button><div id="vehicleResult" class="fit-result"></div>`;
  const make=document.querySelector('#makeSelect'),model=document.querySelector('#modelSelect'),chassis=document.querySelector('#chassisSelect'),year=document.querySelector('#yearSelect'),engine=document.querySelector('#engineSelect'),summary=document.querySelector('#vehicleSummary'),result=document.querySelector('#vehicleResult');
  options(make,Object.keys(VEHICLES),'Select make');make.disabled=false;options(model,[],'Select model');options(chassis,[],'Select submodel / chassis');options(year,[],'Select year');options(engine,[],'Select engine / trim');
  const refreshSummary=()=>{const vals=[make.value,model.value,chassis.value,year.value,engine.value].filter(Boolean);summary.textContent=vals.join(' · ');summary.classList.toggle('show',vals.length>1)};
  make.onchange=()=>{options(model,make.value?Object.keys(VEHICLES[make.value]):[],'Select model');options(chassis,[],'Select submodel / chassis');options(year,[],'Select year');options(engine,[],'Select engine / trim');refreshSummary()};
  model.onchange=()=>{const d=make.value&&model.value?VEHICLES[make.value][model.value]:null;options(chassis,d?Object.keys(d):[],'Select submodel / chassis');options(year,[],'Select year');options(engine,[],'Select engine / trim');refreshSummary()};
  chassis.onchange=()=>{const d=make.value&&model.value&&chassis.value?VEHICLES[make.value][model.value][chassis.value]:null;options(year,d?yearList(d.years):[],'Select year');options(engine,d?d.engines:[],'Select engine / trim');refreshSummary()};
  year.onchange=refreshSummary;engine.onchange=refreshSummary;
  document.querySelector('#vehicleSearch').onclick=()=>{if(!make.value||!model.value||!chassis.value||!year.value||!engine.value){result.className='fit-result bad';result.textContent='Please complete all vehicle fields.';return}const label=`${make.value} ${model.value} · ${chassis.value} · ${year.value} · ${engine.value}`;document.querySelectorAll('.selected-vehicle').forEach(x=>x.textContent=label);localStorage.setItem('plug-selected-vehicle',JSON.stringify({make:make.value,model:model.value,chassis:chassis.value,year:year.value,engine:engine.value}));result.className='fit-result good';result.textContent='Vehicle selected. Showing compatible products.';setTimeout(()=>{document.querySelector('#modalOverlay')?.classList.remove('show');document.querySelector('#vehicleModal')?.classList.remove('show');location.hash='#shop'},650)};
  const saved=JSON.parse(localStorage.getItem('plug-selected-vehicle')||'null');if(saved&&VEHICLES[saved.make]?.[saved.model]?.[saved.chassis]){make.value=saved.make;make.onchange();model.value=saved.model;model.onchange();chassis.value=saved.chassis;chassis.onchange();year.value=saved.year;engine.value=saved.engine;refreshSummary();document.querySelectorAll('.selected-vehicle').forEach(x=>x.textContent=`${saved.make} ${saved.model} · ${saved.chassis} · ${saved.year}`)}
 }
 function wireShopByCar(){const links=[...document.querySelectorAll('.staging-nav a')];const car=links.find(a=>a.textContent.toLowerCase().includes('shop by car'));if(!car)return;car.href='#';car.addEventListener('click',e=>{e.preventDefault();document.querySelector('#modalOverlay')?.classList.add('show');document.querySelector('#vehicleModal')?.classList.add('show');const tab=[...document.querySelectorAll('[data-tab]')].find(b=>b.dataset.tab==='vehiclePane');if(tab){document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===tab));document.querySelectorAll('.tabpane').forEach(p=>p.classList.toggle('active',p.id==='vehiclePane'))}})}

 async function products(limit=24){try{return await (await fetch('/api/products?limit='+limit)).json()}catch{return []}}
 function card(p){return `<article class="product-card api-card" data-api-product="${p.id}"><div class="product-image"><img src="${esc(p.image||'assets/product-runningboard.png')}" alt="${esc(p.title)}"></div><div class="brandline">${esc(p.brand_name)}</div><h3>${esc(p.title)}</h3><div class="rating">☆☆☆☆☆ <span>(0)</span></div><div class="price"><strong>${fmt(p.price_sar)}</strong>${p.msrp_sar&&p.msrp_sar>p.price_sar?` <del>${fmt(p.msrp_sar)}</del>`:''}</div><button class="btn full api-open-product">Select options</button></article>`}
 async function hydrate(){const ps=await products(32); if(!ps.length)return; document.querySelectorAll('[data-products]').forEach((el,i)=>{let take=i===3?ps:ps.slice(i*4,i*4+4);if(!take.length)take=ps.slice(0,4);el.innerHTML=take.map(card).join('')}); document.querySelectorAll('.api-open-product').forEach(b=>b.onclick=e=>{const id=e.target.closest('[data-api-product]').dataset.apiProduct;location.hash='#product';loadProduct(id)})}
 async function loadProduct(id){try{const p=await (await fetch('/api/products/'+id)).json(); const root=document.querySelector('#product .product-info'); if(!root||p.error)return; root.querySelector('.brandmark').textContent=p.brand_name||'';root.querySelector('h1').textContent=p.title;root.querySelector('.bigprice').textContent=fmt(p.price_sar);const bid=root.querySelector('.brandline');if(bid)bid.textContent='MFG: '+(p.mfg_part_id||'—')+' · The Plug ID: '+(p.the_plug_id||'—');const main=document.querySelector('#product .gallery-main img');if(main&&p.images?.[0])main.src=p.images[0].url;const acc=document.querySelector('#product .accordions .accordion p');if(acc)acc.textContent=p.description||''; window.__plugProduct=p;}catch(e){console.warn(e)}}

 enhanceVehicleFinder();wireShopByCar();
 document.querySelectorAll('[data-vehicle]').forEach(x=>x.addEventListener('click',()=>{if(window.__plugProduct)sessionStorage.setItem('plugFitmentProductId',window.__plugProduct.id)}));
 hydrate();
})();
