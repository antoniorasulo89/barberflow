/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4e7',
          100: '#fbe5c3',
          200: '#f7c98a',
          300: '#f3aa52',
          400: '#f0921e',
          500: '#d97c12',
          600: '#b8650d',
          700: '#924e0a',
          800: '#6e3907',
          900: '#4c2704',
        },
      },
    },
  },
  plugins: [],
};
