/* =========================
   Loader (never infinite)
========================= */
const pageLoader = document.getElementById("pageLoader");
function showLoader(duration = 500){
  if(!pageLoader) return;
  pageLoader.classList.remove("hide");
  setTimeout(()=> pageLoader.classList.add("hide"), duration);
}
window.addEventListener("load", ()=> showLoader(800));

/* =========================
   Mobile nav
========================= */
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
if(burger && nav){
  burger.addEventListener("click", ()=>{
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".nav__link").forEach(a=>{
    a.addEventListener("click", ()=>{
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded","false");
      showLoader(350);
    });
  });
}

/* Smooth anchor scroll + small loader */
document.addEventListener("click", (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if(!a) return;
  const id = a.getAttribute("href");
  const target = document.querySelector(id);
  if(!target) return;
  e.preventDefault();
  showLoader(320);
  target.scrollIntoView({behavior:"smooth", block:"start"});
  history.pushState(null, "", id);
});

/* =========================
   Reveal on scroll
========================= */
const revealEls = document.querySelectorAll(".reveal");
function reveal(){
  revealEls.forEach(el=>{
    if(el.classList.contains("show")) return;
    if(el.getBoundingClientRect().top < window.innerHeight - 120){
      el.classList.add("show");
    }
  });
}
window.addEventListener("scroll", reveal, {passive:true});
reveal();

/* =========================
   Cart Drawer
========================= */
const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer = document.getElementById("cartDrawer");
const openCartBtn = document.getElementById("openCart");
const closeCartBtn = document.getElementById("closeCart");
const stickyOpenCart = document.getElementById("stickyOpenCart");

function openCart(){
  cartOverlay?.classList.add("open");
  cartDrawer?.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeCart(){
  cartOverlay?.classList.remove("open");
  cartDrawer?.classList.remove("open");
  document.body.style.overflow = "";
}
openCartBtn?.addEventListener("click", openCart);
stickyOpenCart?.addEventListener("click", openCart);
closeCartBtn?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

/* =========================
   Cart Logic (real)
========================= */
const cart = new Map(); // sku -> {name, price, qty}
const cartItemsEl = document.getElementById("cartItems");
const subtotalEl = document.getElementById("subtotal");
const badge1 = document.getElementById("cartBadge");
const badge2 = document.getElementById("cartBadge2");

function euro(n){
  return n.toLocaleString("de-DE",{style:"currency",currency:"EUR"});
}
function cartCount(){
  let c = 0;
  cart.forEach(i=> c += i.qty);
  return c;
}

function renderCart(){
  if(!cartItemsEl) return;

  const count = cartCount();
  if(badge1) badge1.textContent = String(count);
  if(badge2) badge2.textContent = String(count);

  if(cart.size === 0){
    cartItemsEl.innerHTML = `<p class="muted">Noch nichts im Warenkorb.</p>`;
    if(subtotalEl) subtotalEl.textContent = euro(0);
    return;
  }

  let subtotal = 0;
  const parts = [];

  cart.forEach((item, sku)=>{
    subtotal += item.price * item.qty;

    parts.push(`
      <div class="cartitem">
        <div>
          <div class="cartitem__name">${item.name}</div>
          <div class="cartitem__meta">${euro(item.price)} / Stück</div>
        </div>
        <div class="cartitem__right">
          <div class="qty" aria-label="Menge im Warenkorb ändern">
            <button type="button" class="qty__btn touch-ripple" data-cart-qty="-1" data-sku="${sku}">−</button>
            <span style="min-width:18px; text-align:center; font-weight:800;">${item.qty}</span>
            <button type="button" class="qty__btn touch-ripple" data-cart-qty="1" data-sku="${sku}">+</button>
          </div>
          <div><strong>${euro(item.price * item.qty)}</strong></div>
          <button type="button" class="cartitem__remove" data-remove="${sku}">Entfernen</button>
        </div>
      </div>
    `);
  });

  cartItemsEl.innerHTML = parts.join("");
  if(subtotalEl) subtotalEl.textContent = euro(subtotal);
}

document.addEventListener("click", (e)=>{
  /* product qty + / - */
  const qtyBtn = e.target.closest(".qty__btn[data-qty]");
  if(qtyBtn){
    const product = qtyBtn.closest(".product");
    const input = product?.querySelector(".qty__input");
    if(!input) return;
    const delta = Number(qtyBtn.getAttribute("data-qty"));
    const current = Number(input.value || "1");
    input.value = String(Math.max(1, current + delta));
    return;
  }

  /* add to cart */
  const addBtn = e.target.closest(".add");
  if(addBtn){
    const product = addBtn.closest(".product");
    if(!product) return;

    const name = product.querySelector("h3")?.textContent?.trim() || "Produkt";
    const price = Number(product.getAttribute("data-price") || "0");
    const sku = product.getAttribute("data-sku") || name.toLowerCase().replace(/\s+/g,"-");
    const qty = Math.max(1, Number(product.querySelector(".qty__input")?.value || "1"));

    const existing = cart.get(sku);
    cart.set(sku, {
      name,
      price,
      qty: existing ? existing.qty + qty : qty
    });

    renderCart();
    openCart();

    const old = addBtn.textContent;
    addBtn.textContent = "Hinzugefügt ✓";
    addBtn.disabled = true;
    setTimeout(()=>{ addBtn.textContent = old; addBtn.disabled = false; }, 900);
    return;
  }

  /* remove item */
  const remove = e.target.closest("[data-remove]");
  if(remove){
    const sku = remove.getAttribute("data-remove");
    cart.delete(sku);
    renderCart();
    return;
  }

  /* cart qty + / - */
  const cartQtyBtn = e.target.closest("[data-cart-qty]");
  if(cartQtyBtn){
    const sku = cartQtyBtn.getAttribute("data-sku");
    const delta = Number(cartQtyBtn.getAttribute("data-cart-qty"));
    const item = cart.get(sku);
    if(!item) return;
    item.qty = Math.max(1, item.qty + delta);
    cart.set(sku, item);
    renderCart();
    return;
  }
});

document.getElementById("clearCart")?.addEventListener("click", ()=>{
  cart.clear();
  renderCart();
});

document.getElementById("checkoutBtn")?.addEventListener("click", ()=>{
  alert("Demo: Hier würdest du jetzt Payment integrieren (Stripe/Shopify).");
});

renderCart();
