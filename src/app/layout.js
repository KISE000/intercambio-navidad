import { Inter, Space_Grotesk } from 'next/font/google' 
import './globals.css'
import { Toaster } from 'sonner'

// Configuración de fuentes
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-space',
  display: 'swap',
})

export const metadata = {
  title: 'Intercambio de Navidad',
  description: 'App para compartir deseos navideños',
  icons: {
    icon: '/favicon.ico',
  },
};

// --- FIX PARA MÓVIL: BLOQUEAR ZOOM ---
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Impide que el usuario haga zoom con los dedos
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning={true} className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}