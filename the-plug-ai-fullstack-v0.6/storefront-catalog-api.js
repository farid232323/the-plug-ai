const path=require('path');
const {DatabaseSync}=require('node:sqlite');

module.exports=function createStorefrontCatalog({rootDir=__dirname}={}){
  const db=new DatabaseSync(path.join(rootDir,'data','theplug.sqlite'));
  const clean=v=>String(v??'').trim();
  const canonicalBrand=v=>{const s=clean(v),l=s.toLowerCase();if(l==='p3'||l==='p3 gauges'||l==='p3 gauge')return 'P3';if(l==='valvetronic'||l==='valvetronic designs')return 'Valvetronic';if(l==='autoid'||l==='auto id')return 'AUTOID';return s};
  const json=(res,obj,status=200)=>{const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':b.length,'cache-control':'no-store'});res.end(b)};

  function products(res,u){
    const brand=canonicalBrand(u.searchParams.get('brand'));
    const category=clean(u.searchParams.get('category'));
    const make=clean(u.searchParams.get('make'));
    const model=clean(u.searchParams.get('model')).replace(/^.*? — /,'');
    const chassis=clean(u.searchParams.get('chassis'));
    const q=clean(u.searchParams.get('q'));
    const limit=Math.max(1,Math.min(2000,Number(u.searchParams.get('limit')||1000)));
    const where=["lower(p.status)='active'"];const args=[];
    if(brand){where.push('lower(p.brand_name)=lower(?)');args.push(brand)}
    if(category){where.push('lower(p.category)=lower(?)');args.push(category)}
    if(q){where.push('(p.title LIKE ? OR p.mfg_part_id LIKE ? OR p.the_plug_id LIKE ? OR p.brand_name LIKE ?)');const n='%'+q+'%';args.push(n,n,n,n)}
    if(make||model||chassis){
      const fit=[];
      if(make){fit.push('lower(f.car_brand)=lower(?)');args.push(make)}
      if(model){fit.push('(lower(f.model) LIKE lower(?) OR lower(?) LIKE \'%\'||lower(f.model)||\'%\')');args.push('%'+model+'%',model)}
      if(chassis){fit.push('(lower(f.chassis) LIKE lower(?) OR lower(?) LIKE \'%\'||lower(f.chassis)||\'%\')');args.push('%'+chassis+'%',chassis)}
      where.push(`EXISTS (SELECT 1 FROM fitments f WHERE f.product_id=p.id AND ${fit.join(' AND ')})`);
    }
    args.push(limit);
    const rows=db.prepare(`SELECT p.*,
      (SELECT url FROM product_images i WHERE i.product_id=p.id ORDER BY sort_order,id LIMIT 1) image,
      (SELECT count(*) FROM fitments f WHERE f.product_id=p.id) fitment_count
      FROM products p WHERE ${where.join(' AND ')} ORDER BY p.updated_at DESC,p.id DESC LIMIT ?`).all(...args);
    return json(res,rows);
  }

  function brands(res){
    const rows=db.prepare("SELECT brand_name name,count(*) product_count FROM products WHERE lower(status)='active' GROUP BY brand_name ORDER BY brand_name").all();
    return json(res,rows);
  }
  function categories(res){
    const rows=db.prepare("SELECT category name,count(*) product_count FROM products WHERE lower(status)='active' GROUP BY category ORDER BY category").all();
    return json(res,rows);
  }
  function health(res){return json(res,{ok:true,service:'storefront-catalog',products:db.prepare("SELECT count(*) c FROM products WHERE lower(status)='active'").get().c})}

  function handle(req,res,u){
    if(req.method!=='GET')return false;
    if(u.pathname==='/api/storefront/products'){products(res,u);return true}
    if(u.pathname==='/api/storefront/brands'){brands(res);return true}
    if(u.pathname==='/api/storefront/categories'){categories(res);return true}
    if(u.pathname==='/api/storefront/health'){health(res);return true}
    return false;
  }
  return{handle};
};
