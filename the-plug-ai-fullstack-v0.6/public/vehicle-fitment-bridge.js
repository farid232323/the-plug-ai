(()=>{
  const nativeFetch=window.fetch.bind(window);

  function getSelected(){
    try{return JSON.parse(localStorage.getItem('plug-selected-vehicle')||'null')}catch{return null}
  }
  function paramsFor(selected,mode='exact'){
    const p={make:selected?.make||selected?.brand||''};
    const model=selected?.model||selected?.car_model||'';
    if(model)p.model=model;
    if(mode==='exact'){
      if(selected?.submodel)p.submodel=selected.submodel;
      if(selected?.chassis)p.chassis=selected.chassis;
      if(selected?.engine)p.engine=selected.engine;
      if(selected?.liters)p.liters=selected.liters;
    }else if(mode==='model-chassis'){
      if(selected?.chassis)p.chassis=selected.chassis;
    }else if(mode==='model-submodel'){
      if(selected?.submodel)p.submodel=selected.submodel;
    }
    return new URLSearchParams(p);
  }
  async function readFitments(selected){
    if(!selected?.make&&!selected?.brand)return [];
    const modes=['exact','model-chassis','model-submodel','model'];
    for(const mode of modes){
      try{
        const r=await nativeFetch('/api/catalog/vehicle-fitments?'+paramsFor(selected,mode).toString(),{cache:'no-store'});
        if(!r.ok)continue;
        const rows=await r.json();
        if(Array.isArray(rows)&&rows.length)return rows;
      }catch{}
    }
    return [];
  }
  async function readVehicleProducts(selected){
    const fits=await readFitments(selected);
    const ids=[...new Set(fits.map(f=>Number(f.product_id)).filter(Number.isFinite))];
    if(!ids.length)return [];
    const chunks=await Promise.all(ids.map(async id=>{
      try{
        const r=await nativeFetch('/api/products/'+id,{cache:'no-store'});
        if(!r.ok)return null;
        return await r.json();
      }catch{return null}
    }));
    return chunks.filter(Boolean);
  }
  function jsonResponse(data){
    return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json','cache-control':'no-store'}});
  }

  window.fetch=async(input,init)=>{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const selected=getSelected();

    // The legacy storefront only requests 200 products before applying vehicle fitment.
    // For Shop by Car, bypass that cap and return every product attached to the selected vehicle.
    if(selected&&(url.startsWith('/api/products?')||url==='/api/products')){
      const products=await readVehicleProducts(selected);
      return jsonResponse(products);
    }

    // The legacy renderer also reads the protected admin fitment list and filters a second time.
    // Feed it the same public fitment rows and normalize the selected fields so valid matches are not discarded.
    if(url.startsWith('/api/admin/fitments')){
      if(selected?.make||selected?.brand){
        const rows=await readFitments(selected);
        const make=selected.make||selected.brand||'';
        const model=selected.model||selected.car_model||'';
        const chassis=selected.chassis||'';
        return jsonResponse(rows.map(f=>({...f,car_brand:make||f.car_brand,model:model||f.model,chassis:chassis||f.chassis})));
      }
      return nativeFetch('/api/catalog/vehicle-fitments',{cache:'no-store'});
    }

    return nativeFetch(input,init);
  };
})();
