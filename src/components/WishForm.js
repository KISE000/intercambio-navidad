'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

export default function WishForm({ session, onWishAdded, currentWishes, groupId }) {
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [link, setLink] = useState('')
  const [price, setPrice] = useState('') // Guardamos el valor formateado
  const [priority, setPriority] = useState('2')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fileInputRef = useRef(null)

  const myWishesCount = currentWishes.filter(w => w.user_id === session?.user?.id).length
  const isLimitReached = myWishesCount >= 10

  // --- LOGIC: PASTE IMAGE ---
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

  // --- LOGIC: AUTO-COMPLETE TITLE FROM LINK (Mejora #1) ---
  const handleLinkBlur = () => {
    if (link && !title) {
      try {
        const url = new URL(link);
        // Intentar sacar algo legible del path
        let possibleTitle = '';
        
        // Estrategia 1: Ultimo segmento no numérico
        const segments = url.pathname.split('/').filter(s => s.length > 2 && isNaN(s));
        if (segments.length > 0) {
            // Preferimos segmentos largos que parezcan nombres
            const candidate = segments.find(s => s.includes('-') || s.includes('_')) || segments[segments.length - 1];
            possibleTitle = candidate
                .replace(/[-_]/g, ' ') // Reemplazar guiones por espacios
                .replace(/\b\w/g, l => l.toUpperCase()) // Capitalizar
                .substring(0, 40); // Limitar largo
        }

        if (possibleTitle) {
            setTitle(possibleTitle + '...');
            toast.success("✨ ¡Título autocompletado mágicamente!");
        }
      } catch (e) {
        // Ignorar si el link no es válido
      }
    }
  };

  // --- LOGIC: CURRENCY FORMATTING (Mejora #2) ---
  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Solo números
    if (!rawValue) {
        setPrice('');
        return;
    }
    // Formatear a Moneda (CRC o USD genérico visual)
    const formatted = new Intl.NumberFormat('es-CR', { 
        style: 'currency', 
        currency: 'CRC', 
        maximumFractionDigits: 0 
    }).format(rawValue);
    
    setPrice(formatted);
  };

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
          price, // Guardamos el string formateado (simple para este caso)
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
    { id: '1', label: '🔥 Alta', desc: '¡Lo necesito!', style: 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/20' },
    { id: '2', label: '⭐ Media', desc: 'Me haría feliz', style: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:bg-yellow-500/20' },
    { id: '3', label: '🧊 Baja', desc: 'Estaría bien', style: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:bg-blue-500/20' },
  ];

  return (
    <div className="relative group max-w-2xl mx-auto">
      {/* Glow Trasero */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl opacity-20 group-hover:opacity-30 transition duration-500 blur-xl"></div>
      
      {/* Tarjeta Principal */}
      <div className="relative bg-surface/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-border shadow-2xl transition-colors duration-300">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30 text-white">
            ✨
          </div>
          <div>
             <h2 className="text-xl font-bold text-text-main tracking-tight">Nuevo Deseo</h2>
             <p className="text-xs text-text-muted">¿Qué te gustaría recibir este año?</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* INPUT 1: TÍTULO */}
            <div className="space-y-2">
              <div className="flex justify-between items-center h-5 mb-2">
                 <label className="input-label mb-0">¿Qué deseas?</label>
                 {/* VALIDATION CHECKMARK (Mejora #5) */}
                 {title.length > 3 && <span className="text-green-400 text-xs font-bold animate-in zoom-in">✓</span>}
              </div>
              <div className="relative group/input">
                <input
                  type="text"
                  placeholder="Ej: Audífonos Sony..."
                  className="cyber-input h-[50px] py-0 leading-normal" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  required
                  autoFocus
                />
              </div>
            </div>
            
            {/* INPUT 2: LINK */}
            <div className="space-y-2">
              <div className="flex justify-between items-center h-5 mb-2">
                  <label className="input-label mb-0">Link de Referencia</label>
                  {validLinkIcon && <span className="text-[10px] text-green-500 font-mono animate-pulse">● Link Detectado</span>}
              </div>
              <div className="relative">
                  <input
                    type="url"
                    placeholder="https://amazon.com/..."
                    className={`cyber-input h-[50px] py-0 leading-normal ${validLinkIcon ? 'pl-10 border-green-500/30' : ''}`}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onBlur={handleLinkBlur} // Trigger auto-complete
                  />
                  {validLinkIcon && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full overflow-hidden bg-white p-0.5 shadow-sm flex items-center justify-center">
                          <img src={validLinkIcon} alt="Icon" className="w-full h-full object-cover" />
                      </div>
                  )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center h-5 mb-2">
                <label className="input-label mb-0">Prioridad y Precio</label>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {priorities.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`
                            relative flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all duration-300 h-[60px]
                            ${priority === p.id 
                                ? `${p.style} scale-[1.02] ring-1 ring-black/5 dark:ring-white/20` 
                                : 'bg-background border-border text-text-muted hover:bg-surface-highlight hover:border-text-muted/30'
                            }
                        `}
                    >
                        <span className="text-xs md:text-sm font-bold truncate w-full text-center">{p.label}</span>
                    </button>
                ))}
            </div>
            
            {/* 💰 INPUT DE PRECIO MEJORADO */}
            <div className="relative mt-3">
                {/* Icono de billete o signo */}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg pointer-events-none">💳</span>
                <input 
                    type="text"
                    placeholder="Precio aprox (ej: ₡20,000)"
                    className="cyber-input pl-11 h-[50px] py-0 leading-normal font-mono text-sm"
                    value={price}
                    onChange={handlePriceChange}
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="input-label mb-2 block">Detalles / Talla / Color</label>
            <textarea
              placeholder="Talla M, color negro mate, modelo 2024..."
              className="cyber-input resize-none h-24 py-3 leading-relaxed"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center h-5 mb-2">
                <label className="input-label mb-0">Imagen (Opcional)</label>
                <span className="text-[9px] text-text-muted normal-case bg-surface-highlight border border-border px-2 py-0.5 rounded">Tip: Ctrl+V para pegar</span>
            </div>
            <label 
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group/dropzone ${
                imagePreview
                  ? 'border-purple-500/50 bg-background' 
                  : 'border-border hover:border-purple-500 hover:bg-purple-500/5 hover:scale-[1.01]'
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full h-full group/preview">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0 rounded-2xl"></div>
                  <img src={imagePreview} alt="Preview" className="relative z-10 w-full h-full object-contain p-4" />
                  <button 
                    onClick={clearImage}
                    className="absolute top-3 right-3 z-20 bg-white/90 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-full opacity-0 group-hover/preview:opacity-100 transition-all backdrop-blur-md border border-black/10 shadow-lg"
                    title="Eliminar imagen"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-text-muted group-hover/dropzone:text-purple-500 transition-colors">
                   <div className="w-12 h-12 rounded-full bg-surface-highlight border border-border flex items-center justify-center mb-3 group-hover/dropzone:bg-purple-500 group-hover/dropzone:text-white group-hover/dropzone:scale-110 transition-all duration-300 shadow-lg">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <p className="text-xs font-bold uppercase tracking-wider">Suelta tu imagen aquí</p>
                   <p className="text-[10px] opacity-60 mt-1">o haz click para buscar</p>
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
            className="btn-primary mt-4 relative overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center justify-center gap-2">
                {loading ? 'Subiendo...' : 'Agregar a mi lista'}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}