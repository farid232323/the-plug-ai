const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {spawn}=require('child_process');
const {DatabaseSync}=require('node:sqlite');

const PUBLIC_PORT=Number(process.env.PORT||4173);
const APP_PORT=Number(process.env.GATEWAY_APP_PORT||4175);
const ROOT=__dirname;
const db=new DatabaseSync(path.join(ROOT,'data','theplug.sqlite'));
const ADMIN_USER=process.env.ADMIN_USERNAME||'';
const ADMIN_PASS=process.env.ADMIN_PASSWORD||'';

// Run the existing secure application unchanged behind this customer-commerce gateway.
const child=spawn(process.execPath,['secure-entry.js'],{cwd:ROOT,env:{...process.env,PORT:String(APP_PORT)},stdio:'inherit'});
child.on('exit',code=>{console.error('Secure app exited',code);process.exit(code||1)});

function ensureColumn(table,col,def){try{db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`)}catch(e){if(!String(e.message).includes('duplicate column'))throw e}}
db.exec(`CREATE TABLE IF NOT EXISTS customer_sessions(id INTEGER PRIMARY KEY,customer_id INTEGER,token_hash TEXT UNIQUE,created_at TEXT DEFAULT CURRENT_TIMESTAMP,expires_at TEXT,FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS email_events(id INTEGER PRIMARY KEY,event_type TEXT,email TEXT,status TEXT,provider_id TEXT,error TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
ensureColumn('customers','password_hash','TEXT');
ensureColumn('customers','phone','TEXT');
ensureColumn('customers','username','TEXT');
ensureColumn('orders','phone','TEXT');
ensureColumn('orders','customer_id','INTEGER');

function clean(v){return String(v??'').trim()}
function usernameCandidate(c){const first=clean(c.first_name).replace(/[^a-zA-Z0-9._-]/g,'');if(first)return first;const email=clean(c.email).split('@')[0].replace(/[^a-zA-Z0-9._-]/g,'');return email||`customer${c.id}`}
function backfillUsernames(){try{const rows=db.prepare("SELECT id,first_name,email,username FROM customers").all();for(const c of rows){if(clean(c.username))continue;let base=usernameCandidate(c).slice(0,40)||`customer${c.id}`,candidate=base,n=1;while(db.prepare('SELECT id FROM customers WHERE lower(username)=lower(?) AND id<>?').get(candidate,c.id))candidate=(base.slice(0,35)+'-'+(++n));db.prepare('UPDATE customers SET username=? WHERE id=?').run(candidate,c.id)}}catch(e){console.error('Username backfill failed',e.message)}}
backfillUsernames();

function json(res,obj,status=200){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'content-type':'application/json','content-length':b.length,'cache-control':'no-store'});res.end(b)}
function readJson(req){return new Promise(resolve=>{const a=[];req.on('data',c=>a.push(c));req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(a).toString()||'{}'))}catch{resolve({})}});req.on('error',()=>resolve({}))})}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v))}
function validUsername(v){return /^[A-Za-z0-9._-]{3,40}$/.test(clean(v))}
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){const hash=crypto.scryptSync(String(password),salt,64).toString('hex');return `${salt}:${hash}`}
function verifyPassword(password,stored){try{const [salt,hex]=String(stored||'').split(':');if(!salt||!hex)return false;const a=Buffer.from(hex,'hex'),b=crypto.scryptSync(String(password),salt,64);return a.length===b.length&&crypto.timingSafeEqual(a,b)}catch{return false}}
function issueSession(customerId){const token=crypto.randomBytes(32).toString('hex');const tokenHash=crypto.createHash('sha256').update(token).digest('hex');const expires=new Date(Date.now()+30*24*60*60*1000).toISOString();db.prepare('INSERT INTO customer_sessions(customer_id,token_hash,expires_at) VALUES(?,?,?)').run(customerId,tokenHash,expires);return token}
function customerFromToken(token){if(!token)return null;const h=crypto.createHash('sha256').update(String(token)).digest('hex');return db.prepare(`SELECT c.id,c.username,c.first_name,c.last_name,c.email,c.phone,s.expires_at FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=? AND datetime(s.expires_at)>datetime('now')`).get(h)||null}
function customerPayload(c,token){return {id:c.id,username:c.username||usernameCandidate(c),first_name:c.first_name||'',last_name:c.last_name||'',email:c.email||'',phone:c.phone||'',token}}
function money(n){return new Intl.NumberFormat('en-SA',{style:'currency',currency:'SAR',maximumFractionDigits:2}).format(Number(n||0))}
function emailShell(title,body){return `<!doctype html><html><body style="margin:0;background:#f4f7f9;font-family:Arial,sans-serif;color:#132135"><div style="max-width:620px;margin:32px auto;background:#fff;border-top:8px solid #F8FF66;padding:28px"><img src="https://the-plug-ai-live-production.up.railway.app/assets/logo.png" alt="The Plug" style="width:120px;height:auto"><h1 style="font-size:28px;margin:26px 0 12px">${title}</h1>${body}<p style="margin-top:30px;color:#697680;font-size:13px">The Plug · Arriving in Style<br>customerservice@theplug.inc</p></div></body></html>`}
async function sendEmail(eventType,to,subject,html){const key=process.env.RESEND_API_KEY||'';const from=process.env.EMAIL_FROM||'';if(!key||!from){db.prepare('INSERT INTO email_events(event_type,email,status,error) VALUES(?,?,?,?)').run(eventType,to,'skipped','Email provider is not configured');return {sent:false,configured:false}}
  try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${key}`,'content-type':'application/json'},body:JSON.stringify({from,to:[to],subject,html})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||`Email provider returned ${r.status}`);db.prepare('INSERT INTO email_events(event_type,email,status,provider_id) VALUES(?,?,?,?)').run(eventType,to,'sent',j.id||'');return {sent:true,id:j.id||''}}catch(e){db.prepare('INSERT INTO email_events(event_type,email,status,error) VALUES(?,?,?,?)').run(eventType,to,'failed',String(e.message||e));console.error('Email send failed',eventType,to,e.message);return {sent:false,error:String(e.message||e)}}}
async function notifyAdmin(eventType,subject,html){const to=process.env.NOTIFY_EMAIL||'';if(to&&validEmail(to))await sendEmail('admin_'+eventType,to,subject,html)}

function adminAuthorized(req){const h=req.headers.authorization||'';if(!ADMIN_USER||!ADMIN_PASS||!h.startsWith('Basic '))return false;try{const decoded=Buffer.from(h.slice(6),'base64').toString('utf8');const i=decoded.indexOf(':');if(i<0)return false;const u=Buffer.from(decoded.slice(0,i)),p=Buffer.from(decoded.slice(i+1)),eu=Buffer.from(ADMIN_USER),ep=Buffer.from(ADMIN_PASS);return u.length===eu.length&&p.length===ep.length&&crypto.timingSafeEqual(u,eu)&&crypto.timingSafeEqual(p,ep)}catch{return false}}
function adminChallenge(res){res.writeHead(401,{'WWW-Authenticate':'Basic realm="The Plug Admin", charset="UTF-8"','content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({error:'Authentication required'}))}
async function adminCustomerApi(req,res,u){
  if(!adminAuthorized(req))return adminChallenge(res);
  const p=u.pathname;
  if(p==='/api/admin/customer-accounts'&&req.method==='GET'){
    const q=clean(u.searchParams.get('q')).toLowerCase(),status=clean(u.searchParams.get('status'));
    let rows=db.prepare(`SELECT c.id,c.username,c.first_name,c.last_name,c.email,c.phone,c.status,c.created_at,
      (SELECT count(*) FROM orders o WHERE o.customer_id=c.id OR lower(o.email)=lower(c.email)) order_count,
      (SELECT coalesce(sum(o.total),0) FROM orders o WHERE o.customer_id=c.id OR lower(o.email)=lower(c.email)) total_spend,
      (SELECT max(o.created_at) FROM orders o WHERE o.customer_id=c.id OR lower(o.email)=lower(c.email)) last_order
      FROM customers c ORDER BY c.id DESC`).all();
    if(status)rows=rows.filter(c=>String(c.status||'active')===status);
    if(q)rows=rows.filter(c=>[c.username,c.first_name,c.last_name,c.email,c.phone].some(v=>String(v||'').toLowerCase().includes(q)));
    const summary={total:db.prepare('SELECT count(*) c FROM customers').get().c,active:db.prepare("SELECT count(*) c FROM customers WHERE coalesce(status,'active')='active'").get().c,orders:db.prepare('SELECT count(*) c FROM orders').get().c,revenue:db.prepare('SELECT coalesce(sum(total),0) v FROM orders').get().v};
    return json(res,{customers:rows,summary});
  }
  const m=p.match(/^\/api\/admin\/customer-accounts\/(\d+)$/);
  if(m&&req.method==='GET'){
    const id=Number(m[1]);const c=db.prepare(`SELECT c.id,c.username,c.first_name,c.last_name,c.email,c.phone,c.status,c.created_at,
      (SELECT count(*) FROM orders o WHERE o.customer_id=c.id OR lower(o.email)=lower(c.email)) order_count,
      (SELECT coalesce(sum(o.total),0) FROM orders o WHERE o.customer_id=c.id OR lower(o.email)=lower(c.email)) total_spend
      FROM customers c WHERE c.id=?`).get(id);if(!c)return json(res,{error:'Customer not found'},404);
    const orders=db.prepare('SELECT id,order_no,total,status,customer_name,email,phone,created_at FROM orders WHERE customer_id=? OR lower(email)=lower(?) ORDER BY id DESC LIMIT 100').all(id,c.email);
    const email_events=db.prepare('SELECT event_type,email,status,provider_id,error,created_at FROM email_events WHERE lower(email)=lower(?) ORDER BY id DESC LIMIT 50').all(c.email);
    return json(res,{customer:c,orders,email_events});
  }
  if(m&&req.method==='PATCH'){
    const id=Number(m[1]),d=await readJson(req);const status=clean(d.status);if(!['active','suspended'].includes(status))return json(res,{error:'Invalid customer status'},400);const r=db.prepare('UPDATE customers SET status=? WHERE id=?').run(status,id);if(!r.changes)return json(res,{error:'Customer not found'},404);if(status!=='active')db.prepare('DELETE FROM customer_sessions WHERE customer_id=?').run(id);return json(res,{ok:true,status});
  }
  return false;
}

async function shopApi(req,res,u){const p=u.pathname,d=req.method==='GET'?{}:await readJson(req);
  if(p==='/api/shop/register'&&req.method==='POST'){
    const username=clean(d.username),email=clean(d.email).toLowerCase(),password=String(d.password||'');if(!validUsername(username))return json(res,{error:'Username must be 3–40 characters and use only letters, numbers, dots, hyphens or underscores.'},400);if(!validEmail(email))return json(res,{error:'Enter a valid email address.'},400);if(password.length<8)return json(res,{error:'Password must be at least 8 characters.'},400);if(db.prepare('SELECT id FROM customers WHERE lower(email)=lower(?)').get(email))return json(res,{error:'An account already exists with this email.'},409);if(db.prepare('SELECT id FROM customers WHERE lower(username)=lower(?)').get(username))return json(res,{error:'That username is already taken.'},409);
    const r=db.prepare('INSERT INTO customers(username,first_name,last_name,email,phone,password_hash,status) VALUES(?,?,?,?,?,?,?)').run(username,clean(d.first_name)||username,clean(d.last_name),email,clean(d.phone),hashPassword(password),'active');const c=db.prepare('SELECT id,username,first_name,last_name,email,phone FROM customers WHERE id=?').get(r.lastInsertRowid);const token=issueSession(c.id);
    const html=emailShell('Welcome to The Plug',`<p>Hi ${clean(c.username)||'there'},</p><p>Your account has been created successfully. You can now sign in, keep your orders together and check out faster.</p>`);await sendEmail('account_created',email,'Welcome to The Plug',html);notifyAdmin('account_created','New The Plug account created',emailShell('New customer account',`<p>${clean(c.username)}</p><p>${email}</p>`));
    return json(res,{customer:customerPayload(c,token)},201);
  }
  if(p==='/api/shop/login'&&req.method==='POST'){
    const identifier=clean(d.identifier||d.email).toLowerCase();const c=db.prepare('SELECT * FROM customers WHERE (lower(email)=lower(?) OR lower(username)=lower(?)) AND status=?').get(identifier,identifier,'active');if(!c||!verifyPassword(d.password,c.password_hash))return json(res,{error:'Incorrect username/email or password.'},401);const token=issueSession(c.id);return json(res,{customer:customerPayload(c,token)});
  }
  if(p==='/api/shop/me'&&req.method==='GET'){
    const c=customerFromToken(u.searchParams.get('token'));if(!c)return json(res,{error:'Session expired.'},401);return json(res,{customer:customerPayload(c,u.searchParams.get('token'))});
  }
  if(p==='/api/shop/orders'&&req.method==='GET'){
    const c=customerFromToken(u.searchParams.get('token'));if(!c)return json(res,{orders:[]},401);const orders=db.prepare('SELECT id,order_no,total,status,customer_name,email,created_at FROM orders WHERE customer_id=? OR lower(email)=lower(?) ORDER BY id DESC LIMIT 50').all(c.id,c.email);return json(res,{orders});
  }
  if(p==='/api/shop/logout'&&req.method==='POST'){
    if(d.token){const h=crypto.createHash('sha256').update(String(d.token)).digest('hex');db.prepare('DELETE FROM customer_sessions WHERE token_hash=?').run(h)}return json(res,{ok:true});
  }
  if(p==='/api/shop/cart-event'&&req.method==='POST'){
    const email=clean(d.email).toLowerCase();if(!validEmail(email))return json(res,{ok:true,email_sent:false});const item=d.item||{};const title=clean(item.title||item.name||'Product');const price=Number(item.price_sar||item.price||0);const html=emailShell('Added to your cart',`<p>Hi ${clean(d.name)||'there'},</p><p><b>${title}</b> has been added to your cart.</p><p>Price: <b>${money(price)}</b></p><p>Your cart currently has ${Number(d.cart_count||1)} item${Number(d.cart_count||1)===1?'':'s'}.</p><p><a href="https://the-plug-ai-live-production.up.railway.app/#cart" style="display:inline-block;background:#F8FF66;color:#132135;padding:12px 18px;text-decoration:none;font-weight:bold">View cart</a></p>`);const sent=await sendEmail('cart_added',email,'You added an item to your The Plug cart',html);return json(res,{ok:true,email_sent:sent.sent});
  }
  if(p==='/api/shop/order'&&req.method==='POST'){
    const email=clean(d.email).toLowerCase();if(!validEmail(email))return json(res,{error:'A valid email address is required to place an order.'},400);const user=customerFromToken(d.token);const no='TP-'+Date.now().toString().slice(-8);const items=Array.isArray(d.items)?d.items:[];if(!items.length)return json(res,{error:'Your cart is empty.'},400);const total=Number(d.total||items.reduce((s,x)=>s+Number(x.price||0)*Number(x.qty||1),0));
    const displayName=user?.username||clean(d.customer_name)||'Guest';const r=db.prepare('INSERT INTO orders(order_no,customer_name,email,phone,total,status,customer_id) VALUES(?,?,?,?,?,?,?)').run(no,displayName,email,clean(d.phone),total,'placed',user?.id||null);for(const x of items)db.prepare('INSERT INTO order_items(order_id,product_id,title,qty,price) VALUES(?,?,?,?,?)').run(r.lastInsertRowid,x.product_id||null,clean(x.title)||'Product',Number(x.qty||1),Number(x.price||0));
    const rows=items.map(x=>`<tr><td style="padding:8px 0">${clean(x.title)||'Product'} × ${Number(x.qty||1)}</td><td style="padding:8px 0;text-align:right">${money(Number(x.price||0)*Number(x.qty||1))}</td></tr>`).join('');const html=emailShell(`Order ${no} confirmed`,`<p>Thank you for your order.</p><table style="width:100%;border-collapse:collapse">${rows}<tr><td style="padding-top:14px;border-top:1px solid #ddd"><b>Total</b></td><td style="padding-top:14px;border-top:1px solid #ddd;text-align:right"><b>${money(total)}</b></td></tr></table><p>We will contact you with the next order update.</p>`);await sendEmail('order_created',email,`Order ${no} confirmed`,html);notifyAdmin('order_created',`New order ${no}`,emailShell('New order received',`<p><b>${no}</b></p><p>${displayName} · ${email}</p><p>Total: <b>${money(total)}</b></p>`));
    return json(res,{order_no:no,id:r.lastInsertRowid,status:'placed'},201);
  }
  return false;
}

function proxyRequest(req,res,bodyOverride=null){const headers={...req.headers,host:`127.0.0.1:${APP_PORT}`};if(bodyOverride)headers['content-length']=bodyOverride.length;const pr=http.request({hostname:'127.0.0.1',port:APP_PORT,path:req.url,method:req.method,headers},pres=>{const pathname=req.url.split('?')[0];if((pathname==='/api-storefront.js'||pathname==='/admin.js')&&req.method==='GET'){const chunks=[];pres.on('data',c=>chunks.push(c));pres.on('end',()=>{try{let extras=[];if(pathname==='/api-storefront.js')extras=['customer-commerce.js','customer-account-polish.js'];else extras=['admin-customers.js'];const pieces=[Buffer.concat(chunks)];for(const f of extras)pieces.push(Buffer.from('\n;'),fs.readFileSync(path.join(ROOT,'public',f)));const body=Buffer.concat(pieces);res.writeHead(pres.statusCode||200,{...pres.headers,'content-type':'application/javascript; charset=utf-8','content-length':body.length,'cache-control':'no-store'});res.end(body)}catch(e){console.error('Unable to load injected scripts',e);res.writeHead(500);res.end('Unable to load scripts')}});return}res.writeHead(pres.statusCode||500,pres.headers);pres.pipe(res)});pr.on('error',e=>{console.error('Gateway proxy error',e);if(!res.headersSent)res.writeHead(502);res.end('Bad gateway')});if(bodyOverride)pr.end(bodyOverride);else req.pipe(pr)}

const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname.startsWith('/api/admin/customer-accounts')){const handled=await adminCustomerApi(req,res,u);if(handled!==false)return}if(u.pathname.startsWith('/api/shop/')){const handled=await shopApi(req,res,u);if(handled!==false)return}proxyRequest(req,res)});
server.listen(PUBLIC_PORT,()=>console.log(`The Plug customer gateway on :${PUBLIC_PORT}; secure app on :${APP_PORT}`));
