/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'uts-green': '#1A6732',
        'uts-gold': '#FDBE33',
        'uts-dark-bg': '#1E1F21',
        'uts-dark-card': '#2A2B2D',
        'ok-green': '#4ADE80',
        'warning-orange': '#FB923C',
        'error-red': '#F87171',
      },
      borderRadius: {
        'uts-card': '1rem',
      },
      boxShadow: {
        'uts-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
        'uts-glow': '0 0 15px -3px rgba(26, 103, 50, 0.3)',
      }
    },
  },
  plugins: [],
}