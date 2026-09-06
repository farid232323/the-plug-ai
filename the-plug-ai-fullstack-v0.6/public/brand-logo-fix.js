(()=>{
  const replacements={
    'AUTOID':'assets/brands/autoid.svg',
    'P3':'assets/brands/p3.svg'
  };
  function fix(root=document){
    root.querySelectorAll?.('.tp-brand-item').forEach(item=>{
      const name=(item.textContent||'').trim().toUpperCase();
      const img=item.querySelector('img');
      const key=name.startsWith('AUTOID')?'AUTOID':name.startsWith('P3')?'P3':null;
      if(key&&img){
        img.src=replacements[key];
        img.alt=key;
        img.onerror=null;
      }
    });
    root.querySelectorAll?.('img[src*="logo.clearbit.com/autoid.co"]').forEach(img=>{img.src=replacements.AUTOID;img.alt='AUTOID';img.onerror=null});
    root.querySelectorAll?.('img[src*="logo.clearbit.com/p3.io"]').forEach(img=>{img.src=replacements.P3;img.alt='P3';img.onerror=null});
  }
  function run(){fix()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  const obs=new MutationObserver(()=>requestAnimationFrame(run));
  obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
})();
