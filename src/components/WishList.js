'use client'
import { supabase } from '../lib/supabaseClient'

export default function WishList({ wishes, currentUser, onDelete }) {
  
  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que quieres borrar este deseo?')) return
    const { error } = await supabase.from('wishes').delete().eq('id', id)
    if (!error && onDelete) onDelete()
  }

  if (!wishes?.length) return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 bg-slate-900/30">
      <span className="text-5xl mb-4 grayscale opacity-50">🎄</span>
      <p className="font-medium">Aún no hay deseos en el grupo.</p>
      <p className="text-sm">¡Sé el primero en agregar uno!</p>
    </div>
  )

  const groupedWishes = wishes.reduce((acc, wish) => {
    const username = wish.profiles?.username || 'Sin Nombre'
    if (!acc[username]) acc[username] = []
    acc[username].push(wish)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      {Object.entries(groupedWishes).map(([username, userWishes]) => {
        const isMine = userWishes[0].user_id === currentUser.id
        
        return (
          <div key={username} className={`flex flex-col overflow-hidden rounded-2xl border transition-all hover:shadow-2xl ${
            isMine ? 'bg-slate-800/80 border-purple-500/40 shadow-purple-900/20' : 'bg-slate-900/40 border-slate-800'
          }`}>
            
            {/* Header de Tarjeta */}
            <div className={`px-5 py-3 border-b flex justify-between items-center ${
               isMine ? 'bg-purple-900/20 border-purple-500/20' : 'bg-slate-950/50 border-slate-800'
            }`}>
              <span className={`font-bold truncate ${isMine ? 'text-purple-300' : 'text-slate-300'}`}>
                {isMine ? 'Tu Lista' : username}
              </span>
              {isMine && (
                <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold tracking-wider">
                  TÚ
                </span>
              )}
            </div>

            {/* Lista de Items */}
            <div className="p-4 space-y-3">
              {userWishes.map((wish) => (
                <div key={wish.id} className="group relative bg-slate-950/50 rounded-lg p-3 border border-slate-800 hover:border-slate-600 transition-colors flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium leading-snug">
                      {wish.title}
                    </p>
                    {wish.link && (
                      <a href={wish.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-1 text-xs text-blue-400 hover:text-blue-300 hover:underline">
                        <span>Ver enlace</span>
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {wish.priority === 1 && <span title="Alta Prioridad" className="text-lg filter drop-shadow">🔥</span>}
                    {wish.priority === 2 && <span title="Media" className="text-lg opacity-50 grayscale">🙂</span>}
                    
                    {isMine && (
                      <button 
                        onClick={() => handleDelete(wish.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-900"
                        title="Borrar deseo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}