(()=>{
  const about=document.getElementById('about');
  if(about){
    about.innerHTML=`
      <div class="tp-about-page">
        <section class="tp-about-banner">
          <div class="tp-about-banner-bg"></div>
          <div class="tp-about-banner-title">WE ARE MORE THAN JUST A MARKETPLACE.</div>
        </section>

        <section class="tp-about-section tp-about-intro">
          <div class="tp-about-media"><img src="assets/story.jpg" alt="Premium automotive performance engine"></div>
          <div class="tp-about-copy">
            <div class="tp-about-kicker">ABOUT US</div>
            <p>Welcome to The Plug your ultimate destination for premium automotive parts, tools, and accessories. At The Plug, we understand the passion, precision, &amp; dedication that go into maintaining, upgrading, &amp; customizing your vehicle. That’s why we’ve created a one-stop platform where enthusiasts &amp; professionals alike can find everything, they need for their cars.</p>
          </div>
        </section>

        <section class="tp-about-feature tp-about-mission">
          <div class="tp-about-feature-bg" style="background-image:url('assets/cat-performance.jpg')"></div>
          <div class="tp-about-feature-card">
            <div class="tp-about-kicker">OUR MISSION</div>
            <p>Our mission is simple: to empower car owners and professionals with easy access to reliable, top-quality automotive products. By partnering with leading brands and local suppliers, we strive to deliver the best quality products at competitive prices while providing exceptional customer service.</p>
          </div>
        </section>

        <section class="tp-about-feature tp-about-vision">
          <div class="tp-about-feature-bg" style="background-image:url('assets/hero.jpg')"></div>
          <div class="tp-about-feature-card">
            <div class="tp-about-kicker">OUR VISION</div>
            <p>To be the go-to destination for luxury car owners, offering premium European aftermarket parts with unmatched quality and style. We aim to redefine automotive e-commerce through expert curation, reliability, and a seamless shopping experience.</p>
          </div>
        </section>
      </div>`;
  }

  const style=document.createElement('style');
  style.textContent=`
    .tp-about-page{background:#fff;color:#132135;overflow:hidden}.tp-about-banner{position:relative;height:330px;background:#132135;overflow:hidden}.tp-about-banner-bg{position:absolute;inset:0;background:linear-gradient(90deg,rgba(19,33,53,.82),rgba(19,33,53,.28)),url('assets/hero.jpg') center 52%/cover no-repeat}.tp-about-banner-title{position:absolute;left:max(26px,calc((100vw - 1500px)/2 + 26px));right:max(26px,calc((100vw - 1500px)/2 + 26px));bottom:-34px;background:#8FC6E4;color:#000;padding:28px 52px;font-weight:900;font-size:clamp(30px,3.1vw,58px);letter-spacing:.12em;line-height:1.05}
    .tp-about-section{width:min(1500px,calc(100% - 52px));margin:130px auto 100px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:64px}.tp-about-media img{width:100%;height:560px;object-fit:cover;display:block}.tp-about-copy{padding:24px 6%}.tp-about-kicker{font-weight:900;font-size:30px;letter-spacing:.03em;color:#31495a;margin-bottom:28px}.tp-about-kicker:after{content:"";display:block;width:115px;height:3px;background:#F8FF66;margin-top:16px}.tp-about-copy p,.tp-about-feature-card p{font-size:clamp(18px,1.55vw,28px);line-height:1.48;color:#415667;margin:0}
    .tp-about-feature{position:relative;width:100%;min-height:610px;margin:0 0 100px;display:flex;align-items:center}.tp-about-feature-bg{position:absolute;inset:0;background-size:cover;background-position:center}.tp-about-feature:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(19,33,53,.12),rgba(19,33,53,.02))}.tp-about-feature-card{position:relative;z-index:2;background:#fff;width:min(780px,52vw);padding:56px 62px;box-shadow:0 20px 55px rgba(19,33,53,.10)}.tp-about-mission .tp-about-feature-card{margin-left:max(26px,calc((100vw - 1500px)/2 + 26px))}.tp-about-vision{justify-content:flex-end}.tp-about-vision .tp-about-feature-card{margin-right:max(26px,calc((100vw - 1500px)/2 + 26px))}

    @media(max-width:900px){
      html,body{max-width:100%;overflow-x:hidden}.container{width:min(100% - 28px,1500px)!important}.shipping{font-size:11px!important;padding:8px 10px!important}.mainnav .navrow{display:grid!important;grid-template-columns:auto 1fr auto!important;gap:10px!important;padding:10px 14px!important}.mainnav .logo img{max-width:92px!important}.searchbar{grid-column:1/-1!important;order:3!important;width:100%!important}.searchbar input{font-size:16px!important}.vehicle-btn{display:none!important}.navicons{gap:4px!important}.iconbtn{width:38px!important;height:38px!important}.navcats{display:none!important}.mobile-select{display:flex!important;width:calc(100% - 28px)!important;margin:0 14px 10px!important;min-height:46px!important}.hero{min-height:520px!important}.hero .container{padding:46px 18px 110px!important}.hero h1{font-size:clamp(42px,13vw,68px)!important;line-height:.94!important;max-width:8ch!important}.hero-copy{max-width:100%!important}.hero-copy p{font-size:15px!important;line-height:1.5!important}.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}.product-card h3{font-size:14px!important}.shop-layout{grid-template-columns:1fr!important}.filters{order:2!important}.product-detail{grid-template-columns:1fr!important;gap:24px!important}.product-info h1{font-size:clamp(28px,9vw,42px)!important}.gallery-main{min-height:300px!important}.tp-product-tabbar{position:relative!important}.tp-fit-scroll,.table-wrap{overflow-x:auto!important;-webkit-overflow-scrolling:touch}.checkout-grid,.cart-layout,.account-layout,.contact-grid,.footer-grid,.story-grid,.category-grid{grid-template-columns:1fr!important}.footer-grid{gap:28px!important}.newsletter-footer{padding-left:0!important;padding-right:0!important}.modal-card,.vehicle-modal,.cart-drawer,.profile-drawer{max-width:100vw!important}.btn,button,input,select,textarea{min-height:44px}.form-grid,.cols{grid-template-columns:1fr!important}
      .tp-about-banner{height:230px}.tp-about-banner-title{left:14px;right:14px;bottom:-28px;padding:22px 20px;font-size:clamp(25px,8vw,40px);letter-spacing:.08em}.tp-about-section{width:calc(100% - 28px);margin:95px auto 60px;grid-template-columns:1fr;gap:28px}.tp-about-media img{height:330px}.tp-about-copy{padding:0 4px}.tp-about-kicker{font-size:24px;margin-bottom:22px}.tp-about-copy p,.tp-about-feature-card p{font-size:18px;line-height:1.55}.tp-about-feature{min-height:540px;margin-bottom:50px;padding:24px 14px;align-items:flex-end}.tp-about-feature-card,.tp-about-mission .tp-about-feature-card,.tp-about-vision .tp-about-feature-card{width:100%;margin:0;padding:30px 24px}.tp-about-feature-bg{background-position:center}
    }
    @media(max-width:540px){.product-grid{grid-template-columns:1fr!important}.hero{min-height:500px!important}.tp-about-media img{height:260px}.tp-about-feature{min-height:470px}.tp-about-feature-card{padding:26px 20px}.tp-about-copy p,.tp-about-feature-card p{font-size:16px}.tp-about-kicker{font-size:22px}.tp-about-banner-title{font-size:27px}}
  `;
  document.head.appendChild(style);
})();
