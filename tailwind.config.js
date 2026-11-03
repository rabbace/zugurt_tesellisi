/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6D28D9',
          dark: '#4C1D95',
          light: '#EDE9FE',
        },
        gold: '#F59E0B',
        page: token('page'),
        card: token('card'),
        sunken: token('sunken'),
        ink: token('ink'),
        soft: token('soft'),
        muted: token('muted'),
        line: token('line'),
        link: token('link'),
        chip: token('chip'),
      },
      fontSize: {
        '2xs': ['12px', '16px'],
        xs: ['14px', '20px'],
        sm: ['16px', '22px'],
        base: ['18px', '25px'],
        lg: ['20px', '28px'],
        xl: ['23px', '30px'],
        '2xl': ['27px', '34px'],
        '3xl': ['34px', '40px'],
        '4xl': ['40px', '46px'],
        '5xl': ['52px', '58px'],
        '6xl': ['64px', '70px'],
      },
    },
  },
  plugins: [],
  presets: [require('nativewind/preset')],
};
