const defaultTheme = require('tailwindcss/defaultTheme')

/**
 * ⚠️ TAILWIND v2 — la purge se configure via `purge`, PAS via `content`.
 * `content` est la syntaxe v3 : en v2 elle est silencieusement ignorée, ce qui
 * fait que le fichier paraissait configuré alors qu'aucune classe n'était
 * purgée. Le safelist vit également sous `purge.options` en v2.
 */
module.exports = {
  // Chemins analysés pour déterminer les classes réellement utilisées.
  purge: {
    content: [
      './src/**/*.{html,ts,scss}',
    ],
    options: {
      safelist: [
        // ⚠️ v2 : motif regex NUE. La forme { pattern: /.../ } est propre à
        // Tailwind v3 et fait planter purgecss 4.x ("t.test is not a function").
        // Couleurs dynamiques pour app-custom-button et dossier-view.
        /(bg|text|ring|border|hover:bg|hover:text|focus:ring)-(primary|secondary|green|red|indigo|blue|gray|amber|emerald|orange|violet|rose|yellow|white|black)-(50|100|200|300|400|500|600|700|800|900|950)/,
        // Classes utilitaires construites dynamiquement
        'shadow-sm',
        'shadow-md',
        'w-9',
        'px-3',
        'opacity-100',
        'opacity-50',
      ],
    },
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        // 'sans': ['Roboto, "Helvetica Neue", sans-serif'],
        sans: ['Inter', 'sans-serif'],
        // sans: ['Inter', ...defaultTheme.fontFamily.sans'],
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
