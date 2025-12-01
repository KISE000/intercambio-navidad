'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

export default function WishForm({ session, onWishAdded, currentWishes, groupId }) {
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [link, setLink] = useState('')
  const [price, setPrice] = useState('') // 💰 Nuevo Estado
  const [priority, setPriority] = useState('2')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fileInputRef = useRef(null)

  const myWishesCount = currentWishes.filter(w => w.user_id === session?.user?.id).length
  const isLimitReached = myWishesCount >= 10

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob.size > 2 * 1024 * 1024) {
            toast.warning("La imagen del portapapeles es muy grande (Max 2MB)");
            return;
          }
          setImageFile(blob);
          toast.success("📸 Imagen pegada del portapapeles");
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

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
    if(e) e.preventDefault();
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };
  const validLinkIcon = link ? getFavicon(link) : null;

  const triggerConfetti = () => {
    const end = Date.now() + 1000;
    const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];
    (function frame() {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    if (isLimitReached) return toast.error("Límite de deseos alcanzado")

    setLoading(true)
    let finalImageUrl = null

    try {
      if (imageFile) {
        const fileExt = imageFile.name ? imageFile.name.split('.').pop() : 'png';
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
          title, 
          details, 
          link, 
          priority: parseInt(priority), 
          price, // 💰 Guardamos precio
          image_url: finalImageUrl, 
          user_id: session.user.id, 
          group_id: groupId 
        }
      ])

      if (dbError) throw dbError;

      setTitle(''); setDetails(''); setLink(''); setPrice(''); setPriority('2'); setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      triggerConfetti();
      toast.success("¡Deseo agregado con éxito!");
      if (onWishAdded) onWishAdded();

    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const priorities = [
    { id: '1', label: '🔥 Alta', desc: '¡Lo necesito!', style: 'border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/20' },
    { id: '2', label: '⭐ Media', desc: 'Me haría feliz', style: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:bg-yellow-500/20' },
    { id: '3', label: '🧊 Baja', desc: 'Estaría bien', style: 'border-blue-500/50 bg-blue-500/10 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:bg-blue-500/20' },
  ];

  return (
    <div className="relative group max-w-2xl mx-auto">
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
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="input-label flex justify-between">
                  <span>Link de Referencia</span>
                  {validLinkIcon && <span className="text-[10px] text-green-400 font-mono animate-pulse">● Link Detectado</span>}
              </label>
              <div className="relative">
                  <input
                    type="url"
                    placeholder="https://amazon.com/..."
                    className={`cyber-input ${validLinkIcon ? 'pl-10 border-green-500/30' : ''}`}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                  {validLinkIcon && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full overflow-hidden bg-white p-0.5">
                          <img src={validLinkIcon} alt="Icon" className="w-full h-full object-cover" />
                      </div>
                  )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
                <label className="input-label mb-0">Prioridad y Precio</label>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {priorities.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`
                            relative flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all duration-300
                            ${priority === p.id 
                                ? `${p.style} scale-[1.02] ring-1 ring-white/20` 
                                : 'bg-[#0B0E14]/50 border-white/5 text-slate-500 hover:bg-[#1A1F2E] hover:border-white/10'
                            }
                        `}
                    >
                        <span className="text-xs md:text-sm font-bold truncate w-full text-center">{p.label}</span>
                    </button>
                ))}
            </div>
            {/* 💰 INPUT DE PRECIO */}
            <div className="relative mt-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input 
                    type="text"
                    placeholder="Precio aprox (ej: 20.000)"
                    className="cyber-input pl-8"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="input-label">Detalles / Talla / Color</label>
            <textarea
              placeholder="Talla M, color negro mate, modelo 2024..."
              className="cyber-input resize-none h-24"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="input-label flex justify-between">
                <span>Imagen (Opcional)</span>
                <span className="text-[9px] text-slate-500 normal-case bg-white/5 px-2 py-0.5 rounded">Tip: Ctrl+V para pegar</span>
            </label>
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
                   <p className="text-xs font-bold uppercase tracking-wider">Click o Ctrl+V</p>
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
                    Subiendo...
                </span>
            ) : 'Agregar a mi lista'}
          </button>
        </form>
      </div>
    </div>
  )
}