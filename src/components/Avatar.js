// Usamos etiqueta nativa <img> para evitar problemas con Next/Image
import React from 'react';

export default function Avatar({ seed, style = "notionists", params = "", alt = "Avatar", size = "md", className = "" }) {
  // Tamaños predefinidos
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 96
  };

  const pxSize = sizeMap[size] || sizeMap.md;
  
  // LÓGICA DE DESEMPAQUETADO:
  let finalSeed = seed || 'invitado';
  let finalParams = params;

  if (finalSeed && finalSeed.includes('|')) {
    const parts = finalSeed.split('|');
    finalSeed = parts[0];
    finalParams = parts[1]; 
  }

  // --- MAPA DE ESTILOS ACTUALIZADO ---
  // Si el estilo no está en la lista, usamos el valor directo (fallback)
  let collection = style;
  const styleMap = {
    'robot': 'bottts-neutral',
    'human': 'avataaars',
    'monster': 'fun-emoji',
    'pixel': 'pixel-art',
    'adventurer': 'adventurer',
    'notionists': 'notionists', // Nuevo estilo limpio
    'open-peeps': 'open-peeps',  // Nuevo estilo caricatura
    'bottts': 'bottts'          // Robots clásicos (para Grinch)
  };
  
  if (styleMap[style]) collection = styleMap[style];

  // Construcción URL
  const queryParams = finalParams ? `&${finalParams}` : '';
  const avatarUrl = `https://api.dicebear.com/9.x/${collection}/svg?seed=${encodeURIComponent(finalSeed)}${queryParams}`;

  return (
    <div 
      className={`relative overflow-hidden rounded-full bg-slate-800 border border-white/10 shadow-md shrink-0 ${className}`}
      style={{ width: pxSize, height: pxSize }}
    >
      {/* Etiqueta IMG nativa para máxima compatibilidad */}
      <img
        src={avatarUrl}
        alt={alt}
        width={pxSize}
        height={pxSize}
        className="object-cover w-full h-full"
        loading="lazy"
      />
    </div>
  );
}