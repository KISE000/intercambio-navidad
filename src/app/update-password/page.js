'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Verificar sesión al cargar (el link mágico te loguea automáticamente)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("El enlace ha expirado o es inválido.")
        router.push('/')
      }
    }
    checkSession()
  }, [router])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      toast.success('¡Contraseña actualizada con éxito!')
      setTimeout(() => router.push('/'), 1500)
    } catch (error) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fondo Ambiental */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#2e1065_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        {/* Glow Trasero */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[2rem] opacity-75 blur-xl"></div>

        {/* Tarjeta */}
        <div className="relative bg-[#0f111a]/90 backdrop-blur-xl border border-white/10 rounded-[1.7rem] shadow-2xl p-8 md:p-12 overflow-hidden">
            
            <div className="text-center mb-8 relative z-10">
              <div className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">🔐</div>
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-slate-300 mb-2 font-display">
                Nueva Clave
              </h1>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">
                Establece tu nuevo código de acceso
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6 relative z-10">
              <div className="space-y-2 group/input">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within/input:text-purple-300">
                  Nueva Contraseña
                </label>
                <input 
                  type="password" 
                  placeholder="Mínimo 6 caracteres..."
                  className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transform transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 duration-500"
              >
                {loading ? 'Encriptando...' : 'Confirmar Cambio'}
              </button>
            </form>
        </div>
      </div>
    </div>
  )
}