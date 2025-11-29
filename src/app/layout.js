import { Inter, Space_Grotesk } from 'next/font/google' // <--- 1. IMPORTAR FUENTES
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

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning={true} className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}