// client.js - Página del cliente con datos sincronizados

let pizzas = [];
let carrito = [];
let carouselImages = [];
let currentSlide = 0;
let carouselInterval;

// Misma clave que en admin
const STORAGE_PIZZAS = 'pizzeria_dinamita_pizzas';
const STORAGE_CARRUSEL = 'pizzeria_dinamita_carrusel';

// Datos por defecto (mismos que en admin)
const DEFAULT_PIZZAS = [
    {
        id: 1,
        nombre: 'Pizza Margherita',
        descripcion: 'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva',
        precio: 12.99,
        stock: 10,
        imagen_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400'
    },
    {
        id: 2,
        nombre: 'Pizza Pepperoni',
        descripcion: 'Salsa de tomate, mozzarella y pepperoni italiano',
        precio: 14.99,
        stock: 15,
        imagen_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'
    }
];

const DEFAULT_CARRUSEL = [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1400'
];

// ==================== LOADING SCREEN ====================
async function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('loadingProgress');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 12;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            setTimeout(() => {
                loadingScreen.classList.add('hide');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 600);
            }, 400);
        }
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }, 100);
    
    // Cargar datos desde localStorage
    loadDataFromStorage();
    
    // Escuchar cambios en localStorage (para sincronizar entre pestañas)
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_PIZZAS || e.key === STORAGE_CARRUSEL || e.key === 'pizzeria_update') {
            loadDataFromStorage();
        }
    });
}

// Cargar datos desde localStorage
function loadDataFromStorage() {
    // Cargar pizzas
    const savedPizzas = localStorage.getItem(STORAGE_PIZZAS);
    if (savedPizzas) {
        pizzas = JSON.parse(savedPizzas);
    } else {
        pizzas = JSON.parse(JSON.stringify(DEFAULT_PIZZAS));
        localStorage.setItem(STORAGE_PIZZAS, JSON.stringify(pizzas));
    }
    
    // Cargar carrusel
    const savedCarrusel = localStorage.getItem(STORAGE_CARRUSEL);
    if (savedCarrusel) {
        carouselImages = JSON.parse(savedCarrusel);
    } else {
        carouselImages = [...DEFAULT_CARRUSEL];
        localStorage.setItem(STORAGE_CARRUSEL, JSON.stringify(carouselImages));
    }
    
    // Renderizar
    renderPizzas();
    initCarousel();
    initScrollReveal();
}

