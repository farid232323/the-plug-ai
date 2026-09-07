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
  function loadApprovedFrontendPolish(){
    if(document.querySelector('script[data-approved-shop-car-footer]'))return;
    const s=document.createElement('script');
    s.src='/approved-shop-car-footer.js?v=1';
    s.dataset.approvedShopCarFooter='1';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{cleanShippingPolicy();loadApprovedFrontendPolish()},{once:true});else{cleanShippingPolicy();loadApprovedFrontendPolish()}
  const obs=new MutationObserver(cleanShippingPolicy);
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
