(()=>{
  let cfg=null;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const cssEscape=s=>window.CSS?.escape?CSS.escape(s):s.replace(/[^a-z0-9_-]/gi,'\\$&');
  function setText(el,text){if(el&&text!==undefined&&text!==null&&String(text)!=='')el.textContent=String(text)}
  function byText(selector,re){return $$(selector).find(el=>re.test((el.textContent||'').trim()))}
  function apply(){if(!cfg)return;
    const c=cfg.colors||{}, f=cfg.fonts||{}, l=cfg.layout||{}, b=cfg.branding||{};
    const root=document.documentElement;
    if(c.lightBlue)root.style.setProperty('--blue',c.lightBlue),root.style.setProperty('--plug-light-blue',c.lightBlue);
    if(c.navy)root.style.setProperty('--navy',c.navy),root.style.setProperty('--plug-navy',c.navy);
    if(c.deepNavy)root.style.setProperty('--navy2',c.deepNavy),root.style.setProperty('--plug-deep-navy',c.deepNavy);
    if(c.yellow)root.style.setProperty('--yellow',c.yellow),root.style.setProperty('--plug-yellow',c.yellow);
    if(c.white)root.style.setProperty('--white',c.white);
    if(c.black)root.style.setProperty('--black',c.black);
    if(c.text)root.style.setProperty('--ink',c.text);
    if(c.footer)root.style.setProperty('--footer',c.footer);
    document.body.style.background=c.pageBg||'';document.body.style.color=c.text||'';
    if(f.body)document.body.style.fontFamily=`"${f.body}",Arial,Helvetica,sans-serif`;
    if(f.baseSize)document.body.style.fontSize=f.baseSize+'px';
    let style=$('#frontend-control-style');if(!style){style=document.createElement('style');style.id='frontend-control-style';document.head.appendChild(style)}
    style.textContent=`
      h1,h2,h3,h4,h5,h6,.headline,.section-title,.pagehead,.eyebrow,.navcats,.btn,button{font-family:"${String(f.heading||'Nofex').replace(/"/g,'')}",Arial,sans-serif}
      [dir="rtl"] h1,[dir="rtl"] h2,[dir="rtl"] h3,[dir="rtl"] h4,[lang="ar"] h1,[lang="ar"] h2,[lang="ar"] h3,[lang="ar"] h4{font-family:"${String(f.arabicHeading||'Titr Bold').replace(/"/g,'')}","Noto Sans Arabic",sans-serif}
      [dir="rtl"],[lang="ar"]{font-family:"${String(f.arabicBody||'Noto Sans').replace(/"/g,'')}",Arial,sans-serif}
      .navcats{font-size:${Number(f.navSize||14)}px}.btn,button{font-size:${Number(f.buttonSize||14)}px}
      .container{width:min(${Number(l.containerWidth||1460)}px,calc(100% - 54px))}
      .section,.category-section,.products-section{--fe-space:${Number(l.sectionSpacing||72)}px}
      .btn,.addcart,.vehicle-btn,.loadmore{border-radius:${Number(l.buttonRadius||0)}px!important}
      .product-img,.cat-card,.panel,.checkout-card,.summary{border-radius:${Number(l.cardRadius||6)}px}
      .product-img{height:${Number(l.productImageHeight||280)}px}
      .logo img{width:${Number(b.logoWidth||135)}px!important}
      @media(max-width:720px){.logo img{width:${Number(b.mobileLogoWidth||115)}px!important}}
    `;
    const headerLogo=$('.logo img');if(headerLogo&&b.headerLogo)headerLogo.src=b.headerLogo;
    $$('.footer-logo img,.newsletter-footer img[alt*="Plug" i],footer img[alt*="Plug" i]').forEach(x=>{if(b.footerLogo)x.src=b.footerLogo});
    if(b.favicon){let link=$('link[rel="icon"]');if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link)}link.href=b.favicon}
    const h=cfg.header||{};const shipping=$('.shipping');if(shipping){shipping.style.display=h.showAnnouncement===false?'none':'';if(h.announcementText)setText(shipping,h.announcementText)}
    const search=$('.searchbar input');if(search&&h.searchPlaceholder)search.placeholder=h.searchPlaceholder;
    $$('.selected-vehicle').forEach(x=>{if(h.vehicleLabel&&!x.dataset.vehicleChosen)setText(x,h.vehicleLabel)});
    const icons=$$('.navicons .iconbtn');if(icons[0])icons[0].style.display=h.showWishlist===false?'none':'';if(icons[1])icons[1].style.display=h.showLocations===false?'none':'';if(icons[2])icons[2].style.display=h.showCart===false?'none':'';if(icons[3])icons[3].style.display=h.showAccount===false?'none':'';
    applyNav();applyHome();applyAbout();applyFooter();applyButtons();
  }
  function applyNav(){const n=cfg.nav||{};const nav=$('.navcats .container,.staging-nav');if(!nav)return;const links=$$('a',nav);const map=[[/shop by car/i,n.shopByCar,n.showShopByCar],[/shop by brand/i,n.shopByBrand,n.showShopByBrand],[/^categories/i,n.categories,n.showCategories],[/^shop$/i,n.shop,n.showShop],[/about us/i,n.about,n.showAbout],[/^faqs?$/i,n.faqs,n.showFaqs],[/contact us/i,n.contact,n.showContact]];for(const el of links){const txt=(el.textContent||'').trim();for(const [re,label,show] of map){if(re.test(txt)){if(label)setText(el,label);el.style.display=show===false?'none':'';break}}if(/admin/i.test(txt)||el.getAttribute('href')==='/admin')el.remove()}}
  function sectionFromTitle(re){const title=byText('h1,h2,h3,.section-title',re);return title?.closest('section')||title?.parentElement?.closest('section')||null}
  function toggleSection(re,show,titleText){const sec=sectionFromTitle(re);if(sec)sec.style.display=show===false?'none':'';const title=byText('h1,h2,h3,.section-title',re);if(title&&titleText)setText(title,titleText)}
  function applyHome(){const h=cfg.home||{};const why=$('.tp-why,.why');if(why){why.style.display=h.showWhy===false?'none':'';setText($('h2,.section-title',why),h.whyTitle)}
    const cats=$('.tp-categories');if(cats){const sec=cats.closest('section')||cats;sec.style.display=h.showCategories===false?'none':'';const t=$('h2,.section-title',sec);if(t&&h.categoriesTitle)setText(t,h.categoriesTitle)}else toggleSection(/shop by category/i,h.showCategories,h.categoriesTitle);
    toggleSection(/shop the best from top brands/i,h.showTopBrands,h.topBrandsTitle);
    toggleSection(/our top products/i,h.showTopProducts,h.topProductsTitle);
    toggleSection(/featured products/i,h.showFeatured,h.featuredTitle);
    toggleSection(/recent products/i,h.showRecent,h.recentTitle)
  }
  function applyAbout(){const a=cfg.about||{};const home=$('#about,[data-view]#about');if(!home)return;const banner=byText('#about *',/we are more than just a marketplace/i);if(banner&&a.banner)setText(banner,a.banner);const at=byText('#about h1,#about h2,#about h3',/^about us$/i);if(at&&a.aboutTitle)setText(at,a.aboutTitle);const mt=byText('#about h1,#about h2,#about h3',/our mission/i);if(mt&&a.missionTitle)setText(mt,a.missionTitle);const vt=byText('#about h1,#about h2,#about h3',/our vision/i);if(vt&&a.visionTitle)setText(vt,a.visionTitle)}
  function applyFooter(){const f=cfg.footer||{};const foot=$('.newsletter-footer,footer');if(!foot)return;foot.style.display=f.show===false?'none':'';const title=byText('.newsletter-footer h1,.newsletter-footer h2,.newsletter-footer h3,.newsletter-footer h4,footer h1,footer h2,footer h3,footer h4',/stay connected|newsletter|join/i);if(title&&f.newsletterTitle)setText(title,f.newsletterTitle);if(f.supportEmail){$$('a[href^="mailto:"]',foot).forEach(x=>{x.href='mailto:'+f.supportEmail;setText(x,f.supportEmail)})}const legal=byText('.legal,footer small,footer p',/©|all rights reserved/i);if(legal&&f.copyright)setText(legal,f.copyright)}
  function applyButtons(){const b=cfg.buttons||{};$$('a,button').forEach(el=>{const t=(el.textContent||'').trim();if(/^shop now$/i.test(t)&&b.shopNow)setText(el,b.shopNow);else if(/^shop all$/i.test(t)&&b.shopAll)setText(el,b.shopAll);else if(/^add to cart$/i.test(t)&&b.addToCart)setText(el,b.addToCart);else if(/^checkout$/i.test(t)&&b.checkout)setText(el,b.checkout)})}
  async function load(){try{const r=await fetch('/api/site-settings?frontend='+Date.now(),{cache:'no-store'});if(!r.ok)return;const s=await r.json();if(s.frontend_config)cfg=JSON.parse(s.frontend_config)}catch{}if(cfg)apply()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
  let scheduled=false;const obs=new MutationObserver(()=>{if(!cfg||scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})});obs.observe(document.documentElement,{subtree:true,childList:true});
})();
