// Tailwind design tokens (System Design v1.0 §11)
module.exports = {
  content: ['./templates/**/*.html', './static/**/*.js'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1F3864',
          light: '#2E4A7A',
          dark: '#16294A',
        },
        teal: {
          DEFAULT: '#1ABC9C',
          light: '#A3E8DA',
        },
        forest: {
          DEFAULT: '#27AE60',
          light: '#D5F5E3',
          deep: '#1A7A4A',
          dark: '#1A4F2A',
        },
        amber: {
          DEFAULT: '#F39C12',
          light: '#FEF9E7',
        },
        crimson: {
          DEFAULT: '#C0392B',
          light: '#FADBD8',
        },
        sky: {
          DEFAULT: '#2980B9',
          light: '#D6EAF8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
