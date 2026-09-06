(()=>{
  const PLACEHOLDER_RE=/product-runningboard(?:-side)?\.png/i;

  const style=document.createElement('style');
  style.textContent=`
    img[src*="product-runningboard.png"],img[src*="product-runningboard-side.png"]{visibility:hidden!important}
    .tp-product-image-missing{min-height:280px;border:1px solid #e4e8eb;background:#fafcfd;display:grid;place-items:center;text-align:center;color:#6f7b84;font-size:14px;padding:24px}
    .product-card .tp-product-image-missing{min-height:210px;height:100%;border:0;background:#f7f9fa}
    #product .tp-gallery-missing{width:100%;min-height:420px;border:1px solid #e4e8eb;background:#fafcfd;display:grid;place-items:center;text-align:center;color:#6f7b84;font-size:15px;padding:28px}

    /* Logo laminate is deliberately clipped to the exact logo image bounds. */
    .tp-logo-shine-host{
      position:relative!important;
      display:inline-block!important;
      overflow:hidden!important;
      isolation:isolate;
      line-height:0!important;
      background:transparent!important;
      box-shadow:none!important;
      border:0!important;
    }
    .tp-logo-shine-host>img{
      display:block!important;
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
        transparent 0%,
        rgba(248,255,102,.10) 34%,
        rgba(248,255,102,.45) 43%,
        #F8FF66 49%,
        rgba(248,255,102,.55) 54%,
        rgba(248,255,102,.12) 64%,
        transparent 100%);
      background-size:5.5% 100%;
      background-repeat:no-repeat;
      background-position:-7% 0;
      -webkit-mask-image:url('assets/logo.png');
      mask-image:url('assets/logo.png');
      -webkit-mask-repeat:no-repeat;
      mask-repeat:no-repeat;
      -webkit-mask-position:center;
      mask-position:center;
      -webkit-mask-size:100% 100%;
      mask-size:100% 100%;
      opacity:0;
      animation:tpLogoLaminate 3.8s linear infinite;
    }
    @keyframes tpLogoLaminate{
      0%,20%{background-position:-7% 0;opacity:0}
      23%{opacity:.9}
      58%{background-position:107% 0;opacity:.9}
      61%,100%{background-position:107% 0;opacity:0}
    }

    /* Footer logo stays visible and has no tile/background. */
    footer .footer-logo{background:transparent!important;box-shadow:none!important;border:0!important}
    footer .tp-footer-logo-wrap{display:inline-block!important;background:transparent!important;box-shadow:none!important;border:0!important}
    footer .tp-footer-logo-wrap>img{
      display:block!important;
      visibility:visible!important;
      opacity:1!important;
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

  function wrapFooterLogo(img){
    const parent=img.parentElement;if(!parent)return;
    if(parent.classList.contains('tp-footer-logo-wrap')){parent.classList.add('tp-logo-shine-host');return}
    /* Remove the shine host from the large footer column if an older version added it there. */
    parent.classList.remove('tp-logo-shine-host');
    const wrap=document.createElement('span');
    wrap.className='tp-footer-logo-wrap tp-logo-shine-host';
    parent.insertBefore(wrap,img);
    wrap.appendChild(img);
  }

  function applyLogoShine(root=document){
    root.querySelectorAll?.('header img[src*="logo"],header img[alt="The Plug"]').forEach(img=>{
      const host=img.parentElement;if(!host)return;
      host.classList.add('tp-logo-shine-host');
    });
    root.querySelectorAll?.('footer img[src*="logo"],footer img[alt="The Plug"]').forEach(wrapFooterLogo);
  }

  function run(){cleanProductCards();cleanProductGallery();applyLogoShine()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  const obs=new MutationObserver(()=>requestAnimationFrame(run));
  obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
})();
