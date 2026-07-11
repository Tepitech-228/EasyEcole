const hostname: string = window.location.hostname;
const apiBaseUrl: string = "http://" + hostname + ":3000/"
const apiUrl: string = "http://" + hostname + ":3000/api/v1"

export const environment = {
  production: true,
  API_URL: apiUrl,
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
      PROFILES: apiUrl + "auth/profiles/",
      PHOTOS: apiBaseUrl + "auth/apprenants/photos/"
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
