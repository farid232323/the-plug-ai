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
  function normalizeRiyalSymbol(){
    if(document.getElementById('tp-riyal-size-fix'))return;
    const s=document.createElement('style');
    s.id='tp-riyal-size-fix';
    s.textContent=`
      img[src*="Saudi_Riyal_Symbol"],
      img[alt="Saudi Riyal"],
      .riyalsymbol,.riyalsymbol img,.riyal-symbol,.riyal-symbol img,
      .price img,.bigprice img,.drawer-item .price img,.cart-item .price img,
      .summary img,.checkout-summary img{
        display:inline-block!important;
        width:.78em!important;
        height:.78em!important;
        min-width:0!important;
        min-height:0!important;
        max-width:.78em!important;
        max-height:.78em!important;
        object-fit:contain!important;
        vertical-align:-.08em!important;
        margin:0 .18em 0 0!important;
        flex:0 0 auto!important;
      }
      .drawer-item .price,.cart-item .price,.price,.bigprice,.summary-row,.checkout-summary{
        line-height:1.2;
      }
    `;
    document.head.appendChild(s);
  }
  function loadApprovedFrontendPolish(){
    if(document.querySelector('script[data-approved-shop-car-footer]'))return;
    const s=document.createElement('script');
    s.src='/approved-shop-car-footer.js?v=1';
    s.dataset.approvedShopCarFooter='1';
    document.head.appendChild(s);
  }
  function loadCheckoutShippingState(){
    if(document.querySelector('script[data-checkout-shipping-state]'))return;
    const s=document.createElement('script');
    s.src='/checkout-shipping-state.js?v=1';
    s.dataset.checkoutShippingState='1';
    document.head.appendChild(s);
  }
  const init=()=>{cleanShippingPolicy();normalizeRiyalSymbol();loadApprovedFrontendPolish();loadCheckoutShippingState()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  const obs=new MutationObserver(()=>{cleanShippingPolicy();normalizeRiyalSymbol()});
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
