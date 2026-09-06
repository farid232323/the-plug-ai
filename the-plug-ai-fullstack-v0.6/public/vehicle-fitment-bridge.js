(()=>{
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,init)=>{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(url.startsWith('/api/admin/fitments')){
      let selected=null;
      try{selected=JSON.parse(localStorage.getItem('plug-selected-vehicle')||'null')}catch{}
      if(selected?.make){
        const q=new URLSearchParams({
          make:selected.make||selected.brand||'',
          model:selected.model||selected.car_model||'',
          submodel:selected.submodel||'',
          chassis:selected.chassis||'',
          engine:selected.engine||'',
          liters:selected.liters||''
        });
        return nativeFetch('/api/catalog/vehicle-fitments?'+q.toString(),{cache:'no-store'});
      }
      return nativeFetch('/api/catalog/vehicle-fitments',{cache:'no-store'});
    }
    return nativeFetch(input,init);
  };
})();
