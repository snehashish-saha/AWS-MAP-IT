/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        subsea: {
          bg: '#070A12',
          panel: 'rgba(15, 20, 32, 0.72)',
          'panel-hover': 'rgba(20, 28, 44, 0.85)',
          border: 'rgba(255, 255, 255, 0.07)',
          'border-active': 'rgba(34, 227, 255, 0.35)',
          text: '#F8FAFC',
          muted: '#94A3B8',
          cyan: '#22E3FF',
          'cyan-dim': 'rgba(34, 227, 255, 0.15)',
          amber: '#FFB020',
          'amber-dim': 'rgba(255, 176, 32, 0.15)',
          purple: '#8B5CF6',
          'purple-dim': 'rgba(139, 92, 246, 0.18)',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(34, 227, 255, 0.35)',
        'glow-amber': '0 0 20px -3px rgba(255, 176, 32, 0.35)',
        'glow-purple': '0 0 20px -3px rgba(139, 92, 246, 0.35)',
      }
    },
  },
  plugins: [],
}
