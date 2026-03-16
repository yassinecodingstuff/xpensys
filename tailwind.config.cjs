/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        xpensys: {
          DEFAULT: '#009ddc',
          dark: '#0077a8',
          light: '#e6f4fa',
        },
        primary: {
          DEFAULT: '#009ddc',
          dark: '#0077a8',
          light: '#e6f4fa',
          50: '#e6f4fa',
          100: '#cce9f5',
          200: '#99d3eb',
          300: '#66bde1',
          400: '#33a7d7',
          500: '#009ddc',
          600: '#0077a8',
          700: '#005a7f',
          800: '#003d55',
          900: '#001f2b',
        },
      },
    },
  },
  plugins: [],
};

