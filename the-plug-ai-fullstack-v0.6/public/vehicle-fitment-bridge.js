(()=>{
  const nativeFetch=window.fetch.bind(window);
  let fitmentCacheKey='', fitmentCache=[];

  function getSelected(){
    try{return JSON.parse(localStorage.getItem('plug-selected-vehicle')||'null')}catch{return null}
  }
  function normalizedSelected(s){
    if(!s)return null;
    return {make:s.make||s.brand||'',model:s.car_model||s.model||'',rawModel:s.model||'',submodel:s.submodel||'',chassis:s.chassis||'',engine:s.engine||'',liters:s.liters||''};
  }
  function queryFor(s,mode){
    const p=new URLSearchParams();
    if(s.make)p.set('make',s.make);
    if(s.model)p.set('model',s.model);
    if(mode==='exact'){
      if(s.chassis)p.set('chassis',s.chassis);
      if(s.engine)p.set('engine',s.engine);
      if(s.liters)p.set('liters',s.liters);
    }else if(mode==='model-chassis'){
      if(s.chassis)p.set('chassis',s.chassis);
    }else if(mode==='model-engine'){
      if(s.engine)p.set('engine',s.engine);
      if(s.liters)p.set('liters',s.liters);
    }else if(mode==='raw-model'){
      p.set('model',s.rawModel||s.model);
    }else if(mode==='make-chassis'){
      p.delete('model');
      if(s.chassis)p.set('chassis',s.chassis);
    }
    return p;
  }
  async function getRows(s,mode){
    try{
      const r=await nativeFetch('/api/catalog/vehicle-fitments?'+queryFor(s,mode).toString(),{cache:'no-store'});
      if(!r.ok)return [];
      const rows=await r.json();
      return Array.isArray(rows)?rows:[];
    }catch{return []}
  }
  async function readFitments(selected){
    const s=normalizedSelected(selected);
    if(!s?.make)return [];
    const key=JSON.stringify(s);
    if(key===fitmentCacheKey&&fitmentCache.length)return fitmentCache;
    const modes=['exact','model-chassis','model-engine','model','raw-model','make-chassis'];
    const batches=await Promise.all(modes.map(m=>getRows(s,m)));
    const seen=new Set(),rows=[];
    for(const batch of batches){
      for(const f of batch){
        const id=String(f.id||[f.product_id,f.car_brand,f.model,f.chassis,f.engine,f.liters,f.source_row].join('|'));
        if(seen.has(id))continue;
        seen.add(id);rows.push(f);
      }
    }
    fitmentCacheKey=key;fitmentCache=rows;
    return rows;
  }
  async function readVehicleProducts(selected){
    const fits=await readFitments(selected);
    const ids=[...new Set(fits.map(f=>Number(f.product_id)).filter(Number.isFinite))];
    if(!ids.length)return [];
    const products=await Promise.all(ids.map(async id=>{
      try{
        const r=await nativeFetch('/api/products/'+id,{cache:'no-store'});
        if(!r.ok)return null;
        const p=await r.json();
        if(!p.image&&Array.isArray(p.images)&&p.images[0]?.url)p.image=p.images[0].url;
        return p;
      }catch{return null}
    }));
    return products.filter(Boolean);
  }
  function jsonResponse(data){return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json','cache-control':'no-store'}})}

  function installVehicleShopStyles(){
    if(document.getElementById('tp-vehicle-shop-layout-fix'))return;
    const style=document.createElement('style');
    style.id='tp-vehicle-shop-layout-fix';
    style.textContent=`
      #shop .shop-products{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:24px!important;align-items:stretch!important}
      #shop .shop-products .product-card{min-width:0!important;width:auto!important;display:flex!important;flex-direction:column!important}
      #shop .shop-products .product-image{height:260px!important;border:1px solid #eceeef!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;margin-bottom:12px!important}
      #shop .shop-products .product-image img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;padding:16px!important}
      #shop .shop-products .product-card h3{font-size:17px!important;line-height:1.25!important;margin:7px 0 8px!important;min-height:44px!important;letter-spacing:0!important}
      #shop .shop-products .product-card .price{margin-top:auto!important;margin-bottom:12px!important}
      #shop .shop-products .product-card .btn.full{width:100%!important;min-height:44px!important}
      @media(max-width:1100px){#shop .shop-products{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:680px){#shop .shop-products{grid-template-columns:1fr!important;gap:18px!important}#shop .shop-products .product-image{height:230px!important}}
    `;
    document.head.appendChild(style);
  }
  function vehicleTitle(selected){
    const s=normalizedSelected(selected);if(!s)return 'Compatible Parts';
    return ['Parts for',s.make,s.model,s.submodel&&s.submodel!=='Standard'?s.submodel:''].filter(Boolean).join(' ');
  }
  function resetShopFromCategoryState(){
    const selected=getSelected();
    if(!selected)return;
    localStorage.removeItem('plug-selected-category');
    const shop=document.getElementById('shop');
    if(!shop)return;
    const title=vehicleTitle(selected);
    const crumbs=shop.querySelector('.breadcrumbs');if(crumbs)crumbs.textContent='Home / Shop by Car / '+title.replace(/^Parts for /,'');
    const h=shop.querySelector('.pagehead');if(h)h.textContent=title;
    const firstGroup=shop.querySelector('.filter-group');if(firstGroup)firstGroup.innerHTML='<strong>VEHICLE FITMENT</strong><div style="font-size:13px;line-height:1.55;color:#5e6b75">Showing all products compatible with your selected vehicle across every product category.</div>';
  }
  function refreshVehicleHeaderSoon(){
    [0,120,300,700].forEach(ms=>setTimeout(resetShopFromCategoryState,ms));
  }

  const initialSelected=getSelected();
  if(initialSelected)localStorage.removeItem('plug-selected-category');
  installVehicleShopStyles();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshVehicleHeaderSoon,{once:true});else refreshVehicleHeaderSoon();
  window.addEventListener('hashchange',()=>{if(location.hash==='#shop'&&getSelected())refreshVehicleHeaderSoon()});

  window.fetch=async(input,init)=>{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const selected=getSelected();
    if(selected&&(url.startsWith('/api/products?')||url==='/api/products')){
      const products=await readVehicleProducts(selected);
      refreshVehicleHeaderSoon();
      return jsonResponse(products);
    }
    if(url.startsWith('/api/admin/fitments')){
      if(selected?.make||selected?.brand){
        const rows=await readFitments(selected);
        const s=normalizedSelected(selected);
        return jsonResponse(rows.map(f=>({...f,car_brand:s.make||f.car_brand,model:s.model||f.model,chassis:s.chassis||f.chassis})));
      }
      return nativeFetch('/api/catalog/vehicle-fitments',{cache:'no-store'});
    }
    return nativeFetch(input,init);
  };
})();
