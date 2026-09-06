(()=>{
  // Homepage carousel is now fully managed by carousel-managed.js and the admin backend.
  // Keep this file only as a compatibility loader for the organized Shop by Car menu.
  if(!document.querySelector('script[src^="vehicle-menu-v2.js"]')){
    const s=document.createElement('script');
    s.src='vehicle-menu-v2.js?v=2';
    document.body.appendChild(s);
  }
})();
