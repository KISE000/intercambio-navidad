// BottomSheet Component para formularios móviles
'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-6 pb-4 border-b border-border">
            <h2 className="text-xl font-bold text-text-main">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[70vh] p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
