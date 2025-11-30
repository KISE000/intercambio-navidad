import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function GroupSettingsModal({ isOpen, onClose, group, onUpdate, onDelete }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, security, activity
  
  // Form States
  const [name, setName] = useState('');
  const [announcement, setAnnouncement] = useState('');
  
  // Data States
  const [loading, setLoading] = useState(false);
  const [lazyUsers, setLazyUsers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Delete Confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    setMounted(true);
    if (group) {
      setName(group.name);
      setAnnouncement(group.announcement || '');
    }
  }, [group]);

  // Cargar inactivos cuando se abre la pestaña de actividad
  useEffect(() => {
    if (activeTab === 'activity' && group) {
      fetchGroupStats();
    }
  }, [activeTab, group]);

  const fetchGroupStats = async () => {
    setLoadingStats(true);
    // 1. Obtener miembros
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, profiles(email, username)')
      .eq('group_id', group.id);

    // 2. Obtener IDs de usuarios que tienen al menos un deseo
    const { data: wishes } = await supabase
      .from('wishes')
      .select('user_id')
      .eq('group_id', group.id);

    if (members && wishes) {
        const activeUserIds = new Set(wishes.map(w => w.user_id));
        const lazies = members
            .filter(m => !activeUserIds.has(m.user_id))
            .map(m => m.profiles?.username || m.profiles?.email || 'Usuario Desconocido');
        setLazyUsers(lazies);
    }
    setLoadingStats(false);
  };

  if (!mounted || !isOpen || !group) return null;

  // --- ACTIONS ---

  const handleUpdateGeneral = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
          .from('groups')
          .update({ 
            name: name.trim(),
            announcement: announcement.trim() || null
          })
          .eq('id', group.id)
          .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Sin permisos de admin.");

        toast.success('Configuración actualizada');
        if (onUpdate) onUpdate(data[0]);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    // Generar código tipo: NAV-X9Y2
    const newCode = 'NAV-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('groups')
            .update({ code: newCode })
            .eq('id', group.id)
            .select();
            
        if (error) throw error;
        
        toast.success('Nuevo código de acceso generado');
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
        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', group.id);

        if (error) throw error;

        toast.success('Grupo eliminado correctamente');
        onClose();
        if (onDelete) onDelete();
    } catch (error) {
        toast.error('Error al eliminar: ' + error.message);
        setLoading(false);
    }
  };

  const copyLazyList = () => {
    const text = `📢 Lista de la vergüenza (0 deseos):\n- ${lazyUsers.join('\n- ')}\n\n¡Pónganse las pilas! 🎄`;
    navigator.clipboard.writeText(text);
    toast.success('Lista copiada al portapapeles');
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
        <div className="flex border-b border-white/5 px-6 shrink-0">
            <button onClick={() => setActiveTab('general')} className={`py-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'general' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>General</button>
            <button onClick={() => setActiveTab('security')} className={`py-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'security' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Seguridad</button>
            <button onClick={() => setActiveTab('activity')} className={`py-4 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'activity' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Actividad</button>
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

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-2 flex justify-between">
                            <span>📢 Mensaje Fijado (Broadcast)</span>
                            <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded">Visible para todos</span>
                        </label>
                        <textarea 
                            value={announcement}
                            onChange={(e) => setAnnouncement(e.target.value)}
                            className="w-full bg-[#0B0E14] border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-100 focus:border-cyan-500 outline-none transition-all placeholder-slate-700 min-h-[100px]"
                            placeholder="Ej: Recuerden que el intercambio es el día 24 a las 8PM..."
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

            {/* --- TAB SEGURIDAD --- */}
            {activeTab === 'security' && (
                <div className="space-y-8">
                    <div className="p-5 rounded-2xl bg-[#0B0E14] border border-white/5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Código de Invitación</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white/5 rounded-lg p-3 font-mono text-center text-xl text-white tracking-widest select-all border border-white/5">
                                {group.code}
                            </div>
                            <button 
                                onClick={handleRegenerateCode}
                                disabled={loading}
                                className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                                title="Regenerar Código"
                            >
                                🔄
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                            Si regeneras el código, el anterior dejará de funcionar. Los miembros actuales no se verán afectados, pero las invitaciones pendientes fallarán.
                        </p>
                    </div>

                    <div className="pt-6 border-t border-red-500/20">
                        <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">⚠️ Zona de Peligro</h4>
                        <p className="text-xs text-slate-400 mb-4">Esta acción eliminará el grupo, todos los miembros y sus deseos. No se puede deshacer.</p>
                        
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Escribe ELIMINAR para confirmar"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full bg-red-900/10 border border-red-500/30 rounded-xl px-4 py-2 text-red-200 placeholder-red-500/30 focus:border-red-500 outline-none text-sm font-mono"
                            />
                            <button 
                                onClick={handleDeleteGroup}
                                disabled={loading || deleteConfirmation !== 'ELIMINAR'}
                                className="w-full py-3 rounded-xl font-bold text-sm bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
                            >
                                {loading ? 'Eliminando...' : 'Eliminar Grupo Permanentemente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB ACTIVIDAD (PING) --- */}
            {activeTab === 'activity' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <h4 className="text-sm font-bold text-white">Usuarios sin deseos (Vagos)</h4>
                         <span className="bg-white/10 px-2 py-1 rounded text-xs text-slate-400">{lazyUsers.length}</span>
                    </div>

                    {loadingStats ? (
                        <div className="text-center py-8 text-slate-500 animate-pulse">Escaneando base de datos...</div>
                    ) : lazyUsers.length > 0 ? (
                        <div className="bg-[#0B0E14] rounded-xl border border-white/5 overflow-hidden">
                            <ul className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                                {lazyUsers.map((user, i) => (
                                    <li key={i} className="px-4 py-3 text-sm text-slate-300 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        {user}
                                    </li>
                                ))}
                            </ul>
                            <div className="p-3 bg-white/5 border-t border-white/5">
                                <button 
                                    onClick={copyLazyList}
                                    className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold uppercase hover:bg-purple-500/30 transition-colors border border-purple-500/30 flex items-center justify-center gap-2"
                                >
                                    <span>📋</span> Copiar Lista para WhatsApp
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <div className="text-2xl mb-2">🎉</div>
                            <p className="text-green-400 text-sm font-bold">¡Todo el mundo está activo!</p>
                            <p className="text-slate-500 text-xs mt-1">Nadie tiene la lista vacía.</p>
                        </div>
                    )}
                    
                    <div className="text-[10px] text-slate-600 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                        <p>💡 Tip: Copia la lista y mándala al grupo de WhatsApp para presionar a los que faltan.</p>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>,
    document.body
  );
}