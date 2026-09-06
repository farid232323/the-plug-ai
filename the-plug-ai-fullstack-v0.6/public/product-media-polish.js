(()=>{
  const PLACEHOLDER_RE=/product-runningboard(?:-side)?\.png/i;
  const YELLOW='#F8FF66';

  const style=document.createElement('style');
  style.textContent=`
    img[src*="product-runningboard.png"],img[src*="product-runningboard-side.png"]{visibility:hidden!important}
    .tp-product-image-missing{min-height:280px;border:1px solid #e4e8eb;background:#fafcfd;display:grid;place-items:center;text-align:center;color:#6f7b84;font-size:14px;padding:24px}
    .product-card .tp-product-image-missing{min-height:210px;height:100%;border:0;background:#f7f9fa}
    #product .tp-gallery-missing{width:100%;min-height:420px;border:1px solid #e4e8eb;background:#fafcfd;display:grid;place-items:center;text-align:center;color:#6f7b84;font-size:15px;padding:28px}
    .tp-logo-shine-host{position:relative!important;overflow:hidden!important;isolation:isolate}
    .tp-logo-shine-host::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:3;background:linear-gradient(105deg,transparent 0%,transparent 38%,rgba(248,255,102,.22) 44%,${YELLOW} 50%,rgba(248,255,102,.32) 56%,transparent 62%,transparent 100%);background-size:260% 100%;background-position:180% 0;-webkit-mask-image:url('assets/logo.png');mask-image:url('assets/logo.png');-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain;animation:tpLogoLaminate 4.2s ease-in-out infinite}
    @keyframes tpLogoLaminate{0%,20%{background-position:180% 0;opacity:0}28%{opacity:1}55%{background-position:-80% 0;opacity:1}63%,100%{background-position:-80% 0;opacity:0}}
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
      const host=img.parentElement;if(!host||host.classList.contains('tp-logo-shine-host'))return;
      host.classList.add('tp-logo-shine-host');
    });
  }

  function run(){cleanProductCards();cleanProductGallery();applyLogoShine()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  const obs=new MutationObserver(()=>requestAnimationFrame(run));
  obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
})();
