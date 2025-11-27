'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // --- REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: fullName,
              username: email.split('@')[0] 
            } 
          },
        })
        if (error) throw error
        toast.success('¡Registro exitoso! Revisa tu correo o inicia sesión.')
        setIsSignUp(false)
      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // No hace falta toast aquí, la app redirige sola
      }
    } catch (error) {
      toast.error(error.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 relative z-10">
      
      {/* Tarjeta Principal */}
      <div className="w-full max-w-lg bg-[#151923] border border-white/10 rounded-3xl shadow-[0_0_50px_-10px_rgba(124,58,237,0.3)] p-12 relative overflow-hidden backdrop-blur-xl transition-all">
        
        {/* Glow superior decorativo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-80"></div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-6 drop-shadow-lg animate-bounce">
            {isSignUp ? '👨‍👩‍👧‍👦' : '🎅'}
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            {isSignUp ? '¡Bienvenido a la Villa!' : '¡Hola de nuevo!'}
          </h1>
          <p className="text-slate-400 text-lg">
            {isSignUp ? 'Crea tu cuenta para participar' : 'Ingresa para ver qué te traerá Santa'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleAuth} className="space-y-6">
          
          {/* Nombre Completo (Solo Registro) */}
          {isSignUp && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                👤 Nombre Completo
              </label>
              <input
                type="text"
                placeholder="Ej. Rodolfo el Reno"
                className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl px-5 py-4 text-lg text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              ✉️ Usuario (Email)
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl px-5 py-4 text-lg text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {/* Password - CORREGIDO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              🔒 Contraseña
            </label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña" 
              className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl px-5 py-4 text-lg text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Botón Principal */}
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl py-4 rounded-xl shadow-lg shadow-purple-900/30 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            disabled={loading}
          >
            {loading ? 'Procesando...' : (isSignUp ? 'Crear mi carta' : 'Ingresar')}
          </button>
        </form>

        {/* Toggle Login/Registro */}
        <div className="mt-8 text-center">
          <button 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium underline underline-offset-4 decoration-slate-600 hover:decoration-white"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}