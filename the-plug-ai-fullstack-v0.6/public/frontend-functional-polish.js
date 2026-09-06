(()=>{
  const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
  function toast(msg){const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}else console.info(msg)}

  function bindSearch(){
    $$('.searchbar').forEach(bar=>{
      if(bar.dataset.functionalBound)return;bar.dataset.functionalBound='1';
      const input=$('input',bar),btn=$('button',bar);if(!input||!btn)return;
      const go=()=>{const q=input.value.trim();location.hash='#shop';setTimeout(()=>{
        const cards=$$('#shop .product-card');let shown=0;
        cards.forEach(card=>{const hit=!q||(card.textContent||'').toLowerCase().includes(q.toLowerCase());card.style.display=hit?'':'none';if(hit)shown++});
        if(q)toast(shown?`${shown} matching product${shown===1?'':'s'}`:'No matching products found');
      },250)};
      btn.addEventListener('click',go);input.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
    });
  }

  function bindHeaderIcons(){
    $$('.navicons .iconbtn').forEach(b=>{
      if(b.dataset.functionalBound)return;
      const label=(b.getAttribute('aria-label')||'').toLowerCase();
      if(label==='locations'){b.dataset.functionalBound='1';b.addEventListener('click',()=>{location.hash='#contact'})}
      if(label==='wishlist'){b.dataset.functionalBound='1';b.addEventListener('click',()=>{location.hash='#shop';toast('Browse products and save favorites from product pages')})}
    });
  }

  function bindQuantity(){
    $$('.qty').forEach(q=>{
      if(q.dataset.functionalBound)return;q.dataset.functionalBound='1';const buttons=$$('button',q),span=$('span',q);if(buttons.length<2||!span)return;
      buttons[0].addEventListener('click',()=>{span.textContent=String(Math.max(1,(parseInt(span.textContent)||1)-1))});
      buttons[1].addEventListener('click',()=>{span.textContent=String(Math.min(99,(parseInt(span.textContent)||1)+1))});
    });
  }

  function parsePrice(card){const t=(card.querySelector('.price')?.textContent||card.textContent||'').replace(/,/g,'');const m=t.match(/([0-9]+(?:\.[0-9]+)?)/);return m?Number(m[1]):0}
  function bindSort(){
    $$('#shop .sortrow select').forEach(sel=>{if(sel.dataset.functionalBound)return;sel.dataset.functionalBound='1';sel.addEventListener('change',()=>{const grid=$('#shop .shop-products')||$('#shop .product-grid');if(!grid)return;const cards=$$('.product-card',grid);const v=sel.value.toLowerCase();if(v.includes('low to high'))cards.sort((a,b)=>parsePrice(a)-parsePrice(b));else if(v.includes('high to low'))cards.sort((a,b)=>parsePrice(b)-parsePrice(a));else if(v.includes('newest'))cards.reverse();cards.forEach(c=>grid.appendChild(c))})})
  }

  function bindLoadMore(){
    $$('#shop .loadmore').forEach(b=>{if(b.dataset.functionalBound)return;b.dataset.functionalBound='1';b.addEventListener('click',()=>{const hidden=$$('#shop .product-card').filter(c=>getComputedStyle(c).display==='none');if(hidden.length){hidden.forEach(c=>c.style.display='');b.textContent='All products shown'}else{b.textContent='All products shown';b.disabled=true;toast('All available products are already displayed')}})})
  }

  function bindPolicyButtons(){
    $$('.policyrow > div').forEach((el,i)=>{if(el.dataset.functionalBound)return;el.dataset.functionalBound='1';el.style.cursor='pointer';el.tabIndex=0;const open=()=>{location.hash=i===0?'#terms':'#returns'};el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')open()})})
  }

  function bind(){bindSearch();bindHeaderIcons();bindQuantity();bindSort();bindLoadMore();bindPolicyButtons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;bind()})}).observe(document.documentElement,{childList:true,subtree:true});
})();
