// ======================================================
// Sabora — front-end
// Tenta buscar produtos da API Java (backend/). Se o backend
// não estiver rodando, usa os dados de exemplo abaixo.
// ======================================================

const API_BASE = 'http://localhost:8080/api';

const FALLBACK_PRODUCTS = [
  { id:'p1', name:'Risoto de cogumelos selvagens', category:'populares', price:42.90, emoji:'🍄', tag:'Destaque', desc:'Arbóreo cremoso com funghi salteados na manteiga e parmesão curado.' },
  { id:'p2', name:'Hambúrguer artesanal smash', category:'populares', price:34.50, emoji:'🍔', tag:'Mais vendido', desc:'Dois blends de 90g, queijo cheddar derretido e molho da casa.' },
  { id:'p3', name:'Poke de salmão', category:'populares', price:38.00, emoji:'🍣', tag:'Leve', desc:'Salmão fresco, edamame, manga e molho shoyu com gergelim.' },
  { id:'p4', name:'Feijoada completa', category:'salgados', price:46.00, emoji:'🍲', tag:'Tradição', desc:'Feijoada com acompanhamentos clássicos e couve refogada.' },
  { id:'p5', name:'Massa ao molho pesto', category:'salgados', price:32.90, emoji:'🍝', tag:'Vegetariano', desc:'Fettuccine fresco com pesto de manjericão e castanhas.' },
  { id:'p6', name:'Tacos de carne assada', category:'salgados', price:29.90, emoji:'🌮', tag:'Picante', desc:'Três tacos com carne desfiada, pico de gallo e guacamole.' },
  { id:'p7', name:'Pizza margherita', category:'salgados', price:39.90, emoji:'🍕', tag:'Clássico', desc:'Massa fermentada 48h, molho de tomate San Marzano e manjericão.' },
  { id:'p8', name:'Petit gâteau', category:'sobremesas', price:22.00, emoji:'🍫', tag:'Quentinho', desc:'Bolo de chocolate com recheio cremoso e sorvete de creme.' },
  { id:'p9', name:'Cheesecake de frutas vermelhas', category:'sobremesas', price:19.90, emoji:'🍰', tag:'Favorito', desc:'Base amanteigada, creme de queijo e calda de frutas vermelhas.' },
  { id:'p10', name:'Sorvete artesanal', category:'sobremesas', price:16.50, emoji:'🍨', tag:'Refrescante', desc:'Três bolas de sorvete cremoso, sabores rotativos da semana.' },
  { id:'p11', name:'Suco natural de laranja', category:'bebidas', price:9.90, emoji:'🍊', tag:'Vitamina C', desc:'Laranjas espremidas na hora, sem adição de açúcar.' },
  { id:'p12', name:'Café coado especial', category:'bebidas', price:8.50, emoji:'☕', tag:'Origem única', desc:'Grãos torrados artesanalmente, moídos na hora do pedido.' },
  { id:'p13', name:'Limonada suíça', category:'bebidas', price:10.90, emoji:'🍋', tag:'Refrescante', desc:'Limão siciliano batido com leite condensado e gelo.' },
];

const state = {
  products: [],
  cart: [], // { productId, qty }
};

const money = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

// ---------- Carregar produtos ----------
async function loadProducts(){
  try{
    const res = await fetch(`${API_BASE}/products`);
    if(!res.ok) throw new Error('backend indisponível');
    const data = await res.json();
    state.products = data;
  }catch(err){
    console.info('Usando dados locais — backend Java não encontrado em', API_BASE);
    state.products = FALLBACK_PRODUCTS;
  }
  renderRows();
}

function renderRows(){
  const groups = { populares:[], salgados:[], sobremesas:[], bebidas:[] };
  state.products.forEach(p => { if(groups[p.category]) groups[p.category].push(p); });

  Object.entries(groups).forEach(([cat, items]) => {
    const track = document.querySelector(`[data-track="${cat}"]`);
    if(!track) return;
    track.innerHTML = items.map(cardHTML).join('');
  });

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if(e.target.closest('.card__add')) return;
      openModal(card.dataset.id);
    });
  });
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.add);
    });
  });
}

