import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Stockage documentaire unifie.
 *
 * Arborescence cible (racine = DOCUMENTS_STORAGE_DIR, defaut /app/documents) :
 *
 *   documents/
 *     uploads/<annee-academique>/<type>/<sous-type?>/<fichier>   documents importes
 *     created/<annee-academique>/<type>/<sous-type?>/<fichier>   documents generes
 *
 * Exemple : documents/uploads/2025-2026/finances/filieres/recu.pdf
 *
 * Le sous-type est optionnel. Les segments sont normalises (accents, espaces,
 * caracteres speciaux) et tout chemin hors de la racine est refuse.
 */

export const DOCUMENT_ORIGINS = ['uploads', 'created'] as const;
export type DocumentOrigin = (typeof DOCUMENT_ORIGINS)[number];

export const DOCUMENT_CATEGORIES = [
  'finances',
  'pedagogique',
  'administratif',
  'ressources_humaines',
  'communication',
  'orientation',
  'bibliotheque',
  'elearning',
  'inscription',
  'ged',
  'docgen',
  'divers',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/**
 * Racine des documents. En production, elle est montee depuis
 * /mnt/easyecole-documents ; en dev, elle retombe sous storage/documents.
 */
export function getDocumentsRoot(): string {
  return path.resolve(
    process.env.DOCUMENTS_STORAGE_DIR ||
      (process.env.NODE_ENV === 'production'
        ? '/app/documents'
        : path.join(process.cwd(), 'storage', 'documents'))
  );
}

export function getOriginRoot(origin: DocumentOrigin): string {
  if (!DOCUMENT_ORIGINS.includes(origin)) {
    throw new Error(`Origine documentaire invalide : ${String(origin)}`);
  }
  return path.join(getDocumentsRoot(), origin);
}

/**
 * Annee academique au format 2025-2026.
 * Sans valeur explicite : annee courante (bascule au 1er septembre).
 */
export function currentAcademicYear(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0 = janvier, 8 = septembre
  const start = month >= 8 ? year : year - 1;
  return `${start}-${start + 1}`;
}

export function normalizeAcademicYear(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return currentAcademicYear();

  const full = raw.match(/^(\d{4})[\/\-](\d{4})$/);
  if (full) return `${full[1]}-${full[2]}`;

  const single = raw.match(/^(\d{4})$/);
  if (single) return `${single[1]}-${Number(single[1]) + 1}`;

  const loose = raw.match(/(\d{4})\D+(\d{4})/);
  if (loose) return `${loose[1]}-${loose[2]}`;

  console.warn(
    `[DocumentStorageService] Annee academique invalide "${raw}", utilisation de ${currentAcademicYear()}`
  );
  return currentAcademicYear();
}

const CATEGORY_ALIASES: Record<string, DocumentCategory> = {
  finance: 'finances',
  finances: 'finances',
  financier: 'finances',
  financiere: 'finances',
  comptabilite: 'finances',
  pedagogie: 'pedagogique',
  pedagogique: 'pedagogique',
  academique: 'pedagogique',
  scolarite: 'pedagogique',
  bulletins: 'pedagogique',
  pv: 'pedagogique',
  administratif: 'administratif',
  administration: 'administratif',
  admin: 'administratif',
  rh: 'ressources_humaines',
  ressources_humaines: 'ressources_humaines',
  ressourceshumaines: 'ressources_humaines',
  communication: 'communication',
  actualites: 'communication',
  orientation: 'orientation',
  bibliotheque: 'bibliotheque',
  livres: 'bibliotheque',
  elearning: 'elearning',
  inscription: 'inscription',
  admissions: 'inscription',
  ged: 'ged',
  docgen: 'docgen',
  documents: 'docgen',
  divers: 'divers',
  autre: 'divers',
  autres: 'divers',
};

function asciiSlug(value: string): string {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeCategory(value?: string | null): DocumentCategory {
  const raw = asciiSlug(String(value ?? ''));
  if (!raw) return 'divers';
  if ((DOCUMENT_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as DocumentCategory;
  }
  const alias = CATEGORY_ALIASES[raw.replace(/[^a-z0-9]+/g, '_')];
  return alias ?? 'divers';
}

export function sanitizeSegment(value: string, fallback = 'divers'): string {
  const safe = asciiSlug(value)
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 80);
  if (!safe || safe === '.' || safe === '..') return fallback;
  return safe;
}

export function sanitizeFileName(value: string): string {
  const base = path.basename(String(value ?? '').trim());
  const normalized = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const ext = path.extname(normalized).replace(/[^A-Za-z0-9.]+/g, '').slice(0, 10);
  const stem = normalized
    .slice(0, normalized.length - path.extname(normalized).length)
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 160);
  const safe = `${stem || 'document'}${ext}`;
  return safe || `document_${Date.now()}`;
}

export interface DocumentPathOptions {
  origin: DocumentOrigin;
  academicYear?: string | null;
  category?: string | null;
  subcategory?: string | null;
  fileName: string;
}

/**
 * Construit le chemin absolu d'un document et verifie qu'il reste sous la
 * racine de son origine. Leve une erreur en cas de tentative de traversal.
 */
export function resolveDocumentPath(options: DocumentPathOptions): string {
  const originRoot = getOriginRoot(options.origin);
  const year = normalizeAcademicYear(options.academicYear);
  const category = normalizeCategory(options.category);
  const parts = [originRoot, year, category];

  if (options.subcategory && String(options.subcategory).trim()) {
    parts.push(sanitizeSegment(String(options.subcategory), 'divers'));
  }
  parts.push(sanitizeFileName(options.fileName));

  const absolutePath = path.resolve(...parts);
  if (
    absolutePath !== originRoot &&
    !absolutePath.startsWith(originRoot + path.sep)
  ) {
    throw new Error('Chemin documentaire refuse (hors du dossier autorise).');
  }
  return absolutePath;
}

export function getDocumentPath(relativePath: string): string {
  const root = getDocumentsRoot();
  const normalized = String(relativePath ?? '').replace(/\\/g, '/').replace(/^\/+/, '');
  const absolutePath = path.resolve(root, normalized);
  if (absolutePath !== root && !absolutePath.startsWith(root + path.sep)) {
    throw new Error('Chemin documentaire refuse (hors du dossier autorise).');
  }
  return absolutePath;
}

export function getDocumentRelativePath(absolutePath: string): string {
  const root = getDocumentsRoot();
  const absolute = path.resolve(absolutePath);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new Error('Chemin documentaire refuse (hors du dossier autorise).');
  }
  return path.relative(root, absolute).split(path.sep).join('/');
}

