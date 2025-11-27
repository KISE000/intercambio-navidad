'use client'
import { supabase } from '../lib/supabaseClient'

export default function WishList({ wishes, currentUser, onDelete }) {
  
  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que quieres borrar este deseo?')) return

    const { error } = await supabase.from('wishes').delete().eq('id', id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      if (onDelete) onDelete() // Recargar la lista
    }
  }

  if (!wishes || wishes.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666' }}>Aún no hay deseos en la lista. ¡Sé el primero!</p>
  }

  return (
    <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
      {wishes.map((wish) => {
        const isMine = wish.user_id === currentUser?.id
        
        return (
          <div key={wish.id} style={{ 
            border: isMine ? '2px solid #0070f3' : '1px solid #ddd', 
            padding: '15px', 
            borderRadius: '8px',
            backgroundColor: 'white',
            position: 'relative'
          }}>
            {/* Etiqueta de Usuario */}
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>
              {isMine ? '🧞‍♂️ TÚ' : `👤 ${wish.profiles?.username || 'Usuario desconocido'}`}
            </div>

            <h4 style={{ margin: '0 0 10px 0' }}>{wish.title}</h4>
            
            {/* Prioridad con colores */}
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '3px 8px', 
              borderRadius: '12px',
              background: wish.priority === 1 ? '#ffdede' : wish.priority === 2 ? '#fff3cd' : '#d1e7dd',
              color: wish.priority === 1 ? '#8a0000' : wish.priority === 2 ? '#856404' : '#0f5132'
            }}>
              {wish.priority === 1 ? 'Alta' : wish.priority === 2 ? 'Media' : 'Baja'}
            </span>

            {wish.link && (
              <div style={{ marginTop: '10px' }}>
                <a href={wish.link} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', fontSize: '0.9rem' }}>
                  🔗 Ver enlace
                </a>
              </div>
            )}

            {/* Botón Borrar (Solo visible si es MÍO) */}
            {isMine && (
              <button 
                onClick={() => handleDelete(wish.id)}
                style={{ 
                  marginTop: '15px', 
                  width: '100%', 
                  padding: '5px', 
                  background: '#ff4444', 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer',
                  borderRadius: '4px' 
                }}
              >
                Borrar
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}