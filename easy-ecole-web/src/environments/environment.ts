// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const hostname: string = window.location.hostname;
const apiBaseUrl: string = "http://" + hostname + ":3000/"
const apiUrl: string = apiBaseUrl + "api/v1"

export const environment = {
  production: false,

  /** URL de base de l'API (utilisée par l'HttpInterceptor pour préfixer toutes les requêtes) */
  apiUrl: apiUrl,

  /** Alias conservé pour rétrocompatibilité */
  API_URL: apiUrl,

  /** URL racine du serveur (sans /api/v1) — pour les fichiers statiques servis par Express */
  API_BASE_URL: apiBaseUrl,

  /** Configuration des endpoints par module */
  API_MODULES: {
    AUTH: apiUrl + '/auth',
    ORIENTATION: apiUrl + '/orientation',
    INSCRIPTION: apiUrl + '/inscription',
    COMPTABILITE: apiUrl + '/comptabilite',
    COURS: apiUrl + '/cours',
    IMMOBILISATIONS: apiUrl + '/immobilisations',
    STOCKS: apiUrl + '/stocks',
    STAGES: apiUrl + '/stages',
    SCOLARITE: apiUrl + '/scolarite',
    ELEARNING: apiUrl + '/elearning',
    COMMUNICATION: apiUrl + '/communication',
    RH: apiUrl + '/rh',
    ACHATS: apiUrl + '/achats',
    REPORTING: apiUrl + '/reporting',
    GED: apiUrl + '/ged',
  },
  MEDIAS_PATH: {
    AUTH: {
      PROFILES: apiBaseUrl + "media/profiles/",
      PHOTOS: apiBaseUrl + "media/photos/apprenants/",
      PHOTOS_ENSEIGNANTS: apiBaseUrl + "media/photos/enseignants/",
    },
    ORIENTATION: {
      PARCOURS: apiUrl + "/orientation/parcours/",
      DEBOUCHES: apiUrl + "/orientation/debouches/",
    },
    INSCRIPTION: {
      DOSSIERS: apiUrl + "/inscription/dossiers/",
      BORDEREAUX: apiUrl + "/inscription/bordereaux/",
      SIGNATURES: apiBaseUrl + "inscription/presences/signatures/"
    }
  },
  QR_CODES_PATH: apiUrl + "/auth/apprenants/qr-codes/",
  QR_CODES_ENSEIGNANTS_PATH: apiUrl + "/auth/enseignants/qr-codes/",
  QR_CODE_VERIFIER_PATH: apiUrl + "/inscription/cartes/verifier/"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
