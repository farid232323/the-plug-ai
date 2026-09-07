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

  window.fetch=async(input,init)=>{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const selected=getSelected();

    if(selected&&(url.startsWith('/api/products?')||url==='/api/products')){
      return jsonResponse(await readVehicleProducts(selected));
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
