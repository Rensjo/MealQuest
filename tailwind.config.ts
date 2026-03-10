/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        'xs':   ['13px', { lineHeight: '1.5' }],
        'sm':   ['15px', { lineHeight: '1.5' }],
        'base': ['17px', { lineHeight: '1.6' }],
        'lg':   ['19px', { lineHeight: '1.5' }],
        'xl':   ['22px', { lineHeight: '1.4' }],
        '2xl':  ['26px', { lineHeight: '1.3' }],
        '3xl':  ['32px', { lineHeight: '1.2' }],
        '4xl':  ['40px', { lineHeight: '1.1' }],
      },
      colors: {
        brand: {
          DEFAULT: '#E6B75F',
          50: '#FFF8E7',
          100: '#FFE9B5',
          200: '#FFD978',
          300: '#E6B75F',
          400: '#D4A84E',
          500: '#E6B75F',
          600: '#C49A3D',
          700: '#A67C2E',
          800: '#885E1F',
          900: '#6A4010',
        },
        surface: {
          DEFAULT: '#1E1E1E',
          50: '#2A2A2A',
          100: '#242424',
          200: '#1E1E1E',
          300: '#181818',
          400: '#141414',
        },
        neon: {
          gold: '#FFD978',
          glow: '#FFE9B5',
          success: '#4ADE80',
          danger: '#F87171',
          info: '#60A5FA',
          warning: '#FBBF24',
          energy: '#A78BFA',
        },
      },
      animation: {
        'shimmer': 'shimmer 3s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'xp-fill': 'xp-fill 1s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(230, 183, 95, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(230, 183, 95, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'xp-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--xp-width)' },
        },
      },
      boxShadow: {
        'neon': '0 0 10px rgba(230, 183, 95, 0.3), 0 0 20px rgba(230, 183, 95, 0.1)',
        'neon-strong': '0 0 15px rgba(230, 183, 95, 0.5), 0 0 30px rgba(230, 183, 95, 0.2)',
        'neon-success': '0 0 10px rgba(74, 222, 128, 0.3)',
        'neon-danger': '0 0 10px rgba(248, 113, 113, 0.3)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.scrollbar-thin': { 'scrollbar-width': 'thin' },
        '.scrollbar-track-transparent': { 'scrollbar-color': '#404040 transparent' },
        '.scrollbar-thumb-neutral-700': { 'scrollbar-color': '#404040 transparent' },
      })
    },
  ],
}
