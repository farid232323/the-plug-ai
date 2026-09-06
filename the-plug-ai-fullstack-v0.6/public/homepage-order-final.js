(()=>{
  function placeSections(){
    const home=document.getElementById('home');
    if(!home)return;
    const hero=home.querySelector('.hero');
    const why=home.querySelector('.why');
    const categories=home.querySelector('.category-section');
    const story=home.querySelector('.story-grid')?.closest('section');
    if(!hero||!why||!categories)return;

    if(hero.nextElementSibling!==why) hero.after(why);
    if(why.nextElementSibling!==categories) why.after(categories);
    if(story && categories.nextElementSibling!==story) categories.after(story);
  }

  const run=()=>{
    placeSections();
    setTimeout(placeSections,100);
    setTimeout(placeSections,500);
    setTimeout(placeSections,1200);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',placeSections,{once:true});
})();
