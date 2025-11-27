'use client' // Esto indica que este componente usa interactividad (clicks, estado)

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('') // Nombre para el intercambio
  const [isSignUp, setIsSignUp] = useState(false) // Alternar entre Login y Registro
  const [msg, setMsg] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    try {
      if (isSignUp) {
        // Lógica de REGISTRO
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }, // Esto activa nuestro Trigger en la BD
          },
        })
        if (error) throw error
        setMsg('¡Registro exitoso! Ya puedes iniciar sesión.')
        setIsSignUp(false) // Cambiar a vista de login
      } else {
        // Lógica de LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // Si el login es correcto, Supabase actualiza la sesión automáticamente
        // y la página se recargará o actualizará el estado (lo veremos en el siguiente paso)
      }
    } catch (error) {
      setMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>{isSignUp ? 'Registro Intercambio' : 'Iniciar Sesión'}</h2>
      
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Solo pedimos nombre si es Registro */}
        {isSignUp && (
          <input
            type="text"
            placeholder="Tu nombre (Ej. Juan Pérez)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
        )}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '8px' }}
        />
        
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '8px' }}
        />

        <button type="submit" disabled={loading} style={{ padding: '10px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Cargando...' : (isSignUp ? 'Registrarse' : 'Entrar')}
        </button>
      </form>

      {msg && <p style={{ color: 'red', marginTop: '10px' }}>{msg}</p>}

      <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
        {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
        <button 
            onClick={() => { setIsSignUp(!isSignUp); setMsg('') }} 
            style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>
          {isSignUp ? 'Inicia Sesión' : 'Regístrate aquí'}
        </button>
      </p>
    </div>
  )
}