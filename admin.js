// admin.js - Panel de administración funcional

let pizzas = [];
let carouselImages = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar conexión
    const connected = await checkConnection();
    if (!connected) {
        showNotification('Error de conexión con Supabase. Verifica tus credenciales.', 'error');
        return;
    }
    
    await loadPizzas();
    await loadCarouselImages();
    
    // Event listeners
    document.getElementById('pizzaForm')?.addEventListener('submit', guardarPizza);
    document.getElementById('cancelBtn')?.addEventListener('click', cancelarEdicion);
    document.getElementById('carruselForm')?.addEventListener('submit', agregarImagenCarrusel);
    document.getElementById('imagenFile')?.addEventListener('change', previewImage);
});

// Cargar pizzas desde Supabase
async function loadPizzas() {
    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .order('nombre');
            
        if (error) throw error;
        
        pizzas = data || [];
        renderAdminPizzas();
        updateStats();
    } catch (error) {
        console.error('Error cargando pizzas:', error);
        showNotification('Error al cargar las pizzas', 'error');
    }
}

// Cargar imágenes del carrusel desde Supabase
async function loadCarouselImages() {
    try {
        const { data, error } = await supabaseClient
            .from('carrusel')
            .select('*')
            .order('orden');
            
        if (error) throw error;
        
        carouselImages = data || [];
        renderCarruselImages();
        updateStats();
    } catch (error) {
        console.error('Error cargando carrusel:', error);
        showNotification('Error al cargar el carrusel', 'error');
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
    
    let imagen_url = null;
    
    // Subir imagen si se seleccionó una nueva
    if (imagenFile) {
        try {
            imagen_url = await uploadImage(imagenFile, 'pizzas');
        } catch (error) {
            showNotification('Error al subir la imagen', 'error');
            return;
        }
    }
    
    try {
        if (id) {
            // Actualizar pizza existente
            const updateData = { nombre, descripcion, precio, stock };
            if (imagen_url) updateData.imagen_url = imagen_url;
            
            const { error } = await supabaseClient
                .from('productos')
                .update(updateData)
                .eq('id', id);
                
            if (error) throw error;
            showNotification('Pizza actualizada correctamente', 'success');
        } else {
            // Crear nueva pizza
            const newPizza = { nombre, descripcion, precio, stock };
            if (imagen_url) newPizza.imagen_url = imagen_url;
            
            const { error } = await supabaseClient
                .from('productos')
                .insert([newPizza]);
                
            if (error) throw error;
            showNotification('Pizza agregada correctamente', 'success');
        }
        
        resetForm();
        await loadPizzas();
    } catch (error) {
        console.error('Error guardando pizza:', error);
        showNotification('Error al guardar la pizza', 'error');
    }
}

// Editar pizza
window.editarPizza = function(id) {
    const pizza = pizzas.find(p => p.id === id);
    if (!pizza) return;
    
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
    
    document.getElementById('imagenFile').value = '';
    document.getElementById('submitBtn').innerHTML = '✏️ Actualizar Pizza';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    
    document.querySelector('.admin-card').scrollIntoView({ behavior: 'smooth' });
};

// Eliminar pizza
window.eliminarPizza = async function(id) {
    if (!confirm('¿Estás seguro de eliminar esta pizza? Esta acción no se puede deshacer.')) return;
    
    const pizza = pizzas.find(p => p.id === id);
    
    try {
        // Eliminar imagen del storage si existe
        if (pizza && pizza.imagen_url && pizza.imagen_url.includes('supabase')) {
            await deleteImage(pizza.imagen_url);
        }
        
        // Eliminar de la base de datos
        const { error } = await supabaseClient
            .from('productos')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Pizza eliminada correctamente', 'success');
        await loadPizzas();
        
        if (document.getElementById('pizzaId').value == id) {
            resetForm();
        }
    } catch (error) {
        console.error('Error eliminando pizza:', error);
        showNotification('Error al eliminar la pizza', 'error');
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
    
    try {
        const imagen_url = await uploadImage(file, 'carrusel');
        
        // Obtener el orden máximo actual
        const maxOrden = carouselImages.length > 0 
            ? Math.max(...carouselImages.map(img => img.orden || 0)) 
            : 0;
            
        const { error } = await supabaseClient
            .from('carrusel')
            .insert([{ imagen_url, orden: maxOrden + 1 }]);
            
        if (error) throw error;
        
        showNotification('Imagen agregada al carrusel', 'success');
        document.getElementById('carruselFile').value = '';
        await loadCarouselImages();
    } catch (error) {
        console.error('Error agregando imagen:', error);
        showNotification('Error al agregar la imagen', 'error');
    }
}

// Eliminar imagen del carrusel
window.eliminarImagenCarrusel = async function(id) {
    if (!confirm('¿Eliminar esta imagen del carrusel?')) return;
    
    const imagen = carouselImages.find(img => img.id === id);
    
    try {
        // Eliminar imagen del storage
        if (imagen && imagen.imagen_url && imagen.imagen_url.includes('supabase')) {
            await deleteImage(imagen.imagen_url);
        }
        
        // Eliminar de la base de datos
        const { error } = await supabaseClient
            .from('carrusel')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Imagen eliminada', 'success');
        await loadCarouselImages();
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        showNotification('Error al eliminar la imagen', 'error');
    }
};

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
    
    container.innerHTML = carouselImages.map(img => `
        <div class="carrusel-item">
            <img src="${img.imagen_url}" alt="Carrusel">
            <button class="delete-img" onclick="eliminarImagenCarrusel(${img.id})">✕</button>
        </div>
    `).join('');
}

// Actualizar estadísticas
function updateStats() {
    const totalPizzas = pizzas.length;
    const totalStock = pizzas.reduce((sum, p) => sum + (p.stock || 0), 0);
    const carruselCount = carouselImages.length;
    
    document.getElementById('totalPizzas').textContent = totalPizzas;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('carruselCount').textContent = carruselCount;
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

// Cancelar edición
function cancelarEdicion() {
    resetForm();
}

function resetForm() {
    document.getElementById('pizzaForm').reset();
    document.getElementById('pizzaId').value = '';
    document.getElementById('submitBtn').innerHTML = '➕ Agregar Pizza';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('imagenPreview').style.display = 'none';
    document.getElementById('imagenFile').value = '';
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
