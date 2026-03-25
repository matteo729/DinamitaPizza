// supabase-config.js
// Configuración de conexión a Supabase
// Reemplaza con tus credenciales de Supabase

const SUPABASE_URL = 'https://tus-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-public';

// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar conexión
async function checkConnection() {
    try {
        const { data, error } = await supabaseClient.from('productos').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Conectado a Supabase correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a Supabase:', error.message);
        return false;
    }
}