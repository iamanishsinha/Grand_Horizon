/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B132B',
          800: '#1C2541',
          700: '#2A3656',
          600: '#3A506B'
        },
        gold: {
          400: '#F3C969',
          500: '#D4AF37',
          600: '#AA820A'
        },
        cream: {
          50: '#FDFBF7',
          100: '#F9F6F0',
          200: '#F0ECE1'
        }
      }
    },
  },
  plugins: [],
}