export interface SavedDocument {
  relativePath: string;
  fileName: string;
  absolutePath: string;
  size: number;
  sha256: string;
}

/**
 * Ecrit un document de facon atomique dans l'arborescence unifiee.
 * Le fichier temporaire est cree dans le dossier cible (pas dans /tmp) pour
 * que le rename final reste atomique, y compris sur un montage reseau.
 */
export function saveDocument(
  content: Buffer | string,
  options: DocumentPathOptions
): SavedDocument {
  const absolutePath = resolveDocumentPath(options);
  const dir = path.dirname(absolutePath);
  fs.mkdirSync(dir, { recursive: true });

  const tmpPath = path.join(
    dir,
    `.tmp_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`
  );

  try {
    fs.writeFileSync(tmpPath, content);
    fs.renameSync(tmpPath, absolutePath);
  } catch (error) {
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore
      }
    }
    throw error;
  }

  const stats = fs.statSync(absolutePath);
  const sha256 = crypto
    .createHash('sha256')
    .update(fs.readFileSync(absolutePath))
    .digest('hex');

  return {
    relativePath: getDocumentRelativePath(absolutePath),
    fileName: path.basename(absolutePath),
    absolutePath,
    size: stats.size,
    sha256,
  };
}

export function documentExists(relativePath: string): boolean {
  try {
    return fs.existsSync(getDocumentPath(relativePath));
  } catch {
    return false;
  }
}

export function readDocument(relativePath: string): Buffer | null {
  try {
    const absolutePath = getDocumentPath(relativePath);
    if (!fs.existsSync(absolutePath)) return null;
    return fs.readFileSync(absolutePath);
  } catch {
    return null;
  }
}

export interface FindDocumentOptions {
  origin?: DocumentOrigin;
  category?: string | null;
  subcategory?: string | null;
}

