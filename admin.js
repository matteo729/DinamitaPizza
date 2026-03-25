// admin.js - Panel de administración con almacenamiento compartido

let pizzas = [];
let carouselImages = [];
let editingId = null;

// Clave única para almacenamiento compartido
const STORAGE_PIZZAS = 'pizzeria_dinamita_pizzas';
const STORAGE_CARRUSEL = 'pizzeria_dinamita_carrusel';

// Datos iniciales por defecto
const DEFAULT_PIZZAS = [
    {
        id: 1,
        nombre: 'Pizza Margherita',
        descripcion: 'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva',
        precio: 12.99,
        stock: 10,
        imagen_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400',
        imagen_data: null
    },
    {
        id: 2,
        nombre: 'Pizza Pepperoni',
        descripcion: 'Salsa de tomate, mozzarella y pepperoni italiano',
        precio: 14.99,
        stock: 15,
        imagen_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
        imagen_data: null
    },
    {
        id: 3,
        nombre: 'Pizza Cuatro Quesos',
        descripcion: 'Mozzarella, gorgonzola, parmesano y queso de cabra',
        precio: 16.99,
        stock: 8,
        imagen_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        imagen_data: null
    }
];

const DEFAULT_CARRUSEL = [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1400',
    'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1400'
];

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    loadPizzas();
    loadCarouselImages();
    
    // Event listeners
    document.getElementById('pizzaForm')?.addEventListener('submit', guardarPizza);
    document.getElementById('cancelBtn')?.addEventListener('click', cancelarEdicion);
    document.getElementById('carruselForm')?.addEventListener('submit', agregarImagenCarrusel);
    
    // Preview de imagen
    document.getElementById('imagenFile')?.addEventListener('change', previewImage);
});

// Cargar pizzas desde localStorage
function loadPizzas() {
    const saved = localStorage.getItem(STORAGE_PIZZAS);
    if (saved) {
        pizzas = JSON.parse(saved);
    } else {
        // Si no hay datos, usar los de ejemplo
        pizzas = JSON.parse(JSON.stringify(DEFAULT_PIZZAS));
        savePizzas();
    }
    renderAdminPizzas();
    updateStats();
}

// Guardar pizzas en localStorage
function savePizzas() {
    localStorage.setItem(STORAGE_PIZZAS, JSON.stringify(pizzas));
}

// Cargar imágenes del carrusel desde localStorage
function loadCarouselImages() {
    const saved = localStorage.getItem(STORAGE_CARRUSEL);
    if (saved) {
        carouselImages = JSON.parse(saved);
    } else {
        carouselImages = [...DEFAULT_CARRUSEL];
        saveCarouselImages();
    }
    renderCarruselImages();
    updateStats();
}

// Guardar imágenes del carrusel
function saveCarouselImages() {
    localStorage.setItem(STORAGE_CARRUSEL, JSON.stringify(carouselImages));
}

// Preview de imagen
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagenPreview');
            const previewImg = document.getElementById('previewImg');
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Guardar pizza
async function guardarPizza(event) {
    event.preventDefault();
    
    const id = document.getElementById('pizzaId').value;
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precio = parseFloat(document.getElementById('precio').value);
    const stock = parseInt(document.getElementById('stock').value);
    const imagenFile = document.getElementById('imagenFile').files[0];
    
    if (!nombre || !descripcion || isNaN(precio) || isNaN(stock)) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    let imagen_url = null;
    let imagen_data = null;
    
    if (imagenFile) {
        const result = await processImage(imagenFile);
        if (result) {
            imagen_data = result;
            imagen_url = result;
        }
    } else if (id) {
        const existingPizza = pizzas.find(p => p.id == id);
        imagen_url = existingPizza?.imagen_url;
        imagen_data = existingPizza?.imagen_data;
    }
    
    if (id) {
        // Actualizar
        const index = pizzas.findIndex(p => p.id == id);
        if (index !== -1) {
            pizzas[index] = { 
                ...pizzas[index], 
                nombre, 
                descripcion, 
                precio, 
                stock,
                imagen_url: imagen_url || pizzas[index].imagen_url,
                imagen_data: imagen_data || pizzas[index].imagen_data
            };
            showNotification('Pizza actualizada correctamente', 'success');
        }
    } else {
        // Crear nueva
        const newId = pizzas.length > 0 ? Math.max(...pizzas.map(p => p.id)) + 1 : 1;
        const newPizza = {
            id: newId,
            nombre,
            descripcion,
            precio,
            stock,
            imagen_url: imagen_url || null,
            imagen_data: imagen_data || null
        };
        pizzas.push(newPizza);
        showNotification('Pizza agregada correctamente', 'success');
    }
    
    savePizzas();
    resetForm();
    renderAdminPizzas();
    updateStats();
    
    // Forzar actualización de la página del cliente si está abierta en otra pestaña
    localStorage.setItem('pizzeria_update', Date.now().toString());
}

