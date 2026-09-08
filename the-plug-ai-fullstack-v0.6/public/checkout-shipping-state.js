(()=>{
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const cart=()=>{try{const v=JSON.parse(localStorage.getItem('plug-cart')||'[]');return Array.isArray(v)?v:[]}catch{return []}};
  const qty=x=>Math.max(1,Number(x?.qty||1));
  const price=x=>Number(x?.price_sar??x?.price??0)||0;
  const money=n=>'SAR '+Number(n||0).toLocaleString('en-SA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const subtotal=()=>cart().reduce((s,x)=>s+price(x)*qty(x),0);
  function parseAmount(text){const m=String(text||'').replace(/,/g,'').match(/([0-9]+(?:\.[0-9]+)?)/);return m?Number(m[1]):null}
  function quoteFromStorage(){
    try{
      const q=JSON.parse(localStorage.getItem('plug-supplier-shipping-quote')||'null');
      if(!q)return null;
      for(const k of ['shipping_sar','shipping','amount_sar','amount','price_sar','price','total_sar','total']){const n=Number(q[k]);if(Number.isFinite(n)&&n>=0)return n}
      if(q.quote){for(const k of ['shipping_sar','shipping','amount_sar','amount','price_sar','price','total_sar','total']){const n=Number(q.quote[k]);if(Number.isFinite(n)&&n>=0)return n}}
    }catch{}
    return null;
  }
  function quoteFromStatus(){
    const root=$('#checkout');if(!root)return null;
    const candidates=$$('*',root).filter(el=>/live shipping/i.test(el.textContent||'')&&/available/i.test(el.textContent||''));
    for(const el of candidates){const n=parseAmount(el.textContent);if(Number.isFinite(n)&&n>=0)return n}
    return null;
  }
  function findSummaryRows(){
    const summary=$('#checkout .checkout-summary');if(!summary)return null;
    const rows=$$('.summary-row',summary);
    const byLabel=label=>rows.find(r=>new RegExp('^'+label+'$','i').test((r.firstElementChild?.textContent||'').trim()));
    return {summary,shipping:byLabel('Shipping')||byLabel('Delivery'),vat:rows.find(r=>/^VAT\s*\(15%\)$/i.test((r.firstElementChild?.textContent||'').trim())),total:rows.find(r=>/^Total$/i.test((r.firstElementChild?.textContent||'').trim()))};
  }
  function setRow(row,value){if(!row)return;const out=row.lastElementChild;if(out)out.textContent=value}
  function render(){
    if(location.hash!=='#checkout')return;
    const rows=findSummaryRows();if(!rows)return;
    const shipping=quoteFromStorage()??quoteFromStatus();
    const sub=subtotal();
    const place=$('#placeOrderBtn');
    if(shipping===null){
      setRow(rows.shipping,'Not calculated');
      setRow(rows.vat,'—');
      setRow(rows.total,'—');
      if(place){place.disabled=true;place.title='Calculate live shipping before placing the order.'}
      localStorage.removeItem('plug-checkout-total-state');
      return;
    }
    const vat=(sub+shipping)*0.15;
    const total=sub+shipping+vat;
    setRow(rows.shipping,money(shipping));
    setRow(rows.vat,money(vat));
    setRow(rows.total,money(total));
    if(place){place.disabled=false;place.title=''}
    localStorage.setItem('plug-checkout-total-state',JSON.stringify({subtotal:sub,shipping,vat,total,updated_at:Date.now()}));
  }
  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    try{
      const url=typeof input==='string'?input:input?.url||'';
      if(url.includes('/api/shop/order')&&init?.body){
        const state=JSON.parse(localStorage.getItem('plug-checkout-total-state')||'null');
        if(state&&Number.isFinite(Number(state.total))){
          const body=JSON.parse(init.body);
          body.subtotal=Number(state.subtotal);body.shipping=Number(state.shipping);body.vat=Number(state.vat);body.total=Number(state.total);
          init={...init,body:JSON.stringify(body)};
        }
      }
    }catch{}
    return originalFetch(input,init);
  };
  function init(){render();new MutationObserver(()=>render()).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('hashchange',()=>setTimeout(render,0));window.addEventListener('storage',e=>{if(['plug-cart','plug-supplier-shipping-quote'].includes(e.key))render()});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
