(()=>{
  const RIYAL='⃁';
  const pricePattern=/\b(?:SR|SAR)(?=\s*[0-9])/g;
  let siteSettings={};

  function replaceCurrency(root=document){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p||['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION'].includes(p.tagName))return NodeFilter.FILTER_REJECT;
      return pricePattern.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{n.nodeValue=(n.nodeValue||'').replace(pricePattern,RIYAL)});
  }

  function applyContent(){
    const s=siteSettings||{};
    const shipping=document.querySelector('.shipping');
    if(shipping){
      const enabled=String(s.promo_bar_enabled??'true')!=='false';
      shipping.style.display=enabled?'':'none';
      if(enabled){
        let text=(s.promo_bar_text||'Free standard shipping to Saudi Arabia over {threshold}').trim();
        const threshold=(s.shipping_threshold||'1400').toString();
        text=text.replace(/\{threshold\}/g,`${RIYAL} ${threshold}`);
        shipping.textContent=text;
      }
    }

    const heroTitle=document.querySelector('#home .tp-hero h1')||document.querySelector('#home .hero h1');
    const heroSub=document.querySelector('#home .tp-hero p')||document.querySelector('#home .hero-copy p');
    if(heroTitle&&s.hero_headline)heroTitle.textContent=s.hero_headline;
    if(heroSub&&s.hero_subheading)heroSub.textContent=s.hero_subheading;

    if(s.seo_title)document.title=s.seo_title;
    if(s.seo_description){
      let m=document.querySelector('meta[name="description"]');
      if(!m){m=document.createElement('meta');m.name='description';document.head.appendChild(m)}
      m.content=s.seo_description;
    }
    replaceCurrency(document.body);
  }

  async function load(){
    try{const r=await fetch('/api/site-settings',{cache:'no-store'});if(r.ok)siteSettings=await r.json()}catch{}
    applyContent();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
  const obs=new MutationObserver(()=>requestAnimationFrame(applyContent));
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
