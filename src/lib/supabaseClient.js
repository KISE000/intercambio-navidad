import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// --- BLINDAJE PARA EL BUILD ---
// Si Vercel intenta construir sin las llaves listas, usamos valores falsos
// para que el proceso no explote con "Invalid URL".
// En el navegador del usuario real, SIEMPRE usará las variables correctas.
const url = supabaseUrl || 'https://tu-proyecto.supabase.co'
const key = supabaseAnonKey || 'public-key-placeholder'

export const supabase = createClient(url, key)