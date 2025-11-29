import { useState, Fragment, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function WishList({ wishes, currentUser, onDelete }) {
  // Estado para el modal de imagen (Lightbox)
  const [selectedImage, setSelectedImage] = useState(null);
  
  // --- ESTADOS PARA EDICIÓN ---
  const [editingWish, setEditingWish] = useState(null);
  const [formData, setFormData] = useState({ title: '', details: '', link: '', priority: '2' });
  const [loadingEdit, setLoadingEdit] = useState(false);

  // --- ESTADO PARA ACORDEÓN ---
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    if (editingWish) {
      setFormData({
        title: editingWish.title || '',
        details: editingWish.details || '',
        link: editingWish.link || '',
        priority: editingWish.priority?.toString() || '2'
      });
    }
  }, [editingWish]);

  // --- LÓGICA DE AGRUPACIÓN ---
  const groupWishesByUser = (wishes) => {
    return wishes.reduce((acc, wish) => {
      const ownerId = wish.user_id;
      const ownerName = wish.profiles?.full_name || wish.profiles?.username || 'Anónimo';
      
      if (!acc[ownerId]) {
        acc[ownerId] = {
            id: ownerId, 
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

  const toggleGroup = (userId) => {
    setExpandedGroups(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // --- HANDLERS (Solo Delete y Update para el dueño) ---
  const handleDelete = async (wishId) => {
    if (!window.confirm("¿Estás seguro de borrar este deseo?")) return;
    const { error } = await supabase.from('wishes').delete().eq('id', wishId);
    if (error) toast.error("Error: " + error.message);
    else {
      toast.success("Deseo eliminado");
      if (onDelete) onDelete();
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setLoadingEdit(true);

    const { error } = await supabase
      .from('wishes')
      .update({
        title: formData.title,
        details: formData.details,
        link: formData.link,
        priority: parseInt(formData.priority)
      })
      .eq('id', editingWish.id);

    setLoadingEdit(false);
    if (error) toast.error("Error: " + error.message);
    else {
      toast.success("¡Deseo actualizado!");
      setEditingWish(null);
      if (onDelete) onDelete();
    }
  };

  // --- CONFIG VISUAL ---
  const getPriorityConfig = (p) => {
    switch (p) {
      case 1: return { icon: '🔥', label: 'Alta', gradient: 'from-red-500/10 to-orange-500/10', border: 'border-red-500/20', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
      case 2: return { icon: '⭐', label: 'Media', gradient: 'from-yellow-500/10 to-green-500/10', border: 'border-yellow-500/20', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
      default: return { icon: '🧊', label: 'Baja', gradient: 'from-blue-500/10 to-purple-500/10', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
  };

  const isNew = (createdAt) => {
    const diffHours = (new Date() - new Date(createdAt)) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  return (
    <>
      {/* --- MODAL EDICIÓN (Mejorado visualmente) --- */}
      {editingWish && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setEditingWish(null)}>
          <div className="bg-[#0f111a] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">✏️ Editar Deseo</h3>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Título</label>
                <input 
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Detalles</label>
                <textarea 
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none resize-none h-24 transition-colors"
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Prioridad</label>
                    <select 
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-3 text-white outline-none cursor-pointer"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="1">🔥 Alta</option>
                      <option value="2">⭐ Media</option>
                      <option value="3">🧊 Baja</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Link</label>
                    <input 
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-xl p-3 text-white outline-none"
                      placeholder="https://..."
                      value={formData.link}
                      onChange={(e) => setFormData({...formData, link: e.target.value})}
                    />
                 </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                <button 
                  type="button"
                  onClick={() => setEditingWish(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium text-xs font-bold uppercase tracking-wide"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loadingEdit}
                  className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors disabled:opacity-50 text-xs uppercase tracking-wide"
                >
                  {loadingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- LIGHTBOX MODAL --- */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <img 
              src={selectedImage} 
              alt="Zoom" 
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

      {/* --- GRID DE CARDS AGRUPADAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(groupedWishes).map((userGroup) => {
          const isOpen = expandedGroups[userGroup.id]; 

          return (
            <Fragment key={userGroup.id}>
              
              {/* HEADER DEL USUARIO (Acordeón) */}
              <div className="col-span-full mt-4 first:mt-0">
                  <button 
                    onClick={() => toggleGroup(userGroup.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${
                        isOpen 
                        ? 'bg-purple-900/10 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                        : 'bg-[#151923] border-white/5 hover:border-purple-500/30 hover:bg-[#1A1F2E]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <span className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 ${isOpen ? 'bg-gradient-to-tr from-purple-600 to-pink-600 scale-110' : 'bg-slate-800 border border-white/10 group-hover:border-white/30'}`}>
                           {userGroup.initial}
                        </span>
                        
                        <div className="text-left">
                            <h3 className={`text-lg font-bold transition-colors tracking-tight ${isOpen ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                {userGroup.name}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                {userGroup.wishes.length} deseo{userGroup.wishes.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Icono Flecha */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 transition-all duration-300 ${isOpen ? 'bg-purple-500 text-white rotate-180' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                        ▼
                    </div>
                  </button>
              </div>

              {/* TARJETAS (Solo visibles si el grupo está abierto) */}
              {isOpen && userGroup.wishes.map((wish, wishIndex) => {
                const isMine = currentUser?.id === wish.user_id;
                const priority = getPriorityConfig(wish.priority);
                const showNewBadge = isNew(wish.created_at);
                
                return (
                  <div 
                    key={wish.id} 
                    className={`relative bg-gradient-to-br ${priority.gradient} backdrop-blur-sm border ${priority.border} rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-xl flex flex-col animate-in fade-in slide-in-from-top-4`}
                    style={{ animationDelay: `${wishIndex * 50}ms` }}
                  >
                    
                    {/* Badge NUEVO */}
                    {showNewBadge && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg animate-pulse tracking-wide">
                          NUEVO
                        </span>
                      </div>
                    )}

                    {/* Badge de Prioridad */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className={`${priority.badge} text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider`}>
                        <span>{priority.icon}</span>
                        <span>{priority.label}</span>
                      </div>
                    </div>

                    {/* Imagen Grande */}
                    {wish.image_url && (
                      <div 
                        className="relative h-48 overflow-hidden cursor-pointer group/img shrink-0"
                        onClick={() => setSelectedImage(wish.image_url)}
                      >
                        <img 
                          src={wish.image_url} 
                          alt={wish.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#151923] via-transparent to-transparent opacity-90"></div>
                        
                        {/* Overlay de Zoom */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 text-white text-2xl border border-white/20">
                            🔍
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contenido Principal */}
                    <div className="bg-[#151923]/90 backdrop-blur-sm p-6 flex flex-col flex-1 border-t border-white/5">
                      
                      <h3 className="font-bold text-lg text-white leading-tight mb-2 line-clamp-2">
                          {wish.title}
                      </h3>

                      {wish.details && (
                        <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                          {wish.details}
                        </p>
                      )}

                      {/* Footer con Acciones */}
                      <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                        
                        {/* Link Externo (Izquierda) */}
                        <div className="flex-1">
                          {wish.link && (
                            <a 
                              href={wish.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1.5 text-[10px] text-purple-400 hover:text-white font-bold uppercase tracking-wider transition-colors hover:underline"
                            >
                              🔗 Ver Enlace
                            </a>
                          )}
                        </div>
                        
                        {/* BOTONES DE EDICIÓN (SOLO SI ES MÍO) */}
                        {isMine && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingWish(wish)}
                              className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            
                            <button 
                              onClick={() => handleDelete(wish.id)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                              title="Borrar"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                        {/* SI NO ES MÍO, NO MOSTRAMOS NADA EXTRA (SOLO VER) */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}