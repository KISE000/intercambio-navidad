// ThemeSelector Component - Sistema de Temas Navideños
'use client';
import { useState } from 'react';

const CHRISTMAS_THEMES = {
  cyberpunk: {
    name: 'Cyberpunk Dark',
    icon: '🌙',
    colors: { primary: '#a855f7', secondary: '#ec4899', bg: '#050505' }
  },
  santa: {
    name: 'Santa Claus',
    icon: '🎅',
    colors: { primary: '#dc2626', secondary: '#fef08a', bg: '#1a0a0a' }
  },
  tree: {
    name: 'Árbol Navideño',
    icon: '🌲',
    colors: { primary: '#059669', secondary: '#fbbf24', bg: '#064e3b' }
  },
  snow: {
    name: 'Nieve',
    icon: '❄️',
    colors: { primary: '#0ea5e9', secondary: '#e0f2fe', bg: '#f0f9ff' }
  }
};

export default function ThemeSelector({ currentTheme, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface hover:bg-surface-highlight border border-border transition-all duration-300 hover-lift text-sm font-bold"
      >
        <span className="text-xl">{CHRISTMAS_THEMES[currentTheme]?.icon || '🌙'}</span>
        <span className="hidden sm:inline">Tema</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 glass-menu rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">Temas Navideños</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CHRISTMAS_THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeChange(key);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    currentTheme === key
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-border hover:border-border-highlight bg-surface-highlight'
                  }`}
                >
                  <div className="text-3xl mb-1">{theme.icon}</div>
                  <div className="text-[10px] font-bold text-text-main">{theme.name}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
