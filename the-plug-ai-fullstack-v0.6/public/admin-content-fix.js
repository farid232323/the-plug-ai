(()=>{
  const RIYAL='⃁';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let current={};

  async function getSettings(){
    const r=await fetch('/api/admin/settings',{cache:'no-store'});
    if(!r.ok)throw new Error('Unable to load content settings');
    return r.json();
  }
  async function saveSettings(obj){
    const r=await fetch('/api/admin/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(obj)});
    if(!r.ok)throw new Error('Unable to save content settings');
    return r.json();
  }
  function notify(msg){if(window.toast)window.toast(msg);else alert(msg)}

  function build(){
    const section=document.getElementById('content');if(!section)return;
    section.innerHTML=`
      <div class="page-title"><div><small>CMS</small><h1>Content & SEO</h1><p>Edit storefront messaging, the announcement bar and SEO without touching code.</p></div><button class="primary" id="contentSaveTop">Save Changes</button></div>
      <div class="grid2">
        <div class="panel form" id="contentForm">
          <h2>Homepage Content</h2>
          <label>Hero headline<input name="hero_headline"></label>
          <label>Hero subheading<textarea name="hero_subheading"></textarea></label>
          <label>Support email<input name="support_email"></label>
          <button class="primary" id="saveContent">Save Content</button>
        </div>
        <div class="panel form" id="promoForm">
          <h2>Top Announcement Bar</h2>
          <label class="carousel-switch"><input type="checkbox" name="promo_bar_enabled"> Show announcement bar on storefront</label>
          <label>Announcement text<input name="promo_bar_text" placeholder="Free standard shipping to Saudi Arabia over {threshold}"></label>
          <label>Free shipping threshold (${RIYAL})<input name="shipping_threshold" type="number" min="0" step="1"></label>
          <p class="muted">Use <code>{threshold}</code> in the announcement text to insert the saved threshold automatically. Turn the switch off to remove the free-shipping bar completely.</p>
          <button class="primary" id="savePromo">Save Announcement Bar</button>
        </div>
      </div>
      <div class="panel form" id="seoForm" style="margin-top:18px">
        <h2>Homepage SEO</h2>
        <label>SEO page title<input name="seo_title" placeholder="The Plug — Premium Automotive Parts"></label>
        <label>Meta description<textarea name="seo_description" placeholder="Premium European aftermarket automotive parts in Saudi Arabia."></textarea></label>
        <button class="primary" id="saveSeo">Save SEO</button>
      </div>`;

    section.querySelector('#saveContent').onclick=()=>saveGroup('content');
    section.querySelector('#savePromo').onclick=()=>saveGroup('promo');
    section.querySelector('#saveSeo').onclick=()=>saveGroup('seo');
    section.querySelector('#contentSaveTop').onclick=()=>saveGroup('all');
    fill();
  }

  function val(sel){return document.querySelector(sel)?.value??''}
  function checked(sel){return !!document.querySelector(sel)?.checked}
  function fill(){
    const s=current;
    const set=(sel,v)=>{const el=document.querySelector(sel);if(el)el.value=v??''};
    set('#contentForm [name=hero_headline]',s.hero_headline||'');
    set('#contentForm [name=hero_subheading]',s.hero_subheading||'');
    set('#contentForm [name=support_email]',s.support_email||'');
    set('#promoForm [name=promo_bar_text]',s.promo_bar_text||'Free standard shipping to Saudi Arabia over {threshold}');
    set('#promoForm [name=shipping_threshold]',s.shipping_threshold||'1400');
    const toggle=document.querySelector('#promoForm [name=promo_bar_enabled]');if(toggle)toggle.checked=String(s.promo_bar_enabled??'true')!=='false';
    set('#seoForm [name=seo_title]',s.seo_title||'The Plug — Premium Automotive Parts');
    set('#seoForm [name=seo_description]',s.seo_description||'The Plug — premium European aftermarket automotive parts in Saudi Arabia.');
  }

  function payload(group){
    const all={
      hero_headline:val('#contentForm [name=hero_headline]'),
      hero_subheading:val('#contentForm [name=hero_subheading]'),
      support_email:val('#contentForm [name=support_email]'),
      promo_bar_enabled:String(checked('#promoForm [name=promo_bar_enabled]')),
      promo_bar_text:val('#promoForm [name=promo_bar_text]'),
      shipping_threshold:val('#promoForm [name=shipping_threshold]'),
      seo_title:val('#seoForm [name=seo_title]'),
      seo_description:val('#seoForm [name=seo_description]')
    };
    if(group==='content')return {hero_headline:all.hero_headline,hero_subheading:all.hero_subheading,support_email:all.support_email};
    if(group==='promo')return {promo_bar_enabled:all.promo_bar_enabled,promo_bar_text:all.promo_bar_text,shipping_threshold:all.shipping_threshold};
    if(group==='seo')return {seo_title:all.seo_title,seo_description:all.seo_description};
    return all;
  }

  async function saveGroup(group){
    try{
      await saveSettings(payload(group));
      current=await getSettings();
      fill();
      notify(group==='promo'&&!checked('#promoForm [name=promo_bar_enabled]')?'Announcement bar removed from storefront':'Content settings saved');
    }catch(e){alert(e.message)}
  }

  async function init(){
    try{current=await getSettings()}catch(e){console.warn(e)}
    build();
    const nav=[...document.querySelectorAll('.sidebar [data-view]')].find(x=>x.dataset.view==='content');
    if(nav)nav.addEventListener('click',async()=>{try{current=await getSettings();fill()}catch{}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
