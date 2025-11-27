'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import Auth from '../components/Auth';
import WishForm from '../components/WishForm';
import WishList from '../components/WishList';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishes, setWishes] = useState([]);
  const [snowflakes, setSnowflakes] = useState([]);

  // --- Efecto de Nieve ---
  useEffect(() => {
    // Generar copos solo en el cliente para evitar mismatch de hidratación
    const flakes = Array.from({ length: 40 }).map((_, i) => ({
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

  // --- Lógica Supabase ---
  const fetchWishes = useCallback(async () => {
    const { data, error } = await supabase
      .from('wishes')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching wishes:', error);
    else setWishes(data || []);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
        if (session) await fetchWishes();
        setLoading(false);
      }
    }
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchWishes();
      else setWishes([]);
      setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchWishes]);

  // --- Renderizado Condicional ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-cyan-400">
        <SnowBackground />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-sm animate-pulse">Conectando con el Polo Norte...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)] relative overflow-hidden">
        <SnowBackground />
        <Auth />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] relative font-sans">
      <SnowBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-10">
        
        {/* Navbar / Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 pb-6 border-b border-slate-700/50">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
            🎄 Intercambio Cyberpunk
          </h1>
          <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
            <span className="text-xs font-mono text-purple-300 hidden md:block">
              {session.user.email}
            </span>
            <div className="h-4 w-px bg-slate-700 mx-2 hidden md:block"></div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-slate-400 hover:text-white transition-colors uppercase tracking-wider font-bold"
            >
              Salir
            </button>
          </div>
        </header>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Formulario (Sticky) */}
          <aside className="lg:col-span-4">
             <div className="lg:sticky lg:top-8 bg-slate-800/40 p-6 rounded-xl border border-slate-700 backdrop-blur-sm shadow-xl">
               <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <span className="text-purple-400">⚡</span> Agregar Deseo
               </h2>
               <WishForm 
                  session={session} 
                  onWishAdded={fetchWishes} 
                  currentWishes={wishes} 
               />
             </div>
          </aside>

          {/* Columna Derecha: Feed de Deseos */}
          <section className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🎁</span> Muro de Deseos
              </h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 shadow-inner">
                {wishes.length} ITEMS
              </span>
            </div>
            <WishList 
              wishes={wishes} 
              currentUser={session.user} 
              onDelete={fetchWishes} 
            />
          </section>
        </div>
      </div>
    </div>
  );
}