/**
 * Retrouve un document genere par son seul nom de fichier, en parcourant les
 * annees academiques de l'origine demandee. Utile pour les routes de
 * telechargement qui ne recoivent que le basename (PV, cartes, etc.).
 */
export function findDocumentByFileName(
  fileName: string,
  options: FindDocumentOptions = {}
): string | null {
  const origin = options.origin ?? 'created';
  const category = options.category ?? 'divers';
  const name = sanitizeFileName(fileName);

  for (const year of listAcademicYears(origin)) {
    const candidate = resolveDocumentPath({
      origin,
      academicYear: year,
      category,
      subcategory: options.subcategory ?? null,
      fileName: name,
    });
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Resout un chemin stocke en base :
 * - `uploads/...` ou `created/...` : nouvelle arborescence documentaire ;
 * - chemin absolu : utilise tel quel ;
 * - ancien chemin relatif : cherche sous chaque racine legacy fournie, puis
 *   relativement au repertoire courant.
 * Retourne null si aucun fichier n'existe.
 */
export function resolveStoredDocumentPath(
  storedPath: string | null | undefined,
  legacyRoots: string[] = []
): string | null {
  const raw = String(storedPath ?? '').trim();
  if (!raw) return null;

  const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.startsWith('uploads/') || normalized.startsWith('created/')) {
    try {
      const absolutePath = getDocumentPath(normalized);
      return fs.existsSync(absolutePath) ? absolutePath : null;
    } catch {
      return null;
    }
  }

  if (path.isAbsolute(raw) && fs.existsSync(raw)) return raw;

  const candidates: string[] = [];
  for (const root of legacyRoots) {
    candidates.push(path.resolve(root, raw));
    candidates.push(path.resolve(root, path.basename(raw)));
  }
  candidates.push(path.resolve(raw));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export interface InitDocumentStorageOptions {
  academicYear?: string | null;
  categories?: string[];
  subcategories?: string[];
}

/**
 * Cree l'arborescence de base. Idempotent : aucun fichier existant n'est
 * supprime ou modifie.
 */
export function initDocumentStorage(
  options: InitDocumentStorageOptions = {}
): string[] {
  const year = normalizeAcademicYear(options.academicYear);
  const categories =
    options.categories && options.categories.length > 0
      ? options.categories
      : [...DOCUMENT_CATEGORIES];
  const subcategories =
    options.subcategories && options.subcategories.length > 0
      ? options.subcategories
      : [];
  const created: string[] = [];

  for (const origin of DOCUMENT_ORIGINS) {
    for (const category of categories) {
      const dir = path.join(
        getOriginRoot(origin),
        year,
        normalizeCategory(category)
      );
      fs.mkdirSync(dir, { recursive: true });
      created.push(dir);

      for (const subcategory of subcategories) {
        const subDir = path.join(dir, sanitizeSegment(subcategory, 'divers'));
        fs.mkdirSync(subDir, { recursive: true });
        created.push(subDir);
      }
    }
  }

  return created;
}

export function listAcademicYears(origin: DocumentOrigin = 'uploads'): string[] {
  const root = getOriginRoot(origin);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && /^\d{4}-\d{4}$/.test(entry.name)
    )
    .map((entry) => entry.name)
    .sort()
    .reverse();
}

export function getAcademicYearFromRequest(req: any): string {
  const candidates = [
    req?.body?.anneeAcademique,
    req?.body?.academicYear,
    req?.body?.anneeScolaire,
    req?.body?.anneeAcademiqueLibelle,
    req?.query?.anneeAcademique,
    req?.query?.academicYear,
    req?.params?.anneeAcademique,
    req?.params?.academicYear,
  ];
  const found = candidates.find(
    (value) => typeof value === 'string' && value.trim() !== ''
  );
  return normalizeAcademicYear(found);
}

export function getCategoryFromRequest(req: any): DocumentCategory {
  const candidates = [
    req?.body?.typeDocument,
    req?.body?.documentType,
    req?.body?.categorie,
    req?.body?.category,
    req?.query?.typeDocument,
    req?.query?.categorie,
    req?.query?.category,
  ];
  const found = candidates.find(
    (value) => typeof value === 'string' && value.trim() !== ''
  );
  return normalizeCategory(found);
}
