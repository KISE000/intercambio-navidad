import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Intercambio de Navidad',
  description: 'App para compartir deseos navideños',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body suppressHydrationWarning={true}>
        {children}
        {/* Notificaciones Toast Globales (Estilo Cyberpunk) */}
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}