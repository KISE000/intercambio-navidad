import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import Avatar from './Avatar';

export default function AvatarSelector({ isOpen, onClose, currentSession, onUpdate }) {
  const [loading, setLoading] = useState(false);
  
  // Opciones predefinidas de Navidad + Cyberpunk
  const avatars = [
    { id: 'robot', name: 'Cyber Unit', style: 'robot', seed: currentSession?.user?.email },
    { id: 'santa', name: 'Santa Bot', style: 'elf', seed: 'SantaClaus' }, // Seed fija para que siempre salga Santa
    { id: 'elf', name: 'Elfo Nocturno', style: 'elf', seed: 'Elf_' + currentSession?.user?.email },
    { id: 'grinch', name: 'Grinch', style: 'monster', seed: 'Grinch' },
    { id: 'pixel', name: '8-Bit Xmas', style: 'pixel', seed: currentSession?.user?.email },
    { id: 'reindeer', name: 'Reno', style: 'elf', seed: 'Rudolph' },
  ];

  const handleSelect = async (avatar) => {
    setLoading(true);
    try {
      // Guardamos la preferencia en los metadatos del usuario de Supabase
      // Esto persiste la elección sin necesitar nuevas tablas
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          avatar_style: avatar.style,
          avatar_seed: avatar.seed 
        }
      });

      if (error) throw error;

      toast.success(`Identidad cambiada a: ${avatar.name}`);
      
      // Actualizamos el estado local en la página padre para ver el cambio instantáneo
      if (onUpdate && data.user) {
        onUpdate(data.user); 
      }
      
      onClose();
    } catch (error) {
      toast.error("Error al cambiar avatar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#0f111a] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Decoración Navideña Sutil de Fondo */}
        <div className="absolute top-0 right-0 p-20 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 p-20 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2 relative z-10">🎭 Máscara Digital</h3>
        <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider relative z-10">Elige tu apariencia festiva</p>

        <div className="grid grid-cols-3 gap-3 relative z-10">
          {avatars.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={loading}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all group active:scale-95"
            >
              <div className="relative transform group-hover:-translate-y-1 transition-transform duration-300">
                <Avatar seed={option.seed} style={option.style} size="lg" className="shadow-lg" />
              </div>
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wide text-center">
                {option.name}
              </span>
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700 transition-colors uppercase tracking-widest"
        >
          Cancelar Operación
        </button>
      </div>
    </div>
  );
}