function cardHTML(p){
  return `
    <article class="card" data-id="${p.id}">
      <div class="card__media">
        <span class="card__tag">${p.tag}</span>
        ${p.emoji}
        <button class="card__add" data-add="${p.id}" aria-label="Adicionar ${p.name} à sacola">+</button>
      </div>
      <div class="card__body">
        <div class="card__name">${p.name}</div>
        <div class="card__desc">${p.desc}</div>
        <div class="card__price">${money(p.price)}</div>
      </div>
    </article>`;
}

// ---------- Modal ----------
function openModal(id){
  const p = state.products.find(x => x.id === id);
  if(!p) return;
  const modal = document.getElementById('productModal');
  document.getElementById('modalCard').innerHTML = `
    <div class="modal__media" style="background:linear-gradient(135deg,#F6E3C0,#F3F6EC)">
      <button class="modal__close" id="modalClose">✕</button>
      ${p.emoji}
    </div>
    <div class="modal__body">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <span class="modal__price">${money(p.price)}</span>
      <button class="btn btn--primary btn--full" data-add="${p.id}">Adicionar à sacola</button>
    </div>`;
  modal.classList.add('open');
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCard').querySelector('[data-add]').addEventListener('click', () => {
    addToCart(p.id);
    closeModal();
  });
}
function closeModal(){ document.getElementById('productModal').classList.remove('open'); }
document.getElementById('productModal').addEventListener('click', (e) => {
  if(e.target.id === 'productModal') closeModal();
});
document.getElementById('heroInfoBtn').addEventListener('click', () => openModal('p1'));

// ---------- Carrinho ----------
async function addToCart(productId){
  // tenta sincronizar com o backend Java; se falhar, mantém local
  try{
    await fetch(`${API_BASE}/cart`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ productId, qty:1 })
    });
  }catch(err){ /* segue apenas com o estado local */ }

  const existing = state.cart.find(i => i.productId === productId);
  if(existing) existing.qty++;
  else state.cart.push({ productId, qty:1 });

  renderCart();
  openCart();
}

function changeQty(productId, delta){
  const item = state.cart.find(i => i.productId === productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) state.cart = state.cart.filter(i => i.productId !== productId);
  renderCart();
}

function renderCart(){
  const list = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');

  if(state.cart.length === 0){
    list.innerHTML = `<p class="cart__empty">Sua sacola está vazia. Que tal adicionar algo gostoso?</p>`;
    totalEl.textContent = money(0);
    countEl.textContent = '0';
    return;
  }

  let total = 0, count = 0;
  list.innerHTML = state.cart.map(item => {
    const p = state.products.find(x => x.id === item.productId);
    if(!p) return '';
    total += p.price * item.qty;
    count += item.qty;
    return `
      <div class="cart__item">
        <div class="cart__item-media">${p.emoji}</div>
        <div class="cart__item-info">
          <div class="cart__item-name">${p.name}</div>
          <div class="cart__item-price">${money(p.price)}</div>
        </div>
        <div class="cart__item-qty">
          <button data-dec="${p.id}">−</button>
          <span>${item.qty}</span>
          <button data-inc="${p.id}">+</button>
        </div>
      </div>`;
  }).join('');

  totalEl.textContent = money(total);
  countEl.textContent = String(count);

  list.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => changeQty(b.dataset.inc, 1)));
  list.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => changeQty(b.dataset.dec, -1)));
}

function openCart(){
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
}
function closeCart(){
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
}
document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('overlay').addEventListener('click', () => { closeCart(); closeModal(); });
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if(state.cart.length === 0) return;
  alert('Pedido fechado! Isso é uma demonstração — conecte um checkout real quando integrar pagamentos.');
  state.cart = [];
  renderCart();
  closeCart();
});

// ---------- Busca ----------
const searchToggle = document.getElementById('searchToggle');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
searchToggle.addEventListener('click', () => {
  searchBar.classList.toggle('open');
  if(searchBar.classList.contains('open')) searchInput.focus();
});
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const name = card.querySelector('.card__name').textContent.toLowerCase();
    card.style.display = name.includes(q) ? '' : 'none';
  });
});

// ---------- Topbar ao rolar ----------
const topbar = document.getElementById('topbar');
window.addEventListener('scroll', () => {
  topbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ---------- Início ----------
loadProducts();