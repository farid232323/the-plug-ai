(()=>{
  document.title='the plug v2 ai build';
  const FREE_HEADING=/^Free standard shipping$/i;
  function cleanShippingPolicy(){
    const root=document.querySelector('#policyCopy');
    if(!root)return;
    [...root.querySelectorAll('h3')].forEach(h=>{
      if(!FREE_HEADING.test((h.textContent||'').trim()))return;
      const next=h.nextElementSibling;
      if(next&&/Free standard shipping applies to qualifying Saudi Arabia orders/i.test(next.textContent||''))next.remove();
      h.remove();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanShippingPolicy,{once:true});else cleanShippingPolicy();
  const obs=new MutationObserver(cleanShippingPolicy);
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
