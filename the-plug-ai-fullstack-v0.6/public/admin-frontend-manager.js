(()=>{
  const defaults={
    branding:{headerLogo:'assets/logo.png',footerLogo:'assets/logo.png',favicon:'',logoWidth:135,mobileLogoWidth:115},
    fonts:{heading:'Nofex',body:'Tamil Sangam MN',arabicHeading:'Titr Bold',arabicBody:'Noto Sans',baseSize:16,navSize:14,buttonSize:14},
    colors:{lightBlue:'#8FC6E4',navy:'#132135',deepNavy:'#1B2B3F',yellow:'#F8FF66',white:'#FFFFFF',black:'#000000',pageBg:'#FFFFFF',text:'#172433',footer:'#1b1e1e'},
    layout:{containerWidth:1460,sectionSpacing:72,buttonRadius:0,cardRadius:6,productImageHeight:280},
    header:{showAnnouncement:true,announcementText:'Free standard shipping to Saudi Arabia over {threshold}',searchPlaceholder:'Search by part number, VIN, product type, make, model or year…',vehicleLabel:'Select your vehicle',showWishlist:true,showLocations:true,showCart:true,showAccount:true},
    nav:{shopByCar:'Shop By Car',shopByBrand:'Shop By Brand',categories:'Categories',shop:'Shop',about:'About Us',faqs:'FAQs',contact:'Contact Us',showShopByCar:true,showShopByBrand:true,showCategories:true,showShop:true,showAbout:true,showFaqs:true,showContact:true},
    home:{showWhy:true,whyTitle:'Why The Plug ?',showCategories:true,categoriesTitle:'Shop By Category',showTopBrands:true,topBrandsTitle:'Shop the best from top brands',showTopProducts:true,topProductsTitle:'Our top products',showFeatured:true,featuredTitle:'Featured products',showRecent:true,recentTitle:'Recent products'},
    about:{banner:'WE ARE MORE THAN JUST A MARKETPLACE.',aboutTitle:'About Us',missionTitle:'Our Mission',visionTitle:'Our Vision'},
    footer:{show:true,newsletterTitle:'Stay connected',newsletterText:'',copyright:'© The Plug. All rights reserved.',supportEmail:'customerservice@theplug.inc'},
    buttons:{shopNow:'Shop now',shopAll:'Shop all',addToCart:'Add to cart',checkout:'Checkout'}
  };
  let cfg=structuredClone(defaults);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const style=document.createElement('style');style.textContent=`
    .fe-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.fe-panel{border:1px solid #e3e8eb;background:#fff;padding:18px}.fe-panel h2{margin:0 0 14px}.fe-panel h3{margin:18px 0 10px;font-size:15px}.fe-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fe-panel label{display:block;margin:10px 0;font-weight:600}.fe-panel input,.fe-panel textarea,.fe-panel select{width:100%;margin-top:6px}.fe-toggle{display:flex!important;align-items:center;gap:9px;font-weight:600}.fe-toggle input{width:auto!important;margin:0!important}.fe-upload{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.fe-preview{max-width:180px;max-height:80px;object-fit:contain;border:1px solid #e3e8eb;background:#fafafa}.fe-actions{position:sticky;bottom:0;background:#fff;border-top:1px solid #e4e8eb;padding:14px 0;display:flex;gap:10px;justify-content:flex-end;z-index:5}.fe-note{background:#f2f9fd;border-left:4px solid #8FC6E4;padding:12px 14px;margin-bottom:16px}.fe-status{font-weight:700;margin-right:auto;align-self:center}@media(max-width:850px){.fe-grid,.fe-row{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
  function ensureUI(){
    if(document.getElementById('frontend-control'))return;
    const nav=document.querySelector('.sidebar nav');if(!nav)return setTimeout(ensureUI,100);
    const btn=document.createElement('button');btn.dataset.frontendView='1';btn.textContent='✦ Frontend Control';
    const contentBtn=[...nav.querySelectorAll('button')].find(b=>b.dataset.view==='content');nav.insertBefore(btn,contentBtn||null);
    const main=document.querySelector('.admin-main');if(!main)return;
    const section=document.createElement('section');section.className='admin-view';section.id='frontend-control';section.innerHTML=`
      <div class="page-title"><div><small>STOREFRONT</small><h1>Frontend Control Center</h1><p>Control branding, logos, fonts, colors, navigation, homepage sections, footer, labels and layout from the backend.</p></div><button class="primary" id="feSaveTop">Save & Publish</button></div>
      <div class="fe-note"><b>This panel controls the public storefront.</b> Image uploads are stored with the site settings. Product/catalog data, orders and fitment remain in their dedicated admin sections.</div>
      <div id="feRoot"></div>
      <div class="fe-actions"><span class="fe-status" id="feStatus"></span><button class="secondary" id="feReset">Reset Unsaved</button><button class="primary" id="feSave">Save & Publish</button></div>`;
    main.appendChild(section);
    btn.onclick=()=>{document.querySelectorAll('.admin-view').forEach(x=>x.classList.remove('active'));section.classList.add('active');document.querySelectorAll('.sidebar button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');load()};
    section.querySelector('#feSave').onclick=save;section.querySelector('#feSaveTop').onclick=save;section.querySelector('#feReset').onclick=()=>{render();status('Unsaved changes discarded')};
    render();
  }
  function input(path,label,type='text',opts=''){const v=get(path);return `<label>${label}<input data-fe="${path}" type="${type}" value="${esc(v)}" ${opts}></label>`}
  function area(path,label){return `<label>${label}<textarea data-fe="${path}" rows="3">${esc(get(path))}</textarea></label>`}
  function toggle(path,label){return `<label class="fe-toggle"><input data-fe="${path}" type="checkbox" ${get(path)?'checked':''}> ${label}</label>`}
  function color(path,label){return `<label>${label}<input data-fe="${path}" type="color" value="${esc(get(path))}"></label>`}
  function get(path){return path.split('.').reduce((o,k)=>o?.[k],cfg)}
  function set(path,val){const parts=path.split('.');let o=cfg;parts.slice(0,-1).forEach(k=>o=o[k]||(o[k]={}));o[parts.at(-1)]=val}
  function uploadBlock(path,label){const src=get(path);return `<label>${label}</label><div class="fe-upload"><img class="fe-preview" data-preview="${path}" src="${esc(src)}" alt=""><input data-fe="${path}" value="${esc(src)}" placeholder="assets/... or https://..."><input type="file" data-upload="${path}" accept="image/png,image/jpeg,image/webp,image/svg+xml"></div>`}
  function render(){
    const root=document.getElementById('feRoot');if(!root)return;
    root.innerHTML=`<div class="fe-grid">
      <div class="fe-panel"><h2>Branding & Logos</h2>${uploadBlock('branding.headerLogo','Header logo')}${uploadBlock('branding.footerLogo','Footer logo')}${uploadBlock('branding.favicon','Favicon')}
        <div class="fe-row">${input('branding.logoWidth','Desktop logo width (px)','number','min="60" max="300"')}${input('branding.mobileLogoWidth','Mobile logo width (px)','number','min="50" max="240"')}</div></div>
      <div class="fe-panel"><h2>Typography</h2><div class="fe-row">${input('fonts.heading','English heading font')}${input('fonts.body','English body font')}${input('fonts.arabicHeading','Arabic heading font')}${input('fonts.arabicBody','Arabic body font')}</div><div class="fe-row">${input('fonts.baseSize','Base font size','number','min="12" max="24"')}${input('fonts.navSize','Navigation font size','number','min="10" max="22"')}${input('fonts.buttonSize','Button font size','number','min="10" max="22"')}</div></div>
      <div class="fe-panel"><h2>Brand Colors</h2><div class="fe-row">${color('colors.lightBlue','Light blue')}${color('colors.navy','Navy')}${color('colors.deepNavy','Deep navy')}${color('colors.yellow','Yellow')}${color('colors.pageBg','Page background')}${color('colors.text','Text')}${color('colors.footer','Footer')}</div></div>
      <div class="fe-panel"><h2>Layout & Sizing</h2><div class="fe-row">${input('layout.containerWidth','Max content width','number')}${input('layout.sectionSpacing','Section spacing','number')}${input('layout.buttonRadius','Button corner radius','number')}${input('layout.cardRadius','Card corner radius','number')}${input('layout.productImageHeight','Product image height','number')}</div></div>
      <div class="fe-panel"><h2>Header</h2>${toggle('header.showAnnouncement','Show announcement bar')}${input('header.announcementText','Announcement text')}${input('header.searchPlaceholder','Search placeholder')}${input('header.vehicleLabel','Vehicle selector label')}<h3>Header icons</h3>${toggle('header.showWishlist','Wishlist')}${toggle('header.showLocations','Locations')}${toggle('header.showCart','Cart')}${toggle('header.showAccount','Account')}</div>
      <div class="fe-panel"><h2>Navigation</h2><div class="fe-row">${input('nav.shopByCar','Shop By Car label')}${toggle('nav.showShopByCar','Show')}${input('nav.shopByBrand','Shop By Brand label')}${toggle('nav.showShopByBrand','Show')}${input('nav.categories','Categories label')}${toggle('nav.showCategories','Show')}${input('nav.shop','Shop label')}${toggle('nav.showShop','Show')}${input('nav.about','About label')}${toggle('nav.showAbout','Show')}${input('nav.faqs','FAQs label')}${toggle('nav.showFaqs','Show')}${input('nav.contact','Contact label')}${toggle('nav.showContact','Show')}</div></div>
      <div class="fe-panel"><h2>Homepage Sections</h2>${toggle('home.showWhy','Show Why The Plug')}${input('home.whyTitle','Why section title')}${toggle('home.showCategories','Show categories')}${input('home.categoriesTitle','Categories title')}${toggle('home.showTopBrands','Show top brands')}${input('home.topBrandsTitle','Top brands title')}${toggle('home.showTopProducts','Show top products')}${input('home.topProductsTitle','Top products title')}${toggle('home.showFeatured','Show featured products')}${input('home.featuredTitle','Featured title')}${toggle('home.showRecent','Show recent products')}${input('home.recentTitle','Recent title')}</div>
      <div class="fe-panel"><h2>About Page Labels</h2>${input('about.banner','About banner')}${input('about.aboutTitle','About title')}${input('about.missionTitle','Mission title')}${input('about.visionTitle','Vision title')}<p class="muted">Long-form About, Mission and Vision copy remains editable from Content & SEO.</p></div>
      <div class="fe-panel"><h2>Footer</h2>${toggle('footer.show','Show footer')}${input('footer.newsletterTitle','Newsletter title')}${area('footer.newsletterText','Newsletter text')}${input('footer.supportEmail','Support email','email')}${input('footer.copyright','Copyright text')}</div>
      <div class="fe-panel"><h2>Button & Store Labels</h2>${input('buttons.shopNow','Shop now')}${input('buttons.shopAll','Shop all')}${input('buttons.addToCart','Add to cart')}${input('buttons.checkout','Checkout')}</div>
    </div>`;
    root.querySelectorAll('[data-fe]').forEach(el=>{el.oninput=()=>{let v=el.type==='checkbox'?el.checked:el.value;if(el.type==='number')v=Number(v);set(el.dataset.fe,v);const p=root.querySelector(`[data-preview="${CSS.escape(el.dataset.fe)}"]`);if(p&&el.type!=='file')p.src=el.value;status('Unsaved changes')}});
    root.querySelectorAll('[data-upload]').forEach(el=>el.onchange=()=>handleUpload(el));
  }
  function handleUpload(el){const f=el.files?.[0];if(!f)return;if(f.size>2*1024*1024)return alert('Please use an image under 2 MB.');const r=new FileReader();r.onload=()=>{set(el.dataset.upload,String(r.result||''));render();status('Image uploaded — save to publish')};r.readAsDataURL(f)}
  function status(t,good=false){const el=document.getElementById('feStatus');if(el){el.textContent=t||'';el.style.color=good?'#138a22':''}}
  async function load(){try{status('Loading…');const r=await fetch('/api/admin/settings?frontend='+Date.now(),{cache:'no-store'});const s=await r.json();if(s.frontend_config){const saved=JSON.parse(s.frontend_config);cfg=merge(structuredClone(defaults),saved)}else cfg=structuredClone(defaults);render();status('')}catch(e){status('Unable to load settings')}}
  function merge(a,b){if(!b||typeof b!=='object')return a;Object.keys(b).forEach(k=>{if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k]))a[k]=merge(a[k]||{},b[k]);else a[k]=b[k]});return a}
  async function save(){try{status('Publishing…');const r=await fetch('/api/admin/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({frontend_config:JSON.stringify(cfg)})});if(!r.ok)throw new Error();const v=await fetch('/api/admin/settings?verify='+Date.now(),{cache:'no-store'});const s=await v.json();if(!s.frontend_config)throw new Error();status('Published ✓',true);if(window.toast)window.toast('Frontend settings published')}catch{status('Publish failed');alert('Unable to publish frontend settings.')}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI);else ensureUI();
})();
