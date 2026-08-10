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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 4px 30px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
