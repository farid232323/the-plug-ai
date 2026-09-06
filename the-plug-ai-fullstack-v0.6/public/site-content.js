(()=>{
  const RIYAL_SVG='https://www.sama.gov.sa/ar-sa/Currency/Documents/Saudi_Riyal_Symbol-2.svg';
  const pricePattern=/\b(?:SR|SAR)(?=\s*[0-9])/g;
  let siteSettings={};

  function installStyle(){
    if(document.getElementById('plug-riyal-style'))return;
    const s=document.createElement('style');s.id='plug-riyal-style';s.textContent=`.plug-riyal-symbol{display:inline-block;width:.82em;height:.82em;object-fit:contain;vertical-align:-.08em;margin-right:.18em;filter:none}.shipping .plug-riyal-symbol{height:.9em;width:.9em}`;document.head.appendChild(s);
  }

  function symbol(){const i=document.createElement('img');i.className='plug-riyal-symbol';i.src=RIYAL_SVG;i.alt='Saudi Riyal';i.setAttribute('aria-label','Saudi Riyal');return i}

  function replaceCurrency(root=document){
    installStyle();
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p||['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION'].includes(p.tagName))return NodeFilter.FILTER_REJECT;
      pricePattern.lastIndex=0;
      return pricePattern.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const text=node.nodeValue||'';pricePattern.lastIndex=0;
      if(!pricePattern.test(text))return;pricePattern.lastIndex=0;
      const frag=document.createDocumentFragment();let last=0,m;
      while((m=pricePattern.exec(text))){
        if(m.index>last)frag.append(document.createTextNode(text.slice(last,m.index)));
        frag.append(symbol());last=m.index+m[0].length;
      }
      if(last<text.length)frag.append(document.createTextNode(text.slice(last)));
      node.replaceWith(frag);
    });
  }

  function setShippingText(el,text,threshold){
    el.textContent='';
    const token='{threshold}',idx=text.indexOf(token);
    if(idx<0){el.textContent=text;replaceCurrency(el);return}
    el.append(document.createTextNode(text.slice(0,idx)),symbol(),document.createTextNode(' '+threshold+text.slice(idx+token.length)));
  }

  function applyContent(){
    const s=siteSettings||{};
    const shipping=document.querySelector('.shipping');
    if(shipping){
      const enabled=String(s.promo_bar_enabled??'true')!=='false';
      shipping.style.display=enabled?'':'none';
      if(enabled){
        const text=(s.promo_bar_text||'Free standard shipping to Saudi Arabia over {threshold}').trim();
        const threshold=(s.shipping_threshold||'1400').toString();
        if(shipping.dataset.plugPromo!==text+'|'+threshold){setShippingText(shipping,text,threshold);shipping.dataset.plugPromo=text+'|'+threshold}
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
  let queued=false;const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyContent()})});
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
