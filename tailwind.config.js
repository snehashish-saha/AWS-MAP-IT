/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orbital: {
          bg: '#070B12',
          surface: '#0D1420',
          elevated: '#121D2B',
          border: '#1C2A3A',
          text: '#EDF4F7',
          muted: '#92A3B3',
          teal: '#62E8D0',
          weather: '#75B9FF',
          amber: '#FFB45C',
          coral: '#FF6D6D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
