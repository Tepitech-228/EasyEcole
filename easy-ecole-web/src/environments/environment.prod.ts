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
    COURS: apiUrl + 'cours',
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
      DOSSIERS: apiBaseUrl + "inscription/dossiers/"
    }
  }
};
