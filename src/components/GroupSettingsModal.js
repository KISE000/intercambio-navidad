import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function GroupSettingsModal({ isOpen, onClose, group, onUpdate }) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (group) setName(group.name);
  }, [group]);

  if (!mounted || !isOpen || !group) return null;

  const handleUpdateName = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    
    if (!cleanName) {
        toast.error("El nombre no puede estar vacío");
        return;
    }

    if (cleanName === group.name) {
        onClose();
        return;
    }
    
    setLoading(true);

    try {
        // 1. Intentamos actualizar en Supabase
        // CRÍTICO: Usamos .select() para confirmar que la DB realmente hizo el cambio
        const { data, error } = await supabase
          .from('groups')
          .update({ name: cleanName })
          .eq('id', group.id)
          .select(); // <--- Esto nos devuelve el registro actualizado

        if (error) throw error;

        // 2. Verificación de Seguridad RLS
        // Si data está vacío, significa que la query corrió pero ninguna fila cumplió la política de seguridad
        if (!data || data.length === 0) {
            throw new Error("No tienes permisos de administrador para editar este grupo.");
        }

        // 3. Éxito confirmado
        const updatedGroup = data[0];
        toast.success('Nombre del grupo actualizado');
        
        if (onUpdate) {
            onUpdate(updatedGroup);
        }
        onClose();

    } catch (error) {
        console.error("Error updating group:", error);
        toast.error(error.message || 'Error al actualizar el grupo');
    } finally {
        setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#151923] border border-cyan-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cyberpunk */}
        <div className="bg-[#0B0E14]/50 p-6 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl text-cyan-400">
                    ⚙️
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Configuración</h3>
                    <p className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest">ADMIN PANEL v1.0</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-8">
            {/* Formulario Nombre */}
            <form onSubmit={handleUpdateName} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-2">
                        Nombre del Grupo
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder-slate-600"
                            placeholder="Ej: Familia Pérez"
                            autoFocus
                        />
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={loading || name === group.name || !name.trim()}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </form>

            {/* Sección Informativa (Código) */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400 text-lg">🔒</span>
                    <h4 className="text-sm font-bold text-blue-100">Seguridad de Acceso</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                    El código de invitación actual es <span className="font-mono text-white bg-white/10 px-1 rounded select-all">{group.code}</span>. 
                    Compártelo solo con personas de confianza.
                </p>
            </div>

            {/* Zona de Peligro (Visual por ahora) */}
            <div className="pt-4 border-t border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                 <button className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Eliminar Grupo (Contactar Soporte)
                 </button>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
}