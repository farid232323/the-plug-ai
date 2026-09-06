(()=>{
  function clean(){
    document.querySelectorAll('.tp-category-count').forEach(el=>el.remove());
    const shop=document.getElementById('shop');
    if(shop){
      shop.querySelectorAll('.filter-group .check').forEach(label=>{
        label.childNodes.forEach(n=>{if(n.nodeType===3)n.textContent=n.textContent.replace(/\s*\(\d[\d,]*\)\s*$/,'')});
      });
    }
  }
  const obs=new MutationObserver(clean);
  function init(){clean();obs.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
