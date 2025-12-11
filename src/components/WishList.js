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
  horizontalListSortingStrategy, 
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- HELPERS ---
const getPriorityConfig = (p) => {
  switch (p) {
    case 1: return { 
        icon: '🔥', 
        label: 'Alta', 
        container: 'border-red-500/50 bg-surface/80 shadow-[0_0_20px_-5px_rgba(239,68,68,0.25)]', 
        badge: 'bg-red-500/10 text-red-500 border border-red-500/30', 
        gradient: 'bg-gradient-to-br from-red-500/5 to-transparent'
    };
    case 2: return { 
        icon: '⭐', 
        label: 'Media', 
        container: 'border-yellow-500/40 bg-surface/80 shadow-[0_0_15px_-5px_rgba(234,179,8,0.2)]', 
        badge: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30',
        gradient: 'bg-gradient-to-br from-yellow-500/5 to-transparent'
    };
    default: return { 
        icon: '🧊', 
        label: 'Baja', 
        container: 'border-border bg-surface/80 hover:border-purple-500/40', 
        badge: 'bg-slate-500/10 text-slate-500 border border-slate-500/30', 
        gradient: 'bg-gradient-to-br from-slate-800/5 to-transparent'
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

// --- TARJETA INDIVIDUAL ---
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

  const contentPadding = wish.image_url ? 'pt-4' : 'pt-10';
  const opacityClass = isHidden ? 'opacity-60 grayscale-[0.8] border-dashed border-border' : '';

  return (
    <div className={`relative bg-surface backdrop-blur-md border rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col h-full w-full ${priority.container} ${opacityClass}`}>
      <div className={`absolute inset-0 ${priority.gradient} opacity-50 pointer-events-none`}></div>

      {isMine && (
        <button 
          {...dragListeners}
          className="absolute top-0 inset-x-0 h-8 flex items-start justify-center pt-2 z-30 cursor-grab active:cursor-grabbing touch-none outline-none group/handle"
        >
          <div className="w-12 h-1 rounded-full bg-white/10 group-hover/handle:bg-purple-500/50 transition-colors"></div>
        </button>
      )}

      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        {showNewBadge && !isHidden && (
            <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-lg shadow-purple-500/30 animate-pulse tracking-wide self-start">
                NUEVO
            </span>
        )}
        {wish.price && (
            <span className="bg-black/60 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-md self-start flex items-center gap-1">
               💲 {wish.price}
            </span>
        )}
      </div>

      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        {isMine && (
            <div className="relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 border group/btn
                      ${showMenu 
                        ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                        : 'bg-white/40 dark:bg-black/20 text-text-muted border-transparent hover:bg-surface-highlight hover:text-text-main hover:border-white/10'
                      } backdrop-blur-md`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
                
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-[49]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}></div>
                        <div className="absolute right-0 top-full mt-2 w-40 glass-menu rounded-xl z-[50] overflow-hidden flex flex-col py-1 animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-white/10 bg-[#0B0E14]">
                            <button onClick={(e) => { e.stopPropagation(); onToggleHidden(wish); setShowMenu(false); }} className="menu-item border-b border-white/5 text-xs">
                                <span className="text-sm">{isHidden ? '👁️' : '🕶️'}</span> {isHidden ? 'Mostrar' : 'Ocultar'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(wish); setShowMenu(false); }} className="menu-item border-b border-white/5 text-blue-400 hover:bg-blue-500/10 text-xs">
                                <span className="text-sm">✏️</span> Editar
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(wish.id); setShowMenu(false); }} className="menu-item text-red-400 hover:bg-red-500/10 text-xs">
                                <span className="text-sm">🗑️</span> Borrar
                            </button>
                        </div>
                    </>
                )}
            </div>
        )}
      </div>

      <div 
          className="relative h-40 overflow-hidden cursor-pointer group/img shrink-0 mt-3 mx-3 rounded-xl border border-white/5 bg-surface-highlight z-10"
          onClick={() => wish.image_url && onImageClick(wish.image_url)}
          onPointerDown={(e) => e.stopPropagation()} 
        >
          {wish.image_url ? (
              <img src={wish.image_url} alt={wish.title} className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover/img:scale-110"/>
          ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                  <div className="text-4xl opacity-30 grayscale group-hover/img:grayscale-0 group-hover/img:opacity-80 transition-all duration-500">🎁</div>
              </div>
          )}
      </div>

      <div className={`px-5 pb-5 flex flex-col flex-1 relative z-10 ${contentPadding}`}>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <div className={`${priority.badge} text-[8px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider`}>
                <span>{priority.icon}</span> <span>{priority.label}</span>
            </div>
            {tag && <span className="text-[8px] font-bold bg-white/5 text-text-muted px-1.5 py-0.5 rounded border border-white/5 uppercase">{tag}</span>}
        </div>

        <h3 className="font-bold text-base text-text-main leading-tight line-clamp-2 mb-1">{wish.title}</h3>
        
        <div className="flex-1 mb-3">
            {wish.details ? (
              <p onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className={`text-text-muted text-xs leading-relaxed cursor-pointer ${isExpanded ? '' : 'line-clamp-2 hover:text-text-main transition-colors'}`}>
                {wish.details}
              </p>
            ) : <p className="text-text-muted/40 text-[10px] italic">Sin detalles.</p>}
        </div>

        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
            {wish.link ? (
              <a href={wish.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-md" onPointerDown={(e) => e.stopPropagation()}>
                {favicon ? <img src={favicon} alt="icon" className="w-3 h-3 rounded-sm" /> : <span>🔗</span>} Ver Link
              </a>
            ) : <span></span>}
            <span className="text-[8px] text-text-muted/60 font-mono">{relativeDate}</span>
        </div>
      </div>
    </div>
  );
});

// --- WRAPPER DRAGGABLE ---
function SortableWishCard({ wish, children, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: wish.id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="h-full min-w-[280px] max-w-[280px] snap-center shrink-0">
      {cloneElement(children, { dragListeners: listeners })}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function WishList({ wishes, currentUser, onDelete }) {
  const [internalWishes, setInternalWishes] = useState(wishes);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sortOption, setSortOption] = useState('newest'); 
  
  const [editingWish, setEditingWish] = useState(null);
  const [formData, setFormData] = useState({ title: '', details: '', link: '', priority: '2', price: '' });
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [expandedUsers, setExpandedUsers] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setInternalWishes(wishes); }, [wishes]);
  useEffect(() => { setMounted(true); }, []);

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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  const groupedWishesObj = groupWishesByUser(internalWishes);
  let groupedWishesArray = Object.values(groupedWishesObj);

  if (sortOption === 'fewest') {
      groupedWishesArray.sort((a, b) => a.wishes.length - b.wishes.length);
  } else {
      groupedWishesArray.sort((a, b) => a.name.localeCompare(b.name));
  }

  useEffect(() => {
    if (currentUser?.id) {
        setExpandedUsers(prev => {
            if (Object.prototype.hasOwnProperty.call(prev, currentUser.id)) { return prev; }
            return { ...prev, [currentUser.id]: true };
        });
    }
  }, [currentUser]);

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const scrollCarousel = (userId, direction) => {
      const container = document.getElementById(`carousel-${userId}`);
      if (container) {
          const scrollAmount = direction === 'left' ? -300 : 300; 
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
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
        const updates = myWishes.map((w, index) => ({ id: w.id, position: index }));
        const updatesJson = JSON.stringify(updates);
        await supabase.rpc('reorder_wishes', { updates_json: updatesJson });
        toast.success('Orden actualizado');
    } catch (err) {
        toast.error('Error guardando orden');
        if (onDelete) onDelete(); 
    }
  };

  const handleDelete = async (wishId) => {
    if (!window.confirm("¿Borrar deseo?")) return;
    const { error } = await supabase.from('wishes').delete().eq('id', wishId);
    if (error) toast.error(error.message);
    else { toast.success("Borrado"); if (onDelete) onDelete(); }
  };

  const handleToggleHidden = async (wish) => {
      const newState = !wish.is_hidden;
      setInternalWishes(prev => prev.map(w => w.id === wish.id ? { ...w, is_hidden: newState } : w));
      await supabase.from('wishes').update({ is_hidden: newState }).eq('id', wish.id);
      toast.success(newState ? "Ocultado" : "Visible");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setLoadingEdit(true);
    const { error } = await supabase.from('wishes').update({
        title: formData.title, details: formData.details, link: formData.link,
        priority: parseInt(formData.priority), price: formData.price 
      }).eq('id', editingWish.id);
    setLoadingEdit(false);
    if (error) toast.error(error.message);
    else { toast.success("Actualizado"); setEditingWish(null); if (onDelete) onDelete(); }
  };

  return (
    <>
      {/* MODALS */}
      {mounted && editingWish && createPortal(
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={() => setEditingWish(null)}>
          <div className="bg-surface border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-text-main mb-4">✏️ Editar</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div><label className="input-label">Título</label><input className="cyber-input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
              <div><label className="input-label">Detalles</label><textarea className="cyber-input h-20 resize-none" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="input-label">Prioridad</label><select className="cyber-input" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}><option value="1">🔥 Alta</option><option value="2">⭐ Media</option><option value="3">🧊 Baja</option></select></div>
                 <div><label className="input-label">Link</label><input className="cyber-input" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} /></div>
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setEditingWish(null)} className="flex-1 btn-primary bg-transparent border border-white/10 hover:bg-white/5">Cancelar</button>
                <button type="submit" disabled={loadingEdit} className="flex-1 btn-primary">{loadingEdit ? '...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}
      {mounted && selectedImage && createPortal(
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xl" onClick={() => setSelectedImage(null)}>
          <button className="fixed top-4 right-4 bg-white/10 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20" onClick={() => setSelectedImage(null)}>✕</button>
          <img src={selectedImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>, document.body
      )}
      
      {/* ORDENAMIENTO ESTILO DARK MEJORADO */}
      <div className="flex justify-end mb-6 relative z-20">
          <div className="relative group">
            {/* Se fuerza el fondo oscuro (#151923) para evitar el blanco en modo nocturno */}
            <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)} 
                className="appearance-none bg-[#151923] text-gray-200 text-xs font-bold border border-purple-500/30 rounded-xl pl-4 pr-10 py-2.5 cursor-pointer hover:border-purple-500/60 hover:bg-[#1A1F2E] shadow-lg outline-none transition-all"
            >
                <option value="newest">A-Z Alfabetico</option>
                <option value="fewest">Menos deseos</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg></div>
          </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-10">
          {groupedWishesArray.map((userGroup) => {
            const isOpen = expandedUsers[userGroup.id]; 
            const isMyGroup = userGroup.id === currentUser?.id;
            const wishCount = userGroup.wishes.length;
            const progress = Math.min((wishCount / 5) * 100, 100);
            const progressColor = wishCount === 0 ? 'bg-red-500' : wishCount < 3 ? 'bg-yellow-500' : 'bg-emerald-500 candy-stripe';

            return (
              <div key={userGroup.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div onClick={() => toggleUser(userGroup.id)} className="flex items-center justify-between mb-4 cursor-pointer group select-none">
                    <div className="flex items-center gap-4">
                        <Avatar seed={userGroup.avatarSeed} style={userGroup.avatarStyle} size="lg" className="ring-2 ring-offset-2 ring-offset-background ring-transparent group-hover:ring-purple-500/50 transition-all" />
                        <div>
                            <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                                {userGroup.name}
                                {isMyGroup && <span className="bg-purple-500/20 text-purple-300 text-[9px] px-2 py-0.5 rounded-full border border-purple-500/30">TÚ</span>}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                                    wishCount === 0 
                                        ? 'border-red-500/20 bg-red-500/5 text-red-400' 
                                        : wishCount < 3 
                                            ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' 
                                            : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                }`}>
                                    {wishCount} {wishCount === 1 ? 'Deseo' : 'Deseos'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full border border-white/5 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-white/10' : 'group-hover:bg-white/5'}`}>▼</div>
                </div>

                {isOpen && (
                    <div className="relative group/carousel">
                        {/* INDICADOR MOVIL (Solo aparece si hay > 1 deseo) */}
                        {wishCount > 1 && (
                            <div className="md:hidden flex items-center gap-2 mb-2 px-1 animate-pulse opacity-70">
                                <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">👈 Desliza para ver más 👉</span>
                            </div>
                        )}

                        {wishCount === 0 ? (
                             <div className="py-8 px-4 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                                 <div className="text-3xl mb-2 grayscale opacity-40">🌵</div>
                                 <p className="text-text-muted text-sm">Aún no hay deseos aquí.</p>
                             </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => scrollCarousel(userGroup.id, 'left')}
                                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white shadow-xl flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hidden md:flex"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                                </button>

                                <div 
                                    id={`carousel-${userGroup.id}`}
                                    className="flex overflow-x-auto gap-4 pb-6 pt-2 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/20 hover:scrollbar-thumb-purple-500/50 transition-colors"
                                >
                                    <SortableContext items={userGroup.wishes.map(w => w.id)} strategy={horizontalListSortingStrategy} disabled={!isMyGroup}>
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
                                    <div className="w-4 shrink-0"></div>
                                </div>

                                <button 
                                    onClick={() => scrollCarousel(userGroup.id, 'right')}
                                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white shadow-xl flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 hidden md:flex"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                            </>
                        )}
                        
                        {/* Gradientes laterales para indicar scroll visualmente en móviles */}
                        {wishCount > 2 && (
                            <>
                                <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 lg:hidden"></div>
                                <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 lg:hidden"></div>
                            </>
                        )}
                    </div>
                )}
                
                <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mt-2"></div>
              </div>
            );
          })}
        </div>
      </DndContext>
      
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar { height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 10px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.5); }
      `}</style>
    </>
  );
}