'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Auth from '../components/Auth';
import WishForm from '../components/WishForm';
import WishList from '../components/WishList';
import GroupSelector from '../components/GroupSelector';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishes, setWishes] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('mine');
  
  // Estado para la nieve
  const [snowflakes, setSnowflakes] = useState([]);

  // --- NUEVO ESTADO PARA EL MENÚ ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // --- 1. Efecto de Nieve ---
  useEffect(() => {
    const flakes = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: Math.random() * 5 + 5 + 's',
      animationDelay: Math.random() * 5 + 's',
      opacity: Math.random() * 0.5 + 0.3
    }));
    setSnowflakes(flakes);
  }, []);

  const SnowBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-white select-none animate-fall"
          style={{
            top: '-20px',
            left: flake.left,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            opacity: flake.opacity,
            fontSize: '1.2rem',
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );

  // --- 2. Lógica Supabase ---
  const fetchWishes = useCallback(async () => {
    if (!selectedGroup) return;
    const { data, error } = await supabase
      .from('wishes')
      .select('*, profiles(username)')
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error:', error);
    else setWishes(data || []);
  }, [selectedGroup]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) { setSession(session); setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { setSelectedGroup(null); setWishes([]); }
      setLoading(false);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (session && selectedGroup) fetchWishes();
  }, [session, selectedGroup, fetchWishes]);

  // --- Lógica de Cierre de Menú al hacer click fuera ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // --- CORRECCIÓN CRÍTICA DE LOGOUT ---
  const handleLogout = async () => {
    // Forzamos la limpieza del estado visual primero
    setSession(null);
    setSelectedGroup(null);
    setWishes([]);
    
    // Luego desconectamos de Supabase
    await supabase.auth.signOut();
  };

  const filteredWishes = wishes.filter(w => {
    if (!session) return false;
    return activeTab === 'mine' 
      ? w.user_id === session.user.id 
      : w.user_id !== session.user.id;
  });

  // --- Renderizado ---
  if (loading) return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-purple-500 relative overflow-hidden">
      <SnowBackground />
      <span className="animate-pulse z-10">Cargando la Villa...</span>
    </div>
  );

  if (!session) return (
    <main className="min-h-screen bg-[#0B0E14] flex items-center justify-center relative overflow-hidden">
      <SnowBackground />
      <div className="z-10"><Auth /></div>
    </main>
  );

  if (!selectedGroup) return (
    <main className="min-h-screen bg-[#0B0E14] flex items-center justify-center relative overflow-hidden">
      <SnowBackground />
      <div className="z-10 w-full"><GroupSelector session={session} onSelectGroup={setSelectedGroup} onLogout={handleLogout} /></div>
    </main>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans pb-20 relative">
      
      {/* FONDO DE NIEVE */}
      <SnowBackground />

      {/* HEADER TIPO DASHBOARD */}
      <header className="bg-[#151923]/90 backdrop-blur-md border-b border-white/5 px-6 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="text-3xl">🎁</div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">iShop Navidad</h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
              <span>Mis Grupos</span>
              <span className="text-slate-600">/</span>
              <span className="text-purple-400 font-bold uppercase">{selectedGroup.name}</span>
            </div>
          </div>
        </div>

        {/* --- MENÚ DE USUARIO (DROPDOWN MÁS GRANDE) --- */}
        <div className="relative" ref={menuRef}>
           <button 
             onClick={() => setIsMenuOpen(!isMenuOpen)}
             // Se aumentó el padding, el tamaño del avatar y el tamaño del texto
             className={`hidden md:flex items-center gap-4 bg-[#0B0E14] border border-white/5 rounded-full pl-2 pr-6 py-2 hover:border-purple-500/50 transition-all ${isMenuOpen ? 'ring-2 ring-purple-500/20 border-purple-500/50' : ''}`}
           >
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-purple-900/50">
               {session.user.email[0].toUpperCase()}
             </div>
             <span className="text-base font-medium text-slate-300">{session.user.email.split('@')[0]}</span>
             <span className={`text-sm text-slate-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}>▼</span>
           </button>

           {/* Dropdown Content (Más ancho y con más padding) */}
           {isMenuOpen && (
             <div className="absolute right-0 top-full mt-4 w-80 bg-[#1A1F2E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right z-50">
               <div className="px-6 py-5 border-b border-white/5 bg-[#151923]/50">
                 <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Mi Cuenta</p>
                 <p className="text-lg text-white font-medium truncate">{session.user.email}</p>
               </div>
               
               <div className="p-3 space-y-2">
                 <button 
                   onClick={() => { setSelectedGroup(null); setIsMenuOpen(false); }}
                   className="w-full text-left px-4 py-3 text-base text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors group"
                 >
                   <span className="text-xl group-hover:scale-110 transition-transform">🔄</span> Cambiar de Grupo
                 </button>
                 
                 <button 
                   onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                   className="w-full text-left px-4 py-3 text-base text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors group"
                 >
                   <span className="text-xl group-hover:scale-110 transition-transform">🚪</span> Cerrar Sesión
                 </button>
               </div>
             </div>
           )}
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="max-w-4xl mx-auto px-4 mt-10 relative z-10">
        
        {/* --- TOGGLE SWITCH --- */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#151923] p-1 rounded-xl border border-white/5 flex w-full max-w-sm relative shadow-xl">
            <button
              onClick={() => setActiveTab('mine')}
              className={`flex-1 py-3 rounded-lg text-base font-bold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'mine' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              ✏️ Mi Lista
            </button>
            <button
              onClick={() => setActiveTab('others')}
              className={`flex-1 py-3 rounded-lg text-base font-bold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'others' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              👀 Ver Otros
            </button>
            
            {/* Background Animado del Toggle */}
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#6366f1] rounded-lg transition-transform duration-300 ease-out z-0 shadow-[0_0_15px_rgba(99,102,241,0.4)] ${activeTab === 'mine' ? 'translate-x-0' : 'translate-x-full left-1'}`}></div>
          </div>
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
          
          {/* VISTA: MI LISTA */}
          {activeTab === 'mine' && (
            <>
              {/* Formulario */}
              <WishForm 
                session={session} 
                onWishAdded={fetchWishes} 
                currentWishes={wishes} 
                groupId={selectedGroup.id} 
              />

              {/* Lista de Mis Deseos */}
              <div className="mt-16">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-3xl">📝</span>
                  <h2 className="text-2xl font-bold text-white">Mis Deseos</h2>
                  <span className="bg-[#151923] text-slate-400 px-3 py-1 rounded-lg text-sm font-mono border border-white/5">
                    {filteredWishes.length}
                  </span>
                </div>

                {filteredWishes.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center bg-[#151923]/50 backdrop-blur-sm">
                     <div className="text-5xl mb-6">🤷‍♂️</div>
                     <p className="text-slate-400 text-lg">No has agregado deseos aún.</p>
                     <p className="text-slate-500 mt-2">¡Usa el formulario de arriba!</p>
                  </div>
                ) : (
                  <WishList wishes={filteredWishes} currentUser={session.user} onDelete={fetchWishes} />
                )}
              </div>
            </>
          )}

          {/* VISTA: VER OTROS */}
          {activeTab === 'others' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredWishes.length === 0 && (
                 <div className="col-span-full text-center py-24 text-slate-500 bg-[#151923]/30 rounded-2xl backdrop-blur-sm text-lg">
                   El grupo está silencioso... sé el primero en invitar a alguien.
                 </div>
               )}
               <WishList wishes={filteredWishes} currentUser={session.user} onDelete={fetchWishes} />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}