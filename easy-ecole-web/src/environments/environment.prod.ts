const hostname: string = window.location.hostname;
const apiBaseUrl: string = "https://" + hostname + ":3000/"
const apiUrl: string = "https://" + hostname + ":3000/api/v1"

export const environment = {
  production: true,

  /** URL de base de l'API (utilis�e par l'HttpInterceptor pour pr�fixer toutes les requ�tes) */
  apiUrl: apiUrl,

  /** Alias conserv� pour r�trocompatibilit� */
  API_URL: apiUrl,

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
      PROFILES: apiBaseUrl + "auth/profiles/",
      PHOTOS: apiBaseUrl + "auth/apprenants/photos/",
      PHOTOS_ENSEIGNANTS: apiBaseUrl + "auth/enseignants/photos/",
    },
    ORIENTATION: {
      PARCOURS: apiUrl + "/orientation/parcours/",
      DEBOUCHES: apiUrl + "/orientation/debouches/",
    },
    INSCRIPTION: {
      DOSSIERS: apiUrl + "/inscription/dossiers/",
      BORDEREAUX: apiUrl + "/inscription/bordereaux/"
    }
  },
  QR_CODES_PATH: apiUrl + "/auth/apprenants/qr-codes/",
  QR_CODES_ENSEIGNANTS_PATH: apiUrl + "/auth/enseignants/qr-codes/"
};