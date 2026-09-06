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

const defaultSlides=[
  {image:'https://images.unsplash.com/photo-1774066811800-448b846647a2?auto=format&fit=crop&w=2200&q=85',label:'Mercedes-AMG GT',position:'center 55%',enabled:true},
  {image:'https://images.unsplash.com/photo-1762028159677-e45ac537a29a?auto=format&fit=crop&w=2200&q=85',label:'Audi RS6',position:'center 55%',enabled:true},
  {image:'https://images.unsplash.com/photo-1591076898712-f658e1e7edfb?auto=format&fit=crop&w=2200&q=85',label:'Porsche 911',position:'center 58%',enabled:true},
  {image:'https://images.unsplash.com/photo-1707406767272-8c1deea8f5b8?auto=format&fit=crop&w=2200&q=85',label:'BMW M3 Engine Bay',position:'center 48%',enabled:true}
];
async function publicCarousel(res){try{const r=await internalRequest('/api/admin/settings');const settings=JSON.parse(r.body.toString('utf8')||'{}');let slides=defaultSlides;if(settings.carousel_slides){try{const parsed=JSON.parse(settings.carousel_slides);if(Array.isArray(parsed)&&parsed.length)slides=parsed}catch{}}slides=slides.filter(x=>x&&x.enabled!==false&&x.image).map(x=>({image:String(x.image),label:String(x.label||'European performance'),position:String(x.position||'center center')}));json(res,{slides:slides.length?slides:defaultSlides})}catch{json(res,{slides:defaultSlides})}}

let catalogDb=null;
function db(){if(!catalogDb)catalogDb=new DatabaseSync(path.join(__dirname,'data','theplug.sqlite'));return catalogDb}
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
function categorySlug(p){const s=((p.title||'')+' '+(p.description||'')).toLowerCase();
  if(/exhaust|axle[- ]?back|cat[- ]?back|filter[- ]?back/.test(s))return 'exhaust';
  if(/multi[- ]?gauge|\bgauge\b|obd2/.test(s))return 'gauges-displays';
  if(/wheel spacer|\bspacer(s)?\b|wheel bolt/.test(s))return 'wheel-spacers-hardware';
  if(/splitter|diffuser|spoiler|side skirt|mirror cover|wing mirror|rear wing|body kit|canard|arch guard|eye brow|eyebrow|shark fin|aerial cover/.test(s))return 'exterior-styling';
  if(/steering wheel|shift paddle|key cover|foot pedal/.test(s))return 'interior-accessories';
  if(/suspension|lowering spring|sportline/.test(s))return 'suspension';
  if(/\bintake\b|induction/.test(s))return 'air-intakes';
  if(/downpipe|sports cat|sport cat|hi-flow sports cat|high-flow sports cat/.test(s))return 'downpipes-sports-cats';
  if(/header(s)?|midpipe/.test(s))return 'headers-midpipes';
  if(/\bbrake(s|ing)?\b|rotor|brake pad|caliper/.test(s))return 'braking';
  if(/fuel pump|fuel delivery|high pressure fuel|hpfp|lpfp/.test(s))return 'fuel-pumps';
  return null;
}
function catalogProducts(){return db().prepare("SELECT p.id,p.brand_name,p.mfg_part_id,p.the_plug_id,p.title,p.short_description,p.description,p.msrp_sar,p.price_sar,p.status,(SELECT url FROM product_images i WHERE i.product_id=p.id ORDER BY sort_order,id LIMIT 1) image FROM products p WHERE p.status='active' ORDER BY p.updated_at DESC,p.id DESC").all()}
function publicCategories(res){try{const counts=new Map(categoryDefs.map(c=>[c.slug,0]));for(const p of catalogProducts()){const slug=categorySlug(p);if(slug)counts.set(slug,(counts.get(slug)||0)+1)}const categories=categoryDefs.map(c=>({...c,count:counts.get(c.slug)||0})).filter(c=>c.count>0);json(res,{categories})}catch(e){console.error('Category API error',e);json(res,{categories:[]},500)}}
function publicCategory(res,slug){try{const def=categoryDefs.find(c=>c.slug===slug);if(!def)return json(res,{error:'Category not found'},404);const products=catalogProducts().filter(p=>categorySlug(p)===slug);json(res,{category:{...def,count:products.length},products})}catch(e){console.error('Category API error',e);json(res,{error:'Unable to load category'},500)}}

async function appendScript(res,sourcePath,extraPaths){try{const r=await internalRequest(sourcePath);const extras=(Array.isArray(extraPaths)?extraPaths:[extraPaths]).filter(Boolean).map(p=>fs.readFileSync(path.join(__dirname,'public',p)));const pieces=[r.body];for(const extra of extras)pieces.push(Buffer.from('\n;'),extra);const body=Buffer.concat(pieces);res.writeHead(r.status,{'content-type':'application/javascript; charset=utf-8','content-length':body.length,'cache-control':'no-store'});res.end(body)}catch(e){console.error('Script injection error',e);res.writeHead(500,{'content-type':'text/plain'});res.end('Unable to load scripts')}}

const proxy=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/api/carousel'&&req.method==='GET')return publicCarousel(res);
  if(u.pathname==='/api/catalog/categories'&&req.method==='GET')return publicCategories(res);
  const catMatch=u.pathname.match(/^\/api\/catalog\/category\/([^/]+)$/);if(catMatch&&req.method==='GET')return publicCategory(res,decodeURIComponent(catMatch[1]));
  if(adminProtected(u.pathname)&&!authorized(req))return challenge(res);
  if(u.pathname==='/admin.js'&&req.method==='GET')return appendScript(res,'/admin.js',['admin-carousel.js']);
  if(u.pathname==='/api-storefront.js'&&req.method==='GET')return appendScript(res,'/api-storefront.js',['category-menu.js','product-page-cleanup.js','category-count-cleanup.js','product-media-polish.js','nav-hover-controller.js']);
  if(u.pathname==='/carousel-enhancement.js'&&req.method==='GET')return appendScript(res,'/carousel-enhancement.js',['carousel-managed.js']);
  const headers={...req.headers,host:`127.0.0.1:${internalPort}`};
  const pr=http.request({hostname:'127.0.0.1',port:internalPort,path:req.url,method:req.method,headers},pres=>{res.writeHead(pres.statusCode||500,pres.headers);pres.pipe(res)});
  pr.on('error',err=>{console.error('Proxy error',err);if(!res.headersSent)res.writeHead(502);res.end('Bad gateway')});req.pipe(pr);
});

proxy.listen(publicPort,()=>console.log(`Secure The Plug proxy on :${publicPort}; internal app on :${internalPort}`));
