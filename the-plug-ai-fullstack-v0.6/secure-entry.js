const http=require('http');
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

const proxy=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(adminProtected(u.pathname)&&!authorized(req))return challenge(res);
  const headers={...req.headers,host:`127.0.0.1:${internalPort}`};
  const pr=http.request({hostname:'127.0.0.1',port:internalPort,path:req.url,method:req.method,headers},pres=>{
    res.writeHead(pres.statusCode||500,pres.headers);
    pres.pipe(res);
  });
  pr.on('error',err=>{console.error('Proxy error',err);if(!res.headersSent)res.writeHead(502);res.end('Bad gateway')});
  req.pipe(pr);
});

proxy.listen(publicPort,()=>console.log(`Secure The Plug proxy on :${publicPort}; internal app on :${internalPort}`));
