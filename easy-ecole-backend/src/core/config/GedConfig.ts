import path from "path";

/**
 * Configuration centralisée du module GED.
 * Tous les chemins doivent être relatifs à la racine du projet (process.cwd()).
 */
export const GED_CONFIG = {
  /** Répertoire de stockage des fichiers GED (relatif à process.cwd()) */
  UPLOAD_DIR: "public/ged",

  /** Répertoire des fichiers de démonstration / seed */
  SEED_DIR: "public/ged",

  /** Alias pour UPLOAD_DIR (utilisé par ArchiveGedService) */
  STORAGE_DIR: "public/ged",

  /** Répertoire de l'archivage déporté (backup) */
  ARCHIVE_DIR: "public/ged/archive",

  /** Taille maximale des fichiers uploadés (3 Go) */
  MAX_FILE_SIZE: 3 * 1024 * 1024 * 1024,

  /** Types MIME acceptés */
  ACCEPTED_MIMES: ['application/pdf', 'image/tiff', 'image/x-tiff'],

  /** Obtenir le chemin absolu d'un fichier dans le répertoire GED */
  resolvePath(...segments: string[]): string {
    return path.resolve(process.cwd(), GED_CONFIG.UPLOAD_DIR, ...segments);
  },
} as const;

export default GED_CONFIG;
