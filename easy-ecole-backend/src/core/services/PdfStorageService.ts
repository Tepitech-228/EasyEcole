import fs from "fs";
import path from "path";

/**
 * Stockage persistant des PDF — /app/storage/pdfs
 *
 * En production (Dokploy / VM Linux), /app/storage est un BIND MOUNT vers
 * /opt/mon-app/storage sur l'hôte : tout fichier écrit ici survit aux
 * redéploiements, rollbacks et recréations de conteneur.
 *
 * Garanties de ce service :
 *  - le dossier est créé à la volée (`mkdir -p`) ; AUCUNE suppression, ni à
 *    l'écriture ni au démarrage de l'application (les PDF existants sont
 *    toujours conservés) ;
 *  - aucun écriture hors de /app/storage/pdfs : le nom de fichier est
 *    assaini (basename + caractères autorisés) puis contrôlé par préfixe
 *    absolu, ce qui bloque toute traversée de chemin (`../`) ;
 *  - service synchrone et minimal : il encode des octets sur disque, la
 *    logique métier (GED, bordereaux…) reste dans ses services dédiés.
 *
 * Exemple d'usage :
 *   import { savePdf, pdfAbsolutePath } from "@/core/services/PdfStorageService";
 *
 *   const { fileName, relativePath } = savePdf(
 *     `bordereau-${bordereau.id}.pdf`,
 *     pdfBuffer,
 *   );
 *   // Persister `fileName` en base, puis servir le fichier :
 *   res.sendFile(pdfAbsolutePath(fileName));
 */

/** Chemin relatif (à process.cwd() = /app) du dossier des PDF. */
const PDFS_SUBDIR = path.join("storage", "pdfs");

export interface SavedPdf {
  /** Nom de fichier retenu (assaini), unique dans le dossier PDF. */
  fileName: string;
  /** Chemin absolu sur disque — pour res.sendFile() / fs.createReadStream(). */
  absolutePath: string;
  /** Chemin relatif à la racine applicative (/app), pour journaux et debug. */
  relativePath: string;
}

/** Dossier absolu du stockage PDF. */
function pdfsDir(): string {
  return path.resolve(process.cwd(), PDFS_SUBDIR);
}

/** Crée /app/storage/pdfs s'il n'existe pas (idempotent, jamais destructeur). */
function ensureDir(): string {
  const dir = pdfsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Assainit un nom de fichier :
 *  - `path.basename` supprime tout chemin résiduel (/, \, ../) ;
 *  - seuls [A-Za-z0-9._-] sont conservés (le reste -> « _ ») ;
 *  - les points initiaux sont retirés (« .env », « .. »).
 * @throws Error si le nom est vide après assainissement.
 */
function sanitizeFileName(raw: string): string {
  const base = path.basename(String(raw).trim());
  const safe = base.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  if (!safe) {
    throw new Error(`Nom de fichier PDF invalide : "${raw}"`);
  }
  return safe;
}

/** Construit le chemin absolu final et vérifie qu'il reste dans le dossier PDF. */
function resolveSafe(rawFileName: string): { dir: string; absolutePath: string; safe: string } {
  const dir = pdfsDir();
  const safe = sanitizeFileName(rawFileName);
  const absolutePath = path.resolve(dir, safe);
  if (!absolutePath.startsWith(dir + path.sep)) {
    throw new Error(`Chemin PDF refusé (hors du dossier autorisé) : "${rawFileName}"`);
  }
  return { dir, absolutePath, safe };
}

/**
 * Écrit un PDF dans /app/storage/pdfs.
 * Écrase un fichier homonyme existant : le nommage est maîtrisé par
 * l'appelant (ex. `bordereau-123.pdf`) pour éviter les doublons.
 *
 * @throws Error si le nom est invalide, si le chemin sort du dossier,
 *         ou si l'écriture échoue (EACCES, disque plein…).
 */
export function savePdf(fileName: string, content: Buffer | string): SavedPdf {
  ensureDir();
  const { dir, absolutePath, safe } = resolveSafe(fileName);
  fs.writeFileSync(absolutePath, content);
  return {
    fileName: safe,
    absolutePath,
    relativePath: `${PDFS_SUBDIR.replace(/\\/g, "/")}/${safe}`,
  };
}

/**
 * Chemin absolu d'un PDF déjà enregistré (ne vérifie pas l'existence —
 * adapté à res.sendFile, qui gère lui-même l'absence de fichier).
 * @throws Error si le nom est invalide ou sort du dossier PDF.
 */
export function pdfAbsolutePath(fileName: string): string {
  return resolveSafe(fileName).absolutePath;
}

/**
 * Lit un PDF enregistré.
 * @returns le contenu du fichier, ou null si le fichier n'existe pas.
 * @throws Error si le nom est invalide ou sort du dossier PDF.
 */
export function readPdf(fileName: string): Buffer | null {
  const { absolutePath } = resolveSafe(fileName);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  return fs.readFileSync(absolutePath);
}
