/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        mist: '#EDF1F7',
        ink: {
          50: '#F3F6FB', 100: '#E7ECF4', 200: '#D2DAE7', 300: '#B0BBCD', 400: '#8693AA',
          500: '#5F6E89', 600: '#46546E', 700: '#2E3C57', 800: '#1B2944', 900: '#0E1B33',
        },
        tenger: {
          50: '#EEF4FF', 100: '#DDE9FF', 200: '#BBD2FF', 300: '#8CB2FA', 400: '#5C90F3',
          500: '#3A74E8', 600: '#1D5BD8', 700: '#1749B0', 800: '#123A8F', 900: '#0E2C6E',
        },
        saffron: { DEFAULT: '#F4B63F', soft: '#FDF0D2', deep: '#7A4F00' },
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
}
