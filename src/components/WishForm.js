'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function WishForm({ session, onWishAdded, currentWishes }) {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [priority, setPriority] = useState('2')
  const [loading, setLoading] = useState(false)

  // Lógica de límite
  const myWishesCount = currentWishes.filter(w => w.user_id === session?.user?.id).length
  const isLimitReached = myWishesCount >= 10

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    if (isLimitReached) return alert("Límite de 10 deseos alcanzado")

    setLoading(true)
    const { error } = await supabase.from('wishes').insert([
      { title, link, priority: parseInt(priority), user_id: session.user.id }
    ])
    setLoading(false)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setTitle('')
      setLink('')
      setPriority('2')
      if (onWishAdded) onWishAdded()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header Formulario */}
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
        <span className="text-slate-400">Progreso</span>
        <span className={`${isLimitReached ? 'text-red-500' : 'text-purple-400'}`}>
          {myWishesCount} / 10 DESEOS
        </span>
      </div>

      {/* Barra de progreso visual */}
      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-purple-500'}`}
          style={{ width: `${(myWishesCount / 10) * 100}%` }}
        ></div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
        <div>
          <label className="input-label">🎁 ¿Qué te gustaría?</label>
          <input
            className="cyber-input"
            type="text"
            placeholder="Ej. Taza de café gigante"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLimitReached}
            maxLength={50}
            required
          />
        </div>

        <div>
          <label className="input-label">🔗 Enlace (Opcional)</label>
          <input
            className="cyber-input"
            type="url"
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={isLimitReached}
          />
        </div>

        <div>
          <label className="input-label">🔥 Prioridad</label>
          <div className="relative">
            <select
              className="cyber-input appearance-none cursor-pointer"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isLimitReached}
            >
              <option value="1">🔥 ¡Lo necesito mucho!</option>
              <option value="2">🙂 Me gustaría tenerlo</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || isLimitReached}
          className="btn-primary mt-2"
        >
          {loading ? 'Enviando...' : isLimitReached ? 'Lista Completa' : 'Agregar a mi Lista'}
        </button>
      </form>
    </div>
  )
}