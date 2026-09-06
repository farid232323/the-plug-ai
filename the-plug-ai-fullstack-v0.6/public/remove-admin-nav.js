(()=>{
  function removeAdminLinks(){
    document.querySelectorAll('a[href="/admin"],a[href="/admin/"],a[href="/admin.html"]').forEach(a=>a.remove());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeAdminLinks,{once:true});else removeAdminLinks();
  const obs=new MutationObserver(removeAdminLinks);
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
