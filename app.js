const API = "";
let products = [], cart = JSON.parse(localStorage.getItem("luxCart") || "[]");
let token = localStorage.getItem("luxToken") || "", currentUser = JSON.parse(localStorage.getItem("luxUser") || "null"), authMode = "login";
const $ = id => document.getElementById(id);
const money = n => "₹" + Number(n).toLocaleString("en-IN");
const headers = () => ({ "Content-Type":"application/json", ...(token ? {Authorization:"Bearer "+token} : {}) });
async function request(url, options={}) {
  const res = await fetch(API+url, {...options, headers:{...headers(), ...(options.headers||{})}});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function toast(message){$("toast").textContent=message;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400)}
function openModal(id){$(id).classList.add("open")}
function closeModal(id){$(id).classList.remove("open")}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
document.querySelectorAll(".modal-backdrop").forEach(b=>b.addEventListener("click",e=>{if(e.target===b)b.classList.remove("open")}));
$("menuBtn").onclick=()=>document.querySelector(".topbar nav").classList.toggle("show");
document.querySelectorAll(".topbar nav a").forEach(a=>a.onclick=()=>document.querySelector(".topbar nav").classList.remove("show"));
function saveCart(){localStorage.setItem("luxCart",JSON.stringify(cart));renderCart()}
function addToCart(id){const p=products.find(x=>x.id===id);const item=cart.find(x=>x.id===id);if(item)item.quantity++;else cart.push({id,quantity:1});saveCart();toast(p.name+" added to your bag")}
function renderProducts(){
  let list=[...products], q=$("searchInput").value.toLowerCase(), cat=$("categoryFilter").value, sort=$("sortFilter").value;
  list=list.filter(p=>(!q||`${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q))&&(cat==="All"||p.category===cat));
  if(sort==="low")list.sort((a,b)=>a.price-b.price);if(sort==="high")list.sort((a,b)=>b.price-a.price);
  $("productGrid").innerHTML=list.length?list.map(p=>`<article class="product-card"><div class="product-image"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"><span class="product-tag">${escapeHtml(p.category.toUpperCase())}</span></div><div class="product-info"><div class="product-brand">${escapeHtml(p.brand)}</div><h3>${escapeHtml(p.name)}</h3><p class="product-desc">${escapeHtml(p.description||"A considered timepiece for every moment.")}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-btn" onclick="addToCart(${p.id})">ADD TO BAG +</button></div></div></article>`).join(""):`<div class="empty">No watches found. Try another search.</div>`;
}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function loadProducts(){try{products=await request("/api/products");renderProducts()}catch(e){$("productGrid").innerHTML='<div class="empty">Unable to load products. Please refresh the page.</div>'}}
["searchInput","categoryFilter","sortFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",renderProducts));
function renderCart(){
  $("cartCount").textContent=cart.reduce((s,i)=>s+i.quantity,0);
  const rows=cart.map(item=>{const p=products.find(x=>x.id===item.id);return p?`<div class="cart-row"><img src="${escapeHtml(p.image)}" alt=""><div><h4>${escapeHtml(p.name)}</h4><small>${money(p.price)}</small><div class="qty-controls"><button onclick="changeQty(${p.id},-1)">−</button><span>${item.quantity}</span><button onclick="changeQty(${p.id},1)">+</button></div></div><b>${money(p.price*item.quantity)}</b></div>`:""}).join("");
  $("cartItems").innerHTML=rows||'<div class="empty">Your bag is waiting for something timeless.</div>';
  $("cartTotal").textContent=money(cart.reduce((s,i)=>{const p=products.find(x=>x.id===i.id);return s+(p?p.price*i.quantity:0)},0));
}
function changeQty(id,delta){const i=cart.find(x=>x.id===id);if(i){i.quantity+=delta;if(i.quantity<1)cart=cart.filter(x=>x.id!==id);saveCart()}}
$("cartBtn").onclick=()=>{$("cartBackdrop").classList.add("open");renderCart()};
$("closeCart").onclick=()=>$("cartBackdrop").classList.remove("open");
$("checkoutBtn").onclick=()=>{if(!cart.length)return toast("Your bag is empty.");$("cartBackdrop").classList.remove("open");if(!token){authMode="login";updateAuthUI();openModal("authModal");return toast("Please sign in before checkout.")} $("deliveryName").value=currentUser?.name||"";openModal("checkoutModal")};
$("accountBtn").onclick=()=>{if(token){if(currentUser?.role==="admin"){loadAdmin();openModal("adminModal")}else loadOrders()}else{authMode="login";updateAuthUI();openModal("authModal")}};
function updateAccountButton(){$("accountBtn").textContent=currentUser?(currentUser.role==="admin"?"Admin":"My account"):"Sign in"}
function updateAuthUI(){$("authTitle").textContent=authMode==="login"?"Sign in":"Create account";$("authSubmit").textContent=authMode==="login"?"SIGN IN":"CREATE ACCOUNT";$("nameField").classList.toggle("hidden",authMode==="login");$("authSwitch").innerHTML=authMode==="login"?'New here? <button id="toggleAuth">Create an account</button>':'Already registered? <button id="toggleAuth">Sign in</button>';$("toggleAuth").onclick=()=>{authMode=authMode==="login"?"register":"login";updateAuthUI()};$("authMessage").textContent=""}
$("toggleAuth").onclick=()=>{authMode="register";updateAuthUI()};
$("authForm").onsubmit=async e=>{e.preventDefault();try{const body={email:$("authEmail").value,password:$("authPassword").value};if(authMode==="register")body.name=$("authName").value;const data=await request("/api/"+(authMode==="login"?"login":"register"),{method:"POST",body:JSON.stringify(body)});token=data.token;currentUser=data.user;localStorage.setItem("luxToken",token);localStorage.setItem("luxUser",JSON.stringify(currentUser));updateAccountButton();closeModal("authModal");toast("Welcome, "+currentUser.name);if(cart.length) {openModal("checkoutModal");$("deliveryName").value=currentUser.name}}catch(err){$("authMessage").textContent=err.message}};
async function loadOrders(){try{const orders=await request("/api/orders");$("ordersList").innerHTML=orders.length?orders.map(o=>`<div class="order-card"><b>Order ${escapeHtml(o.id)}</b> · ${new Date(o.createdAt).toLocaleDateString()}<p>${o.items.map(i=>`${escapeHtml(i.name)} × ${i.quantity}`).join("<br>")}<br><b>Total: ${money(o.total)}</b><br>Status: ${escapeHtml(o.status)}</p></div>`).join(""):'<div class="empty">You have not placed any orders yet.</div>';openModal("ordersModal")}catch(e){toast(e.message)}}
$("checkoutForm").onsubmit=async e=>{e.preventDefault();try{const order=await request("/api/orders",{method:"POST",body:JSON.stringify({items:cart,customerName:$("deliveryName").value,phone:$("deliveryPhone").value,address:$("deliveryAddress").value})});cart=[];saveCart();closeModal("checkoutModal");await loadProducts();toast("Order placed: "+order.id)}catch(err){$("checkoutMessage").textContent=err.message}};
async function loadAdmin(){try{products=await request("/api/products");$("adminProducts").innerHTML=products.map(p=>`<div class="admin-row"><span>${escapeHtml(p.name)} · ${money(p.price)}</span><span><button onclick="editProduct(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></span></div>`).join("")}catch(e){toast(e.message)}}
$("productForm").onsubmit=async e=>{e.preventDefault();try{await request("/api/admin/products",{method:"POST",body:JSON.stringify({name:$("pName").value,brand:$("pBrand").value,category:$("pCategory").value,price:$("pPrice").value,stock:$("pStock").value,image:$("pImage").value,description:$("pDescription").value})});e.target.reset();await loadAdmin();await loadProducts();toast("Watch added successfully")}catch(err){toast(err.message)}};
async function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;const name=prompt("Product name:",p.name);if(name===null)return;const price=prompt("Price in INR:",p.price);if(price===null)return;const stock=prompt("Available stock:",p.stock);if(stock===null)return;try{await request("/api/admin/products/"+id,{method:"PUT",body:JSON.stringify({name,price,stock})});await loadAdmin();await loadProducts();toast("Product updated")}catch(e){toast(e.message)}}
async function deleteProduct(id){if(!confirm("Delete this watch?"))return;try{await request("/api/admin/products/"+id,{method:"DELETE"});await loadAdmin();await loadProducts();toast("Product deleted")}catch(e){toast(e.message)}}
async function init(){await loadProducts();renderCart();updateAccountButton();if(token){try{currentUser=await request("/api/me");localStorage.setItem("luxUser",JSON.stringify(currentUser));updateAccountButton()}catch{token="";currentUser=null;localStorage.removeItem("luxToken");localStorage.removeItem("luxUser");updateAccountButton()}}}
init();
