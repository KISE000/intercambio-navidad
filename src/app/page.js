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
import GroupSettingsModal from '../components/GroupSettingsModal';
import ShareTicketModal from '../components/ShareTicketModal'; 

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishes, setWishes] = useState([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('mine');
  
  // --- THEME STATE ---
  const [theme, setTheme] = useState('dark');
  
  const router = useRouter();

  const [snowflakes, setSnowflakes] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  
  const menuRef = useRef(null);

  const getUserAvatarStyle = () => session?.user?.user_metadata?.avatar_style || 'robot';
  const getUserAvatarSeed = () => session?.user?.user_metadata?.avatar_seed || session?.user?.email;

  // --- HELPER: Calcular días restantes ---
  const getDaysLeft = (dateString) => {
    if (!dateString) return null;
    const target = new Date(dateString);
    target.setMinutes(target.getMinutes() + target.getTimezoneOffset());
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = selectedGroup?.event_date ? getDaysLeft(selectedGroup.event_date) : null;

  // --- 0. Inicializar Tema ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
      toast.success('Modo Claro activado ☀️');
    } else {
      document.documentElement.classList.remove('light');
      toast.success('Modo Cyberpunk activado 🌙');
    }
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

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

  useEffect(() => {
    if (selectedGroup) {
      window.scrollTo(0, 0);
    }
  }, [selectedGroup]);

  const fetchWishes = useCallback(async () => {
    if (!selectedGroup || !session) return;
    setLoadingWishes(true);
    try {
      const { data, error } = await supabase
        .from('wishes')
        .select('*, profiles(username, avatar_style, avatar_seed)') 
        .eq('group_id', selectedGroup.id)
        .order('position', { ascending: true }) 
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching wishes:', error);
        toast.error('Error al cargar deseos');
        setWishes([]); 
      } else {
        setWishes(data || []);
      }
    } catch (err) {
      console.error('❌ Excepción en fetchWishes:', err);
      toast.error('Error de red al cargar deseos');
      setWishes([]);
    } finally {
      setTimeout(() => setLoadingWishes(false), 500);
    }
  }, [selectedGroup, session]); 
  
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

  const handleGroupUpdate = (updatedGroupData) => {
    setSelectedGroup((prev) => ({ ...prev, ...updatedGroupData }));
  };

  const handleGroupDelete = () => {
    setSelectedGroup(null);
    setWishes([]);
    setIsSettingsModalOpen(false);
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

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-purple-500 relative overflow-hidden"><span className="animate-pulse z-10 font-mono">Iniciando sistemas...</span></div>
  );

  if (!session) return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      <SnowBackground />
      <div className="z-10 w-full">
        <Auth theme={theme} toggleTheme={toggleTheme} />
      </div>
    </div>
  );

  if (!selectedGroup) return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      <SnowBackground />
      <div className="z-10 w-full">
        <GroupSelector 
          session={session} 
          onSelectGroup={setSelectedGroup} 
          onLogout={handleLogout} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </div>
    </div>
  );

  const isAdmin = selectedGroup?.role === 'admin';

  return (
    <div className="min-h-screen bg-background text-text-main font-sans pb-20 relative selection:bg-purple-500/30 transition-colors duration-300">
      <SnowBackground />

      {/* HEADER */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">🎄</div>
          <div>
            <h1 className="text-lg font-bold text-text-main tracking-tight leading-none">{selectedGroup.name}</h1>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-1 cursor-pointer group/code" onClick={handleInvite} title="Click para copiar invitación">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] group-hover/code:animate-pulse"></span>
              <span className="font-mono text-text-muted">ID:</span>
              <span className="font-mono text-purple-400 uppercase tracking-wider group-hover/code:text-purple-300 transition-colors">
                {selectedGroup.code}
              </span>
            </div>
          </div>
        </div>

        {/* Móvil Trigger */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden relative group outline-none">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-active:opacity-50 transition duration-200 blur"></div>
          <Avatar seed={getUserAvatarSeed()} style={getUserAvatarStyle()} size="md" className="relative" />
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:block relative" ref={menuRef}>
           <button 
             onClick={() => setIsMenuOpen(!isMenuOpen)} 
             className={`flex items-center gap-3 bg-surface hover:bg-surface-highlight border border-border rounded-full pl-1.5 pr-5 py-1.5 transition-all duration-300 group ${isMenuOpen ? 'ring-2 ring-purple-500/20 border-purple-500/40' : ''}`}
           >
             <Avatar seed={getUserAvatarSeed()} style={getUserAvatarStyle()} size="sm" />
             <div className="flex flex-col items-start leading-none">
                <span className="text-xs font-bold text-text-main group-hover:text-purple-400 transition-colors">Mi Cuenta</span>
                <span className="text-[10px] text-text-muted font-mono truncate max-w-[100px]">{session.user.email.split('@')[0]}</span>
             </div>
             <span className={`text-[10px] text-text-muted ml-2 transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-purple-400' : ''}`}>▼</span>
           </button>

           {isMenuOpen && (
             <div className="absolute right-0 top-full mt-3 w-72 glass-menu rounded-2xl overflow-hidden animate-menu-in z-50 origin-top-right">
               <div className="p-5 border-b border-border bg-surface-highlight/30">
                 <div className="flex items-center gap-3 mb-3">
                    <Avatar seed={getUserAvatarSeed()} style={getUserAvatarStyle()} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-0.5">Conectado como</p>
                      <p className="text-sm text-text-main font-medium truncate" title={session.user.email}>{session.user.email}</p>
                    </div>
                 </div>
                 {isAdmin && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold text-yellow-500 uppercase tracking-wide w-full justify-center">
                        <span>★</span> Admin del Grupo
                    </div>
                 )}
               </div>

               <div className="p-2 space-y-1">
                   {isAdmin && (
                       <>
                           <h4 className="text-[9px] text-yellow-500/70 font-mono uppercase tracking-widest px-2 pt-1 pb-1">ADMIN TOOLS</h4>
                           <button onClick={() => { setIsSettingsModalOpen(true); setIsMenuOpen(false); }} className="menu-item group">
                               <span className="menu-icon-box text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300">⚙️</span> 
                               <span>Panel Admin</span>
                           </button>
                           <div className="h-px bg-border my-1 mx-2"></div>
                       </>
                   )}
                   <h4 className="text-[9px] text-text-muted font-mono uppercase tracking-widest px-2 pt-1 pb-1">MI CUENTA</h4>
                   <button onClick={() => { setIsTicketOpen(true); setIsMenuOpen(false); }} className="menu-item group">
                       <span className="menu-icon-box text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300">🎫</span> 
                       <span>Mi Ticket Navideño</span>
                   </button>
                   <button onClick={toggleTheme} className="menu-item group">
                       <span className="menu-icon-box text-pink-400 group-hover:bg-pink-500/20 group-hover:text-pink-300">
                           {theme === 'dark' ? '☀️' : '🌙'}
                       </span> 
                       <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Cyberpunk'}</span>
                   </button>
                   <button onClick={() => { setIsAvatarSelectorOpen(true); setIsMenuOpen(false); }} className="menu-item group">
                       <span className="menu-icon-box text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300">🎨</span> 
                       <span>Personalizar Avatar</span>
                   </button>
                   <div className="h-px bg-border my-1 mx-2"></div>
                   <h4 className="text-[9px] text-text-muted font-mono uppercase tracking-widest px-2 pt-1 pb-1">GRUPO</h4>
                   <button onClick={handleInvite} className="menu-item group">
                       <span className="menu-icon-box text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300">🔗</span> 
                       <span>Invitar Amigos</span>
                   </button>
                   <button onClick={() => { setSelectedGroup(null); setIsMenuOpen(false); }} className="menu-item group">
                       <span className="menu-icon-box text-slate-400 group-hover:bg-slate-500/20 group-hover:text-slate-200">🔄</span> 
                       <span>Cambiar de Grupo</span>
                   </button>
                   <div className="h-px bg-border my-1 mx-2"></div>
                   <button onClick={handleLogout} className="menu-item group hover:!bg-red-500/10 hover:!border-red-500/20">
                       <span className="menu-icon-box text-red-400 group-hover:bg-red-500/20 group-hover:text-red-300">🚪</span> 
                       <span className="group-hover:text-red-300">Cerrar Sesión</span>
                   </button>
               </div>
             </div>
           )}
        </div>
      </header>

      {/* MENÚ MÓVIL */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] animate-in fade-in duration-200" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-surface border-l border-border z-[70] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
             <div className="p-6 border-b border-border bg-surface-highlight/50 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent pointer-events-none"></div>
                <h2 className="text-xl font-bold text-text-main relative z-10 flex items-center gap-2">
                    <span className="text-2xl">🎄</span> Menú
                </h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-xl bg-background hover:bg-surface-highlight flex items-center justify-center transition-colors relative z-10 border border-border">
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                     <div className="absolute -inset-2 bg-purple-500/20 rounded-full blur-md"></div>
                     <Avatar seed={getUserAvatarSeed()} style={getUserAvatarStyle()} size="lg" className="relative" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">Cuenta Activa</p>
                  <p className="text-base text-text-main font-medium truncate">{session.user.email}</p>
                </div>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-5xl transform rotate-12 group-hover:rotate-0 transition-transform">🎁</div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Grupo Actual</p>
                <p className="text-lg text-text-main font-bold tracking-tight">{selectedGroup.name}</p>
                {isAdmin && <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 mt-2 inline-block">ADMINISTRADOR</span>}
              </div>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {isAdmin && (
                <button onClick={() => { setIsSettingsModalOpen(true); setIsMobileMenuOpen(false); }} className="menu-item group py-4">
                    <span className="menu-icon-box text-xl text-cyan-400">⚙️</span>
                    <span className="text-base">Panel Admin</span>
                </button>
              )}
              <button onClick={() => { setIsTicketOpen(true); setIsMobileMenuOpen(false); }} className="menu-item group py-4">
                  <span className="menu-icon-box text-xl text-emerald-400">🎫</span>
                  <span className="text-base">Mi Ticket Navideño</span>
              </button>
              <button onClick={toggleTheme} className="menu-item group py-4">
                  <span className="menu-icon-box text-xl text-pink-400">{theme === 'dark' ? '☀️' : '🌙'}</span>
                  <span className="text-base">{theme === 'dark' ? 'Modo Claro' : 'Modo Cyberpunk'}</span>
              </button>
              <button onClick={() => { setIsAvatarSelectorOpen(true); setIsMobileMenuOpen(false); }} className="menu-item group py-4">
                <span className="menu-icon-box text-xl text-pink-400">🎨</span>
                <span className="text-base">Personalizar Avatar</span>
              </button>
              <div className="h-px bg-border my-2"></div>
              <button onClick={() => { setSelectedGroup(null); setIsMobileMenuOpen(false); }} className="menu-item group py-4">
                <span className="menu-icon-box text-xl text-slate-400">🔄</span>
                <span className="text-base">Cambiar de Grupo</span>
              </button>
              <button onClick={handleLogout} className="menu-item group py-4 hover:!bg-red-900/20 hover:!border-red-900/30">
                <span className="menu-icon-box text-xl text-red-400">🚪</span>
                <span className="text-base group-hover:text-red-300">Cerrar Sesión</span>
              </button>
            </div>
            <div className="p-6 border-t border-border bg-surface-highlight/20">
              <p className="text-[10px] text-text-muted text-center font-mono uppercase tracking-widest">iShop Navidad v1.3 • {theme === 'dark' ? 'Cyberpunk' : 'Light'} Ed.</p>
            </div>
          </div>
        </>
      )}

      {/* HERO & STATS */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 mt-8 mb-12">
         {/* --- BROADCAST ALERT --- */}
         {selectedGroup.announcement && (
            <div className="mb-8 p-4 bg-cyan-900/10 border border-cyan-500/30 rounded-xl flex gap-4 animate-in slide-in-from-top-4 duration-500 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <div className="text-2xl animate-pulse">📢</div>
                <div>
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Mensaje del Admin</h3>
                    <p className="text-cyan-100 text-sm leading-relaxed whitespace-pre-wrap">{selectedGroup.announcement}</p>
                </div>
            </div>
         )}
         
         <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl opacity-20 group-hover:opacity-30 transition duration-500 blur-xl"></div>
          {/* USANDO EL NUEVO GLASS-PANEL (Mejora #8) */}
          <div className="relative glass-panel rounded-3xl p-8 md:p-10 overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">🎄</div>
                      <div>
                         <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-1">{selectedGroup.name}</h2>
                         <p className="text-text-muted text-sm md:text-base">Lista de deseos navideños</p>
                      </div>
                   </div>
                   <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl px-5 py-3">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Mi Progreso</p>
                      <p className="text-2xl font-bold"><span className="text-text-main">{myWishesCount}</span><span className="text-slate-600">/</span><span className="text-text-muted">10</span></p>
                   </div>
                </div>
                {/* Stats */}
                <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-text-muted">Deseos agregados</span>
                      <span className="text-sm font-bold text-purple-400">{progressPercentage.toFixed(0)}%</span>
                   </div>
                   <div className="h-3 bg-background rounded-full overflow-hidden border border-border relative">
                      {/* BARRA DE PROGRESO "VIVA" (Mejora #6) */}
                      <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-purple-500/50 relative overflow-hidden" style={{ width: `${Math.min(progressPercentage, 100)}%` }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer w-full"></div>
                      </div>
                   </div>
                </div>
                
                {/* GRID DE CARDS CON FECHA Y MICRO-INTERACCIONES (Mejora #9) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-background/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-purple-500/10 cursor-default">
                      <div className="flex items-center gap-2 mb-2"><span className="text-xl">✏️</span><span className="text-[10px] text-text-muted uppercase tracking-wider">Mis Deseos</span></div>
                      <p className="text-2xl font-bold text-text-main">{myWishesCount}</p>
                   </div>
                   <div className="bg-background/50 backdrop-blur-sm border border-pink-500/20 rounded-xl p-4 hover:border-pink-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-pink-500/10 cursor-default">
                      <div className="flex items-center gap-2 mb-2"><span className="text-xl">👥</span><span className="text-[10px] text-text-muted uppercase tracking-wider">Del Grupo</span></div>
                      <p className="text-2xl font-bold text-text-main">{othersWishesCount}</p>
                   </div>
                   <div className="bg-background/50 backdrop-blur-sm border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-orange-500/10 cursor-default">
                      <div className="flex items-center gap-2 mb-2"><span className="text-xl">🎯</span><span className="text-[10px] text-text-muted uppercase tracking-wider">Total</span></div>
                      <p className="text-2xl font-bold text-text-main">{totalWishes}</p>
                   </div>
                   
                   {/* CARD: FECHA CON URGENCIA VISUAL (Mejora #7) */}
                   <div className={`
                        relative overflow-hidden group/date rounded-xl p-4 border transition-all duration-300 hover:-translate-y-1 cursor-default
                        backdrop-blur-sm
                        ${daysLeft !== null && daysLeft <= 5 
                            ? 'bg-red-500/10 border-red-500/40 hover:border-red-500/60' 
                            : daysLeft !== null && daysLeft <= 15
                            ? 'bg-orange-500/5 border-orange-500/30 hover:border-orange-500/50'
                            : 'bg-background/50 border-blue-500/20 hover:border-blue-500/40'
                        }
                   `}>
                      {/* Efecto brillo sutil variable */}
                      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl transition-colors ${
                          daysLeft <= 5 ? 'bg-red-500/20 animate-pulse' : 'bg-blue-500/10'
                      }`}></div>
                      
                      <div className="flex items-center gap-2 mb-2 relative z-10">
                          <span className="text-xl">📅</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-wider">Evento</span>
                      </div>
                      
                      {daysLeft !== null ? (
                          <div>
                              <p className="text-2xl font-bold text-text-main leading-none">
                                  {new Date(selectedGroup.event_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </p>
                              <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${
                                  daysLeft < 0 ? 'text-red-400' 
                                  : daysLeft === 0 ? 'text-emerald-400 animate-pulse' 
                                  : daysLeft <= 5 ? 'text-red-400 font-black animate-pulse' 
                                  : daysLeft <= 15 ? 'text-orange-400' 
                                  : 'text-blue-400'
                              }`}>
                                  {daysLeft < 0 ? '¡Ya pasó!' : daysLeft === 0 ? '¡ES HOY!' : `Faltan ${daysLeft} días`}
                              </p>
                          </div>
                      ) : (
                          <div>
                              <p className="text-sm text-text-muted italic">Sin fecha</p>
                              {isAdmin && <button onClick={() => setIsSettingsModalOpen(true)} className="text-[9px] text-blue-400 hover:underline mt-1">Definir fecha</button>}
                          </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
         </div>
      </div>

      {/* Tabs y Listas */}
      <div className="max-w-4xl mx-auto px-4 mt-10 relative z-10">
        <div className="flex justify-center mb-12">
          <div className="bg-surface p-1 rounded-xl border border-border flex w-full max-w-sm relative shadow-xl">
            <button onClick={() => setActiveTab('mine')} className={`flex-1 py-3 rounded-lg text-sm md:text-base font-bold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'mine' ? 'text-white' : 'text-text-muted hover:text-text-main'}`}>
              ✏️ Mi Lista
            </button>
            <button onClick={() => setActiveTab('others')} className={`flex-1 py-3 rounded-lg text-sm md:text-base font-bold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'others' ? 'text-white' : 'text-text-muted hover:text-text-main'}`}>
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
                      <h2 className="text-2xl font-bold text-text-main">Mis Deseos</h2>
                      <span className="bg-surface text-text-muted px-3 py-1 rounded-lg text-sm font-mono border border-border">
                        {filteredWishes.length}
                      </span>
                    </div>
                    {filteredWishes.length === 0 ? (
                      <div className="border border-dashed border-border rounded-2xl p-16 text-center bg-surface/50 backdrop-blur-sm">
                         <div className="text-5xl mb-6">🤷‍♂️</div>
                         <p className="text-text-main text-lg">No has agregado deseos aún.</p>
                         <p className="text-text-muted mt-2">¡Usa el formulario de arriba!</p>
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
                    <h2 className="text-2xl font-bold text-text-main">Deseos del Grupo</h2>
                    <span className="bg-surface text-text-muted px-3 py-1 rounded-lg text-sm font-mono border border-border">
                      {filteredWishes.length}
                    </span>
                  </div>
                  {filteredWishes.length === 0 ? (
                    <div className="col-span-full text-center py-24 text-text-muted bg-surface/30 rounded-2xl backdrop-blur-sm text-lg">
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

      <GroupSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        group={selectedGroup}
        session={session}
        onUpdate={handleGroupUpdate}
        onDelete={handleGroupDelete}
      />
      
      <ShareTicketModal 
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        session={session}
        wishes={wishes}
        groupName={selectedGroup.name}
      />
      
    </div>
  );
}