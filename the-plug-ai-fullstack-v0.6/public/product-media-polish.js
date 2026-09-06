(()=>{
  const PLACEHOLDER_RE=/product-runningboard(?:-side)?\.png/i;

  const style=document.createElement('style');
  style.textContent=`
    img[src*="product-runningboard.png"],img[src*="product-runningboard-side.png"]{visibility:hidden!important}
    .tp-product-image-missing{min-height:280px;border:1px solid #e4e8eb;background:#fafcfd;display:grid;place-items:center;text-align:center;color:#6f7b84;font-size:14px;padding:24px}
    .product-card .tp-product-image-missing{min-height:210px;height:100%;border:0;background:#f7f9fa}
    #product .tp-gallery-missing{width:100%;min-height:420px;border:1px solid #e4e8eb;background:#fafcfd;display:grid;place-items:center;text-align:center;color:#6f7b84;font-size:15px;padding:28px}

    /* Staging-style logo laminate: a narrow highlight that travels through the logo itself. */
    .tp-logo-shine-host{
      position:relative!important;
      overflow:hidden!important;
      isolation:isolate;
      background:transparent!important;
      box-shadow:none!important;
    }
    .tp-logo-shine-host>img{
      position:relative;
      z-index:1;
      background:transparent!important;
      box-shadow:none!important;
    }
    .tp-logo-shine-host::after{
      content:"";
      position:absolute;
      inset:0;
      z-index:2;
      pointer-events:none;
      background:linear-gradient(90deg,
        rgba(248,255,102,0) 0%,
        rgba(248,255,102,.12) 22%,
        rgba(248,255,102,.55) 42%,
        #F8FF66 50%,
        rgba(248,255,102,.55) 58%,
        rgba(248,255,102,.12) 78%,
        rgba(248,255,102,0) 100%);
      background-size:12% 100%;
      background-repeat:no-repeat;
      background-position:-16% 0;
      -webkit-mask-image:url('assets/logo.png');
      mask-image:url('assets/logo.png');
      -webkit-mask-repeat:no-repeat;
      mask-repeat:no-repeat;
      -webkit-mask-position:center;
      mask-position:center;
      -webkit-mask-size:contain;
      mask-size:contain;
      opacity:0;
      animation:tpLogoLaminate 3.6s linear infinite;
    }
    @keyframes tpLogoLaminate{
      0%,18%{background-position:-16% 0;opacity:0}
      22%{opacity:.9}
      58%{background-position:116% 0;opacity:.9}
      62%,100%{background-position:116% 0;opacity:0}
    }

    /* Footer logo: no black tile/background; use a clean light logo on the dark footer. */
    footer .tp-logo-shine-host,
    footer .logo,
    footer a.logo,
    footer [class*="logo"]{
      background:transparent!important;
      box-shadow:none!important;
      border:0!important;
    }
    footer .tp-logo-shine-host>img,
    footer img[src*="logo"],
    footer img[alt="The Plug"]{
      background:transparent!important;
      box-shadow:none!important;
      filter:brightness(0) invert(1)!important;
      mix-blend-mode:normal!important;
    }

    @media (prefers-reduced-motion:reduce){.tp-logo-shine-host::after{animation:none;opacity:0}}
  `;
  document.head.appendChild(style);

  function isPlaceholder(img){
    const src=(img?.getAttribute('src')||'').trim();
    return !src||PLACEHOLDER_RE.test(src);
  }

  function cleanProductCards(root=document){
    root.querySelectorAll?.('.product-card .product-image').forEach(box=>{
      const img=box.querySelector('img');
      if(!img||isPlaceholder(img)){
        if(img)img.style.display='none';
        if(!box.querySelector('.tp-product-image-missing')){
          const note=document.createElement('div');note.className='tp-product-image-missing';note.textContent='Product image not available';box.appendChild(note);
        }
      }else{
        img.style.display='';img.style.visibility='visible';
        box.querySelector('.tp-product-image-missing')?.remove();
      }
    });
  }

  function cleanProductGallery(){
    const product=document.querySelector('#product');if(!product)return;
    const detail=product.querySelector('.product-detail');if(!detail)return;
    const galleryCol=detail.firstElementChild;if(!galleryCol)return;
    const main=galleryCol.querySelector('.gallery-main');
    const img=main?.querySelector('img');
    const thumbs=galleryCol.querySelector('.thumbs,.tp-gallery-thumbs');
    if(!img||isPlaceholder(img)){
      if(main)main.style.display='none';
      if(thumbs)thumbs.style.display='none';
      if(!galleryCol.querySelector('.tp-gallery-missing')){
        const note=document.createElement('div');note.className='tp-gallery-missing';note.textContent='Product image not available';galleryCol.prepend(note);
      }
    }else{
      if(main){main.style.display='';img.style.visibility='visible'}
      if(thumbs)thumbs.style.display='';
      galleryCol.querySelector('.tp-gallery-missing')?.remove();
      thumbs?.querySelectorAll('img').forEach(t=>{if(isPlaceholder(t)){t.closest('button,.thumb')?.remove()}else t.style.visibility='visible'});
    }
  }

  function applyLogoShine(root=document){
    root.querySelectorAll?.('header img[src*="logo"],footer img[src*="logo"],img[alt="The Plug"]').forEach(img=>{
      const host=img.parentElement;if(!host)return;
      host.classList.add('tp-logo-shine-host');
    });
  }

  function run(){cleanProductCards();cleanProductGallery();applyLogoShine()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  const obs=new MutationObserver(()=>requestAnimationFrame(run));
  obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
})();
