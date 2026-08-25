// Stratégie réseau (déploiement Docker) :
//   - L'application est servie par nginx (port 80) qui PROXY les appels
//     /api/ -> backend:3000 et /media/ -> backend:3000 (voir nginx.conf).
//   - API et médias sont donc en MÊME ORIGINE que le site : plus besoin du
//     port 3000 exposé, ni de CORS en cross-origin.
//   - Alternative (documentée dans GUIDE-DEPLOIEMENT.md) : URL absolue
//     https://<serveur>:3000 avec le port 3000 exposé + certificats SSL.
const hostname: string = window.location.hostname;
const apiBaseUrl: string = window.location.protocol + "//" + hostname + "/"
const apiUrl: string = apiBaseUrl + "api/v1"

export const environment = {
  production: true,

  /** URL de base de l'API (utilis�e par l'HttpInterceptor pour pr�fixer toutes les requ�tes) */
  apiUrl: apiUrl,

  /** Alias conserv� pour r�trocompatibilit� */
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
    BOURSE: apiUrl + '/bourses',
  },
  MEDIAS_PATH: {
    AUTH: {
      // Correspondance avec les routes statiques du backend (src/app.ts) :
      //   /media/profiles            -> public/auth/profiles
      //   /media/photos/apprenants   -> public/auth/apprenants/photos
      //   /media/photos/enseignants  -> public/auth/enseignants/photos
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