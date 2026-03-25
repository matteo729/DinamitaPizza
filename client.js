// client.js - Lógica principal del cliente con mejoras profesionales

let pizzas = [];
let carrito = [];
let carouselImages = [];
let currentSlide = 0;
let carouselInterval;

// ==================== LOADING SCREEN ====================
async function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('loadingProgress');
    
    // Simular carga de recursos
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Ocultar loading con animación
            setTimeout(() => {
                loadingScreen.classList.add('hide');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    // Mostrar contenido con animación
                    document.body.style.opacity = '0';
                    document.body.style.animation = 'fadeIn 0.6s ease forwards';
                }, 800);
            }, 500);
        }
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }, 100);
    
    // Cargar datos mientras se muestra el loading
    await Promise.all([
        loadCarouselImages(),
        loadPizzas()
    ]);
}

// ==================== CARRUSEL MEJORADO ====================
async function loadCarouselImages() {
    try {
        const { data, error } = await supabaseClient
            .storage
            .from('carrusel')
            .list('');
            
        if (error || !data || data.length === 0) {
            // Imágenes de respaldo profesionales
            carouselImages = [
                {
                    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600',
                    title: 'Pizza Artesanal',
                    description: 'Elaborada con los mejores ingredientes'
                },
                {
                    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600',
                    title: 'Sabor Inigualable',
                    description: 'Receta secreta que enamora'
                },
                {
                    url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1600',
                    title: 'Momento Perfecto',
                    description: 'Comparte con quien más quieras'
                }
            ];
        } else {
            carouselImages = data.map(file => ({
                url: supabaseClient.storage.from('carrusel').getPublicUrl(file.name).data.publicUrl,
                title: 'Pizza Especial',
                description: 'Deliciosa pizza artesanal'
            }));
        }
        
        initCarousel();
    } catch (error) {
        console.error('Error cargando carrusel:', error);
        carouselImages = [{
            url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600',
            title: 'Pizzería Dinamita',
            description: 'La mejor pizza de la ciudad'
        }];
        initCarousel();
    }
}

function initCarousel() {
    const slidesContainer = document.getElementById('carouselSlides');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!slidesContainer) return;
    
    // Crear slides
    slidesContainer.innerHTML = carouselImages.map((img, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${img.url}')">
            <div class="carousel-caption">
                <h2>${img.title}</h2>
                <p>${img.description}</p>
            </div>
        </div>
    `).join('');
    
    // Crear dots
    dotsContainer.innerHTML = carouselImages.map((_, index) => `
        <div class="carousel-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
    `).join('');
    
    // Event listeners para dots
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.dataset.slide);
            goToSlide(slideIndex);
            resetCarouselInterval();
        });
    });
    
    // Iniciar carrusel automático
    startCarouselInterval();
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    currentSlide = index;
}

function startCarouselInterval() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 5000);
}

function resetCarouselInterval() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        startCarouselInterval();
    }
}

// ==================== PIZZAS ====================
async function loadPizzas() {
    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .gte('stock', 1)
            .order('nombre');

        if (error) throw error;

        pizzas = data;
        renderPizzas();
        
        // Activar animaciones scroll reveal
        initScrollReveal();
    } catch (error) {
        console.error('Error cargando pizzas:', error);
        showNotification('Error al cargar las pizzas', 'error');
    }
}

function renderPizzas() {
    const container = document.getElementById('pizzasContainer');
    if (!container) return;

    if (pizzas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
                <p>No hay pizzas disponibles en este momento. ¡Vuelve pronto!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pizzas.map((pizza, index) => `
        <div class="pizza-card scroll-reveal" data-id="${pizza.id}" style="animation-delay: ${index * 0.1}s">
            <div class="pizza-img-container">
                <img src="${pizza.imagen_url || 'https://via.placeholder.com/400x300?text=Pizza+Artesanal'}" 
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
    `).join('');
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
        carrito.push({
            id: pizza.id,
            nombre: pizza.nombre,
            precio: pizza.precio,
            cantidad: 1,
            maxStock: pizza.stock
        });
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
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p>🛒 Tu carrito está vacío</p>
                <small>¡Agrega algunas pizzas!</small>
            </div>
        `;
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
                <button onclick="modificarCantidad(${item.id}, -1)" style="background: #f0f0f0;">-</button>
                <span style="min-width: 30px; text-align: center;">${item.cantidad}</span>
                <button onclick="modificarCantidad(${item.id}, 1)" style="background: #f0f0f0;">+</button>
                <button onclick="eliminarDelCarrito(${item.id})" style="background: #dc3545; color: white;">✕</button>
            </div>
        </div>
    `).join('');
}

function animateCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.style.transform = 'scale(1.1)';
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
    }, 200);
}

function ordenarPorWhatsApp() {
    if (carrito.length === 0) {
        showNotification('Agrega pizzas al carrito primero', 'error');
        return;
    }

    let mensaje = "🍕 *PEDIDO PIZZERÍA DINAMITA* 🍕\n\n";
    mensaje += "*Detalle del pedido:*\n";
    
    carrito.forEach(item => {
        mensaje += `• ${item.cantidad}x ${item.nombre} - $${(item.precio * item.cantidad).toFixed(2)}\n`;
    });
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    mensaje += `\n*Total:* $${total.toFixed(2)}\n\n`;
    mensaje += "_¡Gracias por tu pedido! En breve nos comunicamos._";

    const telefono = "5491123456789";
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ==================== UI INTERACTIVA ====================
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

function initScrollReveal() {
    const reveals = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    reveals.forEach(reveal => observer.observe(reveal));
}

function initHeaderScroll() {
    const header = document.getElementById('mainHeader');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', async () => {
    await initLoadingScreen();
    initHeaderScroll();
    
    // Event listeners del carrito
    document.getElementById('cartToggle')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', toggleCart);
    document.getElementById('cartOverlay')?.addEventListener('click', toggleCart);
    document.getElementById('orderBtn')?.addEventListener('click', ordenarPorWhatsApp);
    
    // Cargar carrito guardado
    loadCarritoFromLocalStorage();
    updateCarritoUI();
});

// ==================== UTILIDADES ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function saveCarritoToLocalStorage() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function loadCarritoFromLocalStorage() {
    const saved = localStorage.getItem('carrito');
    if (saved) {
        carrito = JSON.parse(saved);
    }
}

// Exportar funciones globales
window.agregarAlCarrito = agregarAlCarrito;
window.modificarCantidad = modificarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;