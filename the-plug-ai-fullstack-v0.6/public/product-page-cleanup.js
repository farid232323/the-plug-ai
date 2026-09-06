(()=>{
  function cleanProductPage(){
    const root=document.querySelector('#product .product-info');
    if(!root)return;
    const sizeLabel=[...root.querySelectorAll('.variant-label')].find(el=>/^\s*size\s*:/i.test(el.textContent||''));
    const sizes=root.querySelector('.sizes');
    const hasRealSizeData=root.dataset.hasRealSizeVariants==='1';
    if(!hasRealSizeData){
      if(sizeLabel)sizeLabel.style.display='none';
      if(sizes)sizes.style.display='none';
    }
  }
  const observer=new MutationObserver(cleanProductPage);
  function init(){
    cleanProductPage();
    const product=document.getElementById('product');
    if(product)observer.observe(product,{childList:true,subtree:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
