const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const products=[
 {brand:'VALVETRONIC',name:'Alpina B8 / BMW G16 M850i Valved Sport Exhaust System',price:2999,old:4124,disc:'-27%',img:'assets/exhaust-1.jpg'},
 {brand:'VALVETRONIC',name:'BMW F30 / F22 / F36 / F32 Valved Sport Exhaust System',price:749,old:862,disc:'-13%',img:'assets/exhaust-2.jpg'},
 {brand:'VALVETRONIC',name:'BMW F87 M2 Valved Sport Exhaust System',price:2249,old:2999,disc:'-25%',img:'assets/exhaust-3.jpg'},
 {brand:'VALVETRONIC',name:'BMW F87 M2 N55 Valved Exhaust System',price:2024,old:null,disc:null,img:'assets/exhaust-4.jpg'},
 {brand:'ROMIK',name:'Romik® - 5.5" RAL Series Running Boards',price:1280,old:1400,disc:'-10%',img:'assets/product-runningboard.png'},
 {brand:'LuK',name:'LuK RepSet™ Clutch Kit',price:980,old:1090,disc:'-10%',img:'assets/product-clutch.png'},
 {brand:'Schumacher',name:'Schumacher® 6 V/12 V Portable Fully Automatic Charger',price:740,old:null,disc:null,img:'assets/product-charger.png'},
 {brand:'Motorcraft',name:'Motorcraft® Diesel High Pressure Fuel Pump',price:2600,old:null,disc:null,img:'assets/product-pump.png'}
];
let cart=JSON.parse(localStorage.getItem('plug-cart')||'[]');
function productCard(p,i){return `<article class="product-card">${p.disc?`<span class="discount">${p.disc}</span>`:''}<a href="#product" class="product-img"><img src="${p.img}" alt="${p.name}"></a><div class="brandline">${p.brand==='VALVETRONIC'?'<img src="assets/valvetronic-badge.png" alt="Valvetronic" style="height:48px;width:auto">':`<strong>${p.brand}</strong>`}<span class="plugid">ThePlug ID: 4546547hf</span></div><h4><a href="#product">${p.name}</a></h4><div class="sub">${p.brand==='VALVETRONIC'?'T304 Stainless Steel with Electronic Valves':'Mounting brackets Included'}</div><div class="rating">★★★★★ <span style="color:#777">(288)</span></div><div class="price">SR ${p.price}${p.old?` <del>SR ${p.old}</del>`:''}</div><button class="addcart" data-add="${i}">+ ${p.brand==='VALVETRONIC'?'Select options':'Add to cart'}</button></article>`}
function renderProductGroups(){const groups={top:[0,2,1,3],featured:[4,5,6,7],recent:[3,2,0,1],shop:[0,1,2,3,0,2,1,3,2,0,3,1],related:[3,1,0,2],recommended:[0,1,2,3]};$$('[data-products]').forEach(el=>{el.innerHTML=(groups[el.dataset.products]||groups.top).map(i=>productCard(products[i],i)).join('')});bindAddButtons()}
function bindAddButtons(){$$('[data-add],.product-info .addcart').forEach(b=>b.onclick=()=>{const i=b.dataset.add?+b.dataset.add:0;cart.push(products[i]);saveCart();renderCart();showToast('Added to cart');openCart()})}
function saveCart(){localStorage.setItem('plug-cart',JSON.stringify(cart));$$('.count').forEach(x=>x.textContent=cart.length)}
function removeItem(i){cart.splice(i,1);saveCart();renderCart()}
function renderCart(){saveCart();const drawer=$('#drawerItems'), page=$('#cartPageItems');const subtotal=cart.reduce((s,p)=>s+p.price,0);if(drawer)drawer.innerHTML=cart.length?cart.map((p,i)=>`<div class="drawer-item"><img src="${p.img}"><div><strong>${p.name}</strong><div class="price">SR ${p.price}</div><button onclick="removeItem(${i})" style="border:0;background:none;padding:0;text-decoration:underline">Remove</button></div></div>`).join(''):'<p>Your cart is empty.</p>';if(page)page.innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-item"><img src="${p.img}"><div><strong>${p.name}</strong><div class="sub">${p.brand==='VALVETRONIC'?'T304 Stainless Steel with Electronic Valves':'Mounting brackets Included'}</div><div style="margin-top:10px">1 &nbsp; <button onclick="removeItem(${i})" style="border:0;background:none;text-decoration:underline">Remove</button></div></div><strong>SR ${p.price}</strong></div>`).join(''):`<div class="empty-state"><div class="empty-art"></div><h2>Your cart is waiting for an upgrade.</h2><a class="btn" href="#shop">Start shopping</a></div>`;$('#drawerSubtotal').textContent='SR '+subtotal;$('#subtotal').textContent='SR '+subtotal;$('#total').textContent='SR '+subtotal;$('#cartItemsCount').textContent=cart.length}
window.removeItem=removeItem;

function route(){const id=(location.hash||'#home').slice(1);$$('[data-view]').forEach(v=>v.classList.toggle('active',v.id===id));if(!$('#'+CSS.escape(id)))location.hash='#home';window.scrollTo({top:0});if(id==='cart')renderCart();if(id==='account')renderAccount('details')}
window.addEventListener('hashchange',route);

const overlay=$('#modalOverlay'), modal=$('#vehicleModal'), drawer=$('#cartDrawer'), dOverlay=$('#drawerOverlay'), profile=$('#profileDrawer'), toast=$('#toast');
function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1900)}
function openVehicle(){overlay.classList.add('show');modal.classList.add('show')} function closeVehicle(){overlay.classList.remove('show');modal.classList.remove('show')}
$$('[data-vehicle]').forEach(b=>b.addEventListener('click',openVehicle));$('#modalClose').onclick=closeVehicle;overlay.onclick=closeVehicle;
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.tab;$$('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));$$('.tabpane').forEach(p=>p.classList.toggle('active',p.id===id))}));
$('#vinSearch').onclick=()=>{const v=$('#vinInput').value.trim(),r=$('#vinResult');if(v.length<10){r.className='fit-result bad';r.textContent='It doesn’t fit your car.'}else{r.className='fit-result good';r.textContent='It fits your car!';$$('.selected-vehicle').forEach(x=>x.textContent='Vehicle verified');}};
$('#vehicleSearch').onclick=()=>{const make=$('#makeSelect').value,r=$('#vehicleResult');if(!make){r.className='fit-result bad';r.textContent='Please select your vehicle details.';return}r.className='fit-result good';r.textContent='It fits your car!';$$('.selected-vehicle').forEach(x=>x.textContent=make+' 100 series · 2019');setTimeout(closeVehicle,800)};
function openCart(){dOverlay.classList.add('show');drawer.classList.add('show')}function closeCart(){dOverlay.classList.remove('show');drawer.classList.remove('show')}$$('[data-cart-open]').forEach(b=>b.onclick=openCart);$('#drawerClose').onclick=closeCart;dOverlay.onclick=()=>{closeCart();profile.classList.remove('show')};$('#viewCartBtn').onclick=closeCart;
$$('[data-profile-open]').forEach(b=>b.onclick=()=>{dOverlay.classList.add('show');profile.classList.add('show')});$$('[data-profile-close]').forEach(b=>b.onclick=()=>{profile.classList.remove('show');dOverlay.classList.remove('show')});
$$('[data-subscribe]').forEach(b=>b.onclick=()=>showToast('You’re plugged in.'));$('[data-contact-submit]').onclick=()=>showToast('Message submitted.');$('#checkoutBtn').onclick=()=>location.hash='#checkout';

function renderAccount(tab){$$('[data-account-tab]').forEach(a=>a.classList.toggle('active',a.dataset.accountTab===tab));const c=$('#accountContent');if(tab==='details')c.innerHTML=`<h1 class="pagehead">Account Details</h1><div class="form-grid"><div class="field"><label>First Name</label><input placeholder="Enter Your First Name"></div><div class="field"><label>Last Name</label><input placeholder="Enter Your Last Name"></div><div class="field"><label>Mobile Number</label><input placeholder="+966 xx xxx xxxx"></div><div class="field"><label>Email Address</label><input placeholder="Enter Your Email Address"></div><button class="btn full">Save Changes</button></div>`;if(tab==='password')c.innerHTML=`<h1 class="pagehead">Change Password</h1><div class="form-grid"><div class="field"><label>New Password*</label><input type="password" placeholder="Enter password"></div><div class="field"><label>Confirm Password*</label><input type="password" placeholder="Enter password"></div><button class="btn full">Save Changes</button></div>`;if(tab==='addresses')c.innerHTML=`<h1 class="pagehead">My Addresses</h1><div class="address-card"><h3>⌖ Office</h3><div>Cairo, Fifth Settlement, 10 District 13/14, second floor, apartment..</div><div>Phone: 0123456789</div><div class="default">● Default Address</div></div><div class="address-card"><h3>⌖ Office</h3><div>Cairo, Fifth Settlement, 10 District 13/14, second floor, apartment..</div><div>Phone: 0123456789</div></div><button class="btn outline" style="margin-top:22px" onclick="showAddressDialog()">+ Add New Address</button>`;if(tab==='orders')c.innerHTML=`<h1 class="pagehead">My Orders</h1><div class="orders-tabs"><button class="active">Active Orders</button><button>Order History</button></div><div class="order-card"><h3>Order #54781732 <span style="float:right">Placed</span></h3><p>Ahmed Ali · Credit card</p><button class="btn outline">Order Details</button><div class="summary-row"><span>Total</span><strong>SR 250</strong></div><button class="btn outline" onclick="showCancelOrder()">Cancel order</button></div><div class="order-card"><h3>Order #54781733 <span style="float:right">Out for delivery</span></h3><p>Ahmed Ali · Credit card</p><div class="summary-row"><span>Total</span><strong>SR 285</strong></div></div>`}
$$('[data-account-tab]').forEach(a=>a.onclick=()=>renderAccount(a.dataset.accountTab));

const dialog=$('#dialog');function showDialog(title,text,confirm='Confirm',extra=''){ $('#dialogTitle').textContent=title;$('#dialogText').textContent=text;$('#dialogConfirm').textContent=confirm;$('#dialogExtra').innerHTML=extra;dialog.classList.add('show')}function closeDialog(){dialog.classList.remove('show')}$('.dialog-close').onclick=closeDialog;$('#dialogCancel').onclick=closeDialog;$('#dialogConfirm').onclick=()=>{closeDialog();showToast('Request submitted')};
$$('[data-logout]').forEach(x=>x.onclick=e=>{e.preventDefault();showDialog('Are you sure you want to logout?',"To log back in, you’ll need to enter your details in the login form.",'Logout')});$$('[data-delete]').forEach(x=>x.onclick=e=>{e.preventDefault();showDialog('Delete Account','Deleting your account is permanent. Your profile, wishlist items, order history and saved addresses will be permanently deleted.','Request account deletion')});$$('[data-language]').forEach(x=>x.onclick=e=>{e.preventDefault();showDialog('Change Language','Change the language used in the user interface.','Save','<label><input type="radio" name="lang" checked> English</label><br><br><label><input type="radio" name="lang"> عربي</label>')});
window.showCancelOrder=()=>showDialog('Cancel order #54781732','Are you sure you want to cancel this order?','Cancel Order');window.showAddressDialog=()=>showDialog('Add Shipping Address','Enter a new delivery address.','Save Address','<div class="field"><label>Address Label</label><input placeholder="Ex: Home"></div><div class="field"><label>City</label><input placeholder="City"></div><div class="field"><label>Street Name</label><input placeholder="Enter Your Street Name"></div>');

const termsHtml=`
<h2>Terms &amp; Conditions</h2>
<p>Welcome to <strong>The Plug.</strong> These Terms &amp; Conditions govern your access to and use of The Plug website, mobile platforms, and related services (collectively, the “Platform”). By accessing or using our Platform, you agree to be bound by these Terms.</p>
<p>If you do not agree with any part of these Terms, you must not use the Platform.</p>
<h3>1. About The Plug</h3>
<p>The Plug is an online automotive marketplace that connects customers with third-party automotive brands and suppliers. The Plug <strong>does not manufacture, stock, or physically handle products</strong>, and operates as a <strong>facilitator and commission-based platform.</strong></p>
<p>All products listed on the Platform are sold and fulfilled by independent third-party suppliers.</p>
<h3>2. Eligibility &amp; Account Responsibility</h3>
<ul><li>You must be at least <strong>18 years old</strong> to use the Platform.</li><li>You are responsible for maintaining the confidentiality of your account credentials.</li><li>You agree that all information provided is accurate, current, and complete.</li><li>The Plug reserves the right to suspend or terminate accounts suspected of misuse, fraud, or violation of these Terms.</li></ul>
<h3>3. Product Listings &amp; Accuracy</h3>
<ul><li>Product information, specifications, compatibility, images, pricing, and availability are provided by third-party suppliers.</li><li>While The Plug strives to ensure accuracy, <strong>we do not guarantee that product descriptions or compatibility information are error-free.</strong></li><li>Customers are responsible for confirming product compatibility before placing an order, including fitment based on vehicle make, model, year, and VIN where applicable.</li></ul>
<h3>4. Pricing &amp; Payments</h3>
<ul><li>All prices displayed are in [SAR]</li><li>Prices are subject to change without notice.</li><li>Payment must be completed in full at the time of checkout.</li><li>The Plug earns revenue through <strong>commission agreements with suppliers</strong>, which does not affect the price paid by the customer unless otherwise stated.</li></ul>
<h3>5. Order Processing</h3>
<ul><li>Orders are transmitted to the relevant supplier once payment is confirmed.</li><li>The Plug does not control supplier processing times, manufacturing timelines, or shipping schedules.</li><li>Estimated delivery times are indicative only and not guaranteed.</li></ul>
<h3>6. Order Modifications &amp; Cancellations</h3>
<ul><li>Orders <strong>may only be modified or canceled within 24 hours</strong> of successful payment.</li><li>After 24 hours, orders are considered final and cannot be changed or canceled.</li><li>Modification or cancellation requests must be submitted in writing through the Platform or official communication channels.</li></ul>
<h3>7. Shipping &amp; Delivery</h3>
<ul><li>Shipping is fulfilled directly by third-party suppliers.</li><li>Delivery times vary depending on product type, supplier location, and destination.</li><li>The Plug is not responsible for delays caused by customs clearance, logistics providers, force majeure events, or supplier constraints.</li></ul>
<h3>8. Returns &amp; Refunds</h3>
<ul><li><strong>All sales are final.</strong></li><li>The Plug does <strong>not accept returns or exchanges</strong> under normal circumstances.</li><li>This policy reflects the customized and supplier-direct nature of the products sold.</li></ul>
<h3>9. Damaged or Defective Items</h3>
<ul><li>If a product arrives damaged or defective, customers must:<ul><li>Notify The Plug <strong>within 24 hours of delivery</strong></li><li>Provide <strong>clear photographic evidence</strong> of the damage</li></ul></li><li>Claims submitted after 24 hours may not be accepted.</li><li>Resolution (replacement or refund) is subject to supplier approval.</li></ul>
<h3>10. Warranty</h3>
<ul><li>Product warranties, if any, are provided solely by the supplier or manufacturer.</li><li>The Plug does not provide independent warranties and is not responsible for warranty claims.</li><li>Customers must contact the relevant supplier directly for warranty-related matters, with assistance from The Plug where possible.</li></ul>
<h3>11. Vehicle Compatibility Disclaimer</h3>
<ul><li>The Plug is not liable for incorrect fitment resulting from:<ul><li>Incorrect vehicle information provided by the customer</li><li>Manufacturer changes or revisions</li><li>Improper installation</li></ul></li><li>Professional installation is strongly recommended.</li></ul>
<h3>12. Limitation of Liability</h3>
<p>To the fullest extent permitted by law:</p>
<ul><li>The Plug shall not be liable for indirect, incidental, or consequential damages.</li><li>Liability, if any, shall not exceed the total amount paid by the customer for the relevant order.</li><li>The Plug is not responsible for mechanical failure, vehicle damage, or personal injury resulting from product use or installation.</li></ul>
<h3>13. Intellectual Property</h3>
<ul><li>All content on the Platform, including logos, text, design, and branding, is the property of The Plug or its licensors.</li><li>Unauthorized use, reproduction, or distribution is strictly prohibited.</li></ul>
<h3>14. Third-Party Links &amp; Content</h3>
<ul><li>The Platform may contain links to third-party websites.</li><li>The Plug is not responsible for the content, policies, or practices of third-party sites.</li></ul>
<h3>15. Termination of Use</h3>
<p>The Plug reserves the right to:</p>
<ul><li>Suspend or terminate access to the Platform without notice</li><li>Remove listings or accounts that violate these Terms</li></ul>
<h3>16. Governing Law</h3>
<p>These Terms shall be governed and interpreted in accordance with the laws of the <strong>Kingdom of Saudi Arabia.</strong></p>
<h3>17. Changes to Terms</h3>
<p>The Plug may update these Terms at any time. Continued use of the Platform constitutes acceptance of the revised Terms.</p>
<h3>18. Contact Information</h3>
<p>For questions regarding these Terms &amp; Conditions, please contact:</p>
<p>Email: [Customerservice@theplug.inc]</p>
<p>Website: www.theplug.inc</p>`;

const privacyHtml=`
<h2>Privacy Policy</h2>
<h3>1. Introduction</h3>
<p>The Plug respects your privacy and is committed to protecting your personal data.</p>
<p>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (the “Platform”).</p>
<p>By using The Plug, you agree to the terms outlined in this Privacy Policy.</p>
<h3>2. Information We Collect</h3>
<p>We may collect and process the following types of personal data:</p>
<ul><li>Personal Information: Name, email address, phone number, billing and shipping address</li><li>Account Information: Login credentials and account preferences</li><li>Transaction Information: Orders, payments, and purchase history</li><li>Vehicle Information: VIN, make, model, year (for compatibility purposes)</li><li>Technical Data: IP address, browser type, device information, and usage data</li></ul>
<h3>3. How We Use Your Information</h3>
<p>We use your information to:</p>
<ul><li>Process and fulfill orders</li><li>Provide customer support</li><li>Improve our Platform and services</li><li>Communicate updates, promotions, and offers (with your consent)</li><li>Prevent fraud and ensure security</li><li>Comply with legal and regulatory obligations</li></ul>
<h3>4. Sharing of Information</h3>
<p>We may share your information with:</p>
<ul><li>Third-party suppliers to fulfill orders</li><li>Payment processors to complete transactions</li><li>Logistics providers for shipping and delivery</li><li>Legal authorities if required by law</li></ul>
<p>We do not sell your personal data to third parties.</p>
<h3>5. Data Storage &amp; Security</h3>
<p>We implement appropriate technical and organizational measures to protect your personal data.</p>
<p>While we strive to protect your information, no method of transmission over the internet is 100% secure.</p>
<h3>6. Data Retention</h3>
<p>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.</p>
<h3>7. Your Rights</h3>
<p>Depending on applicable laws, you may have the right to:</p>
<ul><li>Access your personal data</li><li>Request correction or deletion of your data</li><li>Object to or restrict processing</li><li>Withdraw consent at any time</li></ul>
<h3>8. Cookies &amp; Tracking Technologies</h3>
<p>We use cookies and similar technologies to enhance user experience, analyze traffic, and personalize content.</p>
<p>You may control cookie preferences through your browser settings.</p>
<h3>9. Third-Party Links</h3>
<p>Our Platform may contain links to third-party websites.</p>
<p>We are not responsible for the privacy practices or content of these websites.</p>
<h3>10. Changes to This Policy</h3>
<p>We may update this Privacy Policy from time to time.</p>
<p>Any changes will be posted on this page with an updated revision date.</p>
<h3>11. Contact Us</h3>
<p>If you have any questions about this Privacy Policy, please contact us:</p>
<p>Email: customerservice@theplug.inc</p>
<p>Website: www.theplug.inc</p>`;

const returnsHtml=`
<h2>Return &amp; Refund Policy</h2>
<p>At The Plug, we strive to ensure seamless &amp; satisfying shopping experience for all our customers. To maintain the quality and efficiency of our services, we have established the following policies regarding order modifications and returns:</p>
<h3>Order Modifications</h3>
<ul><li>Changes to orders: Once an order is placed and paid, it cannot be modified or cancelled unless the request is made within 24 hours of payment.</li><li>To request a modification within this timeframe, please contact customer support team immediately at (customerservice@theplug.inc). Be sure to provide your order number and details of the requested change.</li><li>After the 24 hour window, all orders are considered final, and no further modifications can be made.</li></ul>
<h3>Returns</h3>
<ul><li>At this time, The Plug does not accept returns for any products purchased through our platform.</li><li>We take great care to ensure that all products listed on our platform meet the highest quality standards and are inspected before shipping.</li><li>To avoid any inconvenience, we encourage customers to carefully review product specifications, compatability, and descriptions before placing an order. If you have any questions, our customer support team is happy to assist.</li></ul>
<h3>Exceptions</h3>
<ul><li>Defective or damaged products: if a product arrives damaged or defective, please notify us within 24hrs of receipt. Our team will work with you to resolve your issue which may include arranging a replacement or refund based on the situation.</li><li>Claims for damaged or defective products must include clear photographic and a description of the issue.</li></ul>
<h3>Refunds</h3>
<ul><li>Refunds are only applicable in cases where the product is deemed defective or damaged upon arrival, and no replacement is available.</li><li>Refund processing time may vary and will typically require 7-10 working days to process once approved.</li></ul>
<h3>Client Information</h3>
<ul><li>Clients must provide accurate &amp; up to date details, including delivery addresses, contact numbers, and any specific delivery instructions. Any changes to be made after an order has been made will not be able to be modified.</li></ul>
<h3><u><em>Order Definitions:</em></u></h3>
<p><strong><u>Under Review:</u></strong> Your order is currently under review and your payment will be on hold until we confirm that your requested item is available. we will contact you once we have an update.</p>
<p><strong><u>Back Order:</u></strong> This product is currently on back order with our supplier or manufacturer. We are unable to predict the exact date that this product will be available for shipment. Orders placed containing back ordered products will ship as soon as possible as products become available. An alternate or equivalent product may be available. Please contact The Plug Sales Team if you have any questions.</p>
<p><strong><u>Ships in [# of days]:</u></strong> This product is sourced from one of our suppliers and will usually ship within the time frame shown, meaning that your order would not ship from our location until those products are received within the given timeframe.</p>
<p><strong><u>On Order [ETA]:</u> This product is currently on order with our supplier. ETA to be provided when product has been shipped from supplier.</strong></p>
<p><strong><u>In Process:</u> This order has arrived at The Plug and is being prepared for shipment. A shipment tracking # will be provided with your chosen shipping company. Your payment will be deducted.</strong></p>
<p><strong><u>Shipped:</u></strong> Your order has been packaged and a shipping label has been assigned. Orders cannot be cancelled or revised at this stage in the ordering process.</p>
<p><strong><u>Canceled:</u>The order has been cancelled. Contact us if you have nay questions.</strong></p>`;

const policyText={shipping:`<h2>Shipping Policy</h2><p>We aim to make premium automotive parts easy to receive across Saudi Arabia. Shipping fees and estimated delivery times are shown at checkout based on destination, item size and supplier availability.</p><h3>Free standard shipping</h3><p>Free standard shipping applies to qualifying Saudi Arabia orders over SR 1400.</p><h3>Delivery timing</h3><p>Some products may ship directly from approved suppliers. Estimated delivery dates will be shown before payment whenever available.</p>`,returns:returnsHtml,privacy:privacyHtml,terms:termsHtml};
function renderPolicy(k='shipping'){policyCopy.innerHTML=policyText[k]||policyText.shipping;policyCopy.classList.toggle('terms-copy',['terms','returns','privacy'].includes(k));$$('[data-policy]').forEach(b=>b.classList.toggle('active',b.dataset.policy===k))}
const policyTabs=$('.policy-tabs');if(policyTabs&&!policyTabs.querySelector('[data-policy="terms"]')){const termsBtn=document.createElement('button');termsBtn.dataset.policy='terms';termsBtn.textContent='Terms & conditions';policyTabs.appendChild(termsBtn)}
$$('[data-policy]').forEach(b=>b.onclick=()=>renderPolicy(b.dataset.policy));renderPolicy();
const policyStyle=document.createElement('style');policyStyle.textContent=`.policy-copy.terms-copy{max-width:1100px;color:#344957;line-height:1.75}.policy-copy.terms-copy h2{font-family:Nofex,"Arial Black",Arial,sans-serif;text-transform:uppercase;font-size:clamp(34px,4vw,58px);color:#132135;margin:10px 0 36px;border-top:18px solid #8FC6E4;padding-top:24px}.policy-copy.terms-copy h3{font-family:Nofex,"Arial Black",Arial,sans-serif;font-size:26px;color:#344957;margin:44px 0 16px}.policy-copy.terms-copy p,.policy-copy.terms-copy li{font-size:18px}.policy-copy.terms-copy ul{padding-left:28px}.policy-copy.terms-copy li{margin:12px 0}.policy-copy.terms-copy strong{font-weight:800}`;document.head.appendChild(policyStyle);
$$('.newsletter-footer a').forEach(a=>{const label=a.textContent.trim().toLowerCase();if(label==='terms & conditions'){a.href='#policy';a.onclick=()=>setTimeout(()=>renderPolicy('terms'),0)}if(label==='privacy policy'){a.href='#policy';a.onclick=()=>setTimeout(()=>renderPolicy('privacy'),0)}});
$('#zoomMain').onclick=()=>showDialog('Product image','', 'Close',`<img src="assets/product-runningboard.png" style="width:100%;max-height:60vh;object-fit:contain">`);

const addAddressBtn=$('#addAddressBtn');if(addAddressBtn)addAddressBtn.onclick=()=>showDialog('Add New Shipping Address','Add a delivery address for this order.','Save Address','<div class="field"><label>Full Name</label><input placeholder="Enter Your Full Name"></div><div class="field"><label>Phone Number</label><input placeholder="+966 xx xxx xxxx"></div><div class="field"><label>Address Label</label><input placeholder="e.g., Home"></div><div class="field"><label>City</label><select><option>Jeddah</option><option>Riyadh</option><option>Dammam</option></select></div><div class="field"><label>Street Name</label><input placeholder="e.g., Tahlia Street"></div>');
const changePaymentBtn=$('#changePaymentBtn');if(changePaymentBtn)changePaymentBtn.onclick=()=>showDialog('Payment Method','Add or change your saved card.','Add My Card','<div class="field"><label>Card number</label><input placeholder="Enter your card number"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="field"><label>Expiration date</label><input placeholder="MM/YY"></div><div class="field"><label>CVV</label><input placeholder="Secure Code"></div></div><div class="field"><label>Card holder name</label><input placeholder="Enter Card holder name"></div>');
const placeOrderBtn=$('#placeOrderBtn');if(placeOrderBtn)placeOrderBtn.onclick=()=>{cart=[];saveCart();location.hash='#success'};

renderProductGroups();renderCart();renderAccount('details');route();
// V3 authentication + onboarding prototype flows
function setAuthStep(group,step){document.querySelectorAll(group).forEach(x=>x.classList.toggle('active',x.dataset.authStep===step||x.dataset.signupStep===step));}
const loginContinue=document.querySelector('#loginContinue');if(loginContinue)loginContinue.onclick=()=>{const e=document.querySelector('#loginEmail').value.trim();if(!e){showToast('Enter your email address');return}document.querySelector('#loginMagicEmail').textContent=e;setAuthStep('.auth-step','login-magic')};
const loginBack=document.querySelector('#loginBack');if(loginBack)loginBack.onclick=()=>setAuthStep('.auth-step','login');
const signupContinue=document.querySelector('#signupContinue');if(signupContinue)signupContinue.onclick=()=>{const e=document.querySelector('#signupEmail').value.trim();if(!e){showToast('Enter your email address');return}document.querySelector('#signupMagicEmail').textContent=e;setAuthStep('.signup-step','magic');setTimeout(()=>setAuthStep('.signup-step','name'),700)};
document.querySelectorAll('[data-signup-back]').forEach(b=>b.onclick=()=>setAuthStep('.signup-step',b.dataset.signupBack));
document.querySelectorAll('[data-signup-next]').forEach(b=>b.onclick=()=>{const next=b.dataset.signupNext;if(next==='vehicle'){const f=document.querySelector('#signupFirst')?.value.trim()||'there';document.querySelector('#signupNameEcho').textContent=f}setAuthStep('.signup-step',next)});
document.querySelectorAll('.interest-grid button,.brand-choice-grid button').forEach(b=>b.onclick=()=>b.classList.toggle('selected'));
function completeSignup(){showToast('Account setup complete');location.hash='#home'}
const fs1=document.querySelector('#finishSignup'),fs2=document.querySelector('#finishSignup2');if(fs1)fs1.onclick=completeSignup;if(fs2)fs2.onclick=completeSignup;