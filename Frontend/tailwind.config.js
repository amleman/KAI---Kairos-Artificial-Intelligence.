/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          purple: '#E8DFF5',
          pink: '#FDE2E4',
          blue: '#DFEEF3',
          yellow: '#FFF9E6',
          green: '#E4F5E4',
        },
        'soft-blue': '#DFEEF3', // Reverted to soft pastel blue
      },
      boxShadow: {
        'inner': 'inset 0 1px 2px 0 rgba(223, 238, 243, 0.4)', // Subtle inner shadow
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}