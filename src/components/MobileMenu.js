
import { useState, useEffect } from 'react';
import Avatar from './Avatar';

export default function MobileMenu({ 
  isOpen, 
  onClose, 
  session, 
  selectedGroup, 
  isAdmin, 
  actions, 
  theme 
}) {
  // Estado para acordeones: guarda el ID de la sección expandida (o null)
  const [expandedSection, setExpandedSection] = useState(null);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) setExpandedSection(null);
  }, [isOpen]);

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  if (!isOpen) return null;

  const getUserAvatarSeed = () => session?.user?.user_metadata?.avatar_seed || session?.user?.email;
  const getUserAvatarStyle = () => session?.user?.user_metadata?.avatar_style || "robot";

  const MenuItem = ({ icon, label, onClick, colorClass = "text-text-main", bgColorClass = "bg-transparent", borderClass = "border-transparent" }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-lg ${bgColorClass} ${borderClass} border active:scale-[0.98] transition-all duration-150 hover:bg-white/5 text-left`}
    >
      <span className={`text-lg w-7 text-center ${colorClass}`}>{icon}</span>
      <span className="font-medium text-sm text-text-main flex-1">{label}</span>
    </button>
  );

  const AccordionItem = ({ id, icon, label, children, colorClass = "text-text-main" }) => {
    const isExpanded = expandedSection === id;
    
    return (
      <div className="overflow-hidden rounded-xl bg-surface-highlight/30 border border-white/5 transition-all duration-200">
        <button 
          onClick={() => toggleSection(id)}
          className={`w-full flex items-center gap-3 p-3 text-left transition-all duration-200 hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}
        >
          <span className={`text-lg w-7 text-center ${colorClass}`}>{icon}</span>
          <span className="font-medium text-sm text-text-main flex-1">{label}</span>
          <span className={`text-text-muted text-[10px] transition-transform duration-200 ease-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </span>
        </button>
        
        <div 
          className={`transition-all duration-200 ease-out overflow-hidden ${
            isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-2 pt-1 space-y-0.5 bg-black/10 border-t border-white/5">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Panel flotante (no full height) */}
      <div className="fixed top-16 right-4 w-[280px] max-h-[75vh] bg-surface/95 backdrop-blur-2xl border border-white/10 z-[70] shadow-2xl rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col overflow-hidden">
        
        {/* Header Compacto */}
        <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-gradient-to-r from-purple-900/20 to-transparent">
            <Avatar seed={getUserAvatarSeed()} style={getUserAvatarStyle()} size="sm" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-main truncate">{session?.user?.email.split('@')[0]}</p>
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest leading-none">Conectado</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                ✕
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            
            {/* SECCIÓN GRUPO - Más importante, siempre visible */}
            <AccordionItem id="group" icon="👥" label="Grupo" colorClass="text-purple-400">
                 <div className="px-3 py-2 mb-1">
                     <p className="text-[10px] uppercase text-text-muted mb-1 font-bold">Grupo Actual:</p>
                     <p className="text-sm font-bold text-white truncate">{selectedGroup?.name}</p>
                 </div>
                 <MenuItem 
                    icon="🔗" 
                    label="Invitar Amigos" 
                    onClick={() => { onClose(); actions.invite(); }} 
                />
                <MenuItem 
                    icon="⚖️" 
                    label="Ver Reglas" 
                    onClick={() => { onClose(); actions.openRules(); }} 
                />
                 <MenuItem 
                    icon="�" 
                    label="Cambiar de Grupo" 
                    onClick={() => { onClose(); actions.changeGroup(); }} 
                />
            </AccordionItem>

            <div className="h-px bg-white/5 my-2"></div>

            {/* ACCIONES RÁPIDAS - Sin acordeón */}
            <MenuItem 
                icon={theme === 'dark' ? '☀️' : '🌙'}
                label={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                onClick={actions.toggleTheme} 
                colorClass="text-blue-400"
            />

            <MenuItem 
                icon="🎨" 
                label="Cambiar Avatar" 
                onClick={() => { onClose(); actions.openAvatar(); }} 
                colorClass="text-pink-400"
            />

            <MenuItem 
                icon="🎫" 
                label="Mi Ticket Navideño" 
                onClick={actions.openTicket} 
                colorClass="text-emerald-400"
            />

            {/* ADMIN - Solo si es admin */}
            {isAdmin && (
                <>
                    <div className="h-px bg-white/5 my-2"></div>
                    <MenuItem 
                        icon="🛠️" 
                        label="Panel Admin" 
                        onClick={() => { onClose(); actions.openSettings(); }} 
                        colorClass="text-yellow-500"
                        bgColorClass="bg-yellow-500/5"
                    />
                </>
            )}

            <div className="h-px bg-white/5 my-2"></div>

             <MenuItem 
                icon="🐛" 
                label="Reportar Bug" 
                onClick={() => { onClose(); actions.reportBug(); }} 
                colorClass="text-orange-400 opacity-70"
            />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-red-500/5">
            <button 
                onClick={actions.logout}
                className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
                <span>🚪</span> CERRAR SESIÓN
            </button>
        </div>

      </div>
    </>
  );
}
