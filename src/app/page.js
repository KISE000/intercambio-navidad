'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Auth from '../components/Auth';
import WishForm from '../components/WishForm';
import WishList from '../components/WishList';
import WishListSkeleton from '../components/WishListSkeleton';
import GroupSelector from '../components/GroupSelector';
import Avatar from '../components/Avatar'; 
import AvatarSelector from '../components/AvatarSelector'; 
import GroupMembersModal from '../components/GroupMembersModal';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishes, setWishes] = useState([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('mine');
  
  const router = useRouter();

  const [snowflakes, setSnowflakes] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  
  const menuRef = useRef(null);

  const getUserAvatarStyle = () => session?.user?.user_metadata?.avatar_style || 'robot';
  const getUserAvatarSeed = () => session?.user?.user_metadata?.avatar_seed || session?.user?.email;

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
    setLoadingWishes(true);
    
    const { data, error } = await supabase
      .from('wishes')
      .select('*, profiles(username, avatar_style, avatar_seed)') 
      .eq('group_id', selectedGroup.id)
      .order('position', { ascending: true }) // <--- NUEVO ORDENAMIENTO PRIMARIO
      .order('created_at', { ascending: false }); // Fallback

    if (error) {
      console.error('Error fetching wishes:', error);
    } else {
      setWishes(data || []);
    }
    setTimeout(() => setLoadingWishes(false), 500); 
  }, [selectedGroup]);

  // --- 3. Auth State Change ---
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) { setSession(session); setLoading(false); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session);
        router.push('/update-password');
        return; 
      }
      setSession(session);
      if (!session) { setSelectedGroup(null); setWishes([]); }
      setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    if (session && selectedGroup) fetchWishes();
  }, [session, selectedGroup, fetchWishes]);

  // Click outside menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [menuRef]);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setSession(null);
    setSelectedGroup(null);
    setWishes([]);
    setIsMobileMenuOpen(false);
    setIsMenuOpen(false);
    await supabase.auth.signOut();
  };

  const handleInvite = () => {
    if (!selectedGroup) return;
    const shareText = `🎄 ¡Únete a mi intercambio "${selectedGroup.name}"!\n\n1. Entra a: ${window.location.origin}\n2. Usa el código: ${selectedGroup.code}`;
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success("📋 Invitación copiada al portapapeles");
      setIsMenuOpen(false);
      setIsMobileMenuOpen(false);
    }).catch(() => toast.error("Error al copiar"));
  };

  const filteredWishes = wishes.filter(w => {
    if (!session) return false;
    return activeTab === 'mine' 
      ? w.user_id === session.user.id 
      : w.user_id !== session.user.id;
  });

  const myWishesCount = wishes.filter(w => w.user_id === session?.user?.id).length;
  const othersWishesCount = wishes.filter(w => w.user_id !== session?.user?.id).length;
  const totalWishes = wishes.length;
  const progressPercentage = (myWishesCount / 10) * 100;

  // --- Render Conditional ---
  if (loading) return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-purple-500 relative overflow-hidden"><SnowBackground /><span className="animate-pulse z-10 font-mono">Iniciando sistemas...</span></div>
  );

  if (!session) return (
    <main className="min-h-screen bg-[#0B0E14] flex items-center justify-center relative overflow-hidden"><SnowBackground /><div className="z-10"><Auth /></div></main>
  );

  if (!selectedGroup) return (
    <main className="min-h-screen bg-[#0B0E14] flex items-center justify-center relative overflow-hidden"><SnowBackground /><div className="z-10 w-full"><GroupSelector session={session} onSelectGroup={setSelectedGroup} onLogout={handleLogout} /></div></main>
  );

  // Check si soy admin del grupo actual
  const isAdmin = selectedGroup?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans pb-20 relative">
      <SnowBackground />

      {/* HEADER */}
      <header className="bg-[#151923]/90 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 md:py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-2xl md:text-3xl">🎄</div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">iShop Navidad</h1>
            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 mt-0.5">
              <span className="hidden sm:inline">Mis Grupos</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="text-purple-400 font-bold uppercase truncate max-w-[120px] sm:max-w-none">{selectedGroup.name}</span>
            </div>
          </div>
        </div>

        {/* Móvil Trigger */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden relative group outline-none">
          <Avatar seed={getUserAvatarSeed()} style={getUserAvatarStyle()} size="md" className="group-active:scale-95 transition-transform" />
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:block relative" ref={menuRef}>
           <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center gap-3 bg-[#0B0E14] border border-white/5 rounded-full pl-1 pr-6 py-1 hover:border-purple-500/50 transition-all ${isMenuOpen ? 'ring-2 ring-purple-500/20 border-purple-500/50' : ''}`}>
             <Avatar seed={getUserAvatarSeed()} style={getUserAvatarStyle()} size="md" />
             <span className="text-sm font-medium text-slate-300">{session.user.email.split('@')[0]}</span>
             <span className={`text-xs text-slate-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}>▼</span>
           </button>

           {isMenuOpen && (
             <div className="absolute right-0 top-full mt-4 w-80 bg-[#1A1F2E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right z-50">
               <div className="px-6 py-5 border-b border-white/5 bg-[#151923]/50">
                 <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Mi Cuenta</p>
                 <p className="text-lg text-white font-medium truncate">{session.user.email}</p>
               </div>
               <div className="p-3 space-y-2">
                 
                 {isAdmin && (
                   <button 
                      onClick={() => { setIsMembersModalOpen(true); setIsMenuOpen(false); }} 
                      className="w-full text-left px-4 py-3 text-base text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-xl flex items-center gap-3 transition-colors group"
                   >
                      <span className="text-xl group-hover:scale-110 transition-transform">👥</span> 
                      Gestión de Miembros
                   </button>
                 )}

                 <button onClick={handleInvite} className="w-full text-left px-4 py-3 text-base text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors group">
                    <span className="text-xl group-hover:scale-110 transition-transform">🔗</span> Invitar Amigos
                 </button>

                 <button onClick={() => { setIsAvatarSelectorOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-base text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors group">
                    <span className="text-xl group-hover:scale-110 transition-transform">🎅</span> Cambiar Avatar
                 </button>
                 
                 <button onClick={() => { setSelectedGroup(null); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-base text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors group">
                   <span className="text-xl group-hover:scale-110 transition-transform">🔄</span> Cambiar de Grupo
                 </button>
                 
                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-base text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors group">
                   <span className="text-xl group-hover:scale-110 transition-transform">🚪</span> Cerrar Sesión
                 </button>
               </div>
             </div>
           )}
        </div>
      </header>

      {/* MENÚ MÓVIL */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#151923] border-l border-white/10 z-[70] shadow-2xl animate-in slide-in-from-right duration-300">
             <div className="p-6 border-b border-white/5 bg-[#0B0E14]/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Menú</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-4 mb-4">
                <Avatar seed={getUserAvatarSeed()} style={getUserAvatarStyle()} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Mi Cuenta</p>
                  <p className="text-base text-white font-medium truncate">{session.user.email}</p>
                </div>
              </div>
              <div className="bg-[#0B0E14]/50 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Grupo Actual</p>
                <p className="text-sm text-purple-400 font-bold">{selectedGroup.name}</p>
                {isAdmin && <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 mt-1 inline-block">ADMINISTRADOR</span>}
              </div>
            </div>
            <div className="p-4 space-y-2">
              
              {isAdmin && (
                <button 
                    onClick={() => { setIsMembersModalOpen(true); setIsMobileMenuOpen(false); }} 
                    className="w-full text-left px-4 py-4 text-base text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-xl flex items-center gap-3 transition-colors group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
                  <span>Gestión de Miembros</span>
                </button>
              )}

              <button onClick={handleInvite} className="w-full text-left px-4 py-4 text-base text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🔗</span><span>Invitar Amigos</span>
              </button>

              <button onClick={() => { setIsAvatarSelectorOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-4 text-base text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎅</span><span>Personalizar Avatar</span>
              </button>

              <button onClick={() => { setSelectedGroup(null); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-4 text-base text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🔄</span><span>Cambiar de Grupo</span>
              </button>
              
              <button onClick={handleLogout} className="w-full text-left px-4 py-4 text-base text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🚪</span><span>Cerrar Sesión</span>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-[#0B0E14]/50">
              <p className="text-xs text-slate-600 text-center">iShop Navidad v1.0</p>
            </div>
          </div>
        </>
      )}

      {/* Hero y Stats */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 mt-8 mb-12">
         <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl opacity-20 group-hover:opacity-30 transition duration-500 blur-xl"></div>
          <div className="relative bg-gradient-to-br from-[#151923] to-[#0B0E14] rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">🎄</div>
                      <div>
                         <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">{selectedGroup.name}</h2>
                         <p className="text-slate-400 text-sm md:text-base">Lista de deseos navideños</p>
                      </div>
                   </div>
                   <div className="bg-[#0B0E14]/80 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mi Progreso</p>
                      <p className="text-2xl font-bold"><span className="text-white">{myWishesCount}</span><span className="text-slate-600">/</span><span className="text-slate-500">10</span></p>
                   </div>
                </div>
                {/* Stats */}
                <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">Deseos agregados</span>
                      <span className="text-sm font-bold text-purple-400">{progressPercentage.toFixed(0)}%</span>
                   </div>
                   <div className="h-3 bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-purple-500/50" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="bg-[#0B0E14]/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 transition-colors">
                      <div className="flex items-center gap-3 mb-2"><span className="text-2xl">✏️</span><span className="text-xs text-slate-500 uppercase tracking-wider">Mis Deseos</span></div>
                      <p className="text-3xl font-bold text-white">{myWishesCount}</p>
                   </div>
                   <div className="bg-[#0B0E14]/50 backdrop-blur-sm border border-pink-500/20 rounded-xl p-4 hover:border-pink-500/40 transition-colors">
                      <div className="flex items-center gap-3 mb-2"><span className="text-2xl">👥</span><span className="text-xs text-slate-500 uppercase tracking-wider">Del Grupo</span></div>
                      <p className="text-3xl font-bold text-white">{othersWishesCount}</p>
                   </div>
                   <div className="bg-[#0B0E14]/50 backdrop-blur-sm border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-colors">
                      <div className="flex items-center gap-3 mb-2"><span className="text-2xl">🎯</span><span className="text-xs text-slate-500 uppercase tracking-wider">Total</span></div>
                      <p className="text-3xl font-bold text-white">{totalWishes}</p>
                   </div>
                </div>
             </div>
          </div>
         </div>
      </div>

      {/* Tabs y Listas */}
      <div className="max-w-4xl mx-auto px-4 mt-10 relative z-10">
        <div className="flex justify-center mb-12">
          <div className="bg-[#151923] p-1 rounded-xl border border-white/5 flex w-full max-w-sm relative shadow-xl">
            <button onClick={() => setActiveTab('mine')} className={`flex-1 py-3 rounded-lg text-sm md:text-base font-bold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'mine' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              ✏️ Mi Lista
            </button>
            <button onClick={() => setActiveTab('others')} className={`flex-1 py-3 rounded-lg text-sm md:text-base font-bold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'others' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              👀 Ver Otros
            </button>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#6366f1] rounded-lg transition-transform duration-300 ease-out z-0 shadow-[0_0_15px_rgba(99,102,241,0.4)] ${activeTab === 'mine' ? 'translate-x-0' : 'translate-x-full left-1'}`}></div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
          {loadingWishes ? (
             <WishListSkeleton />
          ) : (
            <>
              {activeTab === 'mine' && (
                <>
                  <WishForm session={session} onWishAdded={fetchWishes} currentWishes={wishes} groupId={selectedGroup.id} />
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

              {activeTab === 'others' && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-3xl">👥</span>
                    <h2 className="text-2xl font-bold text-white">Deseos del Grupo</h2>
                    <span className="bg-[#151923] text-slate-400 px-3 py-1 rounded-lg text-sm font-mono border border-white/5">
                      {filteredWishes.length}
                    </span>
                  </div>
                  {filteredWishes.length === 0 ? (
                    <div className="col-span-full text-center py-24 text-slate-500 bg-[#151923]/30 rounded-2xl backdrop-blur-sm text-lg">
                      El grupo está silencioso... sé el primero en invitar a alguien.
                    </div>
                  ) : (
                    <WishList wishes={filteredWishes} currentUser={session.user} onDelete={fetchWishes} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* MODALS */}
      <AvatarSelector 
        isOpen={isAvatarSelectorOpen} 
        onClose={() => setIsAvatarSelectorOpen(false)}
        currentSession={session}
        onUpdate={(updatedUser) => {
          setSession({ ...session, user: updatedUser });
          fetchWishes();
        }}
      />

      <GroupMembersModal 
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        groupId={selectedGroup?.id}
        currentUserSession={session}
      />
    </div>
  );
}