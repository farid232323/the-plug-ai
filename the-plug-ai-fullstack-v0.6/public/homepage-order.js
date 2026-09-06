(()=>{
  let queued=false;
  function findCategorySection(home){
    return home.querySelector('.tp-categories')?.closest('section') || home.querySelector('.category-section');
  }
  function findWhySection(home){
    return home.querySelector('.tp-why') || home.querySelector('.why');
  }
  function findHero(home){
    return home.querySelector('.tp-hero') || home.querySelector('.hero');
  }
  function reorderHome(){
    const home=document.getElementById('home');
    if(!home)return;
    const hero=findHero(home);
    const why=findWhySection(home);
    const categories=findCategorySection(home);
    if(!hero||!why||!categories)return;
    if(hero.nextElementSibling!==why) hero.insertAdjacentElement('afterend',why);
    if(why.nextElementSibling!==categories) why.insertAdjacentElement('afterend',categories);
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;reorderHome()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.addEventListener('load',schedule,{once:true});
  const obs=new MutationObserver(schedule);
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
