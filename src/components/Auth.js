'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

export default function Auth({ theme, toggleTheme }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Estado para la animación de error
  const [shakeError, setShakeError] = useState(false)
  
  // NUEVOS ESTADOS PARA MEJORAS
  const [emailValid, setEmailValid] = useState(null) // null, true, false
  const [passwordStrength, setPasswordStrength] = useState(0) // 0-3
  const [focused, setFocused] = useState(null) // 'email' | 'password' | null

  // --- FUNCIÓN DE CONFETI DE ÉXITO ---
  const triggerSuccessConfetti = () => {
    // Versión sutil y rápida (Premium)
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: theme === 'dark' ? ['#A855F7', '#EC4899'] : ['#3B82F6', '#6366F1']
    });
    fire(0.2, {
      spread: 60,
      colors: theme === 'dark' ? ['#ffffff'] : ['#A855F7']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
  }

  const triggerErrorShake = () => {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500); // Duración de la animación CSS
  }
  
  // NUEVA FUNCIÓN: Validar Email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }
  
  // NUEVA FUNCIÓN: Calcular Fortaleza de Contraseña
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return 0
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 8) strength++
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) strength++
    if (/[^a-z A-Z0-9]/.test(pwd)) strength++ // Símbolos
    return Math.min(strength, 3)
  }
  
  // NUEVA FUNCIÓN: Manejar cambio de email con validación
  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    if (value.length > 0) {
      setEmailValid(validateEmail(value))
    } else {
      setEmailValid(null)
    }
  }
  
  // NUEVA FUNCIÓN: Manejar cambio de password con fortaleza
  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    setPasswordStrength(calculatePasswordStrength(value))
  }

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
        triggerSuccessConfetti();
        toast.success('¡Registro exitoso! Revisa tu correo o inicia sesión.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // Login exitoso: Confeti antes de desmontar/redirigir
        triggerSuccessConfetti();
      }
    } catch (error) {
      triggerErrorShake(); // ACTIVAR VIBRACIÓN
      toast.error(error.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
        triggerErrorShake();
        return toast.warning('Escribe tu correo en el campo de arriba primero.')
    }
    
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
    <div className="flex flex-col items-center justify-center w-full px-4 relative z-10 animate-in fade-in zoom-in-95 duration-500 min-h-[85vh]">
      
      {/* Contenedor Glow */}
      <div className="relative group w-full max-w-lg">
        {/* Glow de fondo */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[2rem] opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        
        {/* Tarjeta Principal - AQUÍ APLICAMOS LA CLASE SHAKE CONDICIONAL */}
        <div className={`relative bg-surface backdrop-blur-xl border border-border rounded-[1.7rem] shadow-2xl p-8 md:p-12 overflow-hidden transition-all duration-300 ${shakeError ? 'animate-shake' : ''}`}>
            
            {/* BOTÓN DE TEMA INTEGRADO */}
            <button 
                onClick={toggleTheme}
                className="absolute top-6 right-6 p-2 rounded-full text-text-muted hover:text-text-main hover:bg-white/5 transition-all duration-300 z-50 group/theme"
                title={theme === 'dark' ? 'Activar Modo Luz' : 'Activar Modo Oscuro'}
            >
                <span className="transform group-hover/theme:rotate-12 inline-block transition-transform duration-300 text-xl">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </span>
            </button>

            {/* Ruido sutil de fondo */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative z-10 text-center mb-8 mt-2">
              <div className="inline-block relative">
                <div className="text-6xl mb-4 drop-shadow-md animate-bounce delay-700">
                  {isSignUp ? '🧬' : '🎅'}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-text-main via-purple-500 to-slate-500 mb-3 tracking-tight pb-1">
                {isSignUp ? 'Únete al Nodo' : 'Acceso Navideño'}
              </h1>
              <p className="text-text-muted text-sm uppercase tracking-widest font-medium">
                {isSignUp ? 'Crea tu identidad digital' : 'Ingresa tus credenciales'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="relative z-10 space-y-5">
              
              {isSignUp && (
                <div className="space-y-2 group/input">
                  <label className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] ml-1 transition-colors">
                    Nombre de Agente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Rodolfo el Reno"
                    className="cyber-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2 group/input">
                <label className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] ml-1 transition-colors">
                  Enlace Neural (Email)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className={`cyber-input pr-10 transition-all duration-300 ${
                      focused === 'email' ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''
                    } ${
                      emailValid === true ? 'border-green-500/50' : emailValid === false ? 'border-red-500/50' : ''
                    }`}
                    value={email}
                    onChange={handleEmailChange}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                  />
                  {/* Indicador de validación */}
                  {emailValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in-90 duration-200">
                      {emailValid ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 group/input">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] ml-1 transition-colors">
                    Código de Acceso
                  </label>
                  
                  {!isSignUp && (
                    <button 
                      type="button" 
                      onClick={handleResetPassword}
                      className="text-[10px] text-text-muted hover:text-text-main transition-colors uppercase tracking-wider font-bold"
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Escribe tu contraseña..." 
                    className={`cyber-input pr-12 transition-all duration-300 ${
                      focused === 'password' ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''
                    }`}
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-all duration-300 hover:scale-110 ${
                      showPassword ? 'text-purple-500' : 'text-text-muted hover:text-text-main'
                    }`}
                    title={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0  0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-in zoom-in-90 duration-200"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-in zoom-in-90 duration-200"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    )}
                  </button>
                </div>
                
                {/* Indicador de Fortaleza de Contraseña */}
                {password.length > 0 && isSignUp && (
                  <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= level
                              ? passwordStrength === 1
                                ? 'bg-red-500'
                                : passwordStrength === 2
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[9px] text-text-muted mt-1 uppercase tracking-wider">
                      {passwordStrength === 0 && 'Muy débil'}
                      {passwordStrength === 1 && 'Débil'}
                      {passwordStrength === 2 && 'Media'}
                      {passwordStrength === 3 && 'Fuerte 💪'}
                    </p>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="group/btn w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transform transition-all hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-6 border border-white/10 duration-500"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="animate-pulse">Conectando...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {isSignUp ? 'Iniciar Secuencia de Registro' : 'Conectar al Sistema'}
                    <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center relative z-10">
              <p className="text-text-muted text-sm mb-2">
                {isSignUp ? '¿Ya tienes identificación?' : '¿Eres nuevo en la Villa?'}
              </p>
              <button 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="group/toggle text-text-main hover:text-purple-500 transition-all duration-300 text-sm font-bold uppercase tracking-widest border-b border-transparent hover:border-purple-400 pb-0.5 hover:scale-105"
              >
                <span className="inline-block group-hover/toggle:translate-x-1 transition-transform">
                  {isSignUp ? '>>> Iniciar Sesión' : '>>> Crear Cuenta'}
                </span>
              </button>
            </div>
        </div>
      </div>
    </div>
  )
}