/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#040711',
          900: '#070A13',
          850: '#0B1120',
          800: '#0F172A',
          750: '#17223B',
          700: '#1E293B',
          600: '#334155',
          accent: '#6366F1',
          cyan: '#06B6D4',
          emerald: '#10B981',
          purple: '#8B5CF6'
        }
      }
    },
  },
  plugins: [],
}
