/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6D28D9',
          dark: '#4C1D95',
          light: '#EDE9FE',
        },
        gold: '#F59E0B',
        page: '#F4F4F6',
      },
    },
  },
  plugins: [],
  presets: [require('nativewind/preset')],
};
