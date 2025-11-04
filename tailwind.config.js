/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0072BC',   // Lighter Blue from logo
        'brand-secondary': '#F58220', // Orange from logo
        'brand-light': '#F3F7FA',     // A very light off-white/blue
        'brand-dark': '#202A5B',      // Dark blue from logo background
        'success': '#00A99D',      // Teal from logo
        'warning': '#F58220',      // Orange from logo
        'danger': '#dc3545',       // Standard red
      },
    },
  },
  plugins: [],
}
