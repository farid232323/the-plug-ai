(()=>{
  const css=document.createElement('style');css.textContent=`
    #home .tp-hero{position:relative!important;overflow:hidden!important}
    .tp-managed-slides{position:absolute;inset:0;z-index:0;background:#132135}
    .tp-managed-slide{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat;opacity:0;transition:opacity .7s ease;pointer-events:none}
    .tp-managed-slide.active{opacity:1}
    #home .tp-hero .tp-hero-inner{position:relative!important;z-index:2!important;padding-bottom:92px!important}
    .tp-managed-controls{position:absolute!important;right:28px!important;bottom:24px!important;left:auto!important;transform:none!important;z-index:6!important;display:flex!important;gap:8px!important;align-items:center!important;background:rgba(19,33,53,.82)!important;border:1px solid rgba(255,255,255,.18)!important;backdrop-filter:blur(8px)!important;padding:7px 9px!important;box-shadow:0 8px 24px rgba(0,0,0,.18)!important}
    .tp-managed-controls>span{display:flex;align-items:center;gap:7px;padding:0 2px}
    .tp-managed-controls button{cursor:pointer}
    .tp-managed-controls [data-prev],.tp-managed-controls [data-next]{width:34px;height:34px;border:1px solid rgba(255,255,255,.32);background:#132135;color:#fff;font-size:20px;line-height:1;padding:0}
    .tp-managed-controls [data-prev]:hover,.tp-managed-controls [data-next]:hover{background:#F8FF66;color:#132135;border-color:#F8FF66}
    .tp-managed-dot{width:9px!important;height:9px!important;border-radius:50%;border:1px solid #fff!important;background:transparent!important;padding:0!important;min-width:9px!important}
    .tp-managed-dot.active{background:#F8FF66!important;border-color:#F8FF66!important}
    @media(max-width:720px){#home .tp-hero .tp-hero-inner{padding-bottom:88px!important}.tp-managed-controls{right:14px!important;bottom:14px!important}.tp-managed-controls [data-prev],.tp-managed-controls [data-next]{width:32px;height:32px}}
  `;document.head.appendChild(css);

  async function getBackendSlides(){
    for(let attempt=0;attempt<20;attempt++){
      try{
        const r=await fetch('/api/carousel?ts='+Date.now(),{cache:'no-store'});
        if(!r.ok)throw new Error('carousel unavailable');
        const d=await r.json();
        if(Array.isArray(d.slides))return d.slides.filter(s=>s&&s.image);
      }catch{}
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    return null;
  }

  async function run(){
    const slides=await getBackendSlides();
    if(!slides)return;
    const hero=document.querySelector('#home .tp-hero');if(!hero)return setTimeout(run,150);
    hero.querySelector('.tp-hero-slides')?.remove();hero.querySelector('.tp-hero-controls')?.remove();hero.querySelector('.tp-managed-slides')?.remove();hero.querySelector('.tp-managed-controls')?.remove();
    if(!slides.length)return;
    const wrap=document.createElement('div');wrap.className='tp-managed-slides';slides.forEach((s,i)=>{const d=document.createElement('div');d.className='tp-managed-slide'+(i===0?' active':'');d.style.backgroundImage=`url("${String(s.image).replace(/"/g,'%22')}")`;d.style.backgroundPosition=s.position||'center center';d.setAttribute('aria-label',s.label||'European performance');wrap.appendChild(d)});hero.prepend(wrap);
    const c=document.createElement('div');c.className='tp-managed-controls';c.innerHTML='<button data-prev aria-label="Previous slide">‹</button><span></span><button data-next aria-label="Next slide">›</button>';const dots=c.querySelector('span');slides.forEach((s,i)=>{const b=document.createElement('button');b.className='tp-managed-dot'+(i===0?' active':'');b.dataset.i=i;b.setAttribute('aria-label','Go to slide '+(i+1));dots.appendChild(b)});hero.appendChild(c);
    let cur=0,timer;const show=i=>{cur=(i+slides.length)%slides.length;wrap.querySelectorAll('.tp-managed-slide').forEach((x,n)=>x.classList.toggle('active',n===cur));c.querySelectorAll('.tp-managed-dot').forEach((x,n)=>x.classList.toggle('active',n===cur))};const restart=()=>{clearInterval(timer);if(slides.length>1)timer=setInterval(()=>show(cur+1),6500)};c.querySelector('[data-prev]').onclick=()=>{show(cur-1);restart()};c.querySelector('[data-next]').onclick=()=>{show(cur+1);restart()};c.querySelectorAll('.tp-managed-dot').forEach(b=>b.onclick=()=>{show(+b.dataset.i);restart()});if(slides.length<=1)c.style.display='none';restart();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();