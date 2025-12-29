/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',  
        secondary: '#4b5563', 
        accent: '#D4AF37',   
        'accent-dark': '#b5952f', 
        'light-bg': '#FDFDFD', 
      },
      fontFamily: {
        sans: ['Almarai', 'sans-serif'],
      },
    },
  },
  plugins: [],
}