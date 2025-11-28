import { useState, Fragment } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function WishList({ wishes, currentUser, onDelete }) {
  const [selectedImage, setSelectedImage] = useState(null);

  // --- LÓGICA DE AGRUPACIÓN ---
  const groupWishesByUser = (wishes) => {
    return wishes.reduce((acc, wish) => {
      // Usamos el ID del usuario como clave para agrupar
      const ownerId = wish.user_id;
      // Usamos el nombre más completo para el display
      const ownerName = wish.profiles?.full_name || wish.profiles?.username || wish.profiles?.email?.split('@')[0] || 'Anónimo';
      
      if (!acc[ownerId]) {
        acc[ownerId] = {
            name: ownerName,
            initial: ownerName.charAt(0).toUpperCase(),
            wishes: [],
        };
      }
      acc[ownerId].wishes.push(wish);
      return acc;
    }, {});
  };

  const groupedWishes = groupWishesByUser(wishes);
  // -------------------------

  const handleDelete = async (wishId) => {
    if (!window.confirm("¿Estás seguro de borrar este deseo?")) return;
    const { error } = await supabase.from('wishes').delete().eq('id', wishId);
    if (error) toast.error("Error borrando: " + error.message);
    else {
      toast.success("Deseo borrado");
      if (onDelete) onDelete();
    }
  };

  const getPriorityConfig = (p) => {
    switch (p) {
      case 1: 
        return {
          icon: '🔥',
          label: 'Alta',
          gradient: 'from-red-500/20 to-orange-500/20',
          border: 'border-red-500/30',
          glow: 'shadow-red-500/10',
          badge: 'bg-gradient-to-r from-red-500 to-orange-500'
        };
      case 2: 
        return {
          icon: '⭐',
          label: 'Media',
          gradient: 'from-yellow-500/20 to-green-500/20',
          border: 'border-yellow-500/30',
          glow: 'shadow-yellow-500/10',
          badge: 'bg-gradient-to-r from-yellow-500 to-green-500'
        };
      default: 
        return {
          icon: '🧊',
          label: 'Baja',
          gradient: 'from-blue-500/20 to-purple-500/20',
          border: 'border-blue-500/30',
          glow: 'shadow-blue-500/10',
          badge: 'bg-gradient-to-r from-blue-500 to-purple-500'
        };
    }
  };

  const isNew = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  return (
    <>
      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <img 
              src={selectedImage} 
              alt="Detalle del deseo" 
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
            <button 
              className="absolute -top-4 -right-4 bg-slate-800 text-white w-10 h-10 rounded-full flex items-center justify-center border border-white/20 hover:bg-red-500 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* GRID DE CARDS AGRUPADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(groupedWishes).map((userGroup, groupIndex) => (
          // Fragmento para evitar romper el grid y renderizar Header + Cards
          <Fragment key={userGroup.name}>
            
            {/* HEADER DEL USUARIO (Ocupa todas las columnas) */}
            <div className="col-span-full mb-3 mt-8" style={{ animationDelay: `${groupIndex * 100}ms` }}>
                <h3 className="text-2xl font-bold text-white flex items-center gap-4 border-b border-purple-500/50 pb-2">
                    {/* Avatar del dueño */}
                    <span className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-purple-900/50">
                       {userGroup.initial}
                    </span>
                    {userGroup.name}'s Lista
                    <span className="text-sm text-slate-500 ml-4 font-mono">({userGroup.wishes.length} deseos)</span>
                </h3>
            </div>

            {/* Mapeo de tarjetas para este usuario (fluirán en la grilla de 3 columnas) */}
            {userGroup.wishes.map((wish, wishIndex) => {
              const isMine = currentUser?.id === wish.user_id;
              const priority = getPriorityConfig(wish.priority);
              const showNewBadge = isNew(wish.created_at);
              
              return (
                <div 
                  key={wish.id} 
                  className={`relative bg-gradient-to-br ${priority.gradient} backdrop-blur-sm border ${priority.border} rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 ${priority.glow} shadow-xl animate-in fade-in slide-in-from-bottom-4`}
                  style={{ animationDelay: `${(groupIndex * 100) + (wishIndex * 50)}ms` }}
                >
                  
                  {/* Badge NUEVO */}
                  {showNewBadge && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        ✨ NUEVO
                      </span>
                    </div>
                  )}

                  {/* Badge de Prioridad */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`${priority.badge} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5`}>
                      <span>{priority.icon}</span>
                      <span>{priority.label}</span>
                    </div>
                  </div>

                  {/* Imagen Grande (si existe) */}
                  {wish.image_url && (
                    <div 
                      className="relative h-48 overflow-hidden cursor-pointer group/img"
                      onClick={() => setSelectedImage(wish.image_url)}
                    >
                      <img 
                        src={wish.image_url} 
                        alt={wish.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#151923] to-transparent opacity-60"></div>
                      
                      {/* Overlay de Zoom */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 text-white text-3xl">
                          🔍
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contenido Principal */}
                  <div className="bg-[#151923]/90 backdrop-blur-sm p-6 space-y-4">
                    
                    {/* Header con Título */}
                    <div>
                      <h3 className="font-bold text-xl text-white line-clamp-2 mb-2">
                        {wish.title}
                      </h3>
                      
                      {/* Info del Usuario - REMOVIDO DE LA CARD YA QUE ESTÁ EN EL HEADER DE GRUPO */}
                      <p className="text-sm text-purple-400 font-medium">
                          {isMine ? 'Tu Deseo' : `Para ${userGroup.name}`}
                      </p>
                    </div>

                    {/* Detalles */}
                    {wish.details && (
                      <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                        {wish.details}
                      </p>
                    )}

                    {/* Footer con Acciones */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      
                      <div className="flex items-center gap-2">
                        {/* Link Externo */}
                        {wish.link && (
                          <a 
                            href={wish.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all"
                          >
                            🔗 <span>Ver</span>
                          </a>
                        )}
                      </div>
                      
                      {/* Botón Borrar (Solo si es mío) */}
                      {isMine && (
                        <button 
                          onClick={() => handleDelete(wish.id)}
                          className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all p-2 rounded-lg"
                          title="Borrar deseo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </>
  );
}