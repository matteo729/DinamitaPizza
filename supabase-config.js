const SUPABASE_URL = 'https://jdagptafwruxeumegjuh.supabase.co';  // CAMBIA ESTO
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkYWdwdGFmd3J1eGV1bWVnanVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzYzODIsImV4cCI6MjA5MDA1MjM4Mn0.WlqcVk_K-CeVMcR0tzsvb1Px0HZDKs6z_MSRgD-Q94Q';          // CAMBIA ESTO

// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar conexión
async function checkConnection() {
    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('count')
            .limit(1);
        if (error) throw error;
        console.log('✅ Conectado a Supabase correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a Supabase:', error.message);
        return false;
    }
}

// Función para subir imagen a Supabase Storage (bucket único)
async function uploadImage(file, folder = 'pizzas') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        
        const { data, error } = await supabaseClient.storage
            .from('imagenes')
            .upload(filePath, file);
            
        if (error) throw error;
        
        const { data: publicUrl } = supabaseClient.storage
            .from('imagenes')
            .getPublicUrl(filePath);
            
        return publicUrl.publicUrl;
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        throw error;
    }
}

// Función para eliminar imagen de Supabase Storage
async function deleteImage(url) {
    try {
        // Extraer la ruta del archivo de la URL
        const urlParts = url.split('/imagenes/');
        if (urlParts.length < 2) return false;
        
        const filePath = urlParts[1];
        const { error } = await supabaseClient.storage
            .from('imagenes')
            .remove([filePath]);
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return false;
    }
}