// ==================== CARRUSEL ====================
function initCarousel() {
    const slidesContainer = document.getElementById('carouselSlides');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!slidesContainer) return;
    
    if (carouselImages.length === 0) {
        carouselImages = DEFAULT_CARRUSEL;
    }
    
    slidesContainer.innerHTML = carouselImages.map((img, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${img}')">
            <div class="carousel-caption">
                <h2>Pizzería Dinamita</h2>
                <p>La mejor pizza artesanal</p>
            </div>
        </div>
    `).join('');
    
    dotsContainer.innerHTML = carouselImages.map((_, index) => `
        <div class="carousel-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
    `).join('');
    
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            goToSlide(parseInt(dot.dataset.slide));
            resetCarouselInterval();
        });
    });
    
    startCarouselInterval();
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    currentSlide = index;
}

function startCarouselInterval() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

function resetCarouselInterval() {
    clearInterval(carouselInterval);
    startCarouselInterval();
}

// ==================== PIZZAS ====================
function renderPizzas() {
    const container = document.getElementById('pizzasContainer');
    if (!container) return;
    
    // Filtrar solo pizzas con stock > 0
    const pizzasDisponibles = pizzas.filter(p => p.stock > 0);
    
    if (pizzasDisponibles.length === 0) {
        container.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 3rem;"><p>No hay pizzas disponibles en este momento.</p></div>';
        return;
    }
    
    container.innerHTML = pizzasDisponibles.map(pizza => {
        let imgSrc = pizza.imagen_data || pizza.imagen_url || 'https://via.placeholder.com/400x300?text=Pizza';
        return `
        <div class="pizza-card scroll-reveal" data-id="${pizza.id}">
            <div class="pizza-img-container">
                <img src="${imgSrc}" 
                     alt="${escapeHtml(pizza.nombre)}" 
                     class="pizza-img" 
                     onerror="this.src='https://via.placeholder.com/400x300?text=Pizza'">
                <div class="pizza-badge">🔥 Popular</div>
            </div>
            <div class="pizza-info">
                <h3 class="pizza-nombre">${escapeHtml(pizza.nombre)}</h3>
                <p class="pizza-descripcion">${escapeHtml(pizza.descripcion)}</p>
                <div class="pizza-footer">
                    <div>
                        <div class="pizza-precio">$${pizza.precio.toFixed(2)}</div>
                        <div class="pizza-stock">🍕 ${pizza.stock} disponibles</div>
                    </div>
                    <button class="btn-add" onclick="agregarAlCarrito(${pizza.id})">
                        Agregar +
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// ==================== CARRITO ====================
function agregarAlCarrito(pizzaId) {
    const pizza = pizzas.find(p => p.id === pizzaId);
    if (!pizza) return;
    
    if (pizza.stock <= 0) {
        showNotification('No hay stock disponible', 'error');
        return;
    }
    
    const existingItem = carrito.find(item => item.id === pizzaId);
    if (existingItem) {
        if (existingItem.cantidad < pizza.stock) {
            existingItem.cantidad++;
            showNotification(`+1 ${pizza.nombre}`, 'success');
        } else {
            showNotification('Stock insuficiente', 'error');
            return;
        }
    } else {
        carrito.push({ id: pizza.id, nombre: pizza.nombre, precio: pizza.precio, cantidad: 1 });
        showNotification(`${pizza.nombre} agregada al carrito`, 'success');
    }
    
    saveCarritoToLocalStorage();
    updateCarritoUI();
    animateCartIcon();
}

function updateCarritoUI() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems) return;
    
    if (carrito.length === 0) {
        cartItems.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>Tu carrito está vacío</p><small>¡Agrega algunas pizzas!</small></div>';
        if (cartTotal) cartTotal.textContent = '0';
        if (cartCount) cartCount.textContent = '0';
        return;
    }
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    if (cartTotal) cartTotal.textContent = total.toFixed(2);
    if (cartCount) cartCount.textContent = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    cartItems.innerHTML = carrito.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${escapeHtml(item.nombre)}</h4>
                <p>$${item.precio.toFixed(2)}</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="modificarCantidad(${item.id}, -1)">-</button>
                <span>${item.cantidad}</span>
                <button onclick="modificarCantidad(${item.id}, 1)">+</button>
                <button onclick="eliminarDelCarrito(${item.id})" style="background: #dc3545; color: white;">✕</button>
            </div>
        </div>
    `).join('');
}

function modificarCantidad(pizzaId, cambio) {
    const item = carrito.find(i => i.id === pizzaId);
    if (!item) return;
    
    const nuevaCantidad = item.cantidad + cambio;
    const pizza = pizzas.find(p => p.id === pizzaId);
    
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(pizzaId);
    } else if (pizza && nuevaCantidad <= pizza.stock) {
        item.cantidad = nuevaCantidad;
        saveCarritoToLocalStorage();
        updateCarritoUI();
    } else {
        showNotification('Stock insuficiente', 'error');
    }
}

function eliminarDelCarrito(pizzaId) {
    carrito = carrito.filter(item => item.id !== pizzaId);
    saveCarritoToLocalStorage();
    updateCarritoUI();
}

function ordenarPorWhatsApp() {
    if (carrito.length === 0) {
        showNotification('Agrega pizzas al carrito primero', 'error');
        return;
    }
    
    let mensaje = "🍕 *PEDIDO PIZZERÍA DINAMITA* 🍕\n\n";
    mensaje += "*Detalle del pedido:*\n";
    carrito.forEach(item => mensaje += `• ${item.cantidad}x ${item.nombre} - $${(item.precio * item.cantidad).toFixed(2)}\n`);
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    mensaje += `\n*Total:* $${total.toFixed(2)}\n\n_¡Gracias por tu pedido!_`;
    
    const telefono = "5491123456789";
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function animateCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.style.transform = 'scale(1.1)';
    setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('cartOverlay').classList.toggle('active');
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('revealed'));
    }, { threshold: 0.1 });
    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

function initHeaderScroll() {
    window.addEventListener('scroll', () => {
        document.getElementById('mainHeader').classList.toggle('scrolled', window.pageYOffset > 100);
    });
}

// ==================== EVENTOS ====================
document.addEventListener('DOMContentLoaded', async () => {
    await initLoadingScreen();
    initHeaderScroll();
    document.getElementById('cartToggle')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', toggleCart);
    document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
    document.getElementById('orderBtn')?.addEventListener('click', ordenarPorWhatsApp);
    loadCarritoFromLocalStorage();
    updateCarritoUI();
});

// ==================== UTILIDADES ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${type === 'success' ? '✓' : '✗'}</span><span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function saveCarritoToLocalStorage() { 
    localStorage.setItem('pizzeria_carrito', JSON.stringify(carrito)); 
}

function loadCarritoFromLocalStorage() { 
    const saved = localStorage.getItem('pizzeria_carrito'); 
    if (saved) carrito = JSON.parse(saved); 
}

// Exportar funciones globales
window.agregarAlCarrito = agregarAlCarrito;
window.modificarCantidad = modificarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
