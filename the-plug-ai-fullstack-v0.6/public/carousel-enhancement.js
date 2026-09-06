(()=>{
  const slides=[
    {image:'https://images.unsplash.com/photo-1774066811800-448b846647a2?auto=format&fit=crop&w=2200&q=85',label:'Mercedes-AMG GT',position:'center 55%'},
    {image:'https://images.unsplash.com/photo-1762028159677-e45ac537a29a?auto=format&fit=crop&w=2200&q=85',label:'Audi RS6',position:'center 55%'},
    {image:'https://images.unsplash.com/photo-1591076898712-f658e1e7edfb?auto=format&fit=crop&w=2200&q=85',label:'Porsche 911',position:'center 58%'},
    {image:'https://images.unsplash.com/photo-1707406767272-8c1deea8f5b8?auto=format&fit=crop&w=2200&q=85',label:'BMW M3 Engine Bay',position:'center 48%'}
  ];

  const style=document.createElement('style');
  style.textContent=`
    #home .tp-hero.tp-carousel-ready{position:relative!important;overflow:hidden!important;min-height:560px!important;height:560px!important;animation:none!important;background:none!important;isolation:isolate!important}
    #home .tp-hero.tp-carousel-ready:before{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(90deg,rgba(5,12,22,.84) 0%,rgba(12,26,43,.66) 42%,rgba(12,26,43,.22) 72%,rgba(12,26,43,.08) 100%)!important;pointer-events:none!important}
    #home .tp-hero.tp-carousel-ready .tp-hero-inner{position:relative!important;z-index:2!important;min-height:560px!important;height:560px!important;padding:54px 0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:40px!important}
    #home .tp-hero.tp-carousel-ready .tp-hero-copyblock{max-width:760px!important;position:relative!important;z-index:3!important}
    #home .tp-hero.tp-carousel-ready .tp-kicker{margin-bottom:16px!important}
    #home .tp-hero.tp-carousel-ready h1{font-size:clamp(48px,5vw,76px)!important;line-height:.94!important;max-width:760px!important;margin:0!important;text-wrap:balance!important}
    #home .tp-hero.tp-carousel-ready p{max-width:560px!important;margin:18px 0 24px!important;font-size:16px!important;line-height:1.5!important;color:#fff!important}
    #home .tp-hero.tp-carousel-ready .tp-hero-side{position:relative!important;z-index:3!important;align-self:flex-end!important;margin-bottom:46px!important}
    .tp-hero-slides{position:absolute!important;inset:0!important;z-index:0!important;overflow:hidden!important;background:#132135!important}
    .tp-hero-slide{position:absolute!important;inset:0!important;background-size:cover!important;background-repeat:no-repeat!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:scale(1.02)!important;transition:opacity .7s ease,transform 6s ease,visibility .7s!important}
    .tp-hero-slide.active{opacity:1!important;visibility:visible!important;transform:scale(1)!important}
    .tp-hero-controls{position:absolute!important;left:50%!important;bottom:22px!important;transform:translateX(-50%)!important;z-index:4!important;display:flex!important;align-items:center!important;gap:10px!important;background:rgba(19,33,53,.72)!important;backdrop-filter:blur(8px)!important;padding:7px 9px!important;border:1px solid rgba(255,255,255,.18)!important}
    .tp-hero-arrow{width:34px!important;height:34px!important;border:1px solid rgba(255,255,255,.35)!important;background:#132135!important;color:#fff!important;font-size:20px!important;line-height:1!important;cursor:pointer!important}
    .tp-hero-arrow:hover{background:#F8FF66!important;color:#132135!important;border-color:#F8FF66!important}
    .tp-hero-dots{display:flex!important;align-items:center!important;gap:7px!important}
    .tp-hero-dot{width:8px!important;height:8px!important;border-radius:50%!important;border:1px solid #fff!important;background:transparent!important;padding:0!important;cursor:pointer!important}
    .tp-hero-dot.active{background:#F8FF66!important;border-color:#F8FF66!important;transform:scale(1.2)!important}
    @media(max-width:720px){#home .tp-hero.tp-carousel-ready,#home .tp-hero.tp-carousel-ready .tp-hero-inner{height:520px!important;min-height:520px!important}#home .tp-hero.tp-carousel-ready .tp-hero-inner{padding:38px 0 60px!important;justify-content:center!important;align-items:flex-start!important;flex-direction:column!important}#home .tp-hero.tp-carousel-ready h1{font-size:clamp(40px,11vw,56px)!important;max-width:96%!important}#home .tp-hero.tp-carousel-ready p{font-size:14px!important;max-width:95%!important}#home .tp-hero.tp-carousel-ready .tp-hero-side{display:none!important}.tp-hero-controls{bottom:13px!important}.tp-hero-slide{background-position:58% center!important}}
  `;
  document.head.appendChild(style);

  function mount(){
    const hero=document.querySelector('#home .tp-hero');
    if(!hero||hero.dataset.carouselMounted==='1')return false;
    hero.dataset.carouselMounted='1';
    hero.classList.add('tp-carousel-ready');

    const slideWrap=document.createElement('div');
    slideWrap.className='tp-hero-slides';
    slideWrap.innerHTML=slides.map((s,i)=>`<div class="tp-hero-slide ${i===0?'active':''}" data-slide="${i}" role="img" aria-label="${s.label}" style="background-image:url('${s.image}');background-position:${s.position||'center'}"></div>`).join('');
    hero.prepend(slideWrap);

    const controls=document.createElement('div');
    controls.className='tp-hero-controls';
    controls.setAttribute('aria-label','Homepage European performance car carousel controls');
    controls.innerHTML=`<button class="tp-hero-arrow" data-prev aria-label="Previous slide">‹</button><div class="tp-hero-dots">${slides.map((_,i)=>`<button class="tp-hero-dot ${i===0?'active':''}" data-dot="${i}" aria-label="Go to slide ${i+1}: ${slides[i].label}"></button>`).join('')}</div><button class="tp-hero-arrow" data-next aria-label="Next slide">›</button>`;
    hero.appendChild(controls);

    let current=0,timer=null;
    const show=i=>{
      current=(i+slides.length)%slides.length;
      hero.querySelectorAll('.tp-hero-slide').forEach((el,n)=>el.classList.toggle('active',n===current));
      hero.querySelectorAll('.tp-hero-dot').forEach((el,n)=>el.classList.toggle('active',n===current));
    };
    const restart=()=>{clearInterval(timer);timer=setInterval(()=>show(current+1),6500)};
    controls.querySelector('[data-prev]').onclick=()=>{show(current-1);restart()};
    controls.querySelector('[data-next]').onclick=()=>{show(current+1);restart()};
    controls.querySelectorAll('[data-dot]').forEach(b=>b.onclick=()=>{show(Number(b.dataset.dot));restart()});
    hero.addEventListener('mouseenter',()=>clearInterval(timer));
    hero.addEventListener('mouseleave',restart);
    restart();
    return true;
  }

  function tryMount(){if(!mount())setTimeout(tryMount,120)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryMount);else tryMount();

  if(!document.querySelector('script[src="vehicle-menu-v2.js"]')){
    const s=document.createElement('script');s.src='vehicle-menu-v2.js?v=2';document.body.appendChild(s);
  }
})();
