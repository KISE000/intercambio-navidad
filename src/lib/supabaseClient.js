// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// TRUCO DE INGENIERO:
// Durante el "Build" en Vercel, a veces las variables no están listas.
// Usamos valores "dummy" (falsos) para que el build no explote.
// En la app real (navegador), sí usará las variables correctas.

const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder'

if (!supabaseUrl) console.warn('⚠️ Falta URL de Supabase (Ok si es durante el build)')

export const supabase = createClient(url, key)