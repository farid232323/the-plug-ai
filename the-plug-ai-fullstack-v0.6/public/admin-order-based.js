(()=>{
  const removeInventoryUI=()=>{
    document.querySelectorAll('[data-view="inventory"],[data-view-jump="inventory"],#inventory').forEach(el=>el.remove());

    const stats=document.querySelector('#stats');
    if(stats){
      [...stats.children].forEach(card=>{
        const text=(card.querySelector('span')?.textContent||'').trim().toLowerCase();
        if(text==='inventory units'||text==='low stock')card.remove();
      });
    }

    const productHead=document.querySelector('#products thead tr');
    if(productHead){
      const headers=[...productHead.children];
      const stockIndex=headers.findIndex(th=>(th.textContent||'').trim().toLowerCase()==='stock');
      if(stockIndex>=0){
        headers[stockIndex].remove();
        document.querySelectorAll('#productRows tr').forEach(row=>row.children[stockIndex]?.remove());
      }else{
        document.querySelectorAll('#productRows tr').forEach(row=>{
          if(row.children.length===10)row.children[6]?.remove();
        });
      }
    }

    const modal=document.querySelector('#modalBody');
    if(modal){
      modal.querySelectorAll('[data-ptab]').forEach(btn=>{
        if((btn.textContent||'').trim()==='Pricing & Stock')btn.textContent='Pricing';
      });
      modal.querySelectorAll('label').forEach(label=>{
        const t=(label.textContent||'').trim().toLowerCase();
        if(t.startsWith('stock')||t.startsWith('low stock threshold'))label.remove();
      });
    }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeInventoryUI);else removeInventoryUI();
  new MutationObserver(removeInventoryUI).observe(document.documentElement,{childList:true,subtree:true});
})();
