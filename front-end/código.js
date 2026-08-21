// Base de dados simulada
const foods = [
    { id: 1, name: "Burger Artesanal", category: "Lanches", price: 35.90, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80" },
    { id: 2, name: "Pizza de Pepperoni", category: "Pizza", price: 65.00, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80" },
    { id: 3, name: "Combo Sushi 30 Peças", category: "Sushi", price: 89.90, img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80" },
    { id: 4, name: "Salada Tropical", category: "Saudável", price: 28.50, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80" },
    { id: 5, name: "Batata Frita com Cheddar", category: "Lanches", price: 22.00, img: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80" },
    { id: 6, name: "Bolo de Chocolate", category: "Sobremesas", price: 18.00, img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80" }
];

let cart = [];

// Função para renderizar os cards nos trilhos
function renderRows() {
    const popularRow = document.getElementById('popular-row');
    const orderAgainRow = document.getElementById('order-again-row');
    
    let htmlContent = '';
    
    foods.forEach(food => {
        htmlContent += `
            <div class="food-card" style="background-image: url('${food.img}')">
                <div class="card-overlay">
                    <div class="card-info">
                        <h3>${food.name}</h3>
                        <p>${food.category} • R$ ${food.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="add-btn" onclick="addToCart(${food.id})">+</button>
                </div>
            </div>
        `;
    });

    // Injeta os mesmos dados para demonstração nos dois trilhos
    popularRow.innerHTML = htmlContent;
    orderAgainRow.innerHTML = htmlContent;
}

// Lógica do Carrinho
function addToCart(id) {
    const item = foods.find(f => f.id === id);
    cart.push(item);
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    
    // Atualiza contador
    cartCount.innerText = cart.length;
    
    // Atualiza lista visual
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart">Sua sacola está vazia.</p>';
        cartTotalSpan.innerText = 'R$ 0,00';
        return;
    }

    let itemsHtml = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        itemsHtml += `
            <div class="cart-item">
                <div>
                    <h4>${item.name}</h4>
                    <p style="color: var(--text-muted); font-size: 0.8rem;">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <button style="background:none; border:none; color:red; cursor:pointer;" onclick="removeFromCart(${index})">Remover</button>
            </div>
        `;
    });

    cartItemsDiv.innerHTML = itemsHtml;
    cartTotalSpan.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// Abrir/Fechar Modal do Carrinho
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
    renderRows();
});