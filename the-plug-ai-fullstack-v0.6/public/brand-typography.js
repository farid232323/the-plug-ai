(()=>{
  if(document.getElementById('plug-brand-typography'))return;
  const style=document.createElement('style');
  style.id='plug-brand-typography';
  style.textContent=`
    :root{
      --plug-font-headline:"Nofex","Arial Black",Arial,sans-serif;
      --plug-font-body:"Tamil Sangam MN","Helvetica Neue",Arial,sans-serif;
      --plug-font-ar-headline:"Titr Bold","Noto Sans Arabic","Noto Sans",Arial,sans-serif;
      --plug-font-ar-body:"Noto Sans Arabic","Noto Sans",Arial,sans-serif;
    }

    html,body,input,select,textarea,
    .product-card h4,.product-card .sub,.price,.brandline,.plugid,
    .tp-product-card,.tp-product-card p,.tp-product-card span,
    .tp-why,.tp-categories,.tp-brand-item,
    .breadcrumbs,.filter-group,.summary,.cart-item,.drawer-item,
    .footer-grid p,.footer-grid a,.legal,.muted-note{
      font-family:var(--plug-font-body)!important;
    }

    h1,h2,h3,h4,h5,h6,
    .headline,.pagehead,.section-title,.story-title,.eyebrow,
    .btn,button,.navcats,.vehicle-btn,.mobile-select,
    .cat-card .label,.shopall a,
    .tp-hero h1,.tp-hero h2,.tp-hero .eyebrow,
    .tp-section-title,.tp-heading,.tp-title,
    .tp-category-card h3,.tp-brand-item strong{
      font-family:var(--plug-font-headline)!important;
    }

    :lang(ar),[lang="ar"],html[dir="rtl"] body,
    [dir="rtl"],.arabic,.ar{
      font-family:var(--plug-font-ar-body)!important;
    }

    :lang(ar) h1,:lang(ar) h2,:lang(ar) h3,:lang(ar) h4,:lang(ar) h5,:lang(ar) h6,
    [lang="ar"] h1,[lang="ar"] h2,[lang="ar"] h3,[lang="ar"] h4,
    html[dir="rtl"] h1,html[dir="rtl"] h2,html[dir="rtl"] h3,html[dir="rtl"] h4,
    [dir="rtl"] .headline,[dir="rtl"] .pagehead,[dir="rtl"] .section-title,
    [dir="rtl"] .btn,[dir="rtl"] button,[dir="rtl"] .navcats,
    .arabic.headline,.arabic-title,.ar-headline{
      font-family:var(--plug-font-ar-headline)!important;
    }
  `;
  document.head.appendChild(style);
})();
