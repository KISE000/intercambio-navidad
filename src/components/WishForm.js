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
    <div className="relative group max-w-2xl mx-auto">
      {/* Glow Effect Background */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl opacity-20 group-hover:opacity-30 transition duration-500 blur-xl"></div>
      
      <div className="relative bg-[#151923]/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            ✨
          </div>
          <div>
             <h2 className="text-xl font-bold text-white tracking-tight">Nuevo Deseo</h2>
             <p className="text-xs text-slate-400">¿Qué te gustaría recibir este año?</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="input-label">¿Qué deseas?</label>
              <input
                type="text"
                placeholder="Ej: Audífonos Sony..."
                className="cyber-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="input-label">Prioridad</label>
              <div className="relative">
                <select
                  className="cyber-input appearance-none cursor-pointer"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="1">🔥 Alta (¡Lo necesito!)</option>
                  <option value="2">⭐ Media (Me haría feliz)</option>
                  <option value="3">🧊 Baja (Estaría bien)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="input-label">Detalles / Talla / Color</label>
            <textarea
              placeholder="Talla M, color negro mate, modelo 2024..."
              className="cyber-input resize-none h-28"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="input-label">Link de Referencia (Opcional)</label>
            <input
              type="url"
              placeholder="https://amazon.com/..."
              className="cyber-input text-blue-400 underline-offset-2"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          {/* Área de Imagen con Preview Mejorado */}
          <div className="space-y-2">
            <label className="input-label">Imagen (Opcional)</label>
            <label 
              className={`flex flex-col items-center justify-center w-full h-40 border border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group/dropzone ${
                imagePreview
                  ? 'border-purple-500/50 bg-[#0B0E14]' 
                  : 'border-white/10 hover:border-purple-500/50 bg-[#0B0E14]/50 hover:bg-[#1A1F2E]'
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full h-full group/preview">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>
                  <img src={imagePreview} alt="Preview" className="relative z-10 w-full h-full object-contain p-4" />
                  <button 
                    onClick={clearImage}
                    className="absolute top-3 right-3 z-20 bg-black/50 text-white hover:bg-red-500/80 hover:text-white p-2 rounded-full opacity-0 group-hover/preview:opacity-100 transition-all backdrop-blur-md border border-white/10"
                    title="Eliminar imagen"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500 group-hover/dropzone:text-purple-400 transition-colors">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover/dropzone:bg-purple-500/10 group-hover/dropzone:scale-110 transition-all duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <p className="text-xs font-bold uppercase tracking-wider">Click para subir foto</p>
                   <p className="text-[10px] opacity-60 mt-1">Max 2MB</p>
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
            className="btn-primary mt-4"
          >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Subiendo...
                </span>
            ) : 'Agregar a mi lista'}
          </button>
        </form>
      </div>
    </div>
  )
}