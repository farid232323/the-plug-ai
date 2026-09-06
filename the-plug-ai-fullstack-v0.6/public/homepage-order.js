(()=>{
  function reorderHome(){
    const home=document.getElementById('home');
    if(!home)return;
    const hero=home.querySelector('.hero');
    const why=home.querySelector('.why');
    const categories=home.querySelector('.category-section');
    const story=home.querySelector('.story-grid')?.closest('section');
    if(!hero||!why||!categories)return;
    hero.insertAdjacentElement('afterend',why);
    why.insertAdjacentElement('afterend',categories);
    if(story)categories.insertAdjacentElement('afterend',story);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reorderHome);else reorderHome();
  const obs=new MutationObserver(()=>requestAnimationFrame(reorderHome));
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
