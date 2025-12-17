
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./{components,services,src}/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        tumbi: {
          50: '#f0f7f7',
          100: '#ddeff0',
          200: '#c2e0e2',
          300: '#9cceda',
          400: '#70b8c8',
          500: '#52a1b6',
          600: '#40879c',
          700: '#366e82',
          800: '#305b6b',
          900: '#2b4f5b',
          950: '#1a323c',
        },
        dark: {
          bg: '#1a1a1a', // Main background
          card: '#2c2c2c', // Card background
          border: '#3a3a3a', // Border color
          text: '#e0e0e0', // Primary text
          subtext: '#a0a0a0', // Secondary text
        }
      }
    },
  },
  plugins: [],
}
