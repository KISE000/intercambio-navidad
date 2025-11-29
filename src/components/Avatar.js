import Image from 'next/image';

export default function Avatar({ seed, style = "robot", alt = "Avatar", size = "md", className = "" }) {
  // Tamaños predefinidos
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 96
  };

  const pxSize = sizeMap[size] || sizeMap.md;
  
  // Mapeo de estilos amigables a colecciones de DiceBear
  // 'robot' -> bottts-neutral (Cyberpunk default)
  // 'elf' -> adventurer (Estilo RPG/Fantasía para Santa/Elfos)
  // 'monster' -> fun-emoji (Para el Grinch)
  // 'pixel' -> pixel-art (Retro gaming)
  const styleMap = {
    'robot': 'bottts-neutral',     
    'elf': 'adventurer',           
    'monster': 'fun-emoji',        
    'pixel': 'pixel-art',          
  };

  // Determinamos la colección final. Si el estilo no está en el mapa, usamos el default.
  const collection = styleMap[style] || 'bottts-neutral';

  // URL Determinista
  const avatarUrl = `https://api.dicebear.com/9.x/${collection}/svg?seed=${encodeURIComponent(seed || 'invitado')}`;

  return (
    <div 
      className={`relative overflow-hidden rounded-full bg-black/50 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)] shrink-0 ${className}`}
      style={{ width: pxSize, height: pxSize }}
    >
      <Image
        src={avatarUrl}
        alt={alt}
        width={pxSize}
        height={pxSize}
        className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
      />
      {/* Efecto de brillo (Glassmorphism) */}
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 pointer-events-none"></div>
    </div>
  );
}