// admin.js - Panel de administración

let pizzas = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar conexión
    const connected = await checkConnection();
    if (!connected) {
        showNotification('Error de conexión con Supabase', 'error');
        return;
    }

    await loadPizzas();
    await loadCarouselImages();

    // Event listeners
    document.getElementById('pizza-form')?.addEventListener('submit', guardarPizza);
    document.getElementById('cancelar-btn')?.addEventListener('click', cancelarEdicion);
    document.getElementById('carrusel-form')?.addEventListener('submit', agregarImagenCarrusel);
});

// Cargar pizzas desde Supabase
async function loadPizzas() {
    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .order('nombre');

        if (error) throw error;

        pizzas = data;
        renderAdminPizzas();
    } catch (error) {
        console.error('Error cargando pizzas:', error);
        showNotification('Error al cargar las pizzas', 'error');
    }
}

// Renderizar pizzas en el panel admin
function renderAdminPizzas() {
    const container = document.getElementById('admin-pizzas-list');
    if (!container) return;

    if (pizzas.length === 0) {
        container.innerHTML = '<p>No hay pizzas registradas.</p>';
        return;
    }

    container.innerHTML = pizzas.map(pizza => `
        <div style="background: white; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="flex: 1;">
                <strong>${escapeHtml(pizza.nombre)}</strong><br>
                <small>${escapeHtml(pizza.descripcion)}</small><br>
                <span>💰 $${pizza.precio.toFixed(2)} | 📦 Stock: ${pizza.stock}</span>
            </div>
            <div>
                <button onclick="editarPizza(${pizza.id})" class="btn btn-secondary" style="margin-right: 0.5rem;">✏️ Editar</button>
                <button onclick="eliminarPizza(${pizza.id})" class="btn" style="background: #dc3545; color: white;">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

// Guardar pizza (crear o actualizar)
async function guardarPizza(event) {
    event.preventDefault();

    const id = document.getElementById('pizza-id').value;
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precio = parseFloat(document.getElementById('precio').value);
    const stock = parseInt(document.getElementById('stock').value);
    const imagen_url = document.getElementById('imagen').value.trim();

    if (!nombre || !descripcion || isNaN(precio) || isNaN(stock)) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }

    const pizzaData = { nombre, descripcion, precio, stock, imagen_url };

    try {
        if (id) {
            // Actualizar pizza existente
            const { error } = await supabaseClient
                .from('productos')
                .update(pizzaData)
                .eq('id', id);

            if (error) throw error;
            showNotification('Pizza actualizada correctamente', 'success');
        } else {
            // Crear nueva pizza
            const { error } = await supabaseClient
                .from('productos')
                .insert([pizzaData]);

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
window.editarPizza = async function(id) {
    const pizza = pizzas.find(p => p.id === id);
    if (!pizza) return;

    document.getElementById('pizza-id').value = pizza.id;
    document.getElementById('nombre').value = pizza.nombre;
    document.getElementById('descripcion').value = pizza.descripcion;
    document.getElementById('precio').value = pizza.precio;
    document.getElementById('stock').value = pizza.stock;
    document.getElementById('imagen').value = pizza.imagen_url || '';

    document.getElementById('submit-btn').textContent = 'Actualizar Pizza';
    document.getElementById('cancelar-btn').style.display = 'inline-block';
};

// Eliminar pizza
window.eliminarPizza = async function(id) {
    if (!confirm('¿Estás seguro de eliminar esta pizza? Esta acción no se puede deshacer.')) return;

    try {
        const { error } = await supabaseClient
            .from('productos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showNotification('Pizza eliminada correctamente', 'success');
        await loadPizzas();
    } catch (error) {
        console.error('Error eliminando pizza:', error);
        showNotification('Error al eliminar la pizza', 'error');
    }
};

// Cancelar edición
function cancelarEdicion() {
    resetForm();
}

function resetForm() {
    document.getElementById('pizza-form').reset();
    document.getElementById('pizza-id').value = '';
    document.getElementById('submit-btn').textContent = 'Agregar Pizza';
    document.getElementById('cancelar-btn').style.display = 'none';
}

// Gestión del carrusel
async function loadCarouselImages() {
    try {
        const { data, error } = await supabaseClient
            .storage
            .from('carrusel')
            .list('');

        if (error && error.message !== 'The resource was not found') {
            throw error;
        }

        const container = document.getElementById('carrusel-imagenes');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p>No hay imágenes en el carrusel. Agrega algunas arriba.</p>';
            return;
        }

        container.innerHTML = data.map(file => {
            const url = supabaseClient.storage.from('carrusel').getPublicUrl(file.name).data.publicUrl;
            return `
                <div style="position: relative; width: 200px;">
                    <img src="${url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
                    <button onclick="eliminarImagenCarrusel('${file.name}')" 
                            style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">✕</button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error cargando imágenes del carrusel:', error);
    }
}

async function agregarImagenCarrusel(event) {
    event.preventDefault();
    const url = document.getElementById('carrusel-url').value.trim();

    if (!url) {
        showNotification('Ingresa una URL de imagen', 'error');
        return;
    }

    try {
        // Descargar imagen desde URL y subir a Supabase Storage
        const response = await fetch(url);
        const blob = await response.blob();
        const fileName = `carrusel_${Date.now()}.jpg`;

        const { error } = await supabaseClient.storage
            .from('carrusel')
            .upload(fileName, blob);

        if (error) throw error;

        showNotification('Imagen agregada al carrusel', 'success');
        document.getElementById('carrusel-url').value = '';
        await loadCarouselImages();
    } catch (error) {
        console.error('Error agregando imagen:', error);
        showNotification('Error al agregar la imagen. Verifica la URL', 'error');
    }
}

window.eliminarImagenCarrusel = async function(fileName) {
    if (!confirm('¿Eliminar esta imagen del carrusel?')) return;

    try {
        const { error } = await supabaseClient.storage
            .from('carrusel')
            .remove([fileName]);

        if (error) throw error;

        showNotification('Imagen eliminada', 'success');
        await loadCarouselImages();
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        showNotification('Error al eliminar la imagen', 'error');
    }
};

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? '#dc3545' : '#1e6091';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}