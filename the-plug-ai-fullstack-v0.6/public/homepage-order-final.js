(()=>{
  function findCategorySection(home){
    const direct=home.querySelector('.category-section');
    const headings=[...home.querySelectorAll('h1,h2,h3,h4')];
    const heading=headings.find(h=>/shop\s+by\s+category/i.test((h.textContent||'').trim()))||headings.find(h=>/shop\s+the\s+best\s+from\s+top\s+brands/i.test((h.textContent||'').trim()));
    const fromHeading=heading?.closest('section');
    return fromHeading||direct||null;
  }

  function placeSections(){
    const home=document.getElementById('home');
    if(!home)return;
    const hero=home.querySelector('.tp-hero')||home.querySelector('.hero');
    const why=home.querySelector('.why');
    const categories=findCategorySection(home);
    if(!hero||!why)return;

    why.style.display='';
    if(hero.nextElementSibling!==why)hero.after(why);
    if(categories&&why.nextElementSibling!==categories)why.after(categories);
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
      setTimeout(()=>obs.disconnect(),10000);
    }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('load',placeSections,{once:true});
})();
