import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function WishList({ wishes, currentUser, onDelete }) {
  // Estado para el modal de imagen
  const [selectedImage, setSelectedImage] = useState(null);

  const handleDelete = async (wishId) => {
    if (!window.confirm("¿Estás seguro de borrar este deseo?")) return;
    const { error } = await supabase.from('wishes').delete().eq('id', wishId);
    if (error) toast.error("Error borrando: " + error.message);
    else {
      toast.success("Deseo borrado");
      if (onDelete) onDelete();
    }
  };

  const getPriorityIcon = (p) => {
    switch (p) {
      case 1: return <span title="Alta Prioridad">🔥</span>;
      case 2: return <span title="Media Prioridad" className="grayscale opacity-70">🙂</span>;
      default: return <span title="Baja Prioridad" className="grayscale opacity-50">🧊</span>;
    }
  };

  return (
    <>
      {/* --- LIGHTBOX MODAL (Para ver imagen en grande) --- */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)} // Cerrar al hacer click fuera
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full">
            <img 
              src={selectedImage} 
              alt="Detalle del deseo" 
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
            <button 
              className="absolute -top-4 -right-4 bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center border border-white/20 hover:bg-slate-700"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- GRID DE TARJETAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wishes.map((wish) => {
          const isMine = currentUser?.id === wish.user_id;
          
          return (
            <div key={wish.id} className="bg-[#151923] border border-white/5 rounded-xl p-4 relative group hover:border-purple-500/30 transition-all shadow-lg">
              
              {/* Header: Título y Prioridad */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white text-lg line-clamp-1">{wish.title}</h3>
                  {/* Nombre del dueño si no es mío */}
                  {!isMine && wish.profiles && (
                    <p className="text-xs text-purple-400 font-mono mt-0.5">
                       De: {wish.profiles.username || wish.profiles.email?.split('@')[0] || 'Anónimo'}
                    </p>
                  )}
                </div>
                <div className="text-xl">{getPriorityIcon(wish.priority)}</div>
              </div>

              {/* Detalles */}
              {wish.details && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{wish.details}</p>
              )}

              {/* Footer: Links e Imagen */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                
                <div className="flex items-center gap-3">
                  {/* Link Externo */}
                  {wish.link && (
                    <a 
                      href={wish.link} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20 transition-colors"
                    >
                      🔗 Ver Link
                    </a>
                  )}

                  {/* Miniatura de Imagen (Click para abrir modal) */}
                  {wish.image_url && (
                    <button 
                      onClick={() => setSelectedImage(wish.image_url)}
                      className="relative w-8 h-8 rounded-md overflow-hidden border border-white/10 hover:border-purple-400 transition-colors group/img"
                      title="Ver imagen"
                    >
                      <img src={wish.image_url} alt="Miniatura" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[10px]">
                        🔍
                      </div>
                    </button>
                  )}
                </div>
                
                {/* Botón Borrar (Solo si es mío) */}
                {isMine && (
                  <button 
                    onClick={() => handleDelete(wish.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="Borrar deseo"
                  >
                    ✕
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </>
  );
}