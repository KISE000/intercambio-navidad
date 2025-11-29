/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com', // Avatares Robots
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Imágenes subidas por usuarios
      }
    ],
    dangerouslyAllowSVG: true, // Necesario para los SVGs de DiceBear
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;