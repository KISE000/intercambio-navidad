import './globals.css'

export const metadata = {
  title: 'Intercambio de Navidad',
  description: 'App para compartir deseos navideños',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}