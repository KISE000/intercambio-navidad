/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Habilitamos modo manual por si acaso
  theme: {
    extend: {
      colors: {
        // Mapeamos a variables CSS para cambio dinámico
        background: "var(--bg-app)",
        surface: "var(--bg-card)",
        "surface-highlight": "var(--bg-card-highlight)",
        border: "var(--border-color)",
        primary: "var(--primary)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
      },
      animation: {
        'fall': 'fall 10s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fall: {
          '0%': { transform: 'translateY(-10%)', opacity: '0' },
          '10%': { opacity: '0.5' },
          '100%': { transform: 'translateY(110vh)', opacity: '0.3' },
        }
      }
    },
  },
  plugins: [],
};