import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import Avatar from './Avatar';

export default function GroupMembersModal({ isOpen, onClose, groupId, currentUserSession }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amIAdmin, setAmIAdmin] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      fetchMembers();
    }
  }, [isOpen, groupId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // 🛑 OPTIMIZACIÓN: Se usa un solo SELECT con join para obtener miembros Y perfiles (JOIN implícito)
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        // Se seleccionan datos de group_members y todos los datos de profiles relacionados
        .select('user_id, role, profiles(id, username, avatar_style, avatar_seed)')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setMembers([]);
        return;
      }
      
      const myId = currentUserSession?.user?.id;
      const myMembership = membersData.find(m => m.user_id === myId);
      
      // Detección de Admin
      if (myMembership && myMembership.role === 'admin') {
        setAmIAdmin(true);
      } else {
        setAmIAdmin(false);
      }

      // 🛑 Nota: Ya no se necesita el paso 2 (fetch profiles) ni el paso 3 (join manual)

      // Ordenar: Admins primero
      membersData.sort((a, b) => (a.role === 'admin' ? -1 : 1));

      setMembers(membersData);

    } catch (error) {
      console.error("Error cargando miembros:", error);
      toast.error("Error al cargar la lista.");
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (memberId, memberName) => {
    if (!window.confirm(`⚠️ ¿Confirmar expulsión de ${memberName}?`)) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('user_id', memberId)
        .eq('group_id', groupId);

      if (error) throw error;

      toast.success(`${memberName} eliminado del grupo.`);
      setMembers(prev => prev.filter(m => m.user_id !== memberId));
    } catch (error) {
      console.error("Error kicking:", error);
      toast.error("No tienes permisos o ocurrió un error.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#0f111a] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              👥 Miembros del Grupo
            </h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              {members.length} Integrantes Totales
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors">✕</button>
        </div>

        {/* Lista Scrollable */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {loading ? (
            <p className="text-center text-slate-500 py-10 animate-pulse">Cargando lista...</p>
          ) : (
            members.map((member) => {
              const profile = member.profiles || {};
              const name = profile.username || 'Agente Anónimo';
              const isMe = member.user_id === currentUserSession?.user?.id;
              const isAdminRole = member.role === 'admin';

              return (
                <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl bg-[#151923] border border-white/5 hover:border-purple-500/20 transition-colors group">
                  
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar 
                      seed={profile.avatar_seed || member.user_id} 
                      style={profile.avatar_style} 
                      size="md" 
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isMe ? 'text-purple-400' : 'text-slate-200'}`}>
                        {name} {isMe && '(Tú)'}
                      </p>
                      <div className="flex items-center gap-2">
                        {/* Username o ID corto */}
                        <span className="text-[10px] text-slate-500 truncate">
                          @{profile.username || 'usuario'}
                        </span>
                        {isAdminRole && (
                          <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 uppercase font-bold tracking-wider">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón de Expulsar: Visible solo si YO soy admin y el objetivo NO soy yo */}
                  {amIAdmin && !isMe && (
                    <button
                      onClick={() => handleKick(member.user_id, name)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Eliminar usuario"
                    >
                      🚫
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600">Gestión de acceso reservada para administradores.</p>
        </div>

      </div>
    </div>
  );
}