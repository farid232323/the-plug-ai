(()=>{
  const defaults=[
    {image:'https://images.unsplash.com/photo-1774066811800-448b846647a2?auto=format&fit=crop&w=2200&q=85',label:'Mercedes-AMG GT',position:'center 55%',enabled:true},
    {image:'https://images.unsplash.com/photo-1762028159677-e45ac537a29a?auto=format&fit=crop&w=2200&q=85',label:'Audi RS6',position:'center 55%',enabled:true},
    {image:'https://images.unsplash.com/photo-1591076898712-f658e1e7edfb?auto=format&fit=crop&w=2200&q=85',label:'Porsche 911',position:'center 58%',enabled:true},
    {image:'https://images.unsplash.com/photo-1707406767272-8c1deea8f5b8?auto=format&fit=crop&w=2200&q=85',label:'BMW M3 Engine Bay',position:'center 48%',enabled:true}
  ];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let slides=[];

  const style=document.createElement('style');
  style.textContent=`
    .carousel-admin-list{display:grid;gap:16px}.carousel-admin-card{display:grid;grid-template-columns:180px 1fr auto;gap:18px;align-items:start;border:1px solid #e4e8eb;padding:16px;background:#fff}.carousel-admin-preview{width:180px;height:105px;object-fit:cover;background:#eef2f4}.carousel-admin-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.carousel-admin-fields label:first-child{grid-column:1/-1}.carousel-admin-actions{display:flex;flex-direction:column;gap:8px}.carousel-admin-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.carousel-admin-note{padding:12px 14px;background:#f2f9fd;border-left:4px solid #8FC6E4;color:#43525d;margin-bottom:16px}.carousel-switch{display:flex!important;align-items:center;gap:8px}.carousel-switch input{width:auto!important}.carousel-admin-card input{width:100%}.carousel-admin-card small{color:#73808a}.carousel-live-note{margin-top:10px;font-size:12px;color:#68757e}@media(max-width:850px){.carousel-admin-card{grid-template-columns:1fr}.carousel-admin-preview{width:100%;height:180px}.carousel-admin-fields{grid-template-columns:1fr}.carousel-admin-fields label:first-child{grid-column:auto}.carousel-admin-actions{flex-direction:row;flex-wrap:wrap}}
  `;
  document.head.appendChild(style);

  function ensureUI(){
    if(document.getElementById('carousel'))return;
    const nav=document.querySelector('.sidebar nav');
    const btn=document.createElement('button');btn.dataset.carouselView='1';btn.textContent='▧ Homepage Carousel';
    const contentBtn=[...nav.querySelectorAll('button')].find(b=>b.dataset.view==='content');
    nav.insertBefore(btn,contentBtn||null);
    const main=document.querySelector('.admin-main');
    const section=document.createElement('section');section.className='admin-view';section.id='carousel';section.innerHTML=`<div class="page-title"><div><small>HOMEPAGE</small><h1>Carousel Management</h1><p>Control the homepage hero images without editing code.</p></div><button class="primary" id="carouselSaveTop">Save Changes</button></div><div class="panel"><div class="carousel-admin-note"><b>Changes here update the live homepage carousel.</b><br>Use a full image URL or a site asset path such as <code>assets/hero.jpg</code>. For best results use wide landscape images.</div><div class="carousel-admin-toolbar"><h2>Slides</h2><button class="secondary" id="carouselAdd">＋ Add Slide</button></div><div id="carouselAdminList" class="carousel-admin-list"></div><div class="carousel-live-note">You can change image, label, crop position, order, or temporarily disable a slide.</div></div>`;
    main.appendChild(section);
    btn.onclick=()=>{document.querySelectorAll('.admin-view').forEach(x=>x.classList.remove('active'));section.classList.add('active');document.querySelectorAll('.sidebar button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');load()};
    section.querySelector('#carouselAdd').onclick=()=>{slides.push({image:'',label:'New slide',position:'center center',enabled:true});render()};
    section.querySelector('#carouselSaveTop').onclick=save;
  }

  async function load(){
    try{const r=await fetch('/api/admin/settings');if(!r.ok)throw new Error('Unable to load carousel settings');const s=await r.json();slides=s.carousel_slides?JSON.parse(s.carousel_slides):defaults.map(x=>({...x}));if(!Array.isArray(slides)||!slides.length)slides=defaults.map(x=>({...x}));slides=slides.map(x=>({...x,enabled:x.enabled!==false}));render()}catch(e){slides=defaults.map(x=>({...x}));render();alert(e.message)}
  }
  function syncFromUI(){
    document.querySelectorAll('[data-carousel-row]').forEach((row,i)=>{if(!slides[i])return;slides[i].image=row.querySelector('[data-field="image"]').value.trim();slides[i].label=row.querySelector('[data-field="label"]').value.trim();slides[i].position=row.querySelector('[data-field="position"]').value.trim()||'center center';slides[i].enabled=row.querySelector('[data-field="enabled"]').checked});
  }
  function render(){
    const root=document.getElementById('carouselAdminList');if(!root)return;
    root.innerHTML=slides.map((s,i)=>`<div class="carousel-admin-card" data-carousel-row="${i}"><img class="carousel-admin-preview" src="${esc(s.image)}" alt="${esc(s.label)}" onerror="this.style.opacity=.25"><div class="carousel-admin-fields"><label>Image URL / asset path<input data-field="image" value="${esc(s.image)}" placeholder="https://... or assets/image.jpg"></label><label>Slide label<input data-field="label" value="${esc(s.label)}"></label><label>Image crop / position<input data-field="position" value="${esc(s.position||'center center')}" placeholder="center 55%"></label><label class="carousel-switch"><input type="checkbox" data-field="enabled" ${s.enabled!==false?'checked':''}> Enabled on homepage</label><small>Slide ${i+1}</small></div><div class="carousel-admin-actions"><button class="secondary small" data-up="${i}" ${i===0?'disabled':''}>↑ Up</button><button class="secondary small" data-down="${i}" ${i===slides.length-1?'disabled':''}>↓ Down</button><button class="dangerbtn" data-remove="${i}">Remove</button></div></div>`).join('');
    root.querySelectorAll('[data-field="image"]').forEach(inp=>inp.oninput=()=>{const row=inp.closest('[data-carousel-row]');row.querySelector('img').src=inp.value});
    root.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{syncFromUI();const i=+b.dataset.up;[slides[i-1],slides[i]]=[slides[i],slides[i-1]];render()});
    root.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{syncFromUI();const i=+b.dataset.down;[slides[i+1],slides[i]]=[slides[i],slides[i+1]];render()});
    root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{syncFromUI();slides.splice(+b.dataset.remove,1);render()});
  }
  async function save(){
    syncFromUI();
    if(!slides.length)return alert('Add at least one carousel slide.');
    const bad=slides.find(x=>x.enabled!==false&&!x.image);if(bad)return alert('Every enabled slide needs an image URL or asset path.');
    const r=await fetch('/api/admin/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({carousel_slides:JSON.stringify(slides)})});if(!r.ok)return alert('Unable to save carousel settings.');
    if(window.toast)window.toast('Carousel saved');else alert('Carousel saved. The homepage will use these changes on refresh.');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI);else ensureUI();
})();
