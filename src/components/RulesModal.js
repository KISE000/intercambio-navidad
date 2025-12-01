import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export default function RulesModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="glass-panel w-full max-w-md rounded-3xl overflow-hidden relative flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(139,92,246,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl text-blue-400">
                    ⚖️
                </div>
                <div>
                    <h3 className="text-xl font-bold text-text-main tracking-tight">Reglas del Juego</h3>
                    <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">PROTOCOLO NAVIDEÑO</p>
                </div>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors text-2xl leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            <div className="space-y-4">
                <div className="flex gap-4">
                    <span className="font-mono text-blue-400 font-bold text-xl">01</span>
                    <div>
                        <h4 className="font-bold text-text-main text-sm uppercase mb-1">El Compromiso</h4>
                        <p className="text-sm text-text-muted leading-relaxed">Si entras, juegas. No se vale salirse a medio camino ni dejar a tu amigo secreto sin regalo. El Grinch no está invitado.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <span className="font-mono text-purple-400 font-bold text-xl">02</span>
                    <div>
                        <h4 className="font-bold text-text-main text-sm uppercase mb-1">La Lista de Deseos</h4>
                        <p className="text-sm text-text-muted leading-relaxed">Mantén tu lista actualizada. Ayuda a quien te regala dándole opciones claras (Talla, Color, Link). ¡No seas difícil!</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <span className="font-mono text-pink-400 font-bold text-xl">03</span>
                    <div>
                        <h4 className="font-bold text-text-main text-sm uppercase mb-1">Presupuesto y Fecha</h4>
                        <p className="text-sm text-text-muted leading-relaxed">Respeta la fecha del evento y el presupuesto acordado por el grupo. Ni calcetines baratos (a menos que los pidan), ni lingotes de oro.</p>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <span className="font-mono text-yellow-400 font-bold text-xl">04</span>
                    <div>
                        <h4 className="font-bold text-text-main text-sm uppercase mb-1">El Secreto</h4>
                        <p className="text-sm text-text-muted leading-relaxed">¡Es secreto! No arruines la sorpresa revelando quién te tocó antes del día del evento.</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mt-4">
                <p className="text-xs text-blue-300 text-center font-mono">
                    "El incumplimiento de estas normas resultará en carbón." 🎅
                </p>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
            <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm bg-white/10 text-text-main hover:bg-white/20 transition-colors uppercase tracking-wide">
                Entendido
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
}