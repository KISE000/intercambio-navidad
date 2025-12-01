import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import Avatar from './Avatar'; 

export default function GroupSettingsModal({ isOpen, onClose, group, session, onUpdate, onDelete }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, members, security, activity
  
  // Form States
  const [name, setName] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [eventDate, setEventDate] = useState(''); // <--- NUEVO ESTADO PARA FECHA
  
  // Data States
  const [loading, setLoading] = useState(false);
  
  // Stats / Members Data
  const [lazyUsers, setLazyUsers] = useState([]);
  const [membersList, setMembersList] = useState([]); 
  const [loadingData, setLoadingData] = useState(false);
  
  // Delete Confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    setMounted(true);
    if (group) {
      setName(group.name);
      setAnnouncement(group.announcement || '');
      setEventDate(group.event_date || ''); // <--- CARGAR FECHA AL ABRIR
    }
  }, [group]);

  // Cargar datos según la pestaña activa
  useEffect(() => {
    if (!group) return;

    if (activeTab === 'activity') {
      fetchLazyUsers();
    } else if (activeTab === 'members') {
      fetchMembersList();
    }
  }, [activeTab, group]);

  // --- LOGICA: ACTIVIDAD (Vagos) ---
  const fetchLazyUsers = async () => {
    setLoadingData(true);
    const { data: members } = await supabase.from('group_members').select('user_id, profiles(email, username)').eq('group_id', group.id);
    const { data: wishes } = await supabase.from('wishes').select('user_id').eq('group_id', group.id);

    if (members && wishes) {
        const activeUserIds = new Set(wishes.map(w => w.user_id));
        const lazies = members
            .filter(m => !activeUserIds.has(m.user_id))
            .map(m => m.profiles?.username || m.profiles?.email || 'Usuario Desconocido');
        setLazyUsers(lazies);
    }
    setLoadingData(false);
  };

  // --- LOGICA: MIEMBROS (Gestión Integrada) ---
  const fetchMembersList = async () => {
    setLoadingData(true);
    try {
        const { data: membersData, error } = await supabase
            .rpc('get_group_members_bypass', { group_id_input: group.id });
        
        if (error) throw error;

        const mapped = (membersData || []).map(m => ({
            user_id: m.user_id,
            role: m.role,
            username: m.username,
            avatar_style: m.avatar_style,
            avatar_seed: m.avatar_seed
        })).sort((a, b) => (a.role === 'admin' ? -1 : 1));

        setMembersList(mapped);
    } catch (err) {
        console.error("Error fetching members:", err);
        toast.error("Error al cargar miembros");
    } finally {
        setLoadingData(false);
    }
  };

  const handleKick = async (memberId, memberName) => {
    if (!window.confirm(`⚠️ ¿Confirmar expulsión de ${memberName}?`)) return;
    try {
        const { error } = await supabase.from('group_members').delete().eq('user_id', memberId).eq('group_id', group.id);
        if (error) throw error;
        toast.success(`${memberName} eliminado.`);
        setMembersList(prev => prev.filter(m => m.user_id !== memberId));
    } catch (error) {
        toast.error("Error al expulsar.");
    }
  };

  if (!mounted || !isOpen || !group) return null;

  // --- ACTIONS GENERALES ---
  const handleUpdateGeneral = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
          .from('groups')
          .update({ 
              name: name.trim(), 
              announcement: announcement.trim() || null,
              event_date: eventDate || null // <--- GUARDAR FECHA
          })
          .eq('id', group.id)
          .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Sin permisos.");

        toast.success('Configuración actualizada');
        if (onUpdate) onUpdate(data[0]);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    const newCode = 'NAV-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setLoading(true);
    try {
        const { data, error } = await supabase.from('groups').update({ code: newCode }).eq('id', group.id).select();
        if (error) throw error;
        toast.success('Nuevo código generado');
        if (onUpdate) onUpdate(data[0]);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (deleteConfirmation !== 'ELIMINAR') return;
    setLoading(true);
    try {
        const { error } = await supabase.from('groups').delete().eq('id', group.id);
        if (error) throw error;
        toast.success('Grupo eliminado');
        onClose();
        if (onDelete) onDelete();
    } catch (error) {
        toast.error(error.message);
        setLoading(false);
    }
  };

  const copyLazyList = () => {
    const text = `📢 Lista de la vergüenza (0 deseos):\n- ${lazyUsers.join('\n- ')}\n\n¡Pónganse las pilas! 🎄`;
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#151923] border border-cyan-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)] relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0B0E14]/50 p-6 border-b border-white/5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl text-cyan-400">
                    ⚙️
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Panel Admin</h3>
                    <p className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest">CONTROL TOTAL</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-6 shrink-0 overflow-x-auto">
            <button onClick={() => setActiveTab('general')} className={`py-4 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'general' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>General</button>
            <button onClick={() => setActiveTab('members')} className={`py-4 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'members' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Miembros</button>
            <button onClick={() => setActiveTab('security')} className={`py-4 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'security' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Seguridad</button>
            <button onClick={() => setActiveTab('activity')} className={`py-4 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'activity' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Actividad</button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            
            {/* --- TAB GENERAL --- */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-2">Nombre del Grupo</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                    </div>

                    {/* INPUT DE FECHA */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-2">Fecha del Evento</label>
                        <input 
                            type="date" 
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all [color-scheme:dark]"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-2 flex justify-between">
                            <span>📢 Mensaje Fijado (Broadcast)</span>
                        </label>
                        <textarea 
                            value={announcement}
                            onChange={(e) => setAnnouncement(e.target.value)}
                            className="w-full bg-[#0B0E14] border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-100 focus:border-cyan-500 outline-none transition-all placeholder-slate-700 min-h-[100px]"
                            placeholder="Ej: Recuerden que el intercambio es el día 24..."
                        />
                    </div>
                    <button 
                        onClick={handleUpdateGeneral}
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 disabled:opacity-50 transition-all uppercase tracking-wide"
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            )}

            {/* --- TAB MIEMBROS --- */}
            {activeTab === 'members' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-white">Integrantes</h4>
                        <span className="text-xs text-slate-500">{membersList.length} total</span>
                    </div>
                    {loadingData ? (
                        <div className="text-center py-10 text-slate-500 animate-pulse">Cargando lista...</div>
                    ) : (
                        <div className="space-y-2">
                            {membersList.map((m) => {
                                const isMe = m.user_id === session?.user?.id;
                                return (
                                    <div key={m.user_id} className="flex items-center justify-between p-3 rounded-xl bg-[#0B0E14] border border-white/5">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Avatar seed={m.avatar_seed || m.user_id} style={m.avatar_style} size="sm" />
                                            <div className="min-w-0">
                                                <p className={`text-sm font-bold truncate ${isMe ? 'text-cyan-400' : 'text-slate-200'}`}>
                                                    {m.username || 'Anónimo'} {isMe && '(Tú)'}
                                                </p>
                                                {m.role === 'admin' && <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">Admin</span>}
                                            </div>
                                        </div>
                                        {!isMe && (
                                            <button 
                                                onClick={() => handleKick(m.user_id, m.username || 'Usuario')}
                                                className="text-slate-600 hover:text-red-400 p-2 transition-colors"
                                                title="Expulsar"
                                            >
                                                🚫
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB SEGURIDAD --- */}
            {activeTab === 'security' && (
                <div className="space-y-8">
                    <div className="p-5 rounded-2xl bg-[#0B0E14] border border-white/5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Código de Invitación</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/5 rounded-lg p-3 font-mono text-center text-xl text-white tracking-widest select-all border border-white/5">
                                {group.code}
                            </div>
                            <button onClick={handleRegenerateCode} disabled={loading} className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors">🔄</button>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-red-500/20">
                        <h4 className="text-red-400 font-bold mb-2">⚠️ Zona de Peligro</h4>
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Escribe ELIMINAR para confirmar"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full bg-red-900/10 border border-red-500/30 rounded-xl px-4 py-2 text-red-200 outline-none text-sm font-mono"
                            />
                            <button 
                                onClick={handleDeleteGroup}
                                disabled={loading || deleteConfirmation !== 'ELIMINAR'}
                                className="w-full py-3 rounded-xl font-bold text-sm bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all uppercase"
                            >
                                {loading ? 'Eliminando...' : 'Eliminar Grupo Permanentemente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB ACTIVIDAD --- */}
            {activeTab === 'activity' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <h4 className="text-sm font-bold text-white">Sin deseos (Vagos)</h4>
                         <span className="bg-white/10 px-2 py-1 rounded text-xs text-slate-400">{lazyUsers.length}</span>
                    </div>
                    {loadingData ? <div className="text-center py-8 text-slate-500 animate-pulse">Analizando...</div> : (
                        lazyUsers.length > 0 ? (
                            <div className="bg-[#0B0E14] rounded-xl border border-white/5 overflow-hidden">
                                <ul className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                                    {lazyUsers.map((user, i) => (
                                        <li key={i} className="px-4 py-3 text-sm text-slate-300 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span> {user}
                                        </li>
                                    ))}
                                </ul>
                                <div className="p-3 bg-white/5 border-t border-white/5">
                                    <button onClick={copyLazyList} className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold uppercase hover:bg-purple-500/30 transition-colors">📋 Copiar Lista</button>
                                </div>
                            </div>
                        ) : <div className="text-center py-8 bg-green-500/5 border border-green-500/20 rounded-xl text-green-400 text-sm">¡Todos están activos!</div>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>,
    document.body
  );
}