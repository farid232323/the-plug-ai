(()=>{
  const DESKTOP=851;
  const navLinks=()=>[...document.querySelectorAll('.staging-nav a')];
  const byText=t=>navLinks().find(a=>a.textContent.trim().toLowerCase().startsWith(t));
  let timers={car:null,brand:null,category:null};
  const cancel=k=>{if(timers[k]){clearTimeout(timers[k]);timers[k]=null}};
  const later=(k,fn)=>{cancel(k);timers[k]=setTimeout(fn,110)};

  function closeCar(){
    document.querySelector('.tp2-menu')?.classList.remove('open');
    document.querySelector('.tp2-backdrop')?.classList.remove('open');
    document.querySelector('.tp-car-mega')?.classList.remove('open');
    document.querySelector('.tp-car-backdrop')?.classList.remove('open');
    document.body.style.overflow='';
  }
  function closeBrand(){document.querySelector('.tp-brand-menu')?.classList.remove('open')}
  function closeCategory(){document.querySelector('.tp-category-menu')?.classList.remove('open')}
  function closeOthers(keep){if(keep!=='car')closeCar();if(keep!=='brand')closeBrand();if(keep!=='category')closeCategory()}

  function trigger(link,type){
    if(innerWidth<DESKTOP||!link)return;
    closeOthers(type);
    link.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  }

  function wireOne(link,type,menuSelector,closeFn){
    if(!link||link.dataset.tpHoverWired)return;
    link.dataset.tpHoverWired='1';
    link.addEventListener('mouseenter',()=>{cancel(type);trigger(link,type)});
    link.addEventListener('mouseleave',e=>{
      const menu=document.querySelector(menuSelector);
      if(menu&&e.relatedTarget&&menu.contains(e.relatedTarget))return;
      later(type,closeFn);
    });
    const attachMenu=()=>{
      const menu=document.querySelector(menuSelector);if(!menu||menu.dataset.tpHoverWired)return false;
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

  function init(){
    wireOne(byText('shop by car'),'car','.tp2-menu',closeCar);
    wireOne(byText('shop by brand'),'brand','.tp-brand-menu',closeBrand);
    wireOne(byText('categories'),'category','.tp-category-menu',closeCategory);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
