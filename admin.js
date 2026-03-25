// admin.js - Panel de administración mejorado

let pizzas = [];
let carouselImages = [];

// Datos de demostración (para pruebas sin Supabase)
const DEMO_PIZZAS = [
    { id: 1, nombre: 'Pizza Margherita', descripcion: 'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva', precio: 12.99, stock: 10, imagen_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=200' },
    { id: 2, nombre: 'Pizza Pepperoni', descripcion: 'Salsa de tomate, mozzarella y pepperoni italiano', precio: 14.99, stock: 15, imagen_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200' },
    { id: 3, nombre: 'Pizza Cuatro Quesos', descripcion: 'Mozzarella, gorgonzola, parmesano y queso de cabra', precio: 16.99, stock: 8, imagen_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200' }
];

const DEMO_CAROUSEL = [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600'
];

let nextId = 4;

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar datos de demostración (cambiar a Supabase cuando esté configurado)
    loadDemoData();
    
    // Event listeners
    document.getElementById('pizzaForm')?.addEventListener('submit', guardarPizza);
    document.getElementById('cancelBtn')?.addEventListener('click', cancelarEdicion);
    document.getElementById('carruselForm')?.addEventListener('submit', agregarImagenCarrusel);
});

function loadDemoData() {
    pizzas = [...DEMO_PIZZAS];
    carouselImages = [...DEMO_CAROUSEL];
    renderAdminPizzas();
    renderCarruselImages();
    updateStats();
}

function renderAdminPizzas() {
    const tbody = document.getElementById('pizzasTableBody');
    if (!tbody) return;

    if (pizzas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay pizzas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = pizzas.map(pizza => `
        <tr>
            <td>
                <img src="${pizza.imagen_url || 'https://via.placeholder.com/60x60?text=Pizza'}" 
                     class="pizza-img-mini" 
                     onerror="this.src='https://via.placeholder.com/60x60?text=Pizza'">
            </td>
            <td><strong>${escapeHtml(pizza.nombre)}</strong></td>
            <td style="max-width: 250px;">${escapeHtml(pizza.descripcion.substring(0, 60))}${pizza.descripcion.length > 60 ? '...' : ''}</td>
            <td>$${pizza.precio.toFixed(2)}</td>
            <td>
                <span style="background: ${pizza.stock > 5 ? '#28a745' : pizza.stock > 0 ? '#ffc107' : '#dc3545'}; 
                             color: white; padding: 0.25rem 0.5rem; border-radius: 20px; font-size: 0.75rem;">
                    ${pizza.stock} unidades
                </span>
            </td>
            <td>
                <div class="admin-actions">
                    <button class="edit-btn" onclick="editarPizza(${pizza.id})">✏️ Editar</button>
                    <button class="delete-btn" onclick="eliminarPizza(${pizza.id})">🗑️ Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderCarruselImages() {
    const container = document.getElementById('carruselGrid');
    if (!container) return;

    if (carouselImages.length === 0) {
        container.innerHTML = '<p>No hay imágenes en el carrusel. Agrega algunas arriba.</p>';
        return;
    }

    container.innerHTML = carouselImages.map((img, index) => `
        <div class="carrusel-item">
            <img src="${img}" alt="Carrusel ${index + 1}">
            <button class="delete-img" onclick="eliminarImagenCarrusel(${index})">✕</button>
        </div>
    `).join('');
}

function updateStats() {
    const totalPizzas = pizzas.length;
    const totalStock = pizzas.reduce((sum, p) => sum + p.stock, 0);
    const carruselCount = carouselImages.length;
    
    document.getElementById('totalPizzas').textContent = totalPizzas;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('carruselCount').textContent = carruselCount;
}

function guardarPizza(event) {
    event.preventDefault();
    
    const id = document.getElementById('pizzaId').value;
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precio = parseFloat(document.getElementById('precio').value);
    const stock = parseInt(document.getElementById('stock').value);
    const imagen_url = document.getElementById('imagen').value.trim();

    if (!nombre || !descripcion || isNaN(precio) || isNaN(stock)) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }

    if (id) {
        // Editar pizza existente
        const index = pizzas.findIndex(p => p.id == id);
        if (index !== -1) {
            pizzas[index] = { ...pizzas[index], nombre, descripcion, precio, stock, imagen_url };
            showNotification('Pizza actualizada correctamente', 'success');
        }
    } else {
        // Crear nueva pizza
        const newPizza = {
            id: nextId++,
            nombre,
            descripcion,
            precio,
            stock,
            imagen_url
        };
        pizzas.push(newPizza);
        showNotification('Pizza agregada correctamente', 'success');
    }

    resetForm();
    renderAdminPizzas();
    updateStats();
}

window.editarPizza = function(id) {
    const pizza = pizzas.find(p => p.id === id);
    if (!pizza) return;

    document.getElementById('pizzaId').value = pizza.id;
    document.getElementById('nombre').value = pizza.nombre;
    document.getElementById('descripcion').value = pizza.descripcion;
    document.getElementById('precio').value = pizza.precio;
    document.getElementById('stock').value = pizza.stock;
    document.getElementById('imagen').value = pizza.imagen_url || '';

    document.getElementById('submitBtn').innerHTML = '✏️ Actualizar Pizza';
    document.getElementById('cancelBtn').style.display = 'inline-block';
};

window.eliminarPizza = function(id) {
    if (!confirm('¿Estás seguro de eliminar esta pizza? Esta acción no se puede deshacer.')) return;
    
    pizzas = pizzas.filter(p => p.id !== id);
    renderAdminPizzas();
    updateStats();
    showNotification('Pizza eliminada correctamente', 'success');
    
    // Si estábamos editando esta pizza, resetear formulario
    if (document.getElementById('pizzaId').value == id) {
        resetForm();
    }
};

function agregarImagenCarrusel(event) {
    event.preventDefault();
    const url = document.getElementById('carruselUrl').value.trim();
    
    if (!url) {
        showNotification('Ingresa una URL de imagen válida', 'error');
        return;
    }
    
    carouselImages.push(url);
    renderCarruselImages();
    updateStats();
    document.getElementById('carruselUrl').value = '';
    showNotification('Imagen agregada al carrusel', 'success');
}

window.eliminarImagenCarrusel = function(index) {
    if (!confirm('¿Eliminar esta imagen del carrusel?')) return;
    carouselImages.splice(index, 1);
    renderCarruselImages();
    updateStats();
    showNotification('Imagen eliminada', 'success');
};

function cancelarEdicion() {
    resetForm();
}

function resetForm() {
    document.getElementById('pizzaForm').reset();
    document.getElementById('pizzaId').value = '';
    document.getElementById('submitBtn').innerHTML = '➕ Agregar Pizza';
    document.getElementById('cancelBtn').style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
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
