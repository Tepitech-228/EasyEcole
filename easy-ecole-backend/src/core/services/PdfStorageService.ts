import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  currentAcademicYear,
  getDocumentPath,
  getDocumentsRoot,
  saveDocument,
} from './DocumentStorageService';

/**
 * Stockage des PDF generes.
 *
 * Les nouveaux fichiers sont ecrits dans :
 *   documents/created/<annee-academique>/<type>/<sous-type?>/<fichier>.pdf
 *
 * L'ancien emplacement (storage/documents/<annee>/<mois>/<type>/) reste lisible
 * pour les fichiers deja existants, mais n'est plus utilise en ecriture.
 */

const TMP_DIR =
  process.env.TMP_DIR ||
  (process.env.NODE_ENV === 'production'
    ? '/tmp/easyecole'
    : path.join(process.cwd(), 'storage', 'tmp'));

const LEGACY_DOCUMENTS_DIR =
  process.env.DOCUMENTS_LEGACY_DIR ||
  (process.env.NODE_ENV === 'production'
    ? '/data/documents'
    : path.join(process.cwd(), 'storage', 'documents'));

export interface SavedPdf {
  relativePath: string;
  fileName: string;
  absolutePath: string;
  relativePathFromCwd: string;
  size: number;
  sha256: string;
}

export interface SavePdfOptions {
  fileName?: string;
  type?: string;
  subcategory?: string;
  academicYear?: string;
  originalName?: string;
  date?: Date;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFileName(raw: string): string {
  const base = path.basename(String(raw).trim());
  const safe = base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '');
  if (!safe) {
    throw new Error('Nom de fichier PDF invalide.');
  }
  return safe;
}

export function sanitizePdfFileName(raw: string, prefix?: string): string {
  let name = sanitizeFileName(raw);
  if (!name.toLowerCase().endsWith('.pdf')) {
    name = name + '.pdf';
  }
  if (prefix) {
    const safePrefix = prefix.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '');
    if (safePrefix) {
      name = safePrefix + '_' + name;
    }
  }
  return name;
}

/**
 * Resout un chemin de lecture.
 * - Les chemins commencant par uploads/ ou created/ sont resolus dans la
 *   nouvelle racine documentaire.
 * - Les anciens chemins (annee/mois/type/fichier) sont cherches dans l'ancien
 *   repertoire puis dans la nouvelle racine, pour ne pas casser les PDF deja
 *   generes.
 */
function resolveSafePath(relativePath: string): string {
  const normalized = String(relativePath ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  if (normalized.startsWith('uploads/') || normalized.startsWith('created/')) {
    return getDocumentPath(normalized);
  }

  const candidates = [
    path.resolve(getDocumentsRoot(), normalized),
    path.resolve(LEGACY_DOCUMENTS_DIR, normalized),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

/**
 * Ecrit un PDF genere dans documents/created/<annee>/<type>/<sous-type?>/.
 * Si academicYear n'est pas fourni, l'annee academique courante est utilisee.
 */
export function savePdf(
  content: Buffer | string,
  options: SavePdfOptions = {}
): SavedPdf {
  const type = options.type || 'divers';
  const baseName =
    options.fileName ||
    options.originalName ||
    'document_' + Date.now() + '.pdf';
  const safeName = sanitizePdfFileName(baseName);

  const academicYear =
    options.academicYear ||
    (options.date ? currentAcademicYear(options.date) : undefined);

  const saved = saveDocument(content, {
    origin: 'created',
    academicYear,
    category: type,
    subcategory: options.subcategory,
    fileName: safeName,
  });

  return {
    relativePath: saved.relativePath,
    fileName: saved.fileName,
    absolutePath: saved.absolutePath,
    relativePathFromCwd: path
      .relative(process.cwd(), saved.absolutePath)
      .split(path.sep)
      .join('/'),
    size: saved.size,
    sha256: saved.sha256,
  };
}

export function savePdfWithName(
  fileName: string,
  content: Buffer | string,
  type: string = 'divers',
  date?: Date,
  academicYear?: string,
  subcategory?: string
): SavedPdf {
  return savePdf(content, {
    fileName,
    type,
    date,
    academicYear,
    subcategory,
  });
}

export function getPdfPath(relativePath: string): string {
  return resolveSafePath(relativePath);
}

export const pdfAbsolutePath = getPdfPath;

export function readPdf(relativePath: string): Buffer | null {
  try {
    const absolutePath = resolveSafePath(relativePath);
    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    return fs.readFileSync(absolutePath);
  } catch {
    return null;
  }
}

export function pdfExists(relativePath: string): boolean {
  try {
    const absolutePath = resolveSafePath(relativePath);
    return fs.existsSync(absolutePath);
  } catch {
    return false;
  }
}

export function calculateSha256(relativePath: string): string | null {
  try {
    const content = readPdf(relativePath);
    if (!content) return null;
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

export function getDocumentsBaseDir(): string {
  return getDocumentsRoot();
}

export function getTmpDir(): string {
  ensureDir(TMP_DIR);
  return path.resolve(TMP_DIR);
}

try {
  ensureDir(getDocumentsRoot());
  ensureDir(TMP_DIR);
} catch (error) {
  console.error('[PdfStorageService] Erreur creation repertoires:', error);
}
