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
  
  // Estado para el ojito de la contraseña
  const [showPassword, setShowPassword] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error) {
      toast.error(error.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  // --- RECUPERAR PASSWORD (GRATIS CON SUPABASE) ---
  const handleResetPassword = async () => {
    if (!email) return toast.warning('Escribe tu correo en el campo de arriba primero.')
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
      toast.success('Correo de recuperación enviado. Revisa tu bandeja.')
    } catch (error) {
      toast.error('Error al enviar correo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Contenedor Glow */}
      <div className="relative group w-full max-w-lg">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[2rem] opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        
        <div className="relative bg-[#0f111a]/90 backdrop-blur-xl border border-white/10 rounded-[1.7rem] shadow-2xl p-8 md:p-12 overflow-hidden">
            
            {/* Background Noise */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            <div className="absolute top-0 right-0 p-12 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Header */}
            <div className="relative z-10 text-center mb-8">
              <div className="inline-block relative">
                <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-bounce delay-700">
                  {isSignUp ? '🧬' : '🎅'}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-purple-500/50 blur-lg rounded-full"></div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-slate-300 mb-3 tracking-tight">
                {isSignUp ? 'Únete al Nodo' : 'Acceso Navideño'}
              </h1>
              <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">
                {isSignUp ? 'Crea tu identidad digital' : 'Ingresa tus credenciales'}
              </p>
            </div>

            {/* Formulario Principal */}
            <form onSubmit={handleAuth} className="relative z-10 space-y-5">
              
              {isSignUp && (
                <div className="space-y-2 group/input">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within/input:text-purple-300">
                    Nombre de Agente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Rodolfo el Reno"
                    className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2 group/input">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within/input:text-purple-300">
                  Enlace Neural (Email)
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2 group/input">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within/input:text-purple-300">
                    Código de Acceso
                  </label>
                  
                  {/* Link Olvidé Contraseña (Solo en Login) */}
                  {!isSignUp && (
                    <button 
                      type="button" 
                      onClick={handleResetPassword}
                      className="text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-wider font-bold"
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Escribe tu contraseña..." 
                    className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                    title={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? (
                      /* Ojo Abierto */
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    ) : (
                      /* Ojo Cerrado */
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transform transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-6 border border-white/10 duration-500"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (isSignUp ? 'Iniciar Secuencia de Registro' : 'Conectar al Sistema')}
              </button>
            </form>

            {/* Toggle Login/Registro */}
            <div className="mt-8 text-center relative z-10">
              <p className="text-slate-500 text-sm mb-2">
                {isSignUp ? '¿Ya tienes identificación?' : '¿Eres nuevo en la Villa?'}
              </p>
              <button 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="text-white hover:text-purple-300 transition-colors text-sm font-bold uppercase tracking-widest border-b border-transparent hover:border-purple-400 pb-0.5"
              >
                {isSignUp ? '>>> Iniciar Sesión' : '>>> Crear Cuenta'}
              </button>
            </div>
        </div>
      </div>
    </div>
  )
}