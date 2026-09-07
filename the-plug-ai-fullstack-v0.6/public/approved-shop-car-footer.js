(()=>{
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let DATA={brands:{}},brand='',model='',submodel='',spec=null;

  const style=document.createElement('style');
  style.textContent=`
    .tp2-menu,.tp2-backdrop,.tp-car-mega,.tp-car-backdrop{display:none!important}
    .tp3-backdrop{position:fixed;inset:0;z-index:920;background:rgba(8,18,30,.36);backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:.18s}.tp3-backdrop.open{opacity:1;pointer-events:auto}
    .tp3-panel{position:fixed;z-index:921;left:50%;transform:translateX(-50%) translateY(-8px);width:min(1180px,calc(100vw - 34px));max-height:calc(100vh - 120px);overflow:hidden;background:#fff;border:1px solid #dde4e9;border-radius:14px;box-shadow:0 30px 90px rgba(19,33,53,.28);opacity:0;pointer-events:none;transition:.18s;color:#132135}.tp3-panel.open{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
    .tp3-head{display:grid;grid-template-columns:1fr minmax(260px,360px);gap:24px;padding:24px 26px 18px;border-bottom:1px solid #edf0f2;align-items:end}.tp3-head h2{margin:0;font-size:30px;line-height:1}.tp3-head p{margin:7px 0 0;color:#6d7a84;font-size:14px}.tp3-search{position:relative}.tp3-search input{width:100%;height:46px;border:1px solid #d5dde3;border-radius:8px;padding:0 14px 0 40px;font:inherit}.tp3-search span{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px}.tp3-close{position:absolute;right:14px;top:12px;border:0;background:#fff;width:38px;height:38px;border-radius:50%;font-size:24px;cursor:pointer;display:none}
    .tp3-steps{display:grid;grid-template-columns:repeat(4,1fr) minmax(230px,1.12fr);min-height:430px;max-height:calc(100vh - 235px)}.tp3-col{overflow:auto;border-right:1px solid #edf0f2;background:#fff}.tp3-summary{border-right:0;background:#f8fafb;padding:18px;display:flex;flex-direction:column}.tp3-label{position:sticky;top:0;z-index:2;background:inherit;padding:14px 14px 10px;border-bottom:1px solid #edf0f2;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#7b8790}.tp3-label b{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#F8FF66;color:#132135;margin-right:7px}.tp3-choice{display:flex;width:100%;justify-content:space-between;align-items:center;text-align:left;border:0;border-bottom:1px solid #f0f2f4;background:#fff;padding:14px;color:#132135;font-size:13px;font-weight:800;cursor:pointer}.tp3-choice:hover{background:#f3f8fb}.tp3-choice.active{background:linear-gradient(90deg,#F8FF66 0,#fbffac 100%)}.tp3-choice span{color:#7b8790;font-size:17px}.tp3-meta{display:block;font-size:11px;color:#75818a;margin-top:4px;font-weight:500}.tp3-empty{padding:22px 14px;color:#74818b;font-size:13px}
    .tp3-summary-kicker{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#7a8791;margin-bottom:14px}.tp3-summary-card{background:#fff;border:1px solid #e2e7eb;border-radius:12px;padding:18px}.tp3-mark{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#132135;color:#fff;font-weight:900;font-size:16px;margin-bottom:14px}.tp3-summary h3{margin:0 0 5px;font-size:24px}.tp3-summary p{margin:0;color:#5f6e78;line-height:1.45}.tp3-spec-line{padding:13px 0;margin-top:12px;border-top:1px solid #edf0f2;font-size:13px;font-weight:800}.tp3-match{margin:14px 0;background:#edf8ef;border-radius:8px;padding:10px 12px;font-size:12px;font-weight:800;color:#226b39}.tp3-actions{margin-top:auto;display:grid;gap:9px}.tp3-actions button{min-height:46px;border-radius:8px;font-weight:900;cursor:pointer}.tp3-view{border:0;background:#F8FF66;color:#132135}.tp3-clear{border:1px solid #cfd8de;background:#fff;color:#132135}.tp3-view:disabled{opacity:.45;cursor:not-allowed}.tp3-mobile-back{display:none;border:0;background:transparent;font-weight:900;margin-right:6px}
    .staging-nav a[data-tp-secondary-top="1"]{display:none!important}
    .tp-footer-support{display:none}
    @media(max-width:900px){.tp3-panel{top:10px!important;bottom:10px;max-height:none;width:calc(100vw - 20px)}.tp3-head{grid-template-columns:1fr;padding:18px}.tp3-head h2{font-size:25px}.tp3-search{display:none}.tp3-close{display:block}.tp3-steps{grid-template-columns:1fr;height:calc(100% - 86px);min-height:0;max-height:none}.tp3-col,.tp3-summary{display:none;border-right:0}.tp3-col.mobile-active,.tp3-summary.mobile-active{display:block}.tp3-mobile-back{display:inline-block}.tp3-summary{overflow:auto}}
  `;
  document.head.appendChild(style);

  function cleanSub(s){return String(s||'Standard').replace(/\b(Sedan|Saloon)\b/gi,'').replace(/\s+/g,' ').trim()||'Standard'}
  function normalize(raw){
    const out={brands:{}};
    for(const [mk,models] of Object.entries(raw?.brands||{})){
      if(/^(Scion|Subaru)$/i.test(mk))continue;
      out.brands[mk]={};
      for(const [mdl,subs] of Object.entries(models||{})){
        const grouped=new Map();
        for(const [sub,specs] of Object.entries(subs||{})){
          const name=cleanSub(sub),key=name.toLowerCase();
          if(!grouped.has(key))grouped.set(key,{name,specs:[]});
          const bucket=grouped.get(key).specs,seen=new Set(bucket.map(x=>[x.chassis,x.engine,x.liters].join('|').toLowerCase()));
          for(const x of specs||[]){const k=[x.chassis,x.engine,x.liters].join('|').toLowerCase();if(!seen.has(k)){seen.add(k);bucket.push(x)}}
        }
        out.brands[mk][mdl]={};
        for(const x of grouped.values())out.brands[mk][mdl][x.name]=x.specs;
      }
    }
    return out;
  }

  function shell(){let p=$('.tp3-panel');if(p)return p;const b=document.createElement('div');b.className='tp3-backdrop';b.onclick=close;p=document.createElement('div');p.className='tp3-panel';p.innerHTML=`<button class="tp3-close" aria-label="Close">×</button><div class="tp3-head"><div><h2>Find Parts for Your Vehicle</h2><p>Select your vehicle step by step to see compatible products only.</p></div><label class="tp3-search"><span>⌕</span><input type="search" placeholder="Search brand, model, chassis or engine…"></label></div><div class="tp3-steps"><aside class="tp3-col tp3-brand mobile-active"></aside><aside class="tp3-col tp3-model"></aside><aside class="tp3-col tp3-sub"></aside><aside class="tp3-col tp3-spec"></aside><section class="tp3-summary"></section></div>`;document.body.append(b,p);$('.tp3-close',p).onclick=close;$('.tp3-search input',p).oninput=()=>render();return p}
  const brands=()=>Object.keys(DATA.brands||{}).sort();
  const models=()=>Object.keys(DATA.brands?.[brand]||{}).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const subs=()=>Object.keys(DATA.brands?.[brand]?.[model]||{}).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const specs=()=>DATA.brands?.[brand]?.[model]?.[submodel]||[];
  function mobile(step){if(innerWidth>900)return;const p=shell();p.querySelectorAll('.tp3-col,.tp3-summary').forEach(x=>x.classList.remove('mobile-active'));p.querySelector(step==='model'?'.tp3-model':step==='sub'?'.tp3-sub':step==='spec'?'.tp3-spec':step==='summary'?'.tp3-summary':'.tp3-brand')?.classList.add('mobile-active')}
  function filtered(list){const q=$('.tp3-search input',shell())?.value.trim().toLowerCase()||'';return !q?list:list.filter(x=>String(x).toLowerCase().includes(q))}
  function render(step='brand'){
    const p=shell(),bs=brands();if(!brand||!DATA.brands[brand])brand=bs[0]||'';const ms=models();if(!model||!DATA.brands?.[brand]?.[model])model=ms[0]||'';const ss=subs();if(!submodel||!DATA.brands?.[brand]?.[model]?.[submodel])submodel=ss[0]||'';const sp=specs();if(spec&&!sp.includes(spec))spec=null;
    $('.tp3-brand',p).innerHTML=`<div class="tp3-label"><b>1</b>Select Brand</div>${filtered(bs).map(x=>`<button class="tp3-choice ${x===brand?'active':''}" data-b="${esc(x)}">${esc(x)}<span>›</span></button>`).join('')||'<div class="tp3-empty">No brands found.</div>'}`;
    $('.tp3-model',p).innerHTML=`<div class="tp3-label"><button class="tp3-mobile-back" data-back="brand">←</button><b>2</b>Select Model</div>${filtered(ms).map(x=>`<button class="tp3-choice ${x===model?'active':''}" data-m="${esc(x)}">${esc(x)}<span>›</span></button>`).join('')||'<div class="tp3-empty">Choose a brand first.</div>'}`;
    $('.tp3-sub',p).innerHTML=`<div class="tp3-label"><button class="tp3-mobile-back" data-back="model">←</button><b>3</b>Select Submodel</div>${filtered(ss).map(x=>`<button class="tp3-choice ${x===submodel?'active':''}" data-s="${esc(x)}">${esc(x)}<span>›</span></button>`).join('')||'<div class="tp3-empty">Choose a model first.</div>'}`;
    $('.tp3-spec',p).innerHTML=`<div class="tp3-label"><button class="tp3-mobile-back" data-back="sub">←</button><b>4</b>Chassis & Engine / Litres</div>${sp.map((x,i)=>`<button class="tp3-choice ${spec===x?'active':''}" data-sp="${i}"><span style="display:block;color:inherit"><strong>${esc(x.chassis||'Chassis not listed')}</strong><small class="tp3-meta">${esc([x.engine,x.liters].filter(Boolean).join(' · ')||'Engine details not listed')}</small></span><span>›</span></button>`).join('')||'<div class="tp3-empty">Choose a submodel first.</div>'}`;
    renderSummary();
    p.querySelectorAll('[data-b]').forEach(x=>x.onclick=()=>{brand=x.dataset.b;model='';submodel='';spec=null;render('model')});p.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{model=x.dataset.m;submodel='';spec=null;render('sub')});p.querySelectorAll('[data-s]').forEach(x=>x.onclick=()=>{submodel=x.dataset.s;spec=null;render('spec')});p.querySelectorAll('[data-sp]').forEach(x=>x.onclick=()=>{spec=sp[+x.dataset.sp];render('summary')});p.querySelectorAll('[data-back]').forEach(x=>x.onclick=()=>mobile(x.dataset.back));mobile(step)
  }
  async function countMatches(){if(!spec)return 0;try{const q=new URLSearchParams({make:brand,model,submodel,chassis:spec.chassis||'',engine:spec.engine||'',liters:spec.liters||''});const r=await fetch('/api/catalog/vehicle-fitments?'+q,{cache:'no-store'});const rows=await r.json();return new Set((rows||[]).map(x=>x.product_id)).size}catch{return 0}}
  function renderSummary(){const root=$('.tp3-summary',shell());const ready=!!spec;root.innerHTML=`<div class="tp3-summary-kicker">Your Selected Vehicle</div><div class="tp3-summary-card"><div class="tp3-mark">${esc((brand||'TP').slice(0,2).toUpperCase())}</div><h3>${esc([brand,model].filter(Boolean).join(' '))}</h3><p>${esc(submodel&&submodel!=='Standard'?submodel:'')}</p><div class="tp3-spec-line">${ready?esc([spec.chassis,spec.engine,spec.liters].filter(Boolean).join(' · ')):'Select chassis & engine to continue'}</div><div class="tp3-match" id="tp3Match">${ready?'Checking matching products…':'Complete the four steps above.'}</div></div><div class="tp3-actions"><button class="tp3-view" ${ready?'':'disabled'}>View Matching Parts →</button><button class="tp3-clear">Clear Vehicle</button></div>`;$('.tp3-view',root).onclick=choose;$('.tp3-clear',root).onclick=()=>{brand=model=submodel='';spec=null;localStorage.removeItem('plug-selected-vehicle');$$('.selected-vehicle').forEach(x=>x.textContent='Select your vehicle');render('brand')};if(ready)countMatches().then(n=>{const el=$('#tp3Match');if(el)el.textContent=`✓ ${n} matching product${n===1?'':'s'} found`})}
  function choose(){if(!spec)return;const selected={make:brand,brand,car_model:model,model:spec.raw_model||model,submodel,chassis:spec.chassis||'',engine:spec.engine||'',liters:spec.liters||'',label:[brand,model,submodel, spec.chassis].filter(Boolean).join(' · ')};localStorage.setItem('plug-selected-vehicle',JSON.stringify(selected));localStorage.removeItem('plug-selected-brand');localStorage.removeItem('plug-selected-category');$$('.selected-vehicle').forEach(x=>x.textContent=selected.label);close();location.hash='#shop';window.dispatchEvent(new HashChangeEvent('hashchange'))}
  function position(){const p=shell(),h=$('.mainnav');if(h&&innerWidth>900)p.style.top=Math.round(h.getBoundingClientRect().bottom+6)+'px'}
  function open(){render('brand');position();$('.tp3-panel').classList.add('open');$('.tp3-backdrop').classList.add('open');document.body.style.overflow='hidden'}
  function close(){$('.tp3-panel')?.classList.remove('open');$('.tp3-backdrop')?.classList.remove('open');document.body.style.overflow=''}
  function navFooter(){
    $$('.staging-nav a').forEach(a=>{if(/^(About Us|FAQs|Contact Us)$/i.test((a.textContent||'').trim()))a.dataset.tpSecondaryTop='1'});
    const footer=document.querySelector('footer');if(!footer||footer.querySelector('.tp-footer-support'))return;
    const box=document.createElement('div');box.className='tp-footer-support';box.innerHTML='<strong>Customer Support</strong><a href="#about">About Us</a><a href="#contact">FAQs</a><a href="#contact">Contact Us</a>';
    footer.appendChild(box);
    const s=document.createElement('style');s.textContent='.tp-footer-support{display:grid!important;gap:8px;margin-top:20px}.tp-footer-support strong{color:#fff}.tp-footer-support a{color:#cbd6df;text-decoration:none}.tp-footer-support a:hover{color:#F8FF66}';document.head.appendChild(s)
  }
  function wire(){
    document.addEventListener('click',e=>{const a=e.target.closest('.staging-nav a,[data-vehicle],.tp-open-car');if(!a)return;const txt=(a.textContent||'').toLowerCase();if(a.hasAttribute('data-vehicle')||/shop by car/.test(txt)||a.classList.contains('tp-open-car')){e.preventDefault();e.stopImmediatePropagation();open()}},true);addEventListener('resize',position);navFooter();new MutationObserver(navFooter).observe(document.documentElement,{childList:true,subtree:true})
  }
  async function init(){try{DATA=normalize(await (await fetch('/api/catalog/vehicles',{cache:'no-store'})).json())}catch{DATA={brands:{}}}shell();wire()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
