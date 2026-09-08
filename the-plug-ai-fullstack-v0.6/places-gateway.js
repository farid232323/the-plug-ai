const http=require('http');
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');

const PUBLIC_PORT=Number(process.env.PORT||4173);
const INNER_PORT=Number(process.env.PLACES_INNER_PORT||4187);
const ROOT=__dirname;
const KEY=String(process.env.GOOGLE_PLACES_API_KEY||'').trim();

const child=spawn(process.execPath,['gateway.js'],{cwd:ROOT,env:{...process.env,PORT:String(INNER_PORT)},stdio:'inherit'});
child.on('exit',code=>{console.error('Inner gateway exited',code);process.exit(code||1)});

function json(res,obj,status=200){const body=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':body.length,'cache-control':'no-store'});res.end(body)}
function readJson(req){return new Promise(resolve=>{const chunks=[];let size=0;req.on('data',c=>{size+=c.length;if(size<65536)chunks.push(c)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString()||'{}'))}catch{resolve({})}});req.on('error',()=>resolve({}))})}
function text(v){return String(v??'').trim()}
function comp(components,types){for(const t of types){const hit=(components||[]).find(c=>(c.types||[]).includes(t));if(hit)return text(hit.longText||hit.shortText)}return ''}

async function autocomplete(req,res){
  if(!KEY)return json(res,{error:'Google Places is not configured.'},503);
  const d=await readJson(req),input=text(d.input);if(input.length<3)return json(res,{suggestions:[]});
  const body={input,includedRegionCodes:['sa'],languageCode:'en',regionCode:'SA'};if(text(d.sessionToken))body.sessionToken=text(d.sessionToken);
  try{
    const r=await fetch('https://places.googleapis.com/v1/places:autocomplete',{method:'POST',headers:{'content-type':'application/json','X-Goog-Api-Key':KEY,'X-Goog-FieldMask':'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));if(!r.ok)return json(res,{error:j.error?.message||'Google address search failed.'},502);
    const suggestions=(j.suggestions||[]).map(x=>x.placePrediction).filter(Boolean).map(p=>({place_id:p.placeId,text:p.text?.text||'',main_text:p.structuredFormat?.mainText?.text||p.text?.text||'',secondary_text:p.structuredFormat?.secondaryText?.text||''}));
    return json(res,{suggestions});
  }catch(e){return json(res,{error:'Address search is temporarily unavailable.'},502)}
}

async function details(req,res){
  if(!KEY)return json(res,{error:'Google Places is not configured.'},503);
  const d=await readJson(req),placeId=text(d.placeId);if(!placeId)return json(res,{error:'placeId is required.'},400);
  const url='https://places.googleapis.com/v1/places/'+encodeURIComponent(placeId)+'?languageCode=en&regionCode=SA';
  try{
    const r=await fetch(url,{headers:{'X-Goog-Api-Key':KEY,'X-Goog-FieldMask':'id,displayName,formattedAddress,addressComponents,location'}});
    const j=await r.json().catch(()=>({}));if(!r.ok)return json(res,{error:j.error?.message||'Google address details failed.'},502);
    const c=j.addressComponents||[];const countryShort=(c.find(x=>(x.types||[]).includes('country'))?.shortText||'').toUpperCase();if(countryShort&&countryShort!=='SA')return json(res,{error:'Please select an address in Saudi Arabia.'},400);
    const streetNo=comp(c,['street_number']),route=comp(c,['route']);
    const address1=[streetNo,route].filter(Boolean).join(' ')||text(j.formattedAddress).split(',')[0];
    const district=comp(c,['sublocality_level_1','sublocality','neighborhood']);
    const city=comp(c,['locality','postal_town','administrative_area_level_2']);
    const region=comp(c,['administrative_area_level_1']);
    const postal_code=comp(c,['postal_code']);
    return json(res,{place_id:j.id||placeId,formatted_address:j.formattedAddress||'',address1,district,city,region,postal_code,country:'Saudi Arabia',lat:j.location?.latitude??null,lng:j.location?.longitude??null});
  }catch(e){return json(res,{error:'Address details are temporarily unavailable.'},502)}
}

function servePublicScript(res,file){
  try{const b=fs.readFileSync(path.join(ROOT,'public',file));res.writeHead(200,{'content-type':'application/javascript; charset=utf-8','content-length':b.length,'cache-control':'no-store'});res.end(b)}catch{res.writeHead(404);res.end('Not found')}
}

function proxy(req,res){
  const headers={...req.headers,host:`127.0.0.1:${INNER_PORT}`,'accept-encoding':'identity'};
  const pr=http.request({hostname:'127.0.0.1',port:INNER_PORT,path:req.url,method:req.method,headers},pres=>{
    const type=String(pres.headers['content-type']||'');
    if(req.method==='GET'&&type.includes('text/html')){
      const chunks=[];pres.on('data',c=>chunks.push(c));pres.on('end',()=>{let s=Buffer.concat(chunks).toString('utf8');const tags=[];if(!s.includes('saudi-address-autocomplete.js'))tags.push('<script src="/saudi-address-autocomplete.js"></script>');if(!s.includes('cart-source-of-truth.js'))tags.push('<script src="/cart-source-of-truth.js"></script>');if(tags.length)s=s.replace(/<\/body>/i,tags.join('')+'</body>');const b=Buffer.from(s);const h={...pres.headers,'content-length':b.length,'cache-control':'no-store'};delete h['content-encoding'];delete h['transfer-encoding'];res.writeHead(pres.statusCode||200,h);res.end(b)});return;
    }
    res.writeHead(pres.statusCode||500,pres.headers);pres.pipe(res);
  });
  pr.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end('Bad gateway')});req.pipe(pr);
}

const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname==='/api/places/autocomplete'&&req.method==='POST')return autocomplete(req,res);if(u.pathname==='/api/places/details'&&req.method==='POST')return details(req,res);if(u.pathname==='/saudi-address-autocomplete.js'&&req.method==='GET')return servePublicScript(res,'saudi-address-live.js');if(u.pathname==='/cart-source-of-truth.js'&&req.method==='GET')return servePublicScript(res,'cart-source-of-truth.js');proxy(req,res)});
server.listen(PUBLIC_PORT,()=>console.log(`Places gateway on :${PUBLIC_PORT}; app on :${INNER_PORT}`));
