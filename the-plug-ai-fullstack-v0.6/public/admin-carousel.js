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
    .carousel-admin-list{display:grid;gap:16px}.carousel-admin-card{display:grid;grid-template-columns:180px 1fr auto;gap:18px;align-items:start;border:1px solid #e4e8eb;padding:16px;background:#fff}.carousel-admin-preview{width:180px;height:105px;object-fit:cover;background:#eef2f4}.carousel-admin-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.carousel-admin-fields label:first-child{grid-column:1/-1}.carousel-admin-actions{display:flex;flex-direction:column;gap:8px}.carousel-admin-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.carousel-admin-note{padding:12px 14px;background:#f2f9fd;border-left:4px solid #8FC6E4;color:#43525d;margin-bottom:16px}.carousel-switch{display:flex!important;align-items:center;gap:8px}.carousel-switch input{width:auto!important}.carousel-admin-card input{width:100%}.carousel-admin-card small{color:#73808a}.carousel-live-note{margin-top:10px;font-size:12px;color:#68757e}.carousel-upload-row{display:flex;align-items:center;gap:10px;grid-column:1/-1;flex-wrap:wrap}.carousel-upload-row input[type=file]{max-width:320px}.carousel-upload-state{font-size:12px;color:#567}.carousel-save-state{font-size:13px;font-weight:700;margin-left:auto}.carousel-save-state.good{color:#137a3d}.carousel-save-state.bad{color:#a52a2a}@media(max-width:850px){.carousel-admin-card{grid-template-columns:1fr}.carousel-admin-preview{width:100%;height:180px}.carousel-admin-fields{grid-template-columns:1fr}.carousel-admin-fields label:first-child{grid-column:auto}.carousel-admin-actions{flex-direction:row;flex-wrap:wrap}.carousel-upload-row{grid-column:auto}}
  `;
  document.head.appendChild(style);

  function ensureUI(){
    if(document.getElementById('carousel'))return;
    const nav=document.querySelector('.sidebar nav');
    if(!nav)return setTimeout(ensureUI,100);
    const btn=document.createElement('button');btn.dataset.carouselView='1';btn.textContent='▧ Homepage Carousel';
    const contentBtn=[...nav.querySelectorAll('button')].find(b=>b.dataset.view==='content');
    nav.insertBefore(btn,contentBtn||null);
    const main=document.querySelector('.admin-main');
    if(!main)return;
    const section=document.createElement('section');section.className='admin-view';section.id='carousel';section.innerHTML=`<div class="page-title"><div><small>HOMEPAGE</small><h1>Carousel Management</h1><p>Control the homepage hero images without editing code.</p></div><button class="primary" id="carouselSaveTop">Save Changes</button></div><div class="panel"><div class="carousel-admin-note"><b>Changes here update the live homepage carousel.</b><br>You can paste a full image URL, use a site asset path, or upload an image directly from your device. For best results use a wide landscape image.</div><div class="carousel-admin-toolbar"><h2>Slides</h2><span id="carouselSaveState" class="carousel-save-state"></span><button class="secondary" id="carouselAdd">＋ Add Slide</button></div><div id="carouselAdminList" class="carousel-admin-list"></div><div class="carousel-live-note">After adding or editing a slide, click <b>Save Changes</b>. The admin now verifies that the saved carousel can be read back before reporting success.</div></div>`;
    main.appendChild(section);
    btn.onclick=()=>{document.querySelectorAll('.admin-view').forEach(x=>x.classList.remove('active'));section.classList.add('active');document.querySelectorAll('.sidebar button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');load()};
    section.querySelector('#carouselAdd').onclick=()=>{syncFromUI();slides.push({image:'',label:'New slide',position:'center center',enabled:true});render();setState('New slide added — choose an image, then save.','')};
    section.querySelector('#carouselSaveTop').onclick=save;
  }

  function setState(text,kind=''){
    const el=document.getElementById('carouselSaveState');if(!el)return;el.textContent=text||'';el.className='carousel-save-state'+(kind?' '+kind:'');
  }

  async function load(){
    try{
      setState('Loading…');
      const r=await fetch('/api/admin/settings?carousel='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('Unable to load carousel settings');
      const s=await r.json();slides=s.carousel_slides?JSON.parse(s.carousel_slides):defaults.map(x=>({...x}));
      if(!Array.isArray(slides)||!slides.length)slides=defaults.map(x=>({...x}));slides=slides.map(x=>({...x,enabled:x.enabled!==false}));render();setState('');
    }catch(e){slides=defaults.map(x=>({...x}));render();setState(e.message,'bad')}
  }

  function syncFromUI(){
    document.querySelectorAll('[data-carousel-row]').forEach((row,i)=>{
      if(!slides[i])return;
      const imageInput=row.querySelector('[data-field="image"]');
      const typed=imageInput.value.trim();
      if(typed || imageInput.dataset.uploadManaged!=='1')slides[i].image=typed;
      slides[i].label=row.querySelector('[data-field="label"]').value.trim();
      slides[i].position=row.querySelector('[data-field="position"]').value.trim()||'center center';
      slides[i].enabled=row.querySelector('[data-field="enabled"]').checked;
    });
  }

  function render(){
    const root=document.getElementById('carouselAdminList');if(!root)return;
    root.innerHTML=slides.map((s,i)=>{
      const uploaded=String(s.image||'').startsWith('data:image/');
      const shownValue=uploaded?'':esc(s.image);
      const placeholder=uploaded?'Uploaded image stored with this slide':'https://... or assets/image.jpg';
      return `<div class="carousel-admin-card" data-carousel-row="${i}"><img class="carousel-admin-preview" src="${esc(s.image)}" alt="${esc(s.label)}" onerror="this.style.opacity=.25"><div class="carousel-admin-fields"><label>Image URL / asset path<input data-field="image" data-upload-managed="${uploaded?'1':'0'}" value="${shownValue}" placeholder="${placeholder}"></label><div class="carousel-upload-row"><label><b>Or upload image</b><input type="file" data-upload="${i}" accept="image/jpeg,image/png,image/webp"></label><span class="carousel-upload-state">${uploaded?'✓ Uploaded image ready':''}</span></div><label>Slide label<input data-field="label" value="${esc(s.label)}"></label><label>Image crop / position<input data-field="position" value="${esc(s.position||'center center')}" placeholder="center 55%"></label><label class="carousel-switch"><input type="checkbox" data-field="enabled" ${s.enabled!==false?'checked':''}> Enabled on homepage</label><small>Slide ${i+1}</small></div><div class="carousel-admin-actions"><button class="secondary small" data-up="${i}" ${i===0?'disabled':''}>↑ Up</button><button class="secondary small" data-down="${i}" ${i===slides.length-1?'disabled':''}>↓ Down</button><button class="dangerbtn" data-remove="${i}">Remove</button></div></div>`;
    }).join('');
    root.querySelectorAll('[data-field="image"]').forEach(inp=>inp.oninput=()=>{const i=+inp.closest('[data-carousel-row]').dataset.carouselRow;inp.dataset.uploadManaged='0';slides[i].image=inp.value.trim();const img=inp.closest('[data-carousel-row]').querySelector('img');img.style.opacity='1';img.src=slides[i].image});
    root.querySelectorAll('[data-upload]').forEach(inp=>inp.onchange=()=>handleUpload(inp));
    root.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{syncFromUI();const i=+b.dataset.up;[slides[i-1],slides[i]]=[slides[i],slides[i-1]];render()});
    root.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{syncFromUI();const i=+b.dataset.down;[slides[i+1],slides[i]]=[slides[i],slides[i+1]];render()});
    root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{syncFromUI();slides.splice(+b.dataset.remove,1);render();setState('Slide removed — click Save Changes to publish.','')});
  }

  function handleUpload(inp){
    const file=inp.files&&inp.files[0];if(!file)return;
    const row=inp.closest('[data-carousel-row]'),i=+row.dataset.carouselRow,state=row.querySelector('.carousel-upload-state');
    if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){inp.value='';state.textContent='Use JPG, PNG, or WebP.';return}
    if(file.size>5*1024*1024){inp.value='';state.textContent='Image is too large. Maximum 5 MB.';return}
    state.textContent='Reading image…';
    const reader=new FileReader();
    reader.onload=()=>{slides[i].image=String(reader.result||'');const text=row.querySelector('[data-field="image"]');text.value='';text.dataset.uploadManaged='1';text.placeholder='Uploaded image stored with this slide';const img=row.querySelector('.carousel-admin-preview');img.style.opacity='1';img.src=slides[i].image;state.textContent='✓ Uploaded image ready — click Save Changes';setState('Unsaved carousel changes','')};
    reader.onerror=()=>{state.textContent='Could not read this image.'};
    reader.readAsDataURL(file);
  }

  async function save(){
    syncFromUI();
    if(!slides.length)return alert('Add at least one carousel slide.');
    const bad=slides.find(x=>x.enabled!==false&&!x.image);if(bad)return alert('Every enabled slide needs an image URL, asset path, or uploaded image.');
    const btn=document.getElementById('carouselSaveTop');if(btn)btn.disabled=true;setState('Saving…');
    try{
      const payload=JSON.stringify(slides);
      const r=await fetch('/api/admin/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({carousel_slides:payload})});
      if(!r.ok)throw new Error('Unable to save carousel settings.');
      const verify=await fetch('/api/admin/settings?verify='+Date.now(),{cache:'no-store'});if(!verify.ok)throw new Error('Carousel saved but could not be verified.');
      const settings=await verify.json();let stored=[];try{stored=JSON.parse(settings.carousel_slides||'[]')}catch{}
      if(!Array.isArray(stored)||stored.length!==slides.length)throw new Error('Carousel save did not persist correctly. Please try again.');
      setState(`Saved ✓ ${slides.length} slide${slides.length===1?'':'s'} live`,'good');
      if(window.toast)window.toast('Carousel saved');
    }catch(e){setState(e.message||'Unable to save carousel settings.','bad');alert(e.message||'Unable to save carousel settings.')}finally{if(btn)btn.disabled=false}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI);else ensureUI();
})();
