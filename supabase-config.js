// supabase-config.js
// Configuración de conexión a Supabase
// Reemplaza con tus credenciales de Supabase

const SUPABASE_URL = 'https://jdagptafwruxeumegjuh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkYWdwdGFmd3J1eGV1bWVnanVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzYzODIsImV4cCI6MjA5MDA1MjM4Mn0.WlqcVk_K-CeVMcR0tzsvb1Px0HZDKs6z_MSRgD-Q94Q';

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
