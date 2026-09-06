(()=>{
  const slides=[
    {image:'https://images.unsplash.com/photo-1741889823656-c056b0c43749?auto=format&fit=crop&w=2200&q=85',label:'BMW M4',position:'center 58%'},
    {image:'https://images.unsplash.com/photo-1774066811800-448b846647a2?auto=format&fit=crop&w=2200&q=85',label:'Mercedes-AMG GT',position:'center 55%'},
    {image:'https://images.unsplash.com/photo-1762028159677-e45ac537a29a?auto=format&fit=crop&w=2200&q=85',label:'Audi RS6',position:'center 55%'},
    {image:'https://images.unsplash.com/photo-1591076898712-f658e1e7edfb?auto=format&fit=crop&w=2200&q=85',label:'Porsche 911',position:'center 58%'},
    {image:'https://images.unsplash.com/photo-1707406767272-8c1deea8f5b8?auto=format&fit=crop&w=2200&q=85',label:'BMW M3 Engine Bay',position:'center 48%'}
  ];

  const style=document.createElement('style');
  style.textContent=`
    #home .tp-hero.tp-carousel-ready{animation:none!important;background-image:none!important}
    #home .tp-hero.tp-carousel-ready:before{z-index:1!important}
    .tp-hero-slides{position:absolute;inset:0;z-index:0;overflow:hidden;background:#132135}
    .tp-hero-slide{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transform:scale(1.025);transition:opacity .8s ease,transform 6s ease}
    .tp-hero-slide.active{opacity:1;transform:scale(1)}
    .tp-hero-controls{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:12px;background:rgba(19,33,53,.52);backdrop-filter:blur(8px);padding:8px 10px;border:1px solid rgba(255,255,255,.18)}
    .tp-hero-arrow{width:34px;height:34px;border:1px solid rgba(255,255,255,.35);background:rgba(19,33,53,.78);color:#fff;font-size:20px;line-height:1;cursor:pointer}
    .tp-hero-arrow:hover{background:#F8FF66;color:#132135;border-color:#F8FF66}
    .tp-hero-dots{display:flex;align-items:center;gap:7px}
    .tp-hero-dot{width:8px;height:8px;border-radius:50%;border:1px solid #fff;background:transparent;padding:0;cursor:pointer}
    .tp-hero-dot.active{background:#F8FF66;border-color:#F8FF66;transform:scale(1.2)}
    .tp-hero-caption{position:absolute;right:28px;top:24px;z-index:3;color:#fff;background:rgba(19,33,53,.64);border-left:3px solid #8FC6E4;padding:8px 12px;font:700 11px/1.2 Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase}
    @media(max-width:720px){.tp-hero-controls{bottom:14px}.tp-hero-caption{right:15px;top:14px;font-size:10px}.tp-hero-slide{background-position:58% center}}
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

    const caption=document.createElement('div');
    caption.className='tp-hero-caption';
    caption.textContent=slides[0].label;
    hero.appendChild(caption);

    const controls=document.createElement('div');
    controls.className='tp-hero-controls';
    controls.setAttribute('aria-label','Homepage European performance car carousel controls');
    controls.innerHTML=`<button class="tp-hero-arrow" data-prev aria-label="Previous slide">‹</button><div class="tp-hero-dots">${slides.map((_,i)=>`<button class="tp-hero-dot ${i===0?'active':''}" data-dot="${i}" aria-label="Go to slide ${i+1}"></button>`).join('')}</div><button class="tp-hero-arrow" data-next aria-label="Next slide">›</button>`;
    hero.appendChild(controls);

    let current=0,timer=null;
    const show=i=>{
      current=(i+slides.length)%slides.length;
      hero.querySelectorAll('.tp-hero-slide').forEach((el,n)=>el.classList.toggle('active',n===current));
      hero.querySelectorAll('.tp-hero-dot').forEach((el,n)=>el.classList.toggle('active',n===current));
      caption.textContent=slides[current].label;
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

  function tryMount(){if(!mount())setTimeout(tryMount,150)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryMount);else tryMount();
})();
