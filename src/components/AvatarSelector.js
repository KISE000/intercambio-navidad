import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import Avatar from './Avatar';

export default function AvatarSelector({ isOpen, onClose, currentSession, onUpdate }) {
  const [loading, setLoading] = useState(false);
  
  // --- COLECCIÓN ESTABILIZADA ---
  // Usamos 'notionists' para todos los humanoides (Santa, Elfo, Grinch) para asegurar que carguen.
  // Usamos 'fun-emoji' para las mascotas/fantasía.
  const avatars = [
    { 
      id: 'santa', 
      name: 'Santa Claus', 
      style: 'notionists', 
      seed: 'Santa', 
      params: '' 
    },
    { 
      id: 'mrs_claus', 
      name: 'Mamá Noela', 
      style: 'notionists', 
      seed: 'Grandma',
      params: ''
    },
    { 
      id: 'elf', 
      name: 'Elfo', 
      style: 'notionists', // CAMBIO: Usamos notionists porque open-peeps fallaba
      seed: 'Kid',         // Seed 'Kid' suele dar un aspecto más joven/pequeño
      params: '' 
    },
    { 
      id: 'reindeer', 
      name: 'Reno', 
      style: 'fun-emoji', 
      seed: 'Rudolph',
      params: ''
    },
    { 
      id: 'snowman', 
      name: 'Muñeco Nieve', 
      style: 'fun-emoji', 
      seed: 'Snowman',
      params: 'backgroundColor=b6e3f4' 
    },
    { 
      id: 'grinch', 
      name: 'El Grinch', 
      style: 'notionists', // CAMBIO: Quitamos el robot
      seed: 'Grumpy',      // Seed para intentar sacar una expresión seria
      params: '' 
    },
  ];

  const handleSelect = async (avatar) => {
    setLoading(true);
    
    // 1. Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      toast.error("Sesión expirada. Recarga la página.");
      setLoading(false);
      return;
    }

    try {
      const seedWithParams = avatar.params ? `${avatar.seed}|${avatar.params}` : avatar.seed;

      // 2. Actualizar DB Pública
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          avatar_style: avatar.style,
          avatar_seed: seedWithParams 
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 3. Actualizar Localmente (Optimista)
      let updatedUser = session.user;
      try {
        const { data: authData } = await supabase.auth.updateUser({
          data: { 
            avatar_style: avatar.style, 
            avatar_seed: seedWithParams 
          }
        });
        if (authData?.user) updatedUser = authData.user;
      } catch (err) {
        console.warn("Sync warning:", err);
      }

      toast.success(`Personaje elegido: ${avatar.name}`);
      
      if (onUpdate) {
        const optimisticUser = {
          ...updatedUser,
          user_metadata: {
            ...updatedUser.user_metadata,
            avatar_style: avatar.style,
            avatar_seed: seedWithParams
          }
        };
        onUpdate(optimisticUser); 
      }
      
      onClose();

    } catch (error) {
      console.error("Error:", error);
      toast.error("No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#0f111a] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="relative z-10 text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">🎄 Elige tu Personaje</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Estilo Navideño</p>
        </div>

        <div className="grid grid-cols-3 gap-4 relative z-10">
          {avatars.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={loading}
              className="flex flex-col items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all group active:scale-95"
            >
              <div className="relative transform group-hover:-translate-y-1 transition-transform duration-300">
                <Avatar seed={option.seed} style={option.style} params={option.params} size="lg" className="shadow-lg border-2 border-transparent group-hover:border-yellow-500/50" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wide text-center leading-tight">
                {option.name}
              </span>
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full py-3.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-red-900/50 hover:text-white hover:border hover:border-red-500/30 transition-all uppercase tracking-widest"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}