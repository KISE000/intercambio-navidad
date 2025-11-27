export const metadata = {
  title: 'Intercambio de Navidad',
  description: 'App para compartir deseos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}