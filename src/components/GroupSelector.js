import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function GroupSelector({ session, onSelectGroup, onLogout, theme, toggleTheme }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); 
  
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
        fetchGroups();
    }
  }, [session]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('group_id, role, groups:group_id (id, name, code, created_by, event_date)')
        .eq('user_id', session.user.id);

      if (membersError) throw membersError;

      const formattedGroups = (membersData || [])
        .filter(item => item.groups !== null) 
        .map(item => ({
          id: item.groups.id,
          name: item.groups.name,
          code: item.groups.code,
          event_date: item.groups.event_date,
          role: item.role,
          isCreator: item.groups.created_by === session.user.id
        }))
        .sort((a, b) => (a.role === 'admin' ? -1 : 1));

      setGroups(formattedGroups);
    } catch (err) {
      console.error("Error cargando grupos:", err); 
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.warning("El nombre del grupo no puede estar vacío");
      return;
    }
    setLoading(true);

    try {
      const code = `NAV-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{ name: newGroupName, code: code, created_by: session.user.id }])
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{ group_id: groupData.id, user_id: session.user.id, role: 'admin' }]);

      if (memberError) throw memberError;

      await fetchGroups();
      setViewMode('list');
      setNewGroupName('');
      toast.success(`Grupo "${newGroupName}" creado con éxito`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al crear el grupo");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.warning("Debes ingresar un código");
      return;
    }
    setLoading(true);

    try {
      // Enviamos el código limpio
      const { data, error: rpcError } = await supabase
        .rpc('join_group_via_code', { code_input: joinCode.trim() });

      if (rpcError) throw rpcError;

      if (!data.success) {
        throw new Error(data.message);
      }

      await fetchGroups();
      setViewMode('list');
      setJoinCode('');
      toast.success("¡Te has unido al grupo correctamente!");
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al unirse al grupo");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (e, group) => {
    e.stopPropagation(); 
    const shareText = `🎄 ¡Únete a mi intercambio "${group.name}"!\n\n1. Entra a: ${window.location.origin}\n2. Usa el código: ${group.code}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success("📋 Invitación copiada al portapapeles");
    }).catch(() => {
      toast.error("No se pudo copiar al portapapeles");
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full px-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Botón Flotante */}
      <button 
        onClick={toggleTheme}
        className="absolute top-0 right-4 md:right-0 md:-top-12 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-transform z-50 text-text-main"
        title={theme === 'dark' ? 'Activar Modo Hielo' : 'Activar Modo Cyberpunk'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Contenedor Glow */}
      <div className="relative group w-full max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[2rem] opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        
        {/* Tarjeta Principal */}
        <div className="relative bg-surface backdrop-blur-xl border border-border rounded-[1.7rem] shadow-2xl p-8 overflow-hidden transition-colors duration-300">
          
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10">
            <div className="text-5xl mb-3 drop-shadow-md">
              {viewMode === 'list' ? '🏘️' : viewMode === 'create' ? '🏗️' : '🎟️'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-text-main via-purple-500 to-slate-500 mb-1 tracking-tight pb-1">
              {viewMode === 'list' ? 'BIENVENIDO A LA VILLA' : viewMode === 'create' ? 'NUEVA RED' : 'ACCESO REMOTO'}
            </h1>
            <p className="text-text-muted text-xs font-mono uppercase tracking-widest">
              {viewMode === 'list' ? 'Selecciona tu nodo de conexión' : viewMode === 'create' ? 'Configurando servidor local...' : 'Sincronizando frecuencias...'}
            </p>
          </div>

          {/* --- VISTA: LISTA DE GRUPOS --- */}
          {viewMode === 'list' && (
            <div className="relative z-10">
              <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                {loading && <p className="text-center text-xs text-purple-400 animate-pulse font-mono">Buscando redes activas...</p>}
                
                {!loading && groups.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-border rounded-2xl bg-background/50">
                    <p className="text-text-muted text-sm">No hay señales detectadas.</p>
                    <p className="text-text-muted/80 text-xs mt-1">Crea un grupo o únete a uno.</p>
                  </div>
                )}

                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className="w-full cursor-pointer group/item relative px-5 py-4 bg-background hover:bg-surface-highlight border border-border hover:border-purple-500/50 rounded-xl transition-all duration-300 flex items-center justify-between overflow-hidden shadow-sm hover:shadow-md"
                  >
                    
                    <div className="flex items-center gap-4 z-10">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border text-lg group-hover/item:scale-110 transition-transform shadow-sm">
                        🎁
                      </div>
                      <div className="text-left">
                         <span className="font-bold text-text-main group-hover/item:text-purple-500 block text-sm tracking-wide transition-colors">{group.name}</span>
                         <span className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                           CODE: <span className="text-purple-400 font-bold">{group.code}</span>
                         </span>
                      </div>
                    </div>
                    
                    <div className="z-10 flex items-center gap-2">
                        <button 
                            onClick={(e) => handleShare(e, group)}
                            className="p-2 rounded-full hover:bg-surface text-text-muted hover:text-purple-500 transition-colors"
                            title="Copiar Invitación"
                        >
                            🔗
                        </button>

                        <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded border tracking-widest ${
                        group.role === 'admin' 
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                            : 'bg-background text-text-muted border-border'
                        }`}>
                        {group.role}
                        </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => setViewMode('create')}
                  className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 border border-white/10 transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] group"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="text-xl mb-1 group-hover:-translate-y-1 transition-transform">✨</div>
                    <span className="text-xs font-bold text-white tracking-wide">Crear Grupo</span>
                  </div>
                </button>

                <button 
                  onClick={() => setViewMode('join')}
                  className="relative overflow-hidden p-4 rounded-xl bg-background hover:bg-surface-highlight border border-border hover:border-purple-500/30 transition-all active:scale-[0.98] group"
                >
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="text-xl mb-1 group-hover:-translate-y-1 transition-transform">🤝</div>
                    <span className="text-xs font-bold text-text-muted group-hover:text-text-main tracking-wide">Tengo Código</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {viewMode === 'create' && (
            <form onSubmit={handleCreateGroup} className="mb-4 animate-in fade-in slide-in-from-bottom-4 relative z-10">
               <div className="space-y-2 mb-6 group/input">
                 <label className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] ml-1">Nombre del Nodo</label>
                 <input 
                   type="text" 
                   placeholder="Ej: Familia 2025" 
                   className="cyber-input"
                   value={newGroupName}
                   onChange={(e) => setNewGroupName(e.target.value)}
                   autoFocus
                 />
               </div>
               <div className="flex gap-3">
                 <button type="button" onClick={() => setViewMode('list')} className="flex-1 py-3 rounded-xl bg-background border border-border text-text-muted text-xs font-bold hover:bg-surface-highlight transition-colors">CANCELAR</button>
                 <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-colors disabled:opacity-50">
                   {loading ? 'PROCESANDO...' : 'CONFIRMAR'}
                 </button>
               </div>
            </form>
          )}

          {/* VISTA JOIN: Corrección de mayúsculas */}
          {viewMode === 'join' && (
            <form onSubmit={handleJoinGroup} className="mb-4 animate-in fade-in slide-in-from-bottom-4 relative z-10">
               <div className="space-y-2 mb-6 group/input">
                 <label className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] ml-1">Código de Acceso</label>
                 <input 
                   type="text" 
                   placeholder="Ej: NAV-1234" 
                   className="cyber-input font-mono uppercase"
                   value={joinCode}
                   // Forzamos mayúsculas al escribir para que coincida con el backend
                   onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                   autoFocus
                 />
               </div>
               <div className="flex gap-3">
                 <button type="button" onClick={() => setViewMode('list')} className="flex-1 py-3 rounded-xl bg-background border border-border text-text-muted text-xs font-bold hover:bg-surface-highlight transition-colors">CANCELAR</button>
                 <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-colors disabled:opacity-50">
                   {loading ? 'CONECTANDO...' : 'UNIRSE'}
                 </button>
               </div>
            </form>
          )}

          <div className="border-t border-border pt-6 flex flex-col items-center gap-3 relative z-10">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span className="text-[10px] text-text-muted font-mono tracking-wide">{session?.user?.email}</span>
            </div>
            <button 
              onClick={onLogout} 
              className="text-[10px] text-red-400 hover:text-red-500 hover:tracking-wide transition-all uppercase font-bold"
            >
              /// Desconectar Sesión
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}