module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './templates/**/*.html',
    './frontend/**/*.{js,ts,jsx,tsx}',
    './static/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        navy: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
          dark: '#020617',
        },
        teal: {
          DEFAULT: '#14b8a6',
          light: '#5eead4',
        },
        forest: {
          DEFAULT: '#10b981',
          light: '#6ee7b7',
          deep: '#047857',
          dark: '#064e3b',
        },
        amber: {
          DEFAULT: '#f59e0b',
          light: '#fde68a',
        },
        crimson: {
          DEFAULT: '#ef4444',
          light: '#fca5a5',
        },
        sky: {
          DEFAULT: '#0ea5e9',
          light: '#7dd3fc',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-teal': '0 0 15px rgba(20, 184, 166, 0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'glow-pulse': 'glowPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .7 },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
