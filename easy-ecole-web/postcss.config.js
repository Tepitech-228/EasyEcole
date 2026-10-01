/**
 * PostCSS — obligatoire pour que Tailwind produise réellement du CSS.
 *
 * ⚠️ Sans ce fichier, les directives `@tailwind base|components|utilities`
 * présentes dans src/styles.scss ne sont jamais traitées : les CSS livrés par
 * le paquet tailwindcss ne sont que des coquilles (@tailwind utilities;),
 * et l'application se retrouvait SANS AUCUNE classe utilitaire (d'où les
 * grilles cassées, les espacements absents et les graphiques dont le canvas
 * s'effondre faute de hauteur).
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
