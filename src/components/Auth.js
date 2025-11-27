'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [msg, setMsg] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        setMsg('¡Registro exitoso! Revisa tu correo o inicia sesión.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error) {
      setMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <div className="dark-card p-8 border-purple-500/30">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 filter drop-shadow-lg animate-bounce">
            {isSignUp ? '👨‍👩‍👧‍👦' : '🎅'}
          </div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">
            {isSignUp ? '¡Bienvenido a la Villa!' : '¡Hola de nuevo!'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isSignUp ? 'Crea tu cuenta para participar' : 'Ingresa para ver qué te traerá Santa'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="input-label">👤 Nombre Completo</label>
              <input
                className="cyber-input"
                type="text"
                placeholder="Ej. Rodolfo el Reno"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="input-label">✉️ Usuario (Email)</label>
            <input
              className="cyber-input"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="input-label">🔒 Contraseña</label>
            <input
              className="cyber-input"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Procesando...' : (isSignUp ? 'Crear mi carta' : 'Ingresar')}
          </button>
        </form>

        {/* Mensajes de error/éxito */}
        {msg && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded border border-red-500/50 text-red-400 text-center text-sm">
            {msg}
          </div>
        )}

        {/* Toggle Login/Registro */}
        <div className="text-center mt-8">
          <button 
              onClick={() => { setIsSignUp(!isSignUp); setMsg('') }} 
              className="text-purple-400 hover:text-purple-300 text-sm font-semibold hover:underline transition-colors"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}