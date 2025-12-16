
/** @type {import('tailwindcss').Config} */
export default {
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
      }
    },
  },
  plugins: [],
}
