'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Auth from '../components/Auth'
import WishForm from '../components/WishForm'
import WishList from '../components/WishList'

export default function Home() {
  const [session, setSession] = useState(null)
  const [wishes, setWishes] = useState([])
  const [loadingWishes, setLoadingWishes] = useState(false)

  // Función para cargar deseos (con JOIN a perfiles para ver nombres)
  const fetchWishes = useCallback(async () => {
    setLoadingWishes(true)
    const { data, error } = await supabase
      .from('wishes')
      .select(`
        *,
        profiles ( username )
      `)
      .order('created_at', { ascending: false })

    if (error) console.error('Error cargando deseos:', error)
    else setWishes(data)
    
    setLoadingWishes(false)
  }, [])

  // Manejo de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchWishes() // Cargar deseos si hay sesión
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchWishes()
    })

    return () => subscription.unsubscribe()
  }, [fetchWishes])

  // Vista No Logueado
  if (!session) {
    return (
      <main style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
         <div style={{ width: '100%', maxWidth: '400px' }}>
            <h1 style={{ textAlign: 'center' }}>🎄 Intercambio</h1>
            <Auth />
         </div>
      </main>
    )
  }

  // Vista Logueado
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Hola, {session.user.email.split('@')[0]} 👋</h2>
        <button 
          onClick={() => supabase.auth.signOut()}
          style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        >
          Salir
        </button>
      </header>

      <WishForm session={session} onWishAdded={fetchWishes} />

      <hr style={{ margin: '30px 0', opacity: 0.2 }} />

      <h3>📋 Lista de Deseos del Grupo</h3>
      {loadingWishes ? (
        <p>Cargando deseos...</p>
      ) : (
        <WishList wishes={wishes} currentUser={session.user} onDelete={fetchWishes} />
      )}
    </div>
  )
}