'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'

export default function WishForm({ session, onWishAdded, currentWishes, groupId }) {
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [link, setLink] = useState('')
  const [priority, setPriority] = useState('2')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fileInputRef = useRef(null)

  const myWishesCount = currentWishes.filter(w => w.user_id === session?.user?.id).length
  const isLimitReached = myWishesCount >= 10

  // Efecto para crear/limpiar la URL de preview local
  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile)
      setImagePreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setImagePreview(null)
    }
  }, [imageFile])

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("La imagen es muy pesada (Max 2MB)");
        return;
      }
      setImageFile(file);
    }
  }

  const clearImage = (e) => {
    e.preventDefault();
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    if (isLimitReached) return toast.error("Límite de deseos alcanzado")

    setLoading(true)
    let finalImageUrl = null

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('wish-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('wish-images')
          .getPublicUrl(filePath);
          
        finalImageUrl = publicUrl;
      }

      const { error: dbError } = await supabase.from('wishes').insert([
        { 
          title, details, link, priority: parseInt(priority), 
          image_url: finalImageUrl, user_id: session.user.id, group_id: groupId 
        }
      ])

      if (dbError) throw dbError;

      setTitle(''); setDetails(''); setLink(''); setPriority('2'); setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      toast.success("Deseo agregado correctamente");
      if (onWishAdded) onWishAdded();

    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
      
      <div className="relative bg-[#151923] rounded-2xl p-6 md:p-8 border border-white/5 shadow-2xl">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-purple-500/20">✨</div>
          <h2 className="text-xl font-bold text-white">Nuevo Deseo</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">¿Qué deseas?</label>
              <input
                type="text"
                placeholder="Ej: Audífonos Sony..."
                className="w-full bg-[#0B0E14] border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Prioridad</label>
              <div className="relative">
                <select
                  className="w-full bg-[#0B0E14] border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 appearance-none cursor-pointer focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="1">🔥 Alta</option>
                  <option value="2">🙂 Media</option>
                  <option value="3">🧊 Baja</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Detalles</label>
            <textarea
              placeholder="Talla M, color negro mate, modelo 2024..."
              className="w-full bg-[#0B0E14] border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none h-24"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Link (Opcional)</label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full bg-[#0B0E14] border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          {/* Área de Imagen con Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Imagen de Referencia</label>
            <label 
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all relative overflow-hidden ${
                imagePreview
                  ? 'border-purple-500 bg-[#0B0E14]' 
                  : 'border-slate-700 hover:border-slate-500 bg-[#0B0E14] hover:bg-[#151923]'
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full h-full group/preview">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                  <button 
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-slate-900/80 text-slate-400 hover:text-red-400 p-1.5 rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity"
                    title="Eliminar imagen"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                   <p className="text-3xl mb-2 opacity-50">📷</p>
                   <p className="text-xs">Click para subir foto</p>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading || isLimitReached}
            className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558dd] hover:to-[#7c4dff] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? 'Subiendo...' : 'Agregar a mi lista'}
          </button>
        </form>
      </div>
    </div>
  )
}