// Procesar imagen a base64
function processImage(file) {
    return new Promise((resolve) => {
        if (!file) {
            resolve(null);
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            showNotification('La imagen no puede exceder 2MB', 'error');
            resolve(null);
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showNotification('El archivo debe ser una imagen', 'error');
            resolve(null);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function() {
            showNotification('Error al leer la imagen', 'error');
            resolve(null);
        };
        reader.readAsDataURL(file);
    });
}

// Renderizar tabla de pizzas
function renderAdminPizzas() {
    const tbody = document.getElementById('pizzasTableBody');
    if (!tbody) return;
    
    if (pizzas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay pizzas registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = pizzas.map(pizza => {
        let imgSrc = pizza.imagen_data || pizza.imagen_url || 'https://via.placeholder.com/60x60?text=Pizza';
        return `
        <tr>
            <td>
                <img src="${imgSrc}" 
                     class="pizza-img-mini" 
                     onerror="this.src='https://via.placeholder.com/60x60?text=Pizza'">
            </td>
            <td><strong>${escapeHtml(pizza.nombre)}</strong></td>
            <td style="max-width: 300px;">${escapeHtml(pizza.descripcion.substring(0, 80))}${pizza.descripcion.length > 80 ? '...' : ''}</td>
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
    `}).join('');
}

// Renderizar imágenes del carrusel
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

// Actualizar estadísticas
function updateStats() {
    const totalPizzas = pizzas.length;
    const totalStock = pizzas.reduce((sum, p) => sum + p.stock, 0);
    const carruselCount = carouselImages.length;
    
    document.getElementById('totalPizzas').textContent = totalPizzas;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('carruselCount').textContent = carruselCount;
}

// Editar pizza
window.editarPizza = function(id) {
    const pizza = pizzas.find(p => p.id === id);
    if (!pizza) return;
    
    editingId = id;
    
    document.getElementById('pizzaId').value = pizza.id;
    document.getElementById('nombre').value = pizza.nombre;
    document.getElementById('descripcion').value = pizza.descripcion;
    document.getElementById('precio').value = pizza.precio;
    document.getElementById('stock').value = pizza.stock;
    
    // Mostrar preview de la imagen actual
    const imgSrc = pizza.imagen_data || pizza.imagen_url;
    if (imgSrc) {
        const preview = document.getElementById('imagenPreview');
        const previewImg = document.getElementById('previewImg');
        previewImg.src = imgSrc;
        preview.style.display = 'block';
    } else {
        document.getElementById('imagenPreview').style.display = 'none';
    }
    
    document.getElementById('imagenFile').value = '';
    document.getElementById('submitBtn').innerHTML = '✏️ Actualizar Pizza';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    document.querySelector('.admin-card').scrollIntoView({ behavior: 'smooth' });
};

// Eliminar pizza
window.eliminarPizza = function(id) {
    if (!confirm('¿Estás seguro de eliminar esta pizza? Esta acción no se puede deshacer.')) return;
    
    pizzas = pizzas.filter(p => p.id !== id);
    savePizzas();
    renderAdminPizzas();
    updateStats();
    showNotification('Pizza eliminada correctamente', 'success');
    
    if (document.getElementById('pizzaId').value == id) {
        resetForm();
    }
    
    // Forzar actualización del cliente
    localStorage.setItem('pizzeria_update', Date.now().toString());
};

// Agregar imagen al carrusel
async function agregarImagenCarrusel(event) {
    event.preventDefault();
    const file = document.getElementById('carruselFile').files[0];
    
    if (!file) {
        showNotification('Selecciona una imagen para subir', 'error');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showNotification('La imagen no puede exceder 2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        carouselImages.push(e.target.result);
        saveCarouselImages();
        renderCarruselImages();
        updateStats();
        document.getElementById('carruselFile').value = '';
        showNotification('Imagen agregada al carrusel', 'success');
        
        // Forzar actualización del cliente
        localStorage.setItem('pizzeria_update', Date.now().toString());
    };
    reader.onerror = function() {
        showNotification('Error al procesar la imagen', 'error');
    };
    reader.readAsDataURL(file);
}

// Eliminar imagen del carrusel
window.eliminarImagenCarrusel = function(index) {
    if (!confirm('¿Eliminar esta imagen del carrusel?')) return;
    carouselImages.splice(index, 1);
    saveCarouselImages();
    renderCarruselImages();
    updateStats();
    showNotification('Imagen eliminada', 'success');
    
    // Forzar actualización del cliente
    localStorage.setItem('pizzeria_update', Date.now().toString());
};

// Cancelar edición
function cancelarEdicion() {
    resetForm();
}

// Resetear formulario
function resetForm() {
    document.getElementById('pizzaForm').reset();
    document.getElementById('pizzaId').value = '';
    document.getElementById('submitBtn').innerHTML = '➕ Agregar Pizza';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('imagenPreview').style.display = 'none';
    document.getElementById('imagenFile').value = '';
    editingId = null;
}

// Utilidades
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
