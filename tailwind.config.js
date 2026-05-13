/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#1d4ed8', // Accessible, slightly lighter blue for buttons/accents
          600: '#0033A0', // Official Leoni Blue
          900: '#1e3a8a',
        },
        slate: {
          800: '#1e293b',
          400: '#94a3b8',
          100: '#f1f5f9',
        }
      },
      boxShadow: {
        'glass': '0 10px 40px -10px rgba(0,0,0,0.05)',
        'glass-hover': '0 20px 40px -10px rgba(37,99,235,0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
