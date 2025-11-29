import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function GroupSelector({ session, onSelectGroup, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'join'
  
  // Inputs
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [session]);

  const fetchGroups = async () => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('group_id, role, groups:group_id (id, name, code)')
        .eq('user_id', session.user.id);

      if (membersError) throw membersError;

      const formattedGroups = membersData.map(item => ({
        id: item.groups.id,
        name: item.groups.name,
        code: item.groups.code,
        role: item.role
      }));

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

      // A. Insertar Grupo
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{ name: newGroupName, code: code, created_by: session.user.id }])
        .select()
        .single();

      if (groupError) throw groupError;

      // B. Insertar al creador como admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{ group_id: groupData.id, user_id: session.user.id, role: 'admin' }]);

      if (memberError) throw memberError;

      await fetchGroups();
      setViewMode('list');
      setNewGroupName('');
      toast.success(`Grupo "${newGroupName}" creado con éxito`);
    } catch (err) {
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
      toast.error(err.message || "Error al unirse al grupo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Contenedor Glow (Igual que Auth) */}
      <div className="relative group w-full max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[2rem] opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        
        <div className="relative bg-[#0f111a]/90 backdrop-blur-xl border border-white/10 rounded-[1.7rem] shadow-2xl p-8 overflow-hidden">
          
          {/* Textura de Ruido */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-5xl mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
              {viewMode === 'list' ? '🏘️' : viewMode === 'create' ? '🏗️' : '🎟️'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-slate-400 mb-1 tracking-tight">
              {viewMode === 'list' ? 'BIENVENIDO A LA VILLA' : viewMode === 'create' ? 'NUEVA RED' : 'ACCESO REMOTO'}
            </h1>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">
              {viewMode === 'list' ? 'Selecciona tu nodo de conexión' : viewMode === 'create' ? 'Configurando servidor local...' : 'Sincronizando frecuencias...'}
            </p>
          </div>

          {/* --- VISTA: LISTA DE GRUPOS --- */}
          {viewMode === 'list' && (
            <div className="relative z-10">
              <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                {loading && <p className="text-center text-xs text-purple-400 animate-pulse font-mono">Buscando redes activas...</p>}
                
                {!loading && groups.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                    <p className="text-slate-500 text-sm">No hay señales detectadas.</p>
                    <p className="text-slate-600 text-xs mt-1">Crea un grupo o únete a uno.</p>
                  </div>
                )}

                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className="w-full group/item relative px-5 py-4 bg-[#151923]/80 hover:bg-purple-900/10 border border-white/5 hover:border-purple-500/50 rounded-xl transition-all duration-300 flex items-center justify-between overflow-hidden shadow-lg"
                  >
                    {/* Hover Glow interno */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                    
                    <div className="flex items-center gap-4 z-10">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/5 text-lg group-hover/item:scale-110 transition-transform">
                        🎁
                      </div>
                      <div className="text-left">
                         <span className="font-bold text-slate-200 group-hover/item:text-white block text-sm tracking-wide">{group.name}</span>
                         <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                           CODE: <span className="text-purple-400">{group.code}</span>
                         </span>
                      </div>
                    </div>
                    
                    <span className={`z-10 text-[9px] uppercase font-bold px-2 py-1 rounded border tracking-widest ${
                      group.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                        : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                    }`}>
                      {group.role}
                    </span>
                  </button>
                ))}
              </div>

              {/* Botones de Acción */}
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
                  className="relative overflow-hidden p-4 rounded-xl bg-[#1A1F2E] hover:bg-[#23293b] border border-white/10 hover:border-purple-500/30 transition-all active:scale-[0.98] group"
                >
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="text-xl mb-1 group-hover:-translate-y-1 transition-transform">🤝</div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white tracking-wide">Tengo Código</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* --- VISTA: CREAR GRUPO --- */}
          {viewMode === 'create' && (
            <form onSubmit={handleCreateGroup} className="mb-4 animate-in fade-in slide-in-from-bottom-4 relative z-10">
               <div className="space-y-2 mb-6 group/input">
                 <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] ml-1">Nombre del Nodo</label>
                 <input 
                   type="text" 
                   placeholder="Ej: Familia 2025" 
                   className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                   value={newGroupName}
                   onChange={(e) => setNewGroupName(e.target.value)}
                   autoFocus
                 />
               </div>
               <div className="flex gap-3">
                 <button type="button" onClick={() => setViewMode('list')} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700 transition-colors">CANCELAR</button>
                 <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-colors disabled:opacity-50">
                   {loading ? 'PROCESANDO...' : 'CONFIRMAR'}
                 </button>
               </div>
            </form>
          )}

          {/* --- VISTA: UNIRSE A GRUPO --- */}
          {viewMode === 'join' && (
            <form onSubmit={handleJoinGroup} className="mb-4 animate-in fade-in slide-in-from-bottom-4 relative z-10">
               <div className="space-y-2 mb-6 group/input">
                 <label className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] ml-1">Código de Acceso</label>
                 <input 
                   type="text" 
                   placeholder="Ej: NAV-1234" 
                   className="w-full bg-[#0B0E14]/80 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner font-mono uppercase"
                   value={joinCode}
                   onChange={(e) => setJoinCode(e.target.value)}
                   autoFocus
                 />
               </div>
               <div className="flex gap-3">
                 <button type="button" onClick={() => setViewMode('list')} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700 transition-colors">CANCELAR</button>
                 <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-colors disabled:opacity-50">
                   {loading ? 'CONECTANDO...' : 'UNIRSE'}
                 </button>
               </div>
            </form>
          )}

          {/* Footer User Info */}
          <div className="border-t border-white/5 pt-6 flex flex-col items-center gap-3 relative z-10">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/30 border border-white/5 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wide">{session?.user?.email}</span>
            </div>
            <button 
              onClick={onLogout} 
              className="text-[10px] text-red-400/60 hover:text-red-400 hover:tracking-wide transition-all uppercase font-bold"
            >
              /// Desconectar Sesión
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}