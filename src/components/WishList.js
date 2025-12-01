import { useState, Fragment, useEffect, cloneElement, memo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import Avatar from './Avatar';

// --- DND KIT IMPORTS ---
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- HELPERS ---
const getPriorityConfig = (p) => {
  switch (p) {
    case 1: return { 
        icon: '🔥', 
        label: 'Alta', 
        container: 'border-red-500/50 bg-[#0B0E14]/80 shadow-[0_0_20px_-5px_rgba(239,68,68,0.25)]', 
        badge: 'bg-red-500/10 text-red-300 border border-red-500/30', 
        gradient: 'bg-gradient-to-br from-red-500/5 to-transparent'
    };
    case 2: return { 
        icon: '⭐', 
        label: 'Media', 
        container: 'border-yellow-500/40 bg-[#0B0E14]/80 shadow-[0_0_15px_-5px_rgba(234,179,8,0.2)]', 
        badge: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30',
        gradient: 'bg-gradient-to-br from-yellow-500/5 to-transparent'
    };
    default: return { 
        icon: '🧊', 
        label: 'Baja', 
        container: 'border-slate-700 bg-[#0B0E14]/80 hover:border-purple-500/40', 
        badge: 'bg-slate-700/30 text-slate-300 border border-slate-600',
        gradient: 'bg-gradient-to-br from-slate-800/20 to-transparent'
    };
  }
};

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'hace un momento';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  return date.toLocaleDateString();
};

const isNew = (createdAt) => {
  const diffHours = (new Date() - new Date(createdAt)) / (1000 * 60 * 60);
  return diffHours < 48;
};

const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return null; }
};

const detectTags = (text) => {
  const keywords = {
    'ropa': '👗 Ropa', 'camisa': '👕 Ropa', 'zapatos': '👟 Calzado', 'tenis': '👟 Calzado',
    'libro': '📚 Libros', 'juego': '🎮 Gaming', 'consola': '🎮 Gaming', 'audifonos': '🎧 Tech',
    'celular': '📱 Tech', 'reloj': '⌚ Accesorios', 'maquillaje': '💄 Belleza', 'crema': '🧴 Belleza',
    'lego': '🧱 Juguetes', 'funko': '🧸 Colección', 'bolso': '👜 Accesorios', 'cartera': '👜 Accesorios'
  };
  const lowerText = text.toLowerCase();
  for (const [key, label] of Object.entries(keywords)) {
    if (lowerText.includes(key)) return label;
  }
  return null;
};

