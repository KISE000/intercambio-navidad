/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-app)",
        card: "var(--bg-card)", 
        primary: "var(--primary)",
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