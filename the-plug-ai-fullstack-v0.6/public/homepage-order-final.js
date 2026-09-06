(()=>{
  function findCategorySection(home){
    return home.querySelector('.tp-categories')?.closest('section') || home.querySelector('.category-section');
  }
  function findWhySection(home){
    return home.querySelector('.tp-why') || home.querySelector('.why');
  }
  function placeSections(){
    const home=document.getElementById('home');
    if(!home)return;
    const hero=home.querySelector('.tp-hero')||home.querySelector('.hero');
    const why=findWhySection(home);
    const categories=findCategorySection(home);
    if(!hero||!why||!categories)return;
    why.style.display='';
    if(hero.nextElementSibling!==why)hero.after(why);
    if(why.nextElementSibling!==categories)why.after(categories);
  }
  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;placeSections()});
  };
  const run=()=>{
    placeSections();
    [50,150,400,900,1800,3000].forEach(ms=>setTimeout(placeSections,ms));
    const home=document.getElementById('home');
    if(home){
      const obs=new MutationObserver(schedule);
      obs.observe(home,{childList:true,subtree:true});
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',placeSections,{once:true});
})();
