const fs=require('fs');
const path=require('path');

module.exports=function createRegistry(filePath=process.env.SUPPLIER_REGISTRY_PATH||'/data/suppliers.json'){
  const defaults=[
    {slug:'valvetronic',name:'Valvetronic Designs',brand_matches:['valvetronic'],adapter:'valvetronic',enabled:true,base_url:'https://valvetronic.com',login_url:'https://account.valvetronic.com',username:process.env.VALVETRONIC_DEALER_EMAIL||'',auth_mode:'email_otp',otp_mode:'manual_or_webhook'},
    {slug:'p3-gauges',name:'P3 Gauges',brand_matches:['p3 gauges','p3 gauge','p3'],adapter:'shopify',enabled:false,base_url:'https://p3.io',login_url:'https://p3.io/account/login',username:'',auth_mode:'account',otp_mode:'manual_or_webhook'},
    {slug:'autoid',name:'AUTOID',brand_matches:['autoid','auto id'],adapter:'shopify',enabled:false,base_url:'https://autoid.co',login_url:'https://app.autoid.com/users/sign_in',username:'',auth_mode:'account',otp_mode:'manual_or_webhook'}
  ];
  const clean=v=>String(v??'').trim();
  function ensureDir(){try{fs.mkdirSync(path.dirname(filePath),{recursive:true})}catch{}}
  function load(){
    try{const j=JSON.parse(fs.readFileSync(filePath,'utf8'));if(Array.isArray(j))return mergeDefaults(j)}catch{}
    const d=defaults.map(x=>({...x}));save(d);return d;
  }
  function mergeDefaults(list){const map=new Map(list.map(x=>[x.slug,x]));for(const d of defaults)if(!map.has(d.slug))map.set(d.slug,{...d});return [...map.values()]}
  function save(list){ensureDir();fs.writeFileSync(filePath,JSON.stringify(list,null,2));return list}
  function list(){return load().map(x=>({...x}))}
  function get(slug){return load().find(x=>x.slug===slug)||null}
  function normalizeSlug(v){return clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function upsert(input={}){
    const rows=load(),slug=normalizeSlug(input.slug||input.name);if(!slug)throw new Error('Supplier name is required');
    const i=rows.findIndex(x=>x.slug===slug),prev=i>=0?rows[i]:{};
    const next={...prev,...input,slug,name:clean(input.name||prev.name||slug),username:clean(input.username??prev.username),base_url:clean(input.base_url??prev.base_url),login_url:clean(input.login_url??prev.login_url),adapter:clean(input.adapter||prev.adapter||'shopify'),auth_mode:clean(input.auth_mode||prev.auth_mode||'account'),otp_mode:clean(input.otp_mode||prev.otp_mode||'manual_or_webhook'),enabled:input.enabled===undefined?(prev.enabled??false):!!input.enabled,brand_matches:Array.isArray(input.brand_matches)?input.brand_matches.map(clean).filter(Boolean):(prev.brand_matches||[clean(input.name||slug)])};
    if(i>=0)rows[i]=next;else rows.push(next);save(rows);return next;
  }
  function matchBrand(brand){const n=clean(brand).toLowerCase();if(!n)return null;return load().find(s=>s.enabled&&(s.brand_matches||[]).some(m=>{const q=clean(m).toLowerCase();return q&&(n===q||n.includes(q)||q.includes(n))}))||null}
  return{list,get,upsert,matchBrand,filePath};
};
