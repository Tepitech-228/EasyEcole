import fs from 'fs';
import path from 'path';
import {
  currentAcademicYear,
  resolveStoredDocumentPath,
  saveDocument,
  type SavedDocument,
} from './DocumentStorageService';

/**
 * Stockage unifie des fichiers GED.
 *
 * Les fichiers recus sont d'abord ecrits par multer dans un dossier de staging
 * (storage/tmp/ged), puis deplaces dans :
 *   documents/uploads/<annee-academique>/ged/<sous-type>/<fichier>
 *
 * Les fichiers generes par l'application (exports PDF, versions) sont ecrits
 * dans :
 *   documents/created/<annee-academique>/ged/<sous-type>/<fichier>
 *
 * L'ancien repertoire public/ged reste lisible pour les fichiers historiques.
 */

export const GED_LEGACY_DIR = path.resolve(process.cwd(), 'public', 'ged');

export function getGedStagingDir(): string {
  return path.resolve(
    process.env.GED_STAGING_DIR ||
      path.join(process.cwd(), 'storage', 'tmp', 'ged')
  );
}

export function ensureGedStagingDir(): string {
  const dir = getGedStagingDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function resolveAcademicYearLabel(
  anneeAcademiqueId?: number | null
): Promise<string> {
  if (!anneeAcademiqueId) return currentAcademicYear();
  try {
    const { AnneeAcademique } = require('../../modules/inscription/models/AnneeAcademique') as typeof import('../../modules/inscription/models/AnneeAcademique');
    const annee = await AnneeAcademique.findByPk(anneeAcademiqueId, {
      attributes: ['libelle'],
    });
    return (annee as any)?.libelle || currentAcademicYear();
  } catch {
    return currentAcademicYear();
  }
}

function buildSubcategory(
  folderId?: number | string | null,
  subcategory?: string | null
): string {
  if (subcategory && String(subcategory).trim()) {
    return String(subcategory).trim();
  }
  return folderId ? `dossier_${folderId}` : 'documents';
}

/** Resout un fichier GED : nouveau chemin documents/ ou ancien public/ged/. */
export function resolveGedPath(
  storedPath: string | null | undefined
): string | null {
  return resolveStoredDocumentPath(storedPath, [GED_LEGACY_DIR]);
}

export interface GedUploadedFileLike {
  path: string;
  filename?: string;
  originalname?: string;
  size?: number;
}

export interface GedSaveOptions {
  folderId?: number | string | null;
  anneeAcademiqueId?: number | null;
  subcategory?: string | null;
  fileName?: string;
}

/** Deplace un fichier recu (staging multer) vers le stockage unifie. */
export async function saveGedUpload(
  file: GedUploadedFileLike,
  options: GedSaveOptions = {}
): Promise<SavedDocument> {
  const buffer = fs.readFileSync(file.path);
  const academicYear = await resolveAcademicYearLabel(options.anneeAcademiqueId);
  const saved = saveDocument(buffer, {
    origin: 'uploads',
    academicYear,
    category: 'ged',
    subcategory: buildSubcategory(options.folderId, options.subcategory),
    fileName: options.fileName || file.filename || file.originalname || `ged_${Date.now()}`,
  });
  try {
    fs.unlinkSync(file.path);
  } catch {
    // fichier de staging deja absent
  }
  return saved;
}

/** Ecrit un fichier genere par l'application dans le stockage unifie. */
export async function saveGedGenerated(
  content: Buffer | string,
  fileName: string,
  options: GedSaveOptions = {}
): Promise<SavedDocument> {
  const academicYear = await resolveAcademicYearLabel(options.anneeAcademiqueId);
  return saveDocument(content, {
    origin: 'created',
    academicYear,
    category: 'ged',
    subcategory: buildSubcategory(options.folderId, options.subcategory),
    fileName,
  });
}

export function deleteStagedFile(filePath?: string | null): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // suppression best-effort
  }
}
