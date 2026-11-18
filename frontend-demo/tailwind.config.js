/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f4',
          100: '#fbe8e8',
          200: '#f7d5d5',
          300: '#f0b5b5',
          400: '#e58585',
          500: '#d75858',
          600: '#c03a3a', // Sen Việt Red
          700: '#a12b2b',
          800: '#862727',
          900: '#712525',
        },
      },
      minHeight: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
}
