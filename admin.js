// admin.js - Panel de administración con subida de imágenes

let pizzas = [];
let carouselImages = [];
let editingId = null;

// Configuración de almacenamiento
const STORAGE_BUCKET = 'pizzas';
const CARRUSEL_BUCKET = 'carrusel';

// Datos de demostración inicial
let nextId = 1;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await loadPizzas();
    await loadCarouselImages();
    
    // Event listeners
    document.getElementById('pizzaForm')?.addEventListener('submit', guardarPizza);
    document.getElementById('cancelBtn')?.addEventListener('click', cancelarEdicion);
    document.getElementById('carruselForm')?.addEventListener('submit', agregarImagenCarrusel);
    
    // Preview de imagen
    document.getElementById('imagenFile')?.addEventListener('change', previewImage);
});

// Cargar pizzas desde localStorage (para demostración)
async function loadPizzas() {
    const saved = localStorage.getItem('admin_pizzas');
    if (saved) {
        pizzas = JSON.parse(saved);
        nextId = Math.max(...pizzas.map(p => p.id), 0) + 1;
    } else {
        // Datos de ejemplo
        pizzas = [
            { 
                id: 1, 
                nombre: 'Pizza Margherita', 
                descripcion: 'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva', 
                precio: 12.99, 
                stock: 10, 
                imagen_data: null,
                imagen_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=200'
            },
            { 
                id: 2, 
                nombre: 'Pizza Pepperoni', 
                descripcion: 'Salsa de tomate, mozzarella y pepperoni italiano', 
                precio: 14.99, 
                stock: 15, 
                imagen_data: null,
                imagen_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200'
            }
        ];
        nextId = 3;
    }
    renderAdminPizzas();
    updateStats();
}

// Guardar pizzas en localStorage
function savePizzas() {
    localStorage.setItem('admin_pizzas', JSON.stringify(pizzas));
}

// Cargar imágenes del carrusel desde localStorage
async function loadCarouselImages() {
    const saved = localStorage.getItem('admin_carrusel');
    if (saved) {
        carouselImages = JSON.parse(saved);
    } else {
        // Imágenes de ejemplo
        carouselImages = [
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600'
        ];
    }
    renderCarruselImages();
    updateStats();
}

// Guardar imágenes del carrusel
function saveCarouselImages() {
    localStorage.setItem('admin_carrusel', JSON.stringify(carouselImages));
}

// Preview de imagen antes de subir
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

// Guardar pizza (crear o actualizar)
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
    
    // Procesar imagen si se seleccionó una nueva
    let imagen_url = null;
    if (imagenFile) {
        imagen_url = await processImage(imagenFile);
    } else if (id) {
        // Si no hay nueva imagen, mantener la existente
        const existingPizza = pizzas.find(p => p.id == id);
        imagen_url = existingPizza?.imagen_url;
    }
    
    if (id) {
        // Actualizar pizza existente
        const index = pizzas.findIndex(p => p.id == id);
        if (index !== -1) {
            pizzas[index] = { 
                ...pizzas[index], 
                nombre, 
                descripcion, 
                precio, 
                stock,
                imagen_url: imagen_url || pizzas[index].imagen_url
            };
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
            imagen_url: imagen_url || null
        };
        pizzas.push(newPizza);
        showNotification('Pizza agregada correctamente', 'success');
    }
    
    savePizzas();
    resetForm();
    renderAdminPizzas();
    updateStats();
}

// Procesar imagen (convertir a base64 para almacenamiento local)
function processImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        
        // Validar tamaño (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showNotification('La imagen no puede exceder 2MB', 'error');
            reject('Archivo muy grande');
            return;
        }
        
        // Validar tipo
        if (!file.type.startsWith('image/')) {
            showNotification('El archivo debe ser una imagen', 'error');
            reject('Tipo no válido');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function() {
            reject('Error al leer la imagen');
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
    
    tbody.innerHTML = pizzas.map(pizza => `
        <tr>
            <td>
                <img src="${pizza.imagen_url || 'https://via.placeholder.com/60x60?text=Pizza'}" 
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
    `).join('');
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

// Editar pizza (AHORA FUNCIONA CORRECTAMENTE)
window.editarPizza = function(id) {
    const pizza = pizzas.find(p => p.id === id);
    if (!pizza) return;
    
    editingId = id;
    
    // Llenar el formulario con los datos de la pizza
    document.getElementById('pizzaId').value = pizza.id;
    document.getElementById('nombre').value = pizza.nombre;
    document.getElementById('descripcion').value = pizza.descripcion;
    document.getElementById('precio').value = pizza.precio;
    document.getElementById('stock').value = pizza.stock;
    
    // Mostrar preview de la imagen actual
    if (pizza.imagen_url) {
        const preview = document.getElementById('imagenPreview');
        const previewImg = document.getElementById('previewImg');
        previewImg.src = pizza.imagen_url;
        preview.style.display = 'block';
    } else {
        document.getElementById('imagenPreview').style.display = 'none';
    }
    
    // Limpiar el input file para que no mantenga el archivo anterior
    document.getElementById('imagenFile').value = '';
    
    // Cambiar el texto del botón
    document.getElementById('submitBtn').innerHTML = '✏️ Actualizar Pizza';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    // Scroll al formulario
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
    
    // Si estábamos editando esta pizza, resetear formulario
    if (document.getElementById('pizzaId').value == id) {
        resetForm();
    }
};

// Agregar imagen al carrusel
async function agregarImagenCarrusel(event) {
    event.preventDefault();
    const file = document.getElementById('carruselFile').files[0];
    
    if (!file) {
        showNotification('Selecciona una imagen para subir', 'error');
        return;
    }
    
    // Validar tamaño
    if (file.size > 2 * 1024 * 1024) {
        showNotification('La imagen no puede exceder 2MB', 'error');
        return;
    }
    
    // Convertir a base64
    const reader = new FileReader();
    reader.onload = function(e) {
        carouselImages.push(e.target.result);
        saveCarouselImages();
        renderCarruselImages();
        updateStats();
        document.getElementById('carruselFile').value = '';
        showNotification('Imagen agregada al carrusel', 'success');
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
