(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let DATA={brands:{}},brand='',model='',submodel='';

  const clean=s=>String(s??'').replace(/Coupé/gi,'Coupe').replace(/\s+/g,' ').trim();
  function canonicalSub(s){
    s=clean(s)||'Standard';
    s=s.replace(/\bx\s*-?\s*drive\b/gi,'xDrive')
      .replace(/\bm\s*-?\s*sport\b/gi,'M Sport')
      .replace(/\bpre\s*-?\s*lci\b/gi,'Pre-LCI')
      .replace(/\blci\b/gi,'LCI')
      .replace(/\bcompetition\b/gi,'Competition')
      .replace(/\bperformance\b/gi,'Performance')
      .replace(/\bquattro\b/gi,'quattro')
      .replace(/\s*[/|]\s*/g,' / ')
      .replace(/\s+/g,' ')
      .trim();
    const words=s.split(' '),out=[];
    for(const w of words){if(!out.length||out[out.length-1].toLowerCase()!==w.toLowerCase())out.push(w)}
    return out.join(' ')||'Standard';
  }
  const specKey=x=>[clean(x.chassis).toLowerCase(),clean(x.engine).toLowerCase(),clean(x.liters).toLowerCase()].join('|');
  const specSignature=specs=>[...new Set((specs||[]).map(specKey))].sort().join('||');
  function subCore(name){
    const n=canonicalSub(name);
    return n.replace(/\b(Sedan|Saloon)\b/gi,'').replace(/\s+/g,' ').trim()||'Standard';
  }
  function addUniqueSpecs(target,specs){
    const seen=new Set(target.map(specKey));
    for(const sp of specs||[]){const k=specKey(sp);if(!seen.has(k)){seen.add(k);target.push(sp)}}
  }
  function consolidateSubs(entries){
    const list=[...entries.values()].map(x=>({name:x.name,specs:[...x.specs]}));

    // Merge labels that differ only by a redundant Sedan/Saloon suffix when a clean base label exists.
    const byCore=new Map();
    for(const item of list){const core=subCore(item.name).toLowerCase();if(!byCore.has(core))byCore.set(core,[]);byCore.get(core).push(item)}
    const afterCore=[];
    for(const group of byCore.values()){
      const bare=group.find(x=>canonicalSub(x.name).toLowerCase()===subCore(x.name).toLowerCase());
      if(bare&&group.length>1){
        const merged={name:canonicalSub(bare.name),specs:[]};
        for(const x of group)addUniqueSpecs(merged.specs,x.specs);
        afterCore.push(merged);
      }else afterCore.push(...group);
    }

    // If two labels point to exactly the same chassis/engine/litre set, keep only the shortest clean label.
    const bySignature=new Map();
    for(const item of afterCore){
      const sig=specSignature(item.specs)||('empty:'+canonicalSub(item.name).toLowerCase());
      if(!bySignature.has(sig))bySignature.set(sig,[]);
      bySignature.get(sig).push(item);
    }
    const result=[];
    for(const group of bySignature.values()){
      if(group.length===1){result.push(group[0]);continue}
      const preferred=[...group].sort((a,b)=>canonicalSub(a.name).length-canonicalSub(b.name).length||canonicalSub(a.name).localeCompare(canonicalSub(b.name)))[0];
      const merged={name:canonicalSub(preferred.name),specs:[]};
      for(const x of group)addUniqueSpecs(merged.specs,x.specs);
      result.push(merged);
    }
    return result;
  }
  function normalizeData(raw){
    const out={brands:{}};
    for(const [make,models] of Object.entries(raw?.brands||{})){
      if(/^(Scion|Subaru)$/i.test(make))continue;
      out.brands[make]??={};
      for(const [mdl,subs] of Object.entries(models||{})){
        const cm=clean(mdl);out.brands[make][cm]??={};
        const merged=new Map();
        for(const [sub,specs] of Object.entries(subs||{})){
          const cs=canonicalSub(sub),k=cs.toLowerCase();
          if(!merged.has(k))merged.set(k,{name:cs,specs:[]});
          addUniqueSpecs(merged.get(k).specs,specs);
        }
        for(const {name,specs} of consolidateSubs(merged)){
          specs.sort((a,b)=>`${clean(a.chassis)} ${clean(a.engine)} ${clean(a.liters)}`.localeCompare(`${clean(b.chassis)} ${clean(b.engine)} ${clean(b.liters)}`,undefined,{numeric:true,sensitivity:'base'}));
          out.brands[make][cm][name]=specs;
        }
      }
    }
    return out;
  }

  const style=document.createElement('style');
  style.textContent=`
  .tp2-backdrop{position:fixed;inset:0;background:rgba(10,20,32,.5);backdrop-filter:blur(2px);z-index:490;opacity:0;pointer-events:none;transition:.18s}.tp2-backdrop.open{opacity:1;pointer-events:auto}
  .tp2-menu{position:fixed;left:50%;transform:translateX(-50%) translateY(-8px);z-index:500;width:min(1380px,calc(100vw - 34px));max-height:calc(100vh - 125px);background:#fff;border:1px solid #e6ebef;border-radius:16px;box-shadow:0 28px 80px rgba(19,33,53,.22);display:none;color:#132135;overflow:hidden}.tp2-menu.open{display:block;transform:translateX(-50%) translateY(0)}
  .tp2-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #edf0f2;background:#fff}.tp2-titlewrap{display:flex;align-items:center;gap:16px}.tp2-badge{width:42px;height:42px;border-radius:12px;background:#F8FF66;display:grid;place-items:center;font-weight:900;font-size:19px}.tp2-head h2{margin:0;font:800 21px/1 Nofex,"Arial Black",Arial,sans-serif;text-transform:uppercase}.tp2-head p{margin:6px 0 0;font-size:12px;color:#71808b}.tp2-close{border:1px solid #dfe5e9;background:#fff;color:#132135;width:40px;height:40px;border-radius:10px;font-size:22px;cursor:pointer}.tp2-close:hover{background:#132135;color:#fff}
  .tp2-progress{display:flex;gap:8px;padding:12px 20px;border-bottom:1px solid #edf0f2;background:#fafbfd;overflow:auto}.tp2-step{font-size:11px;font-weight:800;color:#77838c;white-space:nowrap}.tp2-step.active{color:#132135}.tp2-step:not(:last-child)::after{content:'›';margin-left:8px;color:#b2bbc2}
  .tp2-grid{display:grid;grid-template-columns:180px 220px 260px minmax(340px,1fr);height:min(560px,calc(100vh - 245px));min-height:410px}.tp2-col{overflow:auto;border-right:1px solid #edf0f2;background:#fff}.tp2-specs{border-right:0;background:#fbfcfd}.tp2-label{position:sticky;top:0;z-index:3;background:inherit;padding:14px 16px 10px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:900;color:#8a959d;border-bottom:1px solid #f0f2f4}
  .tp2-choice{display:flex;width:100%;align-items:center;justify-content:space-between;text-align:left;border:0;border-bottom:1px solid #f0f2f4;background:transparent;color:#132135;padding:13px 16px;font-size:13px;font-weight:750;cursor:pointer;transition:.12s}.tp2-choice:hover{background:#f4f9fc}.tp2-choice.active{background:#132135;color:#fff}.tp2-choice span{font-size:16px;color:#a4afb7}.tp2-choice.active span{color:#F8FF66}
  .tp2-spec-head{position:sticky;top:0;z-index:3;background:#fbfcfd;padding:14px 18px;border-bottom:1px solid #edf0f2}.tp2-spec-head b{display:block;font:800 15px/1.1 Nofex,"Arial Black",Arial,sans-serif;text-transform:uppercase}.tp2-spec-head small{display:block;margin-top:5px;color:#7b8790}.tp2-spec-list{padding:8px 12px 20px}.tp2-spec{width:100%;display:grid;grid-template-columns:minmax(120px,.8fr) minmax(150px,1fr) auto;align-items:center;gap:12px;border:0;border-bottom:1px solid #e8ecef;background:transparent;text-align:left;padding:13px 10px;cursor:pointer;color:#132135}.tp2-spec:hover{background:#f2f8fb}.tp2-spec strong{font-size:13px}.tp2-engine{font-size:12px;color:#52616d}.tp2-go{font-size:11px;font-weight:900;background:#F8FF66;padding:7px 9px;border-radius:999px;color:#132135}.tp2-empty{padding:24px;color:#74818b;font-size:13px}.tp2-mobile-back{display:none;border:0;background:#eef5f8;color:#132135;padding:7px 9px;border-radius:8px;font-weight:800;cursor:pointer;margin-right:8px}
  @media(max-width:900px){.tp2-menu{top:12px!important;bottom:12px;width:calc(100vw - 24px);max-height:none}.tp2-head{padding:14px 15px}.tp2-titlewrap{gap:10px}.tp2-badge{width:36px;height:36px;border-radius:9px}.tp2-head p{display:none}.tp2-progress{padding:10px 14px}.tp2-grid{height:calc(100% - 117px);min-height:0;grid-template-columns:1fr}.tp2-col{display:none;border-right:0}.tp2-col.mobile-active{display:block}.tp2-label{padding:13px 14px}.tp2-choice{padding:15px 14px}.tp2-spec-list{padding:4px 10px 16px}.tp2-spec{grid-template-columns:1fr auto;gap:5px 10px}.tp2-engine{grid-column:1}.tp2-go{grid-row:1 / span 2;grid-column:2}.tp2-mobile-back{display:inline-flex}}
  `;
  document.head.appendChild(style);

  function shell(){
    let back=document.querySelector('.tp2-backdrop'),menu=document.querySelector('.tp2-menu');
    if(!back){back=document.createElement('div');back.className='tp2-backdrop';document.body.appendChild(back);back.onclick=close}
    if(!menu){menu=document.createElement('div');menu.className='tp2-menu';menu.innerHTML=`<div class="tp2-head"><div class="tp2-titlewrap"><div class="tp2-badge">TP</div><div><h2>Choose My Car</h2><p>Pick your vehicle once and only compatible products will be shown.</p></div></div><button class="tp2-close" aria-label="Close vehicle menu">×</button></div><div class="tp2-progress"><span class="tp2-step active">Brand</span><span class="tp2-step">Model</span><span class="tp2-step">Submodel</span><span class="tp2-step">Chassis & Engine</span></div><div class="tp2-grid"><aside class="tp2-col tp2-brands mobile-active"></aside><aside class="tp2-col tp2-models"></aside><aside class="tp2-col tp2-subs"></aside><section class="tp2-col tp2-specs"></section></div>`;document.body.appendChild(menu);menu.querySelector('.tp2-close').onclick=close}
    return menu;
  }
  const brands=()=>Object.keys(DATA.brands||{}).sort((a,b)=>a.localeCompare(b));
  const models=()=>Object.keys(DATA.brands?.[brand]||{}).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
  const subs=()=>Object.keys(DATA.brands?.[brand]?.[model]||{}).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
  function progress(step){const order=['brands','models','subs','specs'],idx=Math.max(0,order.indexOf(step));shell().querySelectorAll('.tp2-step').forEach((x,i)=>x.classList.toggle('active',i<=idx))}
  function mobileStep(step){progress(step);if(innerWidth>900)return;const menu=shell();menu.querySelectorAll('.tp2-col').forEach(x=>x.classList.remove('mobile-active'));menu.querySelector(step==='models'?'.tp2-models':step==='subs'?'.tp2-subs':step==='specs'?'.tp2-specs':'.tp2-brands')?.classList.add('mobile-active')}
  function render(step='brands'){
    const menu=shell(),bs=brands();
    if(!brand||!DATA.brands[brand])brand=bs[0]||'';
    const ms=models();if(!model||!DATA.brands?.[brand]?.[model])model=ms[0]||'';
    const ss=subs();if(!submodel||!DATA.brands?.[brand]?.[model]?.[submodel])submodel=ss[0]||'';
    const bcol=menu.querySelector('.tp2-brands'),mcol=menu.querySelector('.tp2-models'),scol=menu.querySelector('.tp2-subs'),pcol=menu.querySelector('.tp2-specs');
    bcol.innerHTML=`<div class="tp2-label">Brand</div>${bs.map(x=>`<button class="tp2-choice ${x===brand?'active':''}" data-brand="${esc(x)}">${esc(x)} <span>›</span></button>`).join('')}`;
    mcol.innerHTML=`<div class="tp2-label"><button class="tp2-mobile-back" data-back="brands">←</button>Model</div>${ms.map(x=>`<button class="tp2-choice ${x===model?'active':''}" data-model="${esc(x)}">${esc(x)} <span>›</span></button>`).join('')}`;
    scol.innerHTML=`<div class="tp2-label"><button class="tp2-mobile-back" data-back="models">←</button>Submodel</div>${ss.map(x=>`<button class="tp2-choice ${x===submodel?'active':''}" data-sub="${esc(x)}">${esc(x)} <span>›</span></button>`).join('')}`;
    renderSpecs(pcol);
    bcol.querySelectorAll('[data-brand]').forEach(b=>b.onclick=()=>{brand=b.dataset.brand;model='';submodel='';render('models')});
    mcol.querySelectorAll('[data-model]').forEach(b=>b.onclick=()=>{model=b.dataset.model;submodel='';render('subs')});
    scol.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{submodel=b.dataset.sub;render('specs')});
    menu.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>mobileStep(b.dataset.back));mobileStep(step)
  }
  function renderSpecs(col){
    const specs=DATA.brands?.[brand]?.[model]?.[submodel]||[];
    col.innerHTML=`<div class="tp2-spec-head"><button class="tp2-mobile-back" data-back="subs">←</button><b>Chassis & Engine / Litres</b><small>Select the exact platform for best fitment accuracy.</small></div><div class="tp2-spec-list">${specs.length?specs.map((x,i)=>{const eng=[clean(x.engine),clean(x.liters)].filter(Boolean).join(' · ')||'Engine details not listed';return `<button class="tp2-spec" data-spec="${i}"><strong>${esc(clean(x.chassis)||'Chassis not listed')}</strong><span class="tp2-engine">${esc(eng)}</span><span class="tp2-go">Shop parts</span></button>`}).join(''):'<div class="tp2-empty">No chassis/engine combinations found for this submodel.</div>'}</div>`;
    col.querySelectorAll('[data-spec]').forEach(b=>b.onclick=()=>choose(specs[+b.dataset.spec]));
    col.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>mobileStep(b.dataset.back));
  }
  function choose(spec){
    const selected={make:brand,brand,car_model:model,submodel,chassis:clean(spec.chassis),engine:clean(spec.engine),liters:clean(spec.liters),model:clean(spec.raw_model)||model,label:[brand,model,submodel!=='Standard'?submodel:'',clean(spec.chassis),[clean(spec.engine),clean(spec.liters)].filter(Boolean).join(' ')].filter(Boolean).join(' · ')};
    localStorage.setItem('plug-selected-vehicle',JSON.stringify(selected));
    localStorage.removeItem('plug-selected-brand');
    localStorage.removeItem('plug-selected-category');
    close();location.hash='#shop';location.reload();
  }
  function position(){const menu=shell(),header=document.querySelector('.mainnav');if(innerWidth>900&&header)menu.style.top=Math.round(header.getBoundingClientRect().bottom+10)+'px';else menu.style.top='12px'}
  function open(){position();render('brands');shell().classList.add('open');document.querySelector('.tp2-backdrop')?.classList.add('open');document.body.style.overflow='hidden'}
  function close(){shell().classList.remove('open');document.querySelector('.tp2-backdrop')?.classList.remove('open');document.body.style.overflow=''}
  document.addEventListener('click',e=>{const target=e.target.closest('[data-vehicle],.tp-open-car,.staging-nav a');if(!target)return;const isCar=target.matches('[data-vehicle],.tp-open-car')||target.textContent.toLowerCase().includes('shop by car');if(!isCar)return;e.preventDefault();e.stopImmediatePropagation();open()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});window.addEventListener('resize',position);
  fetch('/api/catalog/vehicles?v=3',{cache:'no-store'}).then(r=>r.json()).then(d=>{DATA=normalizeData(d&&d.brands?d:{brands:{}})}).catch(()=>{DATA={brands:{}}});
})();
