const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  purge: [],
  darkMode: false, // or 'media' or 'class'
  safelist: [
    // Couleurs dynamiques pour app-custom-button et dossier-view
    {
      pattern: /(bg|text|ring|border|hover:bg|hover:text|focus:ring)-(primary|secondary|green|red|indigo|blue|gray|amber|emerald|orange|violet|rose|yellow|white|black)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    // Classes utilitaires dynamiques
    'shadow-sm',
    'shadow-md',
    'w-9',
    'px-3',
    'opacity-100',
    'opacity-50',
  ],
  theme: {
    extend: {
      fontFamily: {
        // 'sans': ['Roboto, "Helvetica Neue", sans-serif'],
        sans: ['Inter', 'sans-serif'],
        // sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        'title': '18px'
      },
      colors: {
        // 'primary': '#1F3C75',
        'primary': {  DEFAULT: '#1F3C75',  50: '#D3DEF3',  100: '#C3D2EF',  200: '#A2B9E6',  300: '#82A1DE',  400: '#6289D5',  500: '#4271CD',  600: '#305DB6',  700: '#284D95',  800: '#1F3C75',  900: '#132549',  950: '#0D1A32'},
        'secondary': '#737373',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
  ],
}
