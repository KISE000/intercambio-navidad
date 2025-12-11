import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import Avatar from './Avatar'; 
import confetti from 'canvas-confetti';

export default function GroupSelector({ session, onSelectGroup, onLogout, theme, toggleTheme }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); 
  const [copiedId, setCopiedId] = useState(null);
  
  const [newGroupName, setNewGroupName] = useState('');
  
  // Estado para unirse y validación
  const [joinCode, setJoinCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(null); // null, true, false

  // --- 2. DEEP LINKING ---
  // Detectar si hay un código en la URL al cargar
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const codeParam = params.get('code');
        if (codeParam) {
            setJoinCode(codeParam.toUpperCase());
            setViewMode('join');
            validateCode(codeParam.toUpperCase());
            toast.info('Código detectado. Confirma para unirte.');
            // Limpiar URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
        fetchGroups();
    }
  }, [session]);

  // --- 4. VALIDACIÓN REAL-TIME ---
  const validateCode = (code) => {
      // Regex simple: NAV- seguido de 4 dígitos
      const regex = /^NAV-\d{4}$/;
      setIsCodeValid(regex.test(code));
  };

  const handleCodeChange = (e) => {
      const val = e.target.value.toUpperCase();
      setJoinCode(val);
      validateCode(val);
  }

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
            group_id, role, 
            groups:group_id (
                id, name, code, created_by, event_date
            )
        `)
        .eq('user_id', session.user.id);

      if (membersError) throw membersError;

      const formattedGroups = (membersData || [])
        .filter(item => item.groups !== null) 
        .map(item => {
          const avatars = []; // Simplificado para evitar crash
          
          // --- 1. ETIQUETAS DE ESTADO ---
          let status = 'planning'; // planning, scheduled, finished
          if (item.groups.event_date) {
              const eventDate = new Date(item.groups.event_date);
              const today = new Date();
              today.setHours(0,0,0,0);
              
              if (eventDate < today) status = 'finished';
              else status = 'scheduled';
          }

          return {
            id: item.groups.id,
            name: item.groups.name,
            code: item.groups.code,
            event_date: item.groups.event_date,
            role: item.role,
            isCreator: item.groups.created_by === session.user.id,
            avatars: avatars,
            status: status
          };
        })
        .sort((a, b) => (a.role === 'admin' ? -1 : 1));

      // Simular un poco de delay para apreciar el skeleton (opcional, solo dev)
      // await new Promise(resolve => setTimeout(resolve, 800));

      setGroups(formattedGroups);
    } catch (err) {
      console.error("Error cargando grupos:", err); 
      toast.error("Error de conexión al cargar grupos");
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

    // --- 6. MICRO-INTERACCIÓN DE CREAR ---
    // Confeti desde el centro del botón (aproximado)
    confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#A855F7', '#EC4899']
    });

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
    // --- 2. DEEP LINKING URL ---
    const deepLink = `${window.location.origin}?code=${group.code}`;
    const shareText = `🎄 ¡Únete a mi intercambio "${group.name}"!\n\n🔗 Click aquí: ${deepLink}\n🔑 Código: ${group.code}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      setCopiedId(group.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("📋 Link de invitación copiado");
    }).catch(() => {
      toast.error("No se pudo copiar al portapapeles");
    });
  };

  const handleMouseMove = (e, id) => {
      const card = document.getElementById(`card-${id}`);
      if (!card) return;
      
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -4; 
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = (id) => {
      const card = document.getElementById(`card-${id}`);
      if (card) {
          card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
      }
  }

  // --- 3. SKELETON COMPONENT ---
  const GroupSkeleton = () => (
      <div className="w-full bg-surface/40 border border-white/5 rounded-xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer opacity-10"></div>
          <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-lg bg-white/5 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse"></div>
                  <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse"></div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse"></div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full px-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Contenedor Glow */}
      <div className="relative group w-full max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-[2rem] opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        
        {/* Tarjeta Principal */}
        <div className="relative bg-surface backdrop-blur-xl border border-border rounded-[1.7rem] shadow-2xl p-8 overflow-hidden transition-colors duration-300 min-h-[500px] flex flex-col">
          
          <button 
              onClick={toggleTheme}
              className="absolute top-6 right-6 p-2 rounded-full text-text-muted hover:text-text-main hover:bg-white/5 transition-all duration-300 z-50 group/theme"
              title={theme === 'dark' ? 'Activar Modo Luz' : 'Activar Modo Oscuro'}
          >
              <span className="transform group-hover/theme:rotate-12 inline-block transition-transform duration-300 text-xl">
                  {theme === 'dark' ? '☀️' : '🌙'}
              </span>
          </button>

          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>

          <div className="text-center mb-6 relative z-10 mt-2">
            <div className="text-5xl mb-3 drop-shadow-md group-hover:animate-bounce">
              {viewMode === 'list' ? '🏘️' : viewMode === 'create' ? '🏗️' : '🎟️'}
            </div>
            {/* 5. TITULO CON EFECTO (GLITCH SIMPLE EN HOVER) */}
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-text-main via-purple-500 to-slate-500 mb-1 tracking-tight pb-1 hover:animate-pulse cursor-default">
              {viewMode === 'list' ? 'BIENVENIDO A LA VILLA' : viewMode === 'create' ? 'NUEVA RED' : 'ACCESO REMOTO'}
            </h1>
            <p className="text-text-muted text-xs font-mono uppercase tracking-widest">
              {viewMode === 'list' ? 'Selecciona tu nodo de conexión' : viewMode === 'create' ? 'Configurando servidor local...' : 'Sincronizando frecuencias...'}
            </p>
          </div>

          {/* --- VISTA: LISTA DE GRUPOS --- */}
          {viewMode === 'list' && (
            <div className="relative z-10 flex-1 flex flex-col slide-in-right">
              <div className="space-y-4 mb-4 flex-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                
                {/* 3. SKELETON LOADING */}
                {loading && (
                    <>
                        <GroupSkeleton />
                        <GroupSkeleton />
                        <GroupSkeleton />
                    </>
                )}
                
                {!loading && groups.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-border rounded-2xl bg-background/50 h-full flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2 opacity-50">📡</span>
                    <p className="text-text-muted text-sm">No hay señales detectadas.</p>
                    <p className="text-text-muted/80 text-xs mt-1">Crea un grupo o únete a uno.</p>
                  </div>
                )}

                {groups.map((group, index) => (
                  <div
                    key={group.id}
                    id={`card-${group.id}`}
                    onClick={() => onSelectGroup(group)}
                    onMouseMove={(e) => handleMouseMove(e, group.id)}
                    onMouseLeave={() => handleMouseLeave(group.id)}
                    className="w-full cursor-pointer group/item relative bg-background hover:bg-surface-highlight border border-border hover:border-purple-500/50 rounded-xl transition-all duration-200 overflow-hidden shadow-sm hover:shadow-xl ease-out"
                    style={{ 
                        animation: `fadeInUp 0.5s ease-out forwards ${index * 0.1}s`,
                        opacity: 0, 
                        transformStyle: 'preserve-3d'
                    }}
                  >
                    <div className="px-5 py-4 relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center border border-border text-2xl group-hover/item:scale-110 transition-transform shadow-sm">
                                🎁
                            </div>
                            <div className="text-left">
                                <span className="font-bold text-text-main group-hover/item:text-purple-500 block text-base tracking-wide transition-colors">{group.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {/* 1. ETIQUETAS DE ESTADO */}
                                    {group.status === 'finished' ? (
                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border tracking-widest bg-emerald-900/20 text-emerald-400 border-emerald-500/20">
                                            FINALIZADO
                                        </span>
                                    ) : group.status === 'scheduled' ? (
                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border tracking-widest bg-purple-500/10 text-purple-400 border-purple-500/20">
                                            PROGRAMADO
                                        </span>
                                    ) : (
                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border tracking-widest bg-slate-500/10 text-slate-400 border-slate-500/20">
                                            PLANIFICACIÓN
                                        </span>
                                    )}

                                    {group.role === 'admin' && (
                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border tracking-widest bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                            ADMIN
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                            <button 
                                onClick={(e) => handleShare(e, group)}
                                className={`p-2 rounded-full transition-all duration-300 ${
                                    copiedId === group.id 
                                    ? 'bg-emerald-500 text-white scale-110' 
                                    : 'hover:bg-surface text-text-muted hover:text-purple-500'
                                }`}
                                title="Copiar Link de Invitación"
                            >
                                {copiedId === group.id ? '✅' : '🔗'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-surface/50 border-t border-border/50 px-4 py-2 flex items-center justify-between">
                        <div className="flex -space-x-2">
                             {/* Avatares Placeholder (Visualmente atractivos) */}
                             {[1,2,3].map((_, i) => (
                                 <div key={i} className={`w-5 h-5 rounded-full border border-background flex items-center justify-center text-[8px] font-bold text-white relative z-10 ${
                                     ['bg-purple-500', 'bg-pink-500', 'bg-blue-500'][i]
                                 }`}>
                                     {['A', 'B', 'C'][i]}
                                 </div>
                             ))}
                             <span className="text-[9px] text-text-muted ml-3 flex items-center">
                                y otros...
                             </span>
                        </div>
                        <span className="text-[10px] text-text-muted font-mono">ID: {group.code}</span>
                    </div>

                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                  onClick={() => setViewMode('create')}
                  className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 border border-white/10 transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] group"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl"></div>
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

          {/* --- VISTA: CREATE (Slide Animation) --- */}
          {viewMode === 'create' && (
            <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-right relative z-10">
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

          {/* --- VISTA: JOIN (Con Validación Real-time) --- */}
          {viewMode === 'join' && (
            <form onSubmit={handleJoinGroup} className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-right relative z-10">
               <div className="space-y-2 mb-6 group/input relative">
                 <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] ml-1">Código de Acceso</label>
                    {/* Indicador visual de validez */}
                    {joinCode.length > 0 && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isCodeValid ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCodeValid ? 'FORMATO VÁLIDO' : 'FORMATO INVÁLIDO'}
                        </span>
                    )}
                 </div>
                 
                 <div className="relative">
                    <input 
                    type="text" 
                    placeholder="NAV-XXXX" 
                    className={`cyber-input font-mono uppercase transition-colors duration-300 ${
                        isCodeValid === true ? 'border-emerald-500/50 focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                        isCodeValid === false ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''
                    }`}
                    value={joinCode}
                    onChange={handleCodeChange}
                    autoFocus
                    />
                    {isCodeValid && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400">✅</span>}
                 </div>
               </div>

               <div className="flex gap-3">
                 <button type="button" onClick={() => setViewMode('list')} className="flex-1 py-3 rounded-xl bg-background border border-border text-text-muted text-xs font-bold hover:bg-surface-highlight transition-colors">CANCELAR</button>
                 <button type="submit" disabled={loading || !isCodeValid} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-colors disabled:opacity-50 disabled:grayscale">
                   {loading ? 'CONECTANDO...' : 'UNIRSE'}
                 </button>
               </div>
            </form>
          )}

          <div className="border-t border-border pt-6 flex flex-col items-center gap-4 relative z-10 mt-auto">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span className="text-[10px] text-text-muted font-mono tracking-wide">{session?.user?.email}</span>
            </div>
            
            <button 
              onClick={onLogout} 
              className="w-full py-2 bg-[repeating-linear-gradient(45deg,rgba(239,68,68,0.1),rgba(239,68,68,0.1)_10px,transparent_10px,transparent_20px)] border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 group/logout"
            >
              <span className="group-hover/logout:animate-ping w-1.5 h-1.5 bg-red-500 rounded-full group-hover/logout:bg-white"></span>
              Desconectar Sesión
            </button>
          </div>

        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}