// --- SUB-COMPONENTE: TARJETA INDIVIDUAL ---
const MemoizedWishCardItem = memo(function WishCardItem({ wish, isMine, onEdit, onDelete, onImageClick, onToggleHidden, dragListeners }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false); 
  
  const priority = getPriorityConfig(wish.priority);
  const showNewBadge = isNew(wish.created_at);
  const relativeDate = getRelativeTime(wish.created_at);
  const favicon = wish.link ? getFaviconUrl(wish.link) : null;
  const tag = detectTags(wish.title + ' ' + wish.details);
  const isHidden = wish.is_hidden;

  if (isHidden && !isMine) return null;

  const contentPadding = wish.image_url ? 'pt-4' : 'pt-12';
  const opacityClass = isHidden ? 'opacity-60 grayscale-[0.8] border-dashed border-slate-700' : '';

  return (
    <div className={`relative backdrop-blur-md border rounded-3xl overflow-hidden group hover:translate-y-[-2px] transition-all duration-300 flex flex-col h-full ${priority.container} ${opacityClass}`}>
      <div className={`absolute inset-0 ${priority.gradient} opacity-50 pointer-events-none`}></div>

      {/* --- AGARRADERA (HANDLE) --- */}
      {isMine && (
        <button 
          {...dragListeners}
          className="absolute top-0 inset-x-0 h-10 flex items-start justify-center pt-3 z-30 cursor-grab active:cursor-grabbing touch-none outline-none group/handle"
        >
          <div className="flex gap-1">
             {[...Array(6)].map((_, i) => (
               <div key={i} className="w-1 h-1 rounded-full bg-white/20 group-hover/handle:bg-white/50 transition-colors"></div>
             ))}
          </div>
        </button>
      )}

      {/* Badges Left */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        {showNewBadge && !isHidden && (
            <span className="bg-purple-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-purple-500/30 animate-pulse tracking-wide self-start">
                NUEVO
            </span>
        )}
        {wish.price && (
            <span className="bg-[#0B0E14]/90 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-1 rounded-lg backdrop-blur-md self-start flex items-center gap-1">
               💲 {wish.price}
            </span>
        )}
      </div>

      {/* --- MENU DE OPCIONES (MEJORADO) --- */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        {isMine && (
            <div className="relative">
                {/* Trigger Button Mejorado: 48px hitbox, Icono SVG, Hover Glow */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 border group/btn
                      ${showMenu 
                        ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                        : 'bg-black/40 text-slate-300 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20'
                      } backdrop-blur-md`}
                    aria-label="Opciones"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                    </svg>
                </button>
                
                {/* Dropdown Menu Estilizado */}
                {showMenu && (
                    <>
                        {/* Backdrop invisible para cerrar al hacer clic fuera */}
                        <div className="fixed inset-0 z-[49]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}></div>
                        
                        <div className="absolute right-0 top-full mt-2 w-44 bg-[#1A1F2E]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[50] overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-white/5">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onToggleHidden(wish); setShowMenu(false); }} 
                              className="w-full px-4 py-3 text-left text-xs text-slate-300 hover:bg-purple-500/10 hover:text-purple-200 flex items-center gap-3 border-b border-white/5 transition-colors active:scale-[0.98]"
                            >
                                <span className="text-base">{isHidden ? '👁️' : '🕶️'}</span>
                                <span className="font-medium">{isHidden ? 'Mostrar' : 'Ocultar'}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEdit(wish); setShowMenu(false); }} 
                              className="w-full px-4 py-3 text-left text-xs text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 flex items-center gap-3 border-b border-white/5 transition-colors active:scale-[0.98]"
                            >
                                <span className="text-base">✏️</span>
                                <span className="font-medium">Editar</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDelete(wish.id); setShowMenu(false); }} 
                              className="w-full px-4 py-3 text-left text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-colors active:scale-[0.98]"
                            >
                                <span className="text-base">🗑️</span>
                                <span className="font-medium">Borrar</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        )}
      </div>

      {/* Imagen */}
      <div 
          className="relative h-56 overflow-hidden cursor-pointer group/img shrink-0 mt-4 mx-4 rounded-2xl border border-white/5 shadow-inner bg-[#050608] p-2 z-10"
          onClick={() => wish.image_url && onImageClick(wish.image_url)}
          onPointerDown={(e) => e.stopPropagation()} 
        >
          {wish.image_url ? (
              <img 
                src={wish.image_url} 
                alt={wish.title}
                className="w-full h-full object-contain transition-transform duration-700 group-hover/img:scale-110"
              />
          ) : (
              <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                  <div className="text-4xl mb-2">🎁</div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">No Image Data</span>
              </div>
          )}
          
          {wish.image_url && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-md rounded-full p-3 text-white border border-white/20 shadow-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
            </div>
          )}
      </div>

      {/* Contenido */}
      <div className={`px-6 pb-6 flex flex-col flex-1 relative z-10 ${contentPadding}`}>
        
        {/* Meta-datos */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className={`${priority.badge} text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider`}>
                <span>{priority.icon}</span>
                <span>{priority.label}</span>
            </div>
            {isHidden && (
                <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 uppercase">👁️‍🗨️ Oculto</span>
            )}
            {tag && <span className="text-[9px] font-bold bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5 uppercase">{tag}</span>}
        </div>

        <h3 className="font-bold text-lg text-white leading-tight break-words drop-shadow-sm mb-2">
            {wish.title}
        </h3>
        
        <div className="flex-1 mb-4">
            {wish.details ? (
              <p 
                onClick={(e) => { 
                   e.stopPropagation(); 
                   setIsExpanded(!isExpanded); 
                }}
                className={`text-slate-400 text-sm leading-relaxed whitespace-pre-wrap break-words cursor-pointer transition-all select-none ${isExpanded ? '' : 'line-clamp-4 hover:text-slate-300'}`}
              >
                {wish.details}
              </p>
            ) : (
                <p className="text-slate-600 text-xs italic">Sin detalles adicionales.</p>
            )}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="flex-1 flex flex-col">
            {wish.link && (
              <a 
                href={wish.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-purple-400 transition-colors group/link mb-1"
                onPointerDown={(e) => e.stopPropagation()} 
              >
                {favicon ? <img src={favicon} alt="icon" className="w-3 h-3 rounded-sm" /> : <span>🔗</span>}
                Ver Enlace
              </a>
            )}
            <span className="text-[9px] text-slate-600 font-mono">Añadido {relativeDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// --- COMPONENTE WRAPPER DND ---
function SortableWishCard({ wish, children, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: wish.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    scale: isDragging ? 1.05 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="h-full relative">
      {cloneElement(children, { dragListeners: listeners })}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function WishList({ wishes, currentUser, onDelete }) {
  const [internalWishes, setInternalWishes] = useState(wishes);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [editingWish, setEditingWish] = useState(null);
  const [formData, setFormData] = useState({ title: '', details: '', link: '', priority: '2', price: '' });
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInternalWishes(wishes);
  }, [wishes]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingWish) {
      setFormData({
        title: editingWish.title || '',
        details: editingWish.details || '',
        link: editingWish.link || '',
        priority: editingWish.priority?.toString() || '2',
        price: editingWish.price || ''
      });
    }
  }, [editingWish]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupWishesByUser = (list) => {
    return list.reduce((acc, wish) => {
      const ownerId = wish.user_id;
      const profile = wish.profiles || {}; 
      const ownerName = profile.username || (wish.profiles?.email?.split('@')[0]) || 'Anónimo'; 
      const avatarStyle = profile.avatar_style || 'robot';
      const avatarSeed = profile.avatar_seed || ownerId;

      if (!acc[ownerId]) {
        acc[ownerId] = {
            id: ownerId, 
            name: ownerName,
            avatarStyle,
            avatarSeed,
            wishes: [],
        };
      }
      if (!wish.is_hidden || ownerId === currentUser?.id) {
          acc[ownerId].wishes.push(wish);
      }
      return acc;
    }, {});
  };

  const groupedWishes = groupWishesByUser(internalWishes);

  useEffect(() => {
    if (currentUser?.id) {
        setExpandedGroups(prev => {
            if (Object.prototype.hasOwnProperty.call(prev, currentUser.id)) {
                return prev;
            }
            return { ...prev, [currentUser.id]: true };
        });
    }
  }, [currentUser]);

  const toggleGroup = (userId) => {
    setExpandedGroups(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeWish = internalWishes.find(w => w.id === active.id);
    if (activeWish.user_id !== currentUser.id) return;

    const oldIndex = internalWishes.findIndex(w => w.id === active.id);
    const newIndex = internalWishes.findIndex(w => w.id === over.id);

    const newWishes = arrayMove(internalWishes, oldIndex, newIndex);
    setInternalWishes(newWishes);

    const myWishes = newWishes.filter(w => w.user_id === currentUser.id);
    
    try {
        const updates = myWishes.map((w, index) => ({
            id: w.id,
            position: index
        }));
        const updatesJson = JSON.stringify(updates);
        const { error: rpcError } = await supabase.rpc('reorder_wishes', { updates_json: updatesJson });
        if (rpcError) throw rpcError;
        toast.success('Orden actualizado');
    } catch (err) {
        toast.error('Error guardando el orden');
        if (onDelete) onDelete(); 
    }
  };

  const handleDelete = async (wishId) => {
    if (!window.confirm("¿Estás seguro de borrar este deseo?")) return;
    const { error } = await supabase.from('wishes').delete().eq('id', wishId);
    if (error) toast.error("Error: " + error.message);
    else {
      toast.success("Deseo eliminado");
      if (onDelete) onDelete();
    }
  };

  const handleToggleHidden = async (wish) => {
      const newState = !wish.is_hidden;
      setInternalWishes(prev => prev.map(w => w.id === wish.id ? { ...w, is_hidden: newState } : w));
      const { error } = await supabase.from('wishes').update({ is_hidden: newState }).eq('id', wish.id);
      if (error) {
          toast.error("Error al actualizar");
          if (onDelete) onDelete(); 
      } else {
          toast.success(newState ? "Deseo ocultado del grupo" : "Deseo visible para el grupo");
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
        priority: parseInt(formData.priority),
        price: formData.price 
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

  return (
    <>
      {mounted && editingWish && createPortal(
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setEditingWish(null)}>
          <div className="bg-[#151923] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">✏️ Editar Deseo</h3>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="input-label">Título</label>
                <input className="cyber-input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Detalles</label>
                <textarea className="cyber-input h-24 resize-none" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="input-label">Prioridad</label>
                    <select className="cyber-input cursor-pointer" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                      <option value="1">🔥 Alta</option>
                      <option value="2">⭐ Media</option>
                      <option value="3">🧊 Baja</option>
                    </select>
                 </div>
                 <div>
                    <label className="input-label">Link</label>
                    <input className="cyber-input" placeholder="https://..." value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-3 mt-8 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setEditingWish(null)} className="flex-1 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-bold text-xs uppercase tracking-wide">Cancelar</button>
                <button type="submit" disabled={loadingEdit} className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors disabled:opacity-50 text-xs uppercase tracking-wide shadow-lg shadow-purple-500/20">{loadingEdit ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {mounted && selectedImage && createPortal(
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-xl" onClick={() => setSelectedImage(null)}>
          <button className="fixed top-6 right-6 z-[10000] bg-white/10 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}>✕</button>
          <div className="relative max-w-5xl max-h-[90vh] p-2">
            <img src={selectedImage} alt="Zoom" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]" />
          </div>
        </div>,
        document.body
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(groupedWishes).map((userGroup) => {
            const isOpen = expandedGroups[userGroup.id]; 
            const isMyGroup = userGroup.id === currentUser?.id;

            return (
              <Fragment key={userGroup.id}>
                <div className="col-span-full mt-6 first:mt-0">
                    <button onClick={() => toggleGroup(userGroup.id)} className={`w-full flex items-center justify-between p-3 pl-4 pr-5 rounded-2xl border transition-all duration-300 group ${isOpen ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[#151923]/60 border-white/5 hover:bg-[#1A1F2E] hover:border-white/10'}`}>
                      <div className="flex items-center gap-4">
                          <Avatar seed={userGroup.avatarSeed} style={userGroup.avatarStyle} size="lg" className="ring-2 ring-offset-2 ring-offset-[#0B0E14] ring-transparent group-hover:ring-purple-500/50 transition-all" />
                          <div className="text-left">
                              <h3 className={`text-lg font-bold transition-colors tracking-tight ${isOpen ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{userGroup.name}</h3>
                              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                  <span>{userGroup.wishes.length} deseo{userGroup.wishes.length !== 1 ? 's' : ''}</span>
                                  {isMyGroup && <span className="text-purple-400 font-bold bg-purple-500/10 px-2 rounded-full hidden sm:inline-block">TU LISTA</span>}
                              </p>
                          </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 transition-all duration-300 ${isOpen ? 'bg-white text-black rotate-180' : 'bg-black/20 text-slate-400 group-hover:bg-white/10 group-hover:text-white'}`}>▼</div>
                    </button>
                    {isOpen && userGroup.wishes.length === 0 && <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-white/5 rounded-2xl mt-4 bg-white/[0.02]">No hay deseos visibles aquí.</div>}
                </div>

                {isOpen && (
                  <SortableContext items={userGroup.wishes.map(w => w.id)} strategy={rectSortingStrategy} disabled={!isMyGroup}>
                    {userGroup.wishes.map((wish) => {
                      const isMine = currentUser?.id === wish.user_id;
                      return (
                        <SortableWishCard key={wish.id} wish={wish} disabled={!isMyGroup}>
                            <MemoizedWishCardItem 
                              wish={wish}
                              isMine={isMine}
                              onEdit={setEditingWish}
                              onDelete={handleDelete}
                              onImageClick={setSelectedImage}
                              onToggleHidden={handleToggleHidden}
                              dragListeners={null} 
                            />
                        </SortableWishCard>
                      );
                    })}
                  </SortableContext>
                )}
              </Fragment>
            );
          })}
        </div>
      </DndContext>
    </>
  );
}