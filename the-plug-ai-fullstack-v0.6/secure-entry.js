const http=require('http');
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');

const publicPort=Number(process.env.PORT||4173);
const internalPort=Number(process.env.INTERNAL_PORT||4174);
const adminUser=process.env.ADMIN_USERNAME||'';
const adminPass=process.env.ADMIN_PASSWORD||'';

if(!adminUser||!adminPass){
  console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be configured. Refusing to start insecure admin proxy.');
  process.exit(1);
}

const child=spawn(process.execPath,['server.js'],{
  cwd:__dirname,
  env:{...process.env,PORT:String(internalPort)},
  stdio:'inherit'
});
child.on('exit',(code)=>{console.error('Internal app exited',code);process.exit(code||1)});

function adminProtected(pathname){
  return pathname==='/admin'||pathname==='/admin/'||pathname==='/admin.html'||pathname==='/admin.js'||pathname==='/admin.css'||pathname.startsWith('/api/admin/');
}
function authorized(req){
  const h=req.headers.authorization||'';
  if(!h.startsWith('Basic '))return false;
  try{
    const decoded=Buffer.from(h.slice(6),'base64').toString('utf8');
    const idx=decoded.indexOf(':');
    if(idx<0)return false;
    const u=decoded.slice(0,idx),p=decoded.slice(idx+1);
    const a=Buffer.from(u),b=Buffer.from(adminUser),c=Buffer.from(p),d=Buffer.from(adminPass);
    return a.length===b.length&&c.length===d.length&&require('crypto').timingSafeEqual(a,b)&&require('crypto').timingSafeEqual(c,d);
  }catch{return false}
}
function challenge(res){
  res.writeHead(401,{
    'WWW-Authenticate':'Basic realm="The Plug Admin", charset="UTF-8"',
    'Content-Type':'text/plain; charset=utf-8',
    'Cache-Control':'no-store'
  });
  res.end('Authentication required');
}
function internalRequest(pathname,method='GET',headers={},body=null){
  return new Promise((resolve,reject)=>{
    const pr=http.request({hostname:'127.0.0.1',port:internalPort,path:pathname,method,headers:{host:`127.0.0.1:${internalPort}`,...headers}},pres=>{const chunks=[];pres.on('data',c=>chunks.push(c));pres.on('end',()=>resolve({status:pres.statusCode||500,headers:pres.headers,body:Buffer.concat(chunks)}))});
    pr.on('error',reject);if(body)pr.write(body);pr.end();
  });
}
const defaultSlides=[
  {image:'https://images.unsplash.com/photo-1774066811800-448b846647a2?auto=format&fit=crop&w=2200&q=85',label:'Mercedes-AMG GT',position:'center 55%',enabled:true},
  {image:'https://images.unsplash.com/photo-1762028159677-e45ac537a29a?auto=format&fit=crop&w=2200&q=85',label:'Audi RS6',position:'center 55%',enabled:true},
  {image:'https://images.unsplash.com/photo-1591076898712-f658e1e7edfb?auto=format&fit=crop&w=2200&q=85',label:'Porsche 911',position:'center 58%',enabled:true},
  {image:'https://images.unsplash.com/photo-1707406767272-8c1deea8f5b8?auto=format&fit=crop&w=2200&q=85',label:'BMW M3 Engine Bay',position:'center 48%',enabled:true}
];
async function publicCarousel(res){
  try{
    const r=await internalRequest('/api/admin/settings');
    const settings=JSON.parse(r.body.toString('utf8')||'{}');
    let slides=defaultSlides;
    if(settings.carousel_slides){try{const parsed=JSON.parse(settings.carousel_slides);if(Array.isArray(parsed)&&parsed.length)slides=parsed}catch{}}
    slides=slides.filter(x=>x&&x.enabled!==false&&x.image).map(x=>({image:String(x.image),label:String(x.label||'European performance'),position:String(x.position||'center center')}));
    const body=Buffer.from(JSON.stringify({slides:slides.length?slides:defaultSlides}));
    res.writeHead(200,{'content-type':'application/json','content-length':body.length,'cache-control':'no-store'});res.end(body);
  }catch(e){const body=Buffer.from(JSON.stringify({slides:defaultSlides}));res.writeHead(200,{'content-type':'application/json','content-length':body.length});res.end(body)}
}
async function adminScript(res){
  try{
    const r=await internalRequest('/admin.js');
    const extra=fs.readFileSync(path.join(__dirname,'public','admin-carousel.js'));
    const body=Buffer.concat([r.body,Buffer.from('\n;'),extra]);
    res.writeHead(r.status,{'content-type':'application/javascript; charset=utf-8','content-length':body.length,'cache-control':'no-store'});res.end(body);
  }catch(e){res.writeHead(500,{'content-type':'text/plain'});res.end('Unable to load admin scripts')}
}

const proxy=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/api/carousel'&&req.method==='GET')return publicCarousel(res);
  if(adminProtected(u.pathname)&&!authorized(req))return challenge(res);
  if(u.pathname==='/admin.js'&&req.method==='GET')return adminScript(res);
  const headers={...req.headers,host:`127.0.0.1:${internalPort}`};
  const pr=http.request({hostname:'127.0.0.1',port:internalPort,path:req.url,method:req.method,headers},pres=>{
    res.writeHead(pres.statusCode||500,pres.headers);
    pres.pipe(res);
  });
  pr.on('error',err=>{console.error('Proxy error',err);if(!res.headersSent)res.writeHead(502);res.end('Bad gateway')});
  req.pipe(pr);
});

proxy.listen(publicPort,()=>console.log(`Secure The Plug proxy on :${publicPort}; internal app on :${internalPort}`));
