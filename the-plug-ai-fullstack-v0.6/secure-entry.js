const http=require('http');
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const {DatabaseSync}=require('node:sqlite');

const publicPort=Number(process.env.PORT||4173);
const internalPort=Number(process.env.INTERNAL_PORT||4174);
const adminUser=process.env.ADMIN_USERNAME||'';
const adminPass=process.env.ADMIN_PASSWORD||'';

if(!adminUser||!adminPass){console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be configured. Refusing to start insecure admin proxy.');process.exit(1)}

const child=spawn(process.execPath,['server.js'],{cwd:__dirname,env:{...process.env,PORT:String(internalPort)},stdio:'inherit'});
child.on('exit',(code)=>{console.error('Internal app exited',code);process.exit(code||1)});

function adminProtected(pathname){return pathname==='/admin'||pathname==='/admin/'||pathname==='/admin.html'||pathname==='/admin.js'||pathname==='/admin.css'||pathname.startsWith('/api/admin/')}
function authorized(req){const h=req.headers.authorization||'';if(!h.startsWith('Basic '))return false;try{const decoded=Buffer.from(h.slice(6),'base64').toString('utf8');const idx=decoded.indexOf(':');if(idx<0)return false;const u=decoded.slice(0,idx),p=decoded.slice(idx+1);const a=Buffer.from(u),b=Buffer.from(adminUser),c=Buffer.from(p),d=Buffer.from(adminPass);return a.length===b.length&&c.length===d.length&&require('crypto').timingSafeEqual(a,b)&&require('crypto').timingSafeEqual(c,d)}catch{return false}}
function challenge(res){res.writeHead(401,{'WWW-Authenticate':'Basic realm="The Plug Admin", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('Authentication required')}
function internalRequest(pathname,method='GET',headers={},body=null){return new Promise((resolve,reject)=>{const pr=http.request({hostname:'127.0.0.1',port:internalPort,path:pathname,method,headers:{host:`127.0.0.1:${internalPort}`,...headers}},pres=>{const chunks=[];pres.on('data',c=>chunks.push(c));pres.on('end',()=>resolve({status:pres.statusCode||500,headers:pres.headers,body:Buffer.concat(chunks)}))});pr.on('error',reject);if(body)pr.write(body);pr.end()})}
function json(res,obj,status=200){const body=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'content-type':'application/json','content-length':body.length,'cache-control':'no-store'});res.end(body)}

let catalogDb=null;
function db(){if(!catalogDb)catalogDb=new DatabaseSync(path.join(__dirname,'data','theplug.sqlite'));return catalogDb}

const defaultSlides=[
  {image:'https://images.unsplash.com/photo-1774066811800-448b846647a2?auto=format&fit=crop&w=2200&q=85',label:'Mercedes-AMG GT',position:'center 55%',enabled:true},
  {image:'https://images.unsplash.com/photo-1762028159677-e45ac537a29a?auto=format&fit=crop&w=2200&q=85',label:'Audi RS6',position:'center 55%',enabled:true},
  {image:'https://images.unsplash.com/photo-1707406767272-8c1deea8f5b8?auto=format&fit=crop&w=2200&q=85',label:'BMW M3 Engine Bay',position:'center 48%',enabled:true}
];
function publicCarousel(res){
  try{
    const row=db().prepare("SELECT value FROM settings WHERE key='carousel_slides'").get();
    let source='default',slides=defaultSlides;
    if(row&&row.value){
      try{
        const parsed=JSON.parse(row.value);
        if(Array.isArray(parsed)){slides=parsed;source='backend'}
      }catch(e){console.error('Invalid saved carousel settings',e.message)}
    }
    slides=(Array.isArray(slides)?slides:[]).filter(x=>x&&x.enabled!==false&&x.image).map(x=>({image:String(x.image),label:String(x.label||'European performance'),position:String(x.position||'center center')}));
    return json(res,{slides,source});
  }catch(e){
    console.error('Carousel settings read failed',e);
    return json(res,{slides:defaultSlides,source:'default'});
  }
}
async function publicSiteSettings(res){try{const r=await internalRequest('/api/admin/settings');const s=JSON.parse(r.body.toString('utf8')||'{}');const keys=['hero_headline','hero_subheading','shipping_threshold','support_email','promo_bar_enabled','promo_bar_text','seo_title','seo_description','frontend_config'];const out={};for(const k of keys)if(s[k]!==undefined)out[k]=String(s[k]);json(res,out)}catch(e){console.error('Site settings API error',e);json(res,{promo_bar_enabled:'true',promo_bar_text:'Free standard shipping to Saudi Arabia over {threshold}',shipping_threshold:'1400'})}}

const categoryDefs=[
  {name:'Exhaust',slug:'exhaust',description:'Valved, cat-back, axle-back and performance exhaust systems'},
  {name:'Gauges & Displays',slug:'gauges-displays',description:'OBD2 multi-gauges and driver display upgrades'},
  {name:'Exterior Styling',slug:'exterior-styling',description:'Splitters, diffusers, spoilers, body kits and carbon exterior parts'},
  {name:'Wheel Spacers & Hardware',slug:'wheel-spacers-hardware',description:'Wheel spacers, bolts and related fitment hardware'},
  {name:'Air Intakes',slug:'air-intakes',description:'Performance intake systems and induction upgrades'},
  {name:'Suspension',slug:'suspension',description:'Lowering springs and suspension upgrades'},
  {name:'Interior Accessories',slug:'interior-accessories',description:'Steering wheels, shift paddles, pedals and interior trim'},
  {name:'Downpipes & Sports Cats',slug:'downpipes-sports-cats',description:'Downpipes and high-flow sports catalysts'},
  {name:'Headers & Midpipes',slug:'headers-midpipes',description:'Performance headers and midpipe upgrades'},
  {name:'Braking',slug:'braking',description:'Brake system upgrades and components'},
  {name:'Fuel Pumps',slug:'fuel-pumps',description:'Fuel delivery and pump upgrades'}
];
function categorySlug(p){const s=((p.title||'')+' '+(p.description||'')).toLowerCase();if(/exhaust|axle[- ]?back|cat[- ]?back|filter[- ]?back/.test(s))return'exhaust';if(/multi[- ]?gauge|\bgauge\b|obd2/.test(s))return'gauges-displays';if(/wheel spacer|\bspacer(s)?\b|wheel bolt/.test(s))return'wheel-spacers-hardware';if(/splitter|diffuser|spoiler|side skirt|mirror cover|wing mirror|rear wing|body kit|canard|arch guard|eye brow|eyebrow|shark fin|aerial cover/.test(s))return'exterior-styling';if(/steering wheel|shift paddle|key cover|foot pedal/.test(s))return'interior-accessories';if(/suspension|lowering spring|sportline/.test(s))return'suspension';if(/\bintake\b|induction/.test(s))return'air-intakes';if(/downpipe|sports cat|sport cat|hi-flow sports cat|high-flow sports cat/.test(s))return'downpipes-sports-cats';if(/header(s)?|midpipe/.test(s))return'headers-midpipes';if(/\bbrake(s|ing)?\b|rotor|brake pad|caliper/.test(s))return'braking';if(/fuel pump|fuel delivery|high pressure fuel|hpfp|lpfp/.test(s))return'fuel-pumps';return null}
function catalogProducts(){return db().prepare("SELECT p.id,p.brand_name,p.mfg_part_id,p.the_plug_id,p.title,p.short_description,p.description,p.msrp_sar,p.price_sar,p.status,(SELECT url FROM product_images i WHERE i.product_id=p.id ORDER BY sort_order,id LIMIT 1) image FROM products p WHERE p.status='active' ORDER BY p.updated_at DESC,p.id DESC").all()}
function publicCategories(res){try{const counts=new Map(categoryDefs.map(c=>[c.slug,0]));for(const p of catalogProducts()){const slug=categorySlug(p);if(slug)counts.set(slug,(counts.get(slug)||0)+1)}const categories=categoryDefs.map(c=>({...c,count:counts.get(c.slug)||0})).filter(c=>c.count>0);json(res,{categories})}catch(e){console.error('Category API error',e);json(res,{categories:[]},500)}}
function publicCategory(res,slug){try{const def=categoryDefs.find(c=>c.slug===slug);if(!def)return json(res,{error:'Category not found'},404);const products=catalogProducts().filter(p=>categorySlug(p)===slug);json(res,{category:{...def,count:products.length},products})}catch(e){console.error('Category API error',e);json(res,{error:'Unable to load category'},500)}}

function tidy(v){return String(v||'').replace(/\s+/g,' ').trim()}
function cleanChassis(v){return tidy(v).replace(/^Audi\s+/i,'').replace(/\s*\((?:UKL1 Platform|SAV|SAC)\)$/i,'').trim()}
function cleanLiters(v){const s=tidy(v);if(!s)return'';const m=s.match(/\d+(?:\.\d+)?/);return m?`${m[0]}L`:s}
function splitVehicle(make,raw,trim){let s=tidy(raw).replace(/Coupé/gi,'Coupe');let base='';const rules={BMW:[/^(1 Series M Coupe|1M)\b/i,/^(X[3-6]\sM)\b/i,/^(M\d)\b/i,/^(M\d{3}[a-z]*)\b/i,/^(\d{3}[a-z]*)\b/i,/^(X\d)\b/i,/^(Z\d)\b/i,/^(i\d)\b/i],Audi:[/^(RS\s?Q\d|RS\s?\d|RSQ\d)\b/i,/^(S\d|A\d|Q\d)\b/i,/^(R8|TT RS|TTRS|TTS|TT)\b/i],Porsche:[/^(911|718|Cayenne|Macan|Panamera|Taycan)\b/i],Toyota:[/^(GR Supra)\b/i],Mercedes:[/^(AMG\sGT|[A-Z]{1,3}\s?\d{2,3})\b/i],"Mercedes-Benz":[/^(AMG\sGT|[A-Z]{1,3}\s?\d{2,3})\b/i]};for(const re of (rules[make]||[])){const m=s.match(re);if(m){base=m[1];break}}if(!base)base=s.split(' ')[0]||s;let sub=tidy(trim)||tidy(s.slice(base.length));sub=sub.replace(/^[-–—/]+\s*/,'').trim();if(!sub)sub='Standard';if(/^1 Series M Coupe$/i.test(base))base='1M';return{model:base,submodel:sub}}
function publicVehicleHierarchy(res){try{const rows=db().prepare("SELECT DISTINCT car_brand,model,trim,chassis,engine,liters FROM fitments WHERE trim(coalesce(car_brand,''))<>'' AND trim(coalesce(model,''))<>'' ORDER BY car_brand,model,chassis,engine,liters").all();const brands={};for(const r of rows){const make=tidy(r.car_brand);if(!make||/^(Scion|Subaru)$/i.test(make))continue;if(/^Toyota$/i.test(make)&&(!/supra/i.test(r.model)||(!/B58/i.test(r.engine||'')&&!/^3(?:\.0)?\b/.test(tidy(r.liters)))))continue;const {model,submodel}=splitVehicle(make,r.model,r.trim);const chassis=cleanChassis(r.chassis);const engine=tidy(r.engine);const liters=cleanLiters(r.liters);const spec={chassis,engine,liters,raw_model:tidy(r.model)};brands[make]??={};brands[make][model]??={};brands[make][model][submodel]??=[];const arr=brands[make][model][submodel];const key=[chassis,engine,liters].join('|').toLowerCase();if(!arr.some(x=>[x.chassis,x.engine,x.liters].join('|').toLowerCase()===key))arr.push(spec)}for(const make of Object.keys(brands)){for(const model of Object.keys(brands[make])){for(const sub of Object.keys(brands[make][model]))brands[make][model][sub].sort((a,b)=>`${a.chassis} ${a.engine} ${a.liters}`.localeCompare(`${b.chassis} ${b.engine} ${b.liters}`,undefined,{numeric:true,sensitivity:'base'}))}}json(res,{brands})}catch(e){console.error('Vehicle hierarchy API error',e);json(res,{brands:{}},500)}}

function sameLoose(a,b){a=tidy(a).toLowerCase();b=tidy(b).toLowerCase();return !a||!b||a===b||a.includes(b)||b.includes(a)}
function publicVehicleFitments(res,u){try{const make=tidy(u.searchParams.get('make'));const model=tidy(u.searchParams.get('model'));const submodel=tidy(u.searchParams.get('submodel'));const chassis=cleanChassis(u.searchParams.get('chassis'));const engine=tidy(u.searchParams.get('engine'));const liters=cleanLiters(u.searchParams.get('liters'));let rows=make?db().prepare("SELECT f.* FROM fitments f JOIN products p ON p.id=f.product_id WHERE p.status='active' AND lower(trim(f.car_brand))=lower(trim(?)) ORDER BY f.product_id").all(make):db().prepare("SELECT f.* FROM fitments f JOIN products p ON p.id=f.product_id WHERE p.status='active' ORDER BY f.product_id").all();if(model||submodel||chassis||engine||liters){rows=rows.filter(f=>{const parts=splitVehicle(tidy(f.car_brand),f.model,f.trim);const modelOk=!model||sameLoose(f.model,model)||sameLoose(parts.model,model);const subOk=!submodel||submodel==='Standard'||sameLoose(parts.submodel,submodel)||sameLoose(f.trim,submodel);const chOk=!chassis||sameLoose(cleanChassis(f.chassis),chassis);const engOk=!engine||sameLoose(f.engine,engine);const litOk=!liters||cleanLiters(f.liters)===liters;return modelOk&&subOk&&chOk&&engOk&&litOk});}json(res,rows)}catch(e){console.error('Vehicle fitment API error',e);json(res,[],500)}}

async function appendScript(res,sourcePath,extraPaths){try{const r=await internalRequest(sourcePath);const extras=(Array.isArray(extraPaths)?extraPaths:[extraPaths]).filter(Boolean).map(p=>fs.readFileSync(path.join(__dirname,'public',p)));const pieces=[r.body];for(const extra of extras)pieces.push(Buffer.from('\n;'),extra);const body=Buffer.concat(pieces);res.writeHead(r.status,{'content-type':'application/javascript; charset=utf-8','content-length':body.length,'cache-control':'no-store'});res.end(body)}catch(e){console.error('Script injection error',e);res.writeHead(500,{'content-type':'text/plain'});res.end('Unable to load scripts')}}

const proxy=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname==='/api/carousel'&&req.method==='GET')return publicCarousel(res);if(u.pathname==='/api/site-settings'&&req.method==='GET')return publicSiteSettings(res);if(u.pathname==='/api/catalog/categories'&&req.method==='GET')return publicCategories(res);if(u.pathname==='/api/catalog/vehicles'&&req.method==='GET')return publicVehicleHierarchy(res);if(u.pathname==='/api/catalog/vehicle-fitments'&&req.method==='GET')return publicVehicleFitments(res,u);const catMatch=u.pathname.match(/^\/api\/catalog\/category\/([^/]+)$/);if(catMatch&&req.method==='GET')return publicCategory(res,decodeURIComponent(catMatch[1]));if(adminProtected(u.pathname)&&!authorized(req))return challenge(res);if(u.pathname==='/admin.js'&&req.method==='GET')return appendScript(res,'/admin.js',['admin-carousel.js','admin-content-fix.js','admin-currency.js','admin-frontend-manager.js']);if(u.pathname==='/api-storefront.js'&&req.method==='GET')return appendScript(res,'/api-storefront.js',['vehicle-fitment-bridge.js','category-menu.js','product-page-cleanup.js','category-count-cleanup.js','product-media-polish.js','nav-hover-controller.js','about-mobile-polish.js','brand-logo-fix.js','homepage-order.js','site-content.js','frontend-functional-polish.js','brand-typography.js','remove-admin-nav.js','frontend-control.js','shipping-policy-cleanup.js','modern-brand-menu.js']);if(u.pathname==='/carousel-enhancement.js'&&req.method==='GET')return appendScript(res,'/carousel-enhancement.js',['carousel-managed.js','homepage-order-final.js','site-content.js']);const headers={...req.headers,host:`127.0.0.1:${internalPort}`};const pr=http.request({hostname:'127.0.0.1',port:internalPort,path:req.url,method:req.method,headers},pres=>{res.writeHead(pres.statusCode||500,pres.headers);pres.pipe(res)});pr.on('error',err=>{console.error('Proxy error',err);if(!res.headersSent)res.writeHead(502);res.end('Bad gateway')});req.pipe(pr)});
proxy.listen(publicPort,()=>console.log(`Secure The Plug proxy on :${publicPort}; internal app on :${internalPort}`));