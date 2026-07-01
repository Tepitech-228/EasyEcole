// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const hostname: string = window.location.hostname;
const apiBaseUrl: string = "http://" + hostname + ":3000/"
const apiUrl: string = apiBaseUrl + "api/v1"

export const environment = {
  production: false,
  API_URL: apiUrl,
  apiUrl: apiUrl,
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
  },
  MEDIAS_PATH: {
    AUTH: {
      PROFILES: apiUrl + "/auth/profiles/",
      PHOTOS: apiBaseUrl + "auth/apprenants/photos/",
      PHOTOS_ENSEIGNANTS: apiBaseUrl + "auth/apprenants/photos/",
    },
    ORIENTATION: {
      PARCOURS: apiBaseUrl + "orientation/parcours/",
      DEBOUCHES: apiBaseUrl + "orientation/debouches/",
    },
    INSCRIPTION: {
      DOSSIERS: apiBaseUrl + "inscription/dossiers/",
      BORDEREAUX: apiBaseUrl + "inscription/bordereaux/"
    }
  },
  QR_CODES_PATH: apiBaseUrl + "auth/apprenants/qr-codes/",
  QR_CODES_ENSEIGNANTS_PATH: apiBaseUrl + "auth/enseignants/qr-codes/"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
