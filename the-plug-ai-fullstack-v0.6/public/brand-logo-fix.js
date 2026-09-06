(()=>{
  const replacements={
    'AUTOID':'assets/brands/autoid.svg',
    'P3':'assets/brands/p3.svg',
    'VALVETRONIC':'assets/valvetronic-badge.png'
  };

  function normalizeKey(name){
    const n=String(name||'').trim().toUpperCase();
    if(n.startsWith('AUTOID'))return 'AUTOID';
    if(n.startsWith('P3'))return 'P3';
    if(n.startsWith('VALVETRONIC'))return 'VALVETRONIC';
    return null;
  }

  function fixDropdown(root=document){
    root.querySelectorAll?.('.tp-brand-item').forEach(item=>{
      const key=normalizeKey(item.textContent);
      const img=item.querySelector('img');
      if(key&&img&&replacements[key]){
        img.src=replacements[key];
        img.alt=key;
        img.onerror=null;
      }
    });
    root.querySelectorAll?.('img[src*="logo.clearbit.com/autoid.co"]').forEach(img=>{img.src=replacements.AUTOID;img.alt='AUTOID';img.onerror=null});
    root.querySelectorAll?.('img[src*="logo.clearbit.com/p3.io"]').forEach(img=>{img.src=replacements.P3;img.alt='P3';img.onerror=null});
  }

  function fixHomepage(root=document){
    root.querySelectorAll?.('#home .tp-brands .tp-brand[data-brand]').forEach(item=>{
      const key=normalizeKey(item.dataset.brand||item.textContent);
      if(!key||!replacements[key])return;
      if(item.querySelector('img[data-tp-brand-logo]'))return;
      item.textContent='';
      const img=document.createElement('img');
      img.dataset.tpBrandLogo='1';
      img.src=replacements[key];
      img.alt=key+' logo';
      img.style.cssText='display:block;max-width:150px;width:auto;max-height:58px;height:auto;object-fit:contain;margin:auto;';
      item.appendChild(img);
      item.setAttribute('aria-label',key);
    });
  }

  function run(){
    fixDropdown();
    fixHomepage();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  const obs=new MutationObserver(()=>requestAnimationFrame(run));
  obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
})();
