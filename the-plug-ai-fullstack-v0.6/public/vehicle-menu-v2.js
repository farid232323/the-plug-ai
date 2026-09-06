(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const unique=a=>[...new Set((a||[]).filter(Boolean))];
  const cleanChassis=ch=>String(ch||'').replace(/^Audi /,'').replace(/\s*\(UKL1 Platform\)$/,'').replace(/\s*\(SAV\)$/,'').replace(/\s*\(SAC\)$/,'');
  let DATA={makes:{}}, currentMake='', currentFamily='';

  const style=document.createElement('style');
  style.textContent=`
  .tp2-backdrop{position:fixed;inset:0;background:rgba(9,18,30,.46);z-index:490;opacity:0;pointer-events:none;transition:.2s}.tp2-backdrop.open{opacity:1;pointer-events:auto}
  .tp2-menu{position:fixed;left:0;right:0;z-index:500;background:#fff;box-shadow:0 24px 70px rgba(19,33,53,.22);border-top:3px solid #F8FF66;display:none;color:#132135}.tp2-menu.open{display:block}
  .tp2-shell{width:min(1500px,100%);margin:0 auto}.tp2-head{display:flex;align-items:center;justify-content:space-between;padding:17px 26px;border-bottom:1px solid #e5e9ed}.tp2-head h2{margin:0;font:800 20px/1 Nofex,"Arial Black",Arial,sans-serif;text-transform:uppercase}.tp2-head p{margin:5px 0 0;font-size:12px;color:#6c7883}.tp2-close{border:0;background:#132135;color:#fff;width:38px;height:38px;font-size:23px;cursor:pointer}.tp2-close:hover{background:#F8FF66;color:#132135}
  .tp2-grid{display:grid;grid-template-columns:220px 270px minmax(0,1fr);height:min(610px,calc(100vh - 190px));min-height:430px}.tp2-col{overflow:auto}.tp2-makes{background:#f7f8fa;border-right:1px solid #e1e5e8}.tp2-series{background:#fff;border-right:1px solid #e1e5e8}.tp2-models{background:#fff}
  .tp2-label{position:sticky;top:0;background:inherit;z-index:2;padding:15px 18px 10px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:#7c8790;border-bottom:1px solid #edf0f2}
  .tp2-make,.tp2-family{display:flex;width:100%;align-items:center;justify-content:space-between;text-align:left;border:0;border-bottom:1px solid #edf0f2;background:transparent;color:#132135;padding:15px 18px;font-size:14px;font-weight:750;cursor:pointer}.tp2-make:hover,.tp2-family:hover{background:#eef8fd}.tp2-make.active,.tp2-family.active{background:#132135;color:#fff}.tp2-make.active span,.tp2-family.active span{color:#F8FF66}
  .tp2-model-head{position:sticky;top:0;background:#fff;z-index:3;padding:14px 22px;border-bottom:1px solid #e7ebee;display:flex;gap:16px;align-items:center;justify-content:space-between}.tp2-model-head b{font:800 17px/1 Nofex,"Arial Black",Arial,sans-serif;text-transform:uppercase}.tp2-search{width:min(330px,50%);height:38px;border:1px solid #d6dde2;padding:0 12px;background:#fafbfc;color:#132135}
  .tp2-model-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:18px 22px 26px}.tp2-car{border:1px solid #e2e7ea;background:#fff;text-align:left;padding:14px 15px;min-height:68px;cursor:pointer;color:#132135;transition:.15s}.tp2-car:hover{border-color:#8FC6E4;background:#f3faff;transform:translateY(-1px)}.tp2-car strong{display:block;font-size:14px;line-height:1.25}.tp2-meta{display:block;color:#74818b;font-size:11px;margin-top:5px;line-height:1.25}.tp2-empty{padding:24px;color:#74818b;font-size:13px}
  @media(max-width:850px){.tp2-menu{top:0!important;bottom:0}.tp2-shell{height:100%}.tp2-head{padding:14px 16px}.tp2-grid{height:calc(100% - 70px);min-height:0;grid-template-columns:1fr}.tp2-col{display:none}.tp2-col.mobile-active{display:block}.tp2-label{padding:14px 16px}.tp2-make,.tp2-family{padding:16px}.tp2-model-head{padding:12px 16px;flex-wrap:wrap}.tp2-search{width:100%;max-width:none}.tp2-model-list{grid-template-columns:1fr;padding:14px 16px}.tp2-mobile-back{display:inline-flex!important}}
  .tp2-mobile-back{display:none;border:0;background:#eef6fa;color:#132135;padding:8px 10px;font-weight:800;cursor:pointer}
  `;
  document.head.appendChild(style);

  function normalize(){
    if(DATA.makes?.Scion)delete DATA.makes.Scion;
    if(DATA.makes?.Subaru)delete DATA.makes.Subaru;
    if(DATA.makes?.Toyota){const supra=(DATA.makes.Toyota['GR Supra']||[]).filter(v=>/^GR Supra 3\.0(?: Premium)?\|/i.test(v));DATA.makes.Toyota=supra.length?{'GR Supra 3.0 (B58)':supra}:{};if(!supra.length)delete DATA.makes.Toyota}
    const bmw=DATA.makes?.BMW;if(!bmw)return;
    const m=[];const pull=k=>(bmw[k]||[]).forEach(v=>m.push(v));
    ['1 Series M Coupé','M2','M3','M4','M5','M8','X3 M','X4 M','X5 M','X6 M'].forEach(pull);
    (bmw['3 Series']||[]).filter(v=>/^M3(?:\s|\||$)/i.test(v)).forEach(v=>m.push(v));
    const cleaned={};
    ['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series','7 Series','8 Series'].forEach(k=>{if(bmw[k])cleaned[k]=bmw[k].filter(v=>!(k==='3 Series'&&/^M3(?:\s|\||$)/i.test(v)))});
    if(m.length)cleaned['M Series']=unique(m);
    const x=[];Object.keys(bmw).filter(k=>/^X\d/.test(k)).forEach(k=>(bmw[k]||[]).forEach(v=>x.push(`${k} — ${v}`)));if(x.length)cleaned['X Series']=unique(x);
    Object.keys(bmw).forEach(k=>{if(!cleaned[k]&&!['1 Series M Coupé','M2','M3','M4','M5','M8','X3 M','X4 M','X5 M','X6 M'].includes(k)&&!/^X\d/.test(k))cleaned[k]=bmw[k]});
    DATA.makes.BMW=cleaned;
  }

  function shell(){
    let back=document.querySelector('.tp2-backdrop'),menu=document.querySelector('.tp2-menu');
    if(!back){back=document.createElement('div');back.className='tp2-backdrop';document.body.appendChild(back);back.onclick=close}
    if(!menu){menu=document.createElement('div');menu.className='tp2-menu';menu.innerHTML=`<div class="tp2-shell"><div class="tp2-head"><div><h2>Shop by car</h2><p>Choose your make, series and exact model/chassis.</p></div><button class="tp2-close" aria-label="Close vehicle menu">×</button></div><div class="tp2-grid"><aside class="tp2-col tp2-makes mobile-active"></aside><aside class="tp2-col tp2-series"></aside><section class="tp2-col tp2-models"></section></div></div>`;document.body.appendChild(menu);menu.querySelector('.tp2-close').onclick=close}
    return menu;
  }
  const families=()=>Object.keys(DATA.makes[currentMake]||{});
  function render(step='makes'){
    const menu=shell(),makes=Object.keys(DATA.makes||{});
    if(!currentMake||!DATA.makes[currentMake])currentMake=makes.includes('BMW')?'BMW':(makes[0]||'');
    const fams=families();if(!currentFamily||!DATA.makes[currentMake]?.[currentFamily])currentFamily=fams[0]||'';
    const makeCol=menu.querySelector('.tp2-makes'),seriesCol=menu.querySelector('.tp2-series'),modelCol=menu.querySelector('.tp2-models');
    makeCol.innerHTML=`<div class="tp2-label">1 · Make</div>${makes.map(m=>`<button class="tp2-make ${m===currentMake?'active':''}" data-tp2-make="${esc(m)}">${esc(m)} <span>›</span></button>`).join('')}`;
    seriesCol.innerHTML=`<div class="tp2-label"><button class="tp2-mobile-back" data-back="makes">← Makes</button> 2 · Series</div>${fams.map(f=>`<button class="tp2-family ${f===currentFamily?'active':''}" data-tp2-family="${esc(f)}">${esc(f)} <span>›</span></button>`).join('')}`;
    renderModels(modelCol,'');
    makeCol.querySelectorAll('[data-tp2-make]').forEach(b=>b.onclick=()=>{currentMake=b.dataset.tp2Make;currentFamily='';render('series')});
    seriesCol.querySelectorAll('[data-tp2-family]').forEach(b=>b.onclick=()=>{currentFamily=b.dataset.tp2Family;render('models')});
    menu.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>mobileStep(b.dataset.back));
    mobileStep(step);
  }
  function renderModels(col,query=''){
    const items=(DATA.makes[currentMake]?.[currentFamily]||[]).map(v=>{const [model,chassis='']=v.split('|');return {raw:v,model,chassis}});
    const q=query.trim().toLowerCase(),filtered=q?items.filter(x=>(x.model+' '+x.chassis).toLowerCase().includes(q)):items;
    col.innerHTML=`<div class="tp2-model-head"><div><button class="tp2-mobile-back" data-back="series">← Series</button> <b>${esc(currentFamily||'Models')}</b></div><input class="tp2-search" placeholder="Search model or chassis…" value="${esc(query)}"></div><div class="tp2-model-list">${filtered.length?filtered.map(x=>`<button class="tp2-car" data-tp2-car="${esc(x.raw)}"><strong>${esc(x.model.replace(/^.*? — /,''))}</strong>${x.chassis?`<span class="tp2-meta">Chassis: ${esc(cleanChassis(x.chassis))}</span>`:''}</button>`).join(''):'<div class="tp2-empty">No matching models.</div>'}</div>`;
    col.querySelector('.tp2-search').oninput=e=>renderModels(col,e.target.value);
    col.querySelectorAll('[data-tp2-car]').forEach(b=>b.onclick=()=>choose(b.dataset.tp2Car));
    col.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>mobileStep(b.dataset.back));
  }
  function mobileStep(step){if(innerWidth>850)return;const menu=shell();menu.querySelectorAll('.tp2-col').forEach(x=>x.classList.remove('mobile-active'));menu.querySelector(step==='series'?'.tp2-series':step==='models'?'.tp2-models':'.tp2-makes')?.classList.add('mobile-active')}
  function position(){const menu=shell(),header=document.querySelector('.mainnav');if(innerWidth>850&&header)menu.style.top=Math.round(header.getBoundingClientRect().bottom)+'px';else menu.style.top='0'}
  function open(){document.querySelector('.tp-car-mega')?.classList.remove('open');document.querySelector('.tp-car-backdrop')?.classList.remove('open');position();render('makes');shell().classList.add('open');document.querySelector('.tp2-backdrop')?.classList.add('open');document.body.style.overflow='hidden'}
  function close(){shell().classList.remove('open');document.querySelector('.tp2-backdrop')?.classList.remove('open');document.body.style.overflow=''}
  function choose(raw){const [model,chassis='']=raw.split('|');const selected={make:currentMake,family:currentFamily,model,chassis,label:`${currentMake} ${model.replace(/^.*? — /,'')}${chassis?' · '+cleanChassis(chassis):''}`};localStorage.setItem('plug-selected-vehicle',JSON.stringify(selected));localStorage.removeItem('plug-selected-brand');close();location.hash='#shop';location.reload()}

  document.addEventListener('click',e=>{const target=e.target.closest('[data-vehicle],.tp-open-car,.staging-nav a');if(!target)return;const isCar=target.matches('[data-vehicle],.tp-open-car')||target.textContent.toLowerCase().includes('shop by car');if(!isCar)return;e.preventDefault();e.stopImmediatePropagation();open()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});window.addEventListener('resize',position);
  fetch('/fitment-menu.json?v=5').then(r=>r.json()).then(d=>{DATA=d||{makes:{}};normalize()}).catch(()=>{});
})();
