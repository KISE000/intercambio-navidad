import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner'; // <--- IMPORTAR

export default function GroupSelector({ session, onSelectGroup, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  
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
      // No mostramos toast aquí para no spamear si falla la carga inicial
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

      // B. Insertar al creador
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{ group_id: groupData.id, user_id: session.user.id, role: 'admin' }]);

      if (memberError) throw memberError;

      await fetchGroups();
      setViewMode('list');
      setNewGroupName('');
      toast.success(`Grupo "${newGroupName}" creado con éxito`); // <--- FEEDBACK
    } catch (err) {
      toast.error(err.message || "Error al crear el grupo"); // <--- ERROR
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
      toast.success("¡Te has unido al grupo correctamente!"); // <--- FEEDBACK
      
    } catch (err) {
      toast.error(err.message || "Error al unirse al grupo"); // <--- ERROR
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 relative z-10">
      
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_-12px_rgba(168,85,247,0.25)] p-8 relative overflow-hidden transition-all">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70"></div>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">🏘️</div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            BIENVENIDO A LA VILLA
          </h1>
          <p className="text-slate-400 text-xs font-light">
            {viewMode === 'list' ? 'Elige tu nodo de conexión' : viewMode === 'create' ? 'Crear nueva red neuronal' : 'Sincronizar frecuencia'}
          </p>
        </div>

        {viewMode === 'list' && (
          <>
            <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
              {loading && <p className="text-center text-xs text-purple-400 animate-pulse">Buscando redes...</p>}
              
              {!loading && groups.length === 0 && (
                <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg">
                  <p className="text-slate-500 text-sm">No perteneces a ningún grupo aún.</p>
                </div>
              )}

              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup(group)}
                  className="w-full group relative px-5 py-4 bg-slate-800/40 hover:bg-purple-900/20 border border-white/5 hover:border-purple-500/50 rounded-xl transition-all duration-300 flex items-center justify-between overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center gap-3 z-10">
                    <span className="text-lg">🎁</span>
                    <div className="text-left">
                       <span className="font-semibold text-slate-200 group-hover:text-white block text-sm">{group.name}</span>
                       <span className="text-[10px] text-slate-500 font-mono">CODE: {group.code}</span>
                    </div>
                  </div>
                  <span className={`z-10 text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                    group.role === 'admin' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                  }`}>
                    {group.role}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => setViewMode('create')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-800 hover:from-purple-500 hover:to-indigo-700 border border-white/10 transition-all shadow-lg shadow-purple-900/20 active:scale-95"
              >
                <div className="text-xl mb-1">+</div>
                <span className="text-xs font-bold text-purple-100">Crear Grupo</span>
              </button>

              <button 
                onClick={() => setViewMode('join')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all active:scale-95"
              >
                <div className="text-xl mb-1">🤝</div>
                <span className="text-xs font-bold text-slate-300">Tengo Código</span>
              </button>
            </div>
          </>
        )}

        {viewMode === 'create' && (
          <form onSubmit={handleCreateGroup} className="mb-6 animate-in fade-in slide-in-from-bottom-4">
             <input 
               type="text" 
               placeholder="Nombre del Grupo (ej: Familia 2025)" 
               className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-purple-500 outline-none mb-4"
               value={newGroupName}
               onChange={(e) => setNewGroupName(e.target.value)}
               autoFocus
             />
             <div className="flex gap-2">
               <button type="button" onClick={() => { setViewMode('list'); }} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700">Cancelar</button>
               <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 disabled:opacity-50">
                 {loading ? 'Creando...' : 'Confirmar'}
               </button>
             </div>
          </form>
        )}

        {viewMode === 'join' && (
          <form onSubmit={handleJoinGroup} className="mb-6 animate-in fade-in slide-in-from-bottom-4">
             <input 
               type="text" 
               placeholder="Ingresa el Código (ej: NAV-1234)" 
               className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-purple-500 outline-none mb-4 uppercase"
               value={joinCode}
               onChange={(e) => setJoinCode(e.target.value)}
               autoFocus
             />
             <div className="flex gap-2">
               <button type="button" onClick={() => { setViewMode('list'); }} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700">Cancelar</button>
               <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 disabled:opacity-50">
                 {loading ? 'Entrando...' : 'Unirse'}
               </button>
             </div>
          </form>
        )}

        <div className="border-t border-white/5 pt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/30 border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-xs text-slate-500 font-mono">{session?.user?.email}</span>
          </div>
          <button onClick={onLogout} className="text-xs text-red-400/60 hover:text-red-400 hover:underline transition-colors">Cerrar Sesión</button>
        </div>

      </div>
    </div>
  );
}