(()=>{
  const PLACEHOLDER_RE=/product-runningboard(?:-side)?\.png/i;
  const fmt=n=>new Intl.NumberFormat('en-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const style=document.createElement('style');
  style.textContent=`
    img[src*="product-runningboard.png"],img[src*="product-runningboard-side.png"]{visibility:hidden!important}
    .tp-product-image-missing{min-height:280px;border:1px solid #e4e8eb;background:#fafcfd;display:grid;place-items:center;text-align:center;color:#6f7b84;font-size:14px;padding:24px}
    .product-card .tp-product-image-missing{min-height:210px;height:100%;border:0;background:#f7f9fa}
    #product .tp-gallery-missing{width:100%;min-height:420px;border:1px solid #e4e8eb;background:#fafcfd;display:grid;place-items:center;text-align:center;color:#6f7b84;font-size:15px;padding:28px}
    .tp-logo-shine-host{position:relative!important;overflow:hidden!important;isolation:isolate}
    .tp-logo-shine-host::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:3;background:linear-gradient(105deg,transparent 0%,transparent 38%,rgba(248,255,102,.20) 44%,#F8FF66 50%,rgba(248,255,102,.34) 56%,transparent 62%,transparent 100%);background-size:260% 100%;background-position:180% 0;-webkit-mask-image:url('assets/logo.png');mask-image:url('assets/logo.png');-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain;animation:tpLogoLaminate 4.2s ease-in-out infinite}
    @keyframes tpLogoLaminate{0%,20%{background-position:180% 0;opacity:0}28%{opacity:1}55%{background-position:-80% 0;opacity:1}63%,100%{background-position:-80% 0;opacity:0}}
    @media (prefers-reduced-motion:reduce){.tp-logo-shine-host::after{animation:none;opacity:0}}
  `;
  document.head.appendChild(style);

  function isPlaceholder(img){const src=(img?.getAttribute('src')||'').trim();return !src||PLACEHOLDER_RE.test(src)}
  function cleanSizeSelector(){const root=document.querySelector('#product .product-info');if(!root)return;const sizeLabel=[...root.querySelectorAll('.variant-label')].find(el=>/^\s*size\s*:/i.test(el.textContent||''));const sizes=root.querySelector('.sizes');if(root.dataset.hasRealSizeVariants!=='1'){if(sizeLabel)sizeLabel.style.display='none';if(sizes)sizes.style.display='none'}}
  function cleanProductCards(){document.querySelectorAll('.product-card .product-image').forEach(box=>{const img=box.querySelector('img');if(!img||isPlaceholder(img)){if(img)img.style.display='none';if(!box.querySelector('.tp-product-image-missing')){const note=document.createElement('div');note.className='tp-product-image-missing';note.textContent='Product image not available';box.appendChild(note)}}else{img.style.display='';img.style.visibility='visible';box.querySelector('.tp-product-image-missing')?.remove()}})}
  function cleanProductGallery(){const detail=document.querySelector('#product .product-detail');if(!detail)return;const galleryCol=detail.firstElementChild;if(!galleryCol)return;const main=galleryCol.querySelector('.gallery-main');const img=main?.querySelector('img');const thumbs=galleryCol.querySelector('.thumbs,.tp-gallery-thumbs');if(!img||isPlaceholder(img)){if(main)main.style.display='none';if(thumbs)thumbs.style.display='none';if(!galleryCol.querySelector('.tp-gallery-missing')){const note=document.createElement('div');note.className='tp-gallery-missing';note.textContent='Product image not available';galleryCol.prepend(note)}}else{if(main){main.style.display='';img.style.visibility='visible'}if(thumbs)thumbs.style.display='';galleryCol.querySelector('.tp-gallery-missing')?.remove();thumbs?.querySelectorAll('img').forEach(t=>{if(isPlaceholder(t))t.closest('button,.thumb')?.remove();else t.style.visibility='visible'})}}
  function applyLogoShine(){document.querySelectorAll('header img[src*="logo"],footer img[src*="logo"],img[alt="The Plug"]').forEach(img=>{const host=img.parentElement;if(host&&!host.classList.contains('tp-logo-shine-host'))host.classList.add('tp-logo-shine-host')})}
  function cleanProductPage(){cleanSizeSelector();cleanProductCards();cleanProductGallery();applyLogoShine()}

  async function renderCatalogProduct(id){
    if(!id)return;
    try{
      const r=await fetch('/api/products/'+encodeURIComponent(id),{cache:'no-store'});if(!r.ok)throw new Error('Product not found');
      const p=await r.json();if(!p||p.error)throw new Error(p?.error||'Product not found');
      sessionStorage.setItem('plug-current-product-id',String(p.id));window.__plugProduct=p;
      const product=document.querySelector('#product'),info=product?.querySelector('.product-info');if(!product||!info)return;
      info.querySelector('.brandmark')&&(info.querySelector('.brandmark').textContent=p.brand_name||'');
      info.querySelector('h1')&&(info.querySelector('h1').textContent=p.title||'');
      info.querySelector('.bigprice')&&(info.querySelector('.bigprice').textContent=fmt(p.price_sar));
      const idline=info.querySelector('[style*="float:right"]');if(idline)idline.textContent='The Plug ID: '+(p.the_plug_id||'—');
      const desc=info.querySelector('p');if(desc)desc.textContent=p.short_description||p.description||'';
      const brandline=info.querySelector('.brandline');if(brandline)brandline.textContent='MFG: '+(p.mfg_part_id||'—');
      const rating=info.querySelector('.rating');if(rating)rating.style.display='none';
      info.querySelectorAll('.variant-label,.sizes,.swatches').forEach(el=>el.style.display='none');

      const detail=product.querySelector('.product-detail'),galleryCol=detail?.firstElementChild,main=galleryCol?.querySelector('.gallery-main'),mainImg=main?.querySelector('img');
      const images=(p.images||[]).filter(x=>x&&x.url);
      galleryCol?.querySelector('.tp-gallery-missing')?.remove();
      if(main&&mainImg&&images.length){main.style.display='';mainImg.src=images[0].url;mainImg.alt=p.title||'Product image';mainImg.style.display='';mainImg.style.visibility='visible';let thumbs=galleryCol.querySelector('.thumbs,.tp-gallery-thumbs');if(thumbs){thumbs.className='tp-gallery-thumbs';thumbs.style.display='';thumbs.innerHTML=images.map((x,i)=>`<button class="tp-gallery-thumb ${i===0?'active':''}" data-src="${esc(x.url)}"><img src="${esc(x.url)}" alt="${esc(x.alt_text||p.title||'Product image')}"></button>`).join('');thumbs.querySelectorAll('[data-src]').forEach(b=>b.onclick=()=>{mainImg.src=b.dataset.src;thumbs.querySelectorAll('.tp-gallery-thumb').forEach(x=>x.classList.toggle('active',x===b))})}}
      else if(galleryCol){if(main)main.style.display='none';const old=galleryCol.querySelector('.thumbs,.tp-gallery-thumbs');if(old)old.style.display='none';if(!galleryCol.querySelector('.tp-gallery-missing')){const note=document.createElement('div');note.className='tp-gallery-missing';note.textContent='Product image not available';galleryCol.prepend(note)}}

      const fits=(p.fitments||[]);const holder=product.querySelector('.accordions');if(holder){holder.innerHTML=`<div class="accordion"><h3>Product Details</h3><p>${esc(p.description||p.short_description||'No product description has been provided for this item yet.')}</p></div><div class="accordion"><h3>Specifications</h3><p><strong>Brand:</strong> ${esc(p.brand_name||'—')}<br><strong>Manufacturer Part ID:</strong> ${esc(p.mfg_part_id||'—')}<br><strong>The Plug Part ID:</strong> ${esc(p.the_plug_id||'—')}</p></div><div class="accordion"><h3>Compatible Vehicles</h3><p>${fits.length?esc(fits.slice(0,20).map(f=>[f.car_brand,f.model,f.year_raw||f.year_from,f.chassis,f.engine].filter(Boolean).join(' · ')).join('\n')):'No compatible vehicle records are currently attached to this product.'}</p></div>`}
      document.title=(p.title?`${p.title} — The Plug`:'The Plug');
      cleanProductPage();
    }catch(e){console.error('Unable to load selected catalog product',e)}
  }

  function selectedIdFromEvent(e){const card=e.target.closest('[data-api-product]');return card?.dataset.apiProduct||''}
  document.addEventListener('click',e=>{const id=selectedIdFromEvent(e);if(!id)return;if(!e.target.closest('.api-open-product,.product-image,h3,a,button'))return;sessionStorage.setItem('plug-current-product-id',id);setTimeout(()=>renderCatalogProduct(id),0)},true);
  addEventListener('hashchange',()=>{if(location.hash==='#product'){const id=sessionStorage.getItem('plug-current-product-id');if(id)renderCatalogProduct(id)}});

  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;cleanProductPage()})});
  function init(){cleanProductPage();observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});if(location.hash==='#product'){const id=sessionStorage.getItem('plug-current-product-id');if(id)renderCatalogProduct(id)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
