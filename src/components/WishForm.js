'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function WishForm({ session, onWishAdded }) {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [priority, setPriority] = useState('3') // 3 es Baja por defecto
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title) return
    setLoading(true)

    try {
      // Insertar en la Base de Datos
      const { error } = await supabase.from('wishes').insert([
        {
          title,
          link,
          priority: parseInt(priority),
          user_id: session.user.id // Importante: Vincular al usuario actual
        }
      ])

      if (error) throw error

      // Limpiar formulario y avisar al padre que actualice la lista
      setTitle('')
      setLink('')
      setPriority('3')
      if (onWishAdded) onWishAdded() 

    } catch (error) {
      alert('Error al guardar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
      <h3>🎁 Agregar nuevo deseo</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="¿Qué te gustaría recibir?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: '8px' }}
        />
        
        <input
          type="url"
          placeholder="Link de referencia (Amazon, MercadoLibre...)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={{ padding: '8px' }}
        />

        <select 
          value={priority} 
          onChange={(e) => setPriority(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="1">🔥 Prioridad Alta (¡Lo necesito!)</option>
          <option value="2">🙂 Prioridad Media</option>
          <option value="3">🤷‍♂️ Prioridad Baja (Si sobra dinero)</option>
        </select>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        >
          {loading ? 'Guardando...' : 'Agregar a mi lista'}
        </button>
      </form>
    </div>
  )
}