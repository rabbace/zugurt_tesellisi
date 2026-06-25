/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zugurt: {
          gold: '#FFD700',
          dark: '#0F0F1A',
          panel: '#1C1B29',
          accent: '#FF5DA2',
          success: '#22C55E',
        },
      },
    },
  },
  plugins: [],
};
