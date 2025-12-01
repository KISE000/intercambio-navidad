import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import Avatar from './Avatar';

export default function ShareTicketModal({ isOpen, onClose, session, wishes, groupName }) {
  const [loading, setLoading] = useState(false);
  const ticketRef = useRef(null);

  if (!isOpen || !session) return null;

  // Filtrar mis deseos y tomar el top 5
  const myWishes = wishes
    .filter(w => w.user_id === session.user.id)
    .sort((a, b) => a.priority - b.priority) // Ordenar por prioridad (Alta primero)
    .slice(0, 5);

  const username = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
  const avatarStyle = session.user.user_metadata?.avatar_style || 'robot';
  const avatarSeed = session.user.user_metadata?.avatar_seed || session.user.email;

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setLoading(true);

    try {
      // Esperar un momento para asegurar renderizado de imágenes
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#0B0E14', // Fondo oscuro para evitar bordes blancos
        scale: 2, // Mejor resolución (Retina)
        logging: false,
        useCORS: true // Permitir cargar avatares externos
      });

      const image = canvas.toDataURL("image/png");
      
      // Crear link de descarga
      const link = document.createElement('a');
      link.href = image;
      link.download = `ishop-ticket-${username}.png`;
      link.click();
      
      toast.success("🎟️ Ticket generado con éxito");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al generar la imagen");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="flex flex-col gap-6 items-center w-full max-w-sm" onClick={e => e.stopPropagation()}>
        
        {/* --- EL TICKET VISUAL (Lo que se captura) --- */}
        <div ref={ticketRef} className="w-full bg-[#151923] relative overflow-hidden rounded-sm shadow-2xl border-x-4 border-dashed border-[#0B0E14]">
            
            {/* Agujero superior (efecto ticket) */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#0B0E14] rounded-full"></div>

            {/* Header Ticket */}
            <div className="p-6 pb-4 border-b-2 border-dashed border-white/10 text-center relative">
                <div className="flex justify-center mb-3">
                    <Avatar seed={avatarSeed} style={avatarStyle} size="xl" className="ring-4 ring-[#0B0E14]" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{username}</h2>
                <p className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mt-1">OPERACIÓN: {groupName || 'NAVIDAD'}</p>
            </div>

            {/* Lista de Deseos */}
            <div className="p-6 space-y-3 bg-gradient-to-b from-[#151923] to-[#0f1118]">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span>Item</span>
                    <span>Prio</span>
                </div>
                {myWishes.length > 0 ? (
                    myWishes.map((wish, i) => (
                        <div key={wish.id} className="flex justify-between items-start gap-4 text-sm font-mono border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <span className="text-slate-200 truncate flex-1">
                                <span className="text-purple-500 mr-2">0{i + 1}</span>
                                {wish.title}
                            </span>
                            <span className="text-xs">
                                {wish.priority === 1 ? '🔥' : wish.priority === 2 ? '⭐' : '🧊'}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-600 font-mono text-xs py-4">
                        [ SYSTEM EMPTY ]<br/>Sin deseos registrados
                    </div>
                )}
            </div>

            {/* Footer Ticket */}
            <div className="p-4 bg-[#0B0E14] border-t-2 border-dashed border-white/10 flex items-center justify-between">
                <div className="text-[9px] text-slate-500 font-mono leading-tight">
                    <p>ISHOP V2.0 // SECURE</p>
                    <p>{new Date().toLocaleDateString()}</p>
                </div>
                {/* Falso Código de Barras Visual */}
                <div className="h-8 flex gap-0.5 items-end opacity-50">
                    {[...Array(15)].map((_,i) => (
                        <div key={i} className="bg-white" style={{height: Math.random() * 100 + '%', width: Math.random() > 0.5 ? 2 : 4}}></div>
                    ))}
                </div>
            </div>

            {/* Agujero inferior */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#0B0E14] rounded-full"></div>
        </div>

        {/* --- CONTROLES --- */}
        <div className="flex gap-3 w-full">
            <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-xs hover:bg-white/10 transition-colors uppercase"
            >
                Cerrar
            </button>
            <button 
                onClick={handleDownload}
                disabled={loading}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs shadow-lg hover:shadow-purple-500/25 transition-all uppercase flex items-center justify-center gap-2"
            >
                {loading ? 'Procesando...' : '📸 Descargar Ticket'}
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
}