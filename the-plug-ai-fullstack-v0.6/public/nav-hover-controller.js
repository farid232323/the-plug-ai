(()=>{
  const DESKTOP=851;
  const navLinks=()=>[...document.querySelectorAll('.staging-nav a')];
  const byText=t=>navLinks().find(a=>a.textContent.trim().toLowerCase().startsWith(t));
  let timers={car:null,brand:null,category:null};
  const cancel=k=>{if(timers[k]){clearTimeout(timers[k]);timers[k]=null}};
  const later=(k,fn)=>{cancel(k);timers[k]=setTimeout(fn,90)};

  function closeCar(){
    document.querySelector('.tp3-panel')?.classList.remove('open');
    document.querySelector('.tp3-backdrop')?.classList.remove('open');
    document.querySelector('.tp2-menu')?.classList.remove('open');
    document.querySelector('.tp2-backdrop')?.classList.remove('open');
    document.querySelector('.tp-car-mega')?.classList.remove('open');
    document.querySelector('.tp-car-backdrop')?.classList.remove('open');
    document.body.style.overflow='';
  }
  function closeBrand(){
    document.querySelector('.tp-modern-brand-panel')?.classList.remove('open');
    document.querySelector('.tp-modern-brand-backdrop')?.classList.remove('open');
    document.querySelector('.tp-brand-menu')?.classList.remove('open');
  }
  function closeCategory(){document.querySelector('.tp-category-menu')?.classList.remove('open')}
  function closeAll(){closeCar();closeBrand();closeCategory()}
  function closeOthers(keep){if(keep!=='car')closeCar();if(keep!=='brand')closeBrand();if(keep!=='category')closeCategory()}

  function trigger(link,type){
    if(innerWidth<DESKTOP||!link)return;
    closeOthers(type);
    link.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  }

  function wireOne(link,type,selectors,closeFn){
    if(!link||link.dataset.tpHoverWired)return;
    link.dataset.tpHoverWired='1';
    const findMenu=()=>selectors.map(s=>document.querySelector(s)).find(Boolean)||null;
    link.addEventListener('mouseenter',()=>{cancel(type);trigger(link,type)});
    link.addEventListener('mouseleave',e=>{
      const menu=findMenu();
      if(menu&&e.relatedTarget&&menu.contains(e.relatedTarget))return;
      later(type,closeFn);
    });
    const attachMenu=()=>{
      const menu=findMenu();if(!menu||menu.dataset.tpHoverWired)return !!menu;
      menu.dataset.tpHoverWired='1';
      menu.addEventListener('mouseenter',()=>cancel(type));
      menu.addEventListener('mouseleave',e=>{
        if(e.relatedTarget===link||link.contains(e.relatedTarget))return;
        later(type,closeFn);
      });
      return true;
    };
    if(!attachMenu()){
      const obs=new MutationObserver(()=>{if(attachMenu())obs.disconnect()});
      obs.observe(document.body,{childList:true,subtree:true});
    }
  }

  function dedupeVehicleBrands(){
    const buttons=[...document.querySelectorAll('.tp3-brand [data-b]')];
    if(buttons.length<2)return;
    const groups=new Map();
    for(const b of buttons){
      const key=String(b.dataset.b||b.textContent||'').trim().toLowerCase();
      if(!key)continue;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(b);
    }
    for(const [key,group] of groups){
      if(group.length<2)continue;
      const canonical=key==='audi'?'Audi':key.replace(/\b\w/g,c=>c.toUpperCase());
      const keep=group.find(b=>String(b.dataset.b||'').trim()===canonical)
        || group.find(b=>String(b.dataset.b||'').trim()!==String(b.dataset.b||'').trim().toUpperCase())
        || group[0];
      const hiddenActive=group.some(b=>b!==keep&&b.classList.contains('active'));
      group.forEach(b=>{if(b!==keep)b.style.display='none'});
      if(hiddenActive&&!keep.classList.contains('active'))setTimeout(()=>keep.click(),0);
    }
  }

  function init(){
    wireOne(byText('shop by car'),'car',['.tp3-panel','.tp2-menu','.tp-car-mega'],closeCar);
    wireOne(byText('shop by brand'),'brand',['.tp-modern-brand-panel','.tp-brand-menu'],closeBrand);
    wireOne(byText('categories'),'category',['.tp-category-menu'],closeCategory);

    document.addEventListener('mousemove',e=>{
      if(innerWidth<DESKTOP)return;
      const links=navLinks();
      const inNav=links.some(a=>a.contains(e.target));
      const inMenu=!!e.target.closest('.tp3-panel,.tp2-menu,.tp-car-mega,.tp-modern-brand-panel,.tp-brand-menu,.tp-category-menu');
      if(!inNav&&!inMenu){
        later('car',closeCar);later('brand',closeBrand);later('category',closeCategory);
      }
    },{passive:true});

    document.addEventListener('mouseleave',()=>{if(innerWidth>=DESKTOP)closeAll()});
    window.addEventListener('blur',()=>{if(innerWidth>=DESKTOP)closeAll()});
    dedupeVehicleBrands();
    new MutationObserver(dedupeVehicleBrands).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();