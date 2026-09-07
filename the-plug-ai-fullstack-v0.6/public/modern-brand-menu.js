(()=>{
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const BRAND_META={
    AUTOID:{name:'AUTOID',logo:'assets/brands/autoid.svg',desc:'Performance Visual Upgrades'},
    P3:{name:'P3 Gauges',logo:'assets/brands/p3.svg',desc:'Digital Gauges & Electronics'},
    VALVETRONIC:{name:'Valvetronic',logo:'assets/valvetronic-badge.png',desc:'Exhaust Systems'}
  };
  let brands=[];
  let activeLetter='ALL';
  let searchTerm='';

  const style=document.createElement('style');
  style.textContent=`
    .tp-brand-menu{display:none!important}
    .tp-modern-brand-backdrop{position:fixed;inset:0;z-index:898;background:rgba(8,18,30,.28);opacity:0;pointer-events:none;transition:opacity .18s ease}.tp-modern-brand-backdrop.open{opacity:1;pointer-events:auto}
    .tp-modern-brand-panel{position:fixed;z-index:899;left:50%;transform:translateX(-50%) translateY(-8px);width:min(1060px,calc(100vw - 40px));background:#fff;border:1px solid #dfe5e9;box-shadow:0 26px 80px rgba(19,33,53,.24);border-radius:12px;padding:26px 28px 28px;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease}
    .tp-modern-brand-panel.open{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
    .tp-modern-brand-head{display:grid;grid-template-columns:1fr minmax(250px,310px);gap:28px;align-items:end;margin-bottom:20px}.tp-modern-brand-head h2{margin:0;color:#132135;font-size:30px;line-height:1}.tp-modern-brand-head p{margin:8px 0 0;color:#71808b;font-size:14px}.tp-brand-search{position:relative}.tp-brand-search input{width:100%;height:46px;border:1px solid #d7dee3;border-radius:8px;padding:0 14px 0 42px;font:inherit;outline:none}.tp-brand-search input:focus{border-color:#8FC6E4;box-shadow:0 0 0 3px rgba(143,198,228,.18)}.tp-brand-search span{position:absolute;left:15px;top:50%;transform:translateY(-50%);font-size:18px;color:#132135}
    .tp-brand-alpha{display:flex;gap:4px;align-items:center;overflow:auto;padding:0 0 16px;scrollbar-width:none}.tp-brand-alpha::-webkit-scrollbar{display:none}.tp-brand-alpha button{border:0;background:transparent;color:#697885;min-width:30px;height:32px;border-radius:7px;font-weight:800;cursor:pointer}.tp-brand-alpha button.active{background:#F8FF66;color:#132135}.tp-brand-alpha button:disabled{opacity:.28;cursor:default}
    .tp-modern-brand-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.tp-modern-brand-card{border:1px solid #e1e6ea;background:#fff;border-radius:10px;overflow:hidden;text-align:left;padding:0;cursor:pointer;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}.tp-modern-brand-card:hover{transform:translateY(-2px);border-color:#8FC6E4;box-shadow:0 12px 30px rgba(19,33,53,.11)}.tp-modern-brand-logo{height:150px;display:flex;align-items:center;justify-content:center;background:#f7f9fa;padding:26px}.tp-modern-brand-card[data-brand-key="P3"] .tp-modern-brand-logo{background:#0d1014}.tp-modern-brand-logo img{display:block;max-width:78%;max-height:72px;width:auto;height:auto;object-fit:contain}.tp-modern-brand-body{padding:17px 18px 18px;display:grid;grid-template-columns:1fr auto;gap:8px 12px;align-items:center}.tp-modern-brand-name{font-size:17px;font-weight:900;color:#132135}.tp-modern-brand-desc{font-size:13px;color:#71808b;grid-column:1/-1}.tp-modern-brand-action{margin-top:4px;font-size:13px;font-weight:900;color:#132135}.tp-modern-brand-arrow{width:36px;height:36px;border-radius:50%;background:#eaf6fc;display:grid;place-items:center;font-size:18px;color:#132135;grid-column:2;grid-row:1/4;align-self:end}.tp-brand-empty{grid-column:1/-1;padding:28px;text-align:center;color:#71808b;background:#f8fafb;border-radius:10px}
    .tp-brand-close{display:none;position:absolute;right:18px;top:16px;border:0;background:#fff;width:38px;height:38px;border-radius:50%;font-size:24px;cursor:pointer}
    #home .tp-brandbar{background:#fff}.tp-brands{gap:18px!important}.tp-brands .tp-brand{position:relative;min-height:190px!important;border-radius:10px!important;border:0!important;background:#132135!important;overflow:hidden;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer;box-shadow:0 8px 22px rgba(19,33,53,.10);transition:transform .18s ease,box-shadow .18s ease}.tp-brands .tp-brand:hover{transform:translateY(-3px);box-shadow:0 15px 30px rgba(19,33,53,.16)}.tp-brands .tp-brand:after{content:'Shop brand →';position:absolute;left:18px;bottom:16px;color:#fff;font-size:13px;font-weight:900}.tp-brands .tp-brand:before{content:'';position:absolute;left:18px;bottom:46px;width:42px;height:3px;background:#F8FF66}.tp-brands .tp-brand img{max-width:58%!important;max-height:70px!important;filter:none!important}.tp-brands .tp-brand[data-brand="AUTOID"]{background:#173d71!important}.tp-brands .tp-brand[data-brand="P3"]{background:#0b0d10!important}.tp-brands .tp-brand[data-brand="Valvetronic"]{background:#1b2b3f!important}
    @media(max-width:820px){.tp-modern-brand-panel{width:calc(100vw - 24px);padding:22px 18px 20px;max-height:calc(100vh - 100px);overflow:auto}.tp-modern-brand-head{grid-template-columns:1fr;gap:16px}.tp-modern-brand-grid{grid-template-columns:1fr 1fr}.tp-brand-close{display:block}.tp-modern-brand-logo{height:120px}}
    @media(max-width:560px){.tp-modern-brand-grid{grid-template-columns:1fr}.tp-modern-brand-head h2{font-size:26px}.tp-modern-brand-logo{height:115px}}
  `;
  document.head.appendChild(style);

  const normalizeKey=n=>{const u=String(n||'').toUpperCase();if(u.startsWith('AUTOID'))return'AUTOID';if(u.startsWith('P3'))return'P3';if(u.startsWith('VALVETRONIC'))return'VALVETRONIC';return u};
  const labelFor=b=>BRAND_META[normalizeKey(b.name)]?.name||b.name;
  const descFor=b=>BRAND_META[normalizeKey(b.name)]?.desc||'Premium automotive performance parts';
  const logoFor=b=>BRAND_META[normalizeKey(b.name)]?.logo||b.logo||'';

  function shell(){
    let panel=$('.tp-modern-brand-panel');
    if(panel)return panel;
    const backdrop=document.createElement('div');backdrop.className='tp-modern-brand-backdrop';backdrop.onclick=close;
    panel=document.createElement('div');panel.className='tp-modern-brand-panel';panel.innerHTML=`<button class="tp-brand-close" aria-label="Close">×</button><div class="tp-modern-brand-head"><div><h2>Browse Brands</h2><p>Premium automotive brands. Performance without compromise.</p></div><label class="tp-brand-search"><span>⌕</span><input type="search" placeholder="Search brands…" aria-label="Search brands"></label></div><div class="tp-brand-alpha"></div><div class="tp-modern-brand-grid"></div>`;
    document.body.append(backdrop,panel);
    $('.tp-brand-close',panel).onclick=close;
    $('.tp-brand-search input',panel).oninput=e=>{searchTerm=e.target.value.trim().toLowerCase();render()};
    return panel;
  }

  function render(){
    const panel=shell();
    const available=new Set(brands.map(b=>labelFor(b).charAt(0).toUpperCase()));
    const letters=['ALL',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    $('.tp-brand-alpha',panel).innerHTML=letters.map(l=>`<button data-letter="${l}" class="${activeLetter===l?'active':''}" ${l!=='ALL'&&!available.has(l)?'disabled':''}>${l==='ALL'?'All':l}</button>`).join('');
    $$('[data-letter]',panel).forEach(b=>b.onclick=()=>{activeLetter=b.dataset.letter;render()});
    const filtered=brands.filter(b=>{const label=labelFor(b);const letterOk=activeLetter==='ALL'||label.toUpperCase().startsWith(activeLetter);const searchOk=!searchTerm||label.toLowerCase().includes(searchTerm)||descFor(b).toLowerCase().includes(searchTerm);return letterOk&&searchOk});
    $('.tp-modern-brand-grid',panel).innerHTML=filtered.length?filtered.map(b=>{const key=normalizeKey(b.name);return `<button class="tp-modern-brand-card" data-modern-brand="${String(b.name).replace(/"/g,'&quot;')}" data-brand-key="${key}"><div class="tp-modern-brand-logo"><img src="${logoFor(b)}" alt="${labelFor(b)} logo"></div><div class="tp-modern-brand-body"><div class="tp-modern-brand-name">${labelFor(b)}</div><div class="tp-modern-brand-desc">${descFor(b)}</div><div class="tp-modern-brand-action">Shop Brand</div><span class="tp-modern-brand-arrow">→</span></div></button>`}).join(''):'<div class="tp-brand-empty">No brands match your search.</div>';
    $$('[data-modern-brand]',panel).forEach(btn=>btn.onclick=()=>choose(btn.dataset.modernBrand));
  }

  function position(){const panel=shell(),header=$('.mainnav');if(!header)return;panel.style.top=Math.max(70,Math.round(header.getBoundingClientRect().bottom)+6)+'px'}
  function open(){activeLetter='ALL';searchTerm='';const input=$('.tp-brand-search input',shell());if(input)input.value='';render();position();$('.tp-modern-brand-panel')?.classList.add('open');$('.tp-modern-brand-backdrop')?.classList.add('open')}
  function close(){$('.tp-modern-brand-panel')?.classList.remove('open');$('.tp-modern-brand-backdrop')?.classList.remove('open')}
  function choose(brand){localStorage.setItem('plug-selected-brand',brand);localStorage.removeItem('plug-selected-vehicle');localStorage.removeItem('plug-selected-category');close();location.href='/?brand='+encodeURIComponent(brand)+'#shop'}

  function wire(){
    const navBrand=$$('.staging-nav a').find(a=>/shop by brand/i.test(a.textContent||''));
    if(navBrand){navBrand.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},true)}
    document.addEventListener('click',e=>{const t=e.target.closest('.tp-open-brand');if(t){e.preventDefault();e.stopImmediatePropagation();open()}},true);
    addEventListener('resize',position);
  }

  function enhanceHomeBrands(){
    $$('#home .tp-brands .tp-brand[data-brand]').forEach(card=>{
      card.title='Shop '+card.dataset.brand;
    });
  }

  async function init(){
    try{const data=await (await fetch('/fitment-menu.json?v=modern-brand-1',{cache:'no-store'})).json();brands=(data.productBrands||[]).filter(b=>['AUTOID','P3','Valvetronic'].includes(b.name))}catch{brands=[{name:'AUTOID'},{name:'P3'},{name:'Valvetronic'}]}
    shell();wire();enhanceHomeBrands();
    const obs=new MutationObserver(enhanceHomeBrands);obs.observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
