import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { QueryTypes } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { Parcours } from "../../inscription/models/Parcours";
import { Classe } from "../../inscription/models/Classe";
import StoredFile, { StoredFileCategory } from "../models/StoredFile";

const IMPORT_DIR = path.resolve(process.cwd(), "storage", "files");
const LEGACY_REFRESH_MS = 5 * 60 * 1000;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const CATEGORIES: StoredFileCategory[] = ["academique", "financier", "administratif", "autre"];

interface LegacySpec {
  table: string;
  column: string;
  category: StoredFileCategory;
  directory: string;
  titleColumn?: string;
}

const LEGACY_SPECS: LegacySpec[] = [
  { table: "ged_documents", column: "fichier", category: "autre", directory: "public/ged", titleColumn: "titre" },
  { table: "ins_bordereaux", column: "fichier", category: "financier", directory: "public/inscription/bordereaux" },
  { table: "ins_dossiers_demandes", column: "nomFichier", category: "academique", directory: "public/inscription/dossiers" },
  { table: "ins_fichiers_ressources", column: "fichier", category: "academique", directory: "public/inscription" },
  { table: "ins_quitus", column: "fichierPDF", category: "financier", directory: "public/inscription" },
  { table: "ins_rattrapage_documents_deposes", column: "fichier", category: "academique", directory: "public/inscription" },
  { table: "scol_demandes_document", column: "fichierPDF", category: "administratif", directory: "public" },
  { table: "scol_demandes_document_pieces", column: "cheminFichier", category: "administratif", directory: "public" },
  { table: "scol_diplomes", column: "fichierPDF", category: "academique", directory: "public" },
  { table: "scol_documents_delivres", column: "fichierPDF", category: "administratif", directory: "public" },
  { table: "scol_recus_caisse", column: "fichierPDF", category: "financier", directory: "public" },
  { table: "scol_recus_caisse_old_v1", column: "fichierPDF", category: "financier", directory: "public" },
  { table: "scol_livres", column: "fichier", category: "academique", directory: "public" },
  { table: "docgen_documents", column: "filePath", category: "administratif", directory: "public" },
  { table: "elearning_devoirs", column: "fichier", category: "academique", directory: "public/elearning" },
  { table: "elearning_soumissions_devoirs", column: "fichier", category: "academique", directory: "public/elearning" },
  { table: "elearning_supports", column: "fichierOriginal", category: "academique", directory: "public/elearning" },
  { table: "elearning_supports", column: "fichierCompresse", category: "academique", directory: "public/elearning" },
  { table: "stg_attestations_stage", column: "fichier", category: "academique", directory: "public/stages" },
  { table: "stg_conventions_stage", column: "fichier", category: "academique", directory: "public/stages" },
  { table: "stg_rapports_stage", column: "fichier", category: "academique", directory: "public/stages" }
];

let lastLegacyRefresh = 0;
let legacyRefresh: Promise<void> | null = null;

function fileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function parseOptionalId(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function allowedRoots(): string[] {
  return ["public", "storage", "uploads", process.env.DOCUMENTS_DIR || "documents"]
    .map(folder => path.resolve(process.cwd(), folder));
}

function withinAllowedRoot(candidate: string): boolean {
  const resolved = path.resolve(candidate);
  return allowedRoots().some(root => resolved === root || resolved.startsWith(root + path.sep));
}

function resolveLegacyPath(value: string, directory: string): string {
  const normalized = value.trim().replace(/\\/g, "/");
  const documentsRoot = path.resolve(process.cwd(), process.env.DOCUMENTS_DIR || "documents");
  const direct = path.isAbsolute(value) ? [path.resolve(value)] : [
    path.resolve(process.cwd(), normalized.replace(/^\/+/, "")),
    path.resolve(documentsRoot, normalized.replace(/^\/+/, "")),
    path.resolve(process.cwd(), "public", normalized.replace(/^\/+/, "")),
    path.resolve(process.cwd(), "storage", normalized.replace(/^\/+/, "")),
    path.resolve(process.cwd(), directory, path.basename(normalized))
  ];
  return direct.find(candidate => withinAllowedRoot(candidate) && fs.existsSync(candidate)) ||
    direct.find(candidate => withinAllowedRoot(candidate)) ||
    path.resolve(process.cwd(), directory, path.basename(normalized));
}

function safePublicFile(file: StoredFile): string {
  const filePath = path.resolve(process.cwd(), file.relativePath);
  if (!withinAllowedRoot(filePath)) throw new Error("Le chemin du fichier sort des répertoires autorisés.");
  if (fs.existsSync(filePath)) {
    const realPath = fs.realpathSync(filePath);
    const realRoots = allowedRoots()
      .filter(root => fs.existsSync(root))
      .map(root => fs.realpathSync(root));
    if (!realRoots.some(root => realPath === root || realPath.startsWith(root + path.sep))) {
      throw new Error("Le fichier pointe en dehors des répertoires autorisés.");
    }
    return realPath;
  }
  return filePath;
}

function isAccountant(req: Request): boolean {
  return req.utilisateurRole === RolesUtilisateur.ESA_COMPTA ||
    req.utilisateurRole === RolesUtilisateur.CABINET_COMPTABLE;
}

function canAccess(req: Request, file: StoredFile): boolean {
  if (isAccountant(req)) {
    const activeSite = parseOptionalId(req.etablissementId);
    return activeSite !== null && file.categorie === "financier" && file.etablissementId === activeSite;
  }
  return [
    RolesUtilisateur.ADMIN,
    RolesUtilisateur.SUPERVISEUR_GENERAL,
    RolesUtilisateur.COMITE_ORIENTATION
  ].includes(req.utilisateurRole as RolesUtilisateur);
}

function describeFile(file: StoredFile) {
  const filePath = safePublicFile(file);
  const exists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  return {
    id: file.id,
    originType: file.originType,
    titre: file.titre,
    nomFichier: file.nomFichier,
    mimeType: file.mimeType,
    taille: file.taille,
    categorie: file.categorie,
    anneeAcademiqueId: file.anneeAcademiqueId,
    etablissementId: file.etablissementId,
    filiereId: file.filiereId,
    filiere: file.filiere,
    niveauEtudeId: file.niveauEtudeId,
    parcoursId: file.parcoursId,
    classeId: file.classeId,
    date: file.createdAt,
    status: exists ? "present" : "missing",
    integrityHash: file.integrityHash
  };
}

async function refreshLegacyIndex(): Promise<void> {
  if (Date.now() - lastLegacyRefresh < LEGACY_REFRESH_MS) return;
  if (legacyRefresh) return legacyRefresh;
  legacyRefresh = syncLegacyIndex();
  try {
    await legacyRefresh;
    lastLegacyRefresh = Date.now();
  } finally {
    legacyRefresh = null;
  }
}

async function syncLegacyIndex(): Promise<void> {
  const sequelize = DatabaseConnection.getInstance().sequelize;
  const tables = new Set(await sequelize.getQueryInterface().showAllTables() as string[]);

  for (const spec of LEGACY_SPECS) {
    if (!tables.has(spec.table)) continue;
    const columns = await sequelize.getQueryInterface().describeTable(spec.table);
    if (!columns[spec.column]) continue;

    const primaryKeys = Object.entries(columns)
      .filter(([, definition]) => definition.primaryKey)
      .map(([name]) => name);
    const idColumns = primaryKeys.length ? primaryKeys : columns.id ? ["id"] : [];
    if (!idColumns.length) continue;
    const metadataColumns = [
      "anneeAcademiqueId", "etablissementId", "filiereId", "niveauEtudeId", "parcoursId", "classeId"
    ].filter(column => Boolean(columns[column]));
    const selected = Array.from(new Set([
      ...idColumns, spec.column, ...(spec.titleColumn && columns[spec.titleColumn] ? [spec.titleColumn] : []),
      ...metadataColumns, ...(columns.createdAt ? ["createdAt"] : [])
    ]));
    const quote = (identifier: string) => `\`${identifier.replace(/`/g, "``")}\``;
    const rows = await sequelize.query(
      `SELECT ${selected.map(quote).join(", ")} FROM ${quote(spec.table)} WHERE ${quote(spec.column)} IS NOT NULL`,
      { type: QueryTypes.SELECT }
    ) as Array<Record<string, unknown>>;

    for (const row of rows) {
      const rawPath = String(row[spec.column] || "").trim();
      if (!rawPath) continue;
      const recordId = idColumns.map(column => String(row[column])).join(":");
      const originKey = `legacy:${spec.table}:${recordId}:${spec.column}`;
      const resolvedPath = resolveLegacyPath(rawPath, spec.directory);
      const relativePath = path.relative(process.cwd(), resolvedPath);
      const exists = fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile();
      const basename = path.basename(rawPath.replace(/\\/g, "/"));
      const titleValue = spec.titleColumn ? row[spec.titleColumn] : null;
      const fileStats = exists ? fs.statSync(resolvedPath) : null;
      const existing = await StoredFile.findOne({ where: { originKey } });
      if (existing) continue;
      const initialHash = exists ? await fileHash(resolvedPath) : null;
      const values = {
        originKey,
        originType: "legacy" as const,
        sourceTable: spec.table,
        sourceRecordId: recordId,
        sourceColumn: spec.column,
        titre: String(titleValue || basename).slice(0, 255),
        nomFichier: basename.slice(0, 255),
        relativePath,
        mimeType: path.extname(basename).toLowerCase() === ".pdf" ? "application/pdf" : "application/octet-stream",
        taille: fileStats?.size || 0,
        integrityHash: initialHash,
        categorie: spec.category,
        anneeAcademiqueId: parseOptionalId(row.anneeAcademiqueId),
        etablissementId: parseOptionalId(row.etablissementId),
        filiereId: parseOptionalId(row.filiereId),
        niveauEtudeId: parseOptionalId(row.niveauEtudeId),
        parcoursId: parseOptionalId(row.parcoursId),
        classeId: parseOptionalId(row.classeId)
      };
      await StoredFile.findOrCreate({ where: { originKey }, defaults: values });
    }
  }
}

function filterFiles(files: StoredFile[], req: Request): StoredFile[] {
  const filters: Array<[string, keyof StoredFile]> = [
    ["anneeAcademiqueId", "anneeAcademiqueId"],
    ["etablissementId", "etablissementId"],
    ["filiereId", "filiereId"],
    ["niveauEtudeId", "niveauEtudeId"],
    ["parcoursId", "parcoursId"],
    ["classeId", "classeId"]
  ];
  const category = req.query.categorie ? String(req.query.categorie) : null;
  const search = req.query.q ? String(req.query.q).trim().toLocaleLowerCase() : "";
  return files.filter(file => {
    if (!canAccess(req, file)) return false;
    if (category && file.categorie !== category) return false;
    if (search && !`${file.titre} ${file.nomFichier}`.toLocaleLowerCase().includes(search)) return false;
    if (req.query.filiere && file.filiere !== String(req.query.filiere)) return false;
    return filters.every(([queryKey, field]) => {
      const value = req.query[queryKey];
      return !value || String(file[field] ?? "") === String(value);
    });
  });
}

function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export default class StoredFileController {
  static async options(req: Request, res: Response): Promise<Response> {
    try {
      const siteFilter = isAccountant(req) ? parseOptionalId(req.etablissementId) : null;
      if (isAccountant(req) && !siteFilter) {
        return res.status(403).json({ message: "Aucun site actif n'est défini pour ce compte." });
      }
      const sites = await Etablissement.findAll({
        attributes: ["id", "nom"],
        where: siteFilter ? { id: siteFilter, actif: true } : { actif: true },
        order: [["nom", "ASC"]]
      });
      const [years, levels, programs, classes] = await Promise.all([
        AnneeAcademique.findAll({ attributes: ["id", "libelle"], order: [["libelle", "DESC"]] }),
        NiveauEtude.findAll({ attributes: ["id", "libelle"], order: [["libelle", "ASC"]] }),
        Parcours.findAll({ attributes: ["id", "titre"], order: [["titre", "ASC"]] }),
        Classe.findAll({ attributes: ["id", "libelle"], order: [["libelle", "ASC"]] })
      ]);
      return res.status(200).json({
        sites: sites.map(site => ({ id: site.id, label: site.nom })),
        annees: years.map(year => ({ id: year.id, label: year.libelle })),
        niveaux: levels.map(level => ({ id: level.id, label: level.libelle })),
        parcours: programs.map(program => ({ id: program.id, label: program.titre })),
        classes: classes.map(item => ({ id: item.id, label: item.libelle }))
      });
    } catch (error) {
      console.error("[Stockage fichiers] Échec de chargement des filtres :", error);
      return res.status(500).json({ message: "Impossible de charger les choix de classement." });
    }
  }

  static async list(req: Request, res: Response): Promise<Response> {
    try {
      await refreshLegacyIndex();
      const files = filterFiles(await StoredFile.findAll({ order: [["createdAt", "DESC"]] }), req);
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
      return res.status(200).json({
        total: files.length,
        page,
        pageSize,
        files: files.slice((page - 1) * pageSize, page * pageSize).map(describeFile)
      });
    } catch (error) {
      console.error("[Stockage fichiers] Échec de l'index ou de la liste :", error);
      return res.status(500).json({ message: "Impossible de charger le catalogue des fichiers." });
    }
  }

  static async upload(req: Request, res: Response): Promise<Response> {
    let absolutePath: string | null = null;
    let persisted = false;
    try {
      const uploaded = req.file;
      const privileged = [
        RolesUtilisateur.ADMIN,
        RolesUtilisateur.SUPERVISEUR_GENERAL,
        RolesUtilisateur.COMITE_ORIENTATION
      ].includes(req.utilisateurRole as RolesUtilisateur);
      if (!privileged && !isAccountant(req)) {
        return res.status(403).json({ message: "Ce rôle ne peut pas importer de fichiers dans le stockage central." });
      }
      if (!uploaded) return res.status(400).json({ message: "Sélectionnez un fichier PDF." });
      if (uploaded.size > MAX_FILE_SIZE) return res.status(413).json({ message: "Le fichier dépasse la limite de 50 Mo." });
      if (uploaded.mimetype !== "application/pdf" || !uploaded.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
        return res.status(415).json({ message: "Seuls les vrais fichiers PDF sont acceptés." });
      }
      const category = String(req.body.categorie || "autre") as StoredFileCategory;
      if (!CATEGORIES.includes(category)) return res.status(400).json({ message: "Catégorie de fichier invalide." });
      if (isAccountant(req) && category !== "financier") {
        return res.status(403).json({ message: "Les comptes comptables ne peuvent importer que des pièces financières." });
      }
      const siteId = parseOptionalId(req.body.etablissementId);
      if (!siteId) return res.status(400).json({ message: "Sélectionnez le site auquel classer le document." });
      if (isAccountant(req) && siteId !== parseOptionalId(req.etablissementId)) {
        return res.status(403).json({ message: "Un compte comptable ne peut importer que pour son site actif." });
      }

      const originalName = path.basename(uploaded.originalname).replace(/[^\w.\- ]/g, "_").slice(0, 255) || "document.pdf";
      const storedName = `${crypto.randomUUID()}.pdf`;
      fs.mkdirSync(IMPORT_DIR, { recursive: true });
      absolutePath = path.join(IMPORT_DIR, storedName);
      await fs.promises.writeFile(absolutePath, uploaded.buffer, { flag: "wx" });
      const hash = crypto.createHash("sha256").update(uploaded.buffer).digest("hex");
      const saved = await StoredFile.create({
        originKey: `import:${storedName}`,
        originType: "import",
        sourceTable: null,
        sourceRecordId: null,
        sourceColumn: null,
        titre: String(req.body.titre || originalName).slice(0, 255),
        nomFichier: originalName,
        relativePath: path.relative(process.cwd(), absolutePath),
        mimeType: "application/pdf",
        taille: uploaded.size,
        integrityHash: hash,
        categorie: category,
        anneeAcademiqueId: parseOptionalId(req.body.anneeAcademiqueId),
        etablissementId: siteId,
        filiereId: parseOptionalId(req.body.filiereId),
        filiere: String(req.body.filiere || "").trim().slice(0, 191) || null,
        niveauEtudeId: parseOptionalId(req.body.niveauEtudeId),
        parcoursId: parseOptionalId(req.body.parcoursId),
        classeId: parseOptionalId(req.body.classeId),
        createdBy: parseOptionalId(req.utilisateurId)
      });
      persisted = true;
      return res.status(201).json(describeFile(saved));
    } catch (error) {
      console.error("[Stockage fichiers] Échec de l'import :", error);
      if (absolutePath && !persisted) {
        try {
          await fs.promises.unlink(absolutePath);
        } catch (cleanupError) {
          if ((cleanupError as NodeJS.ErrnoException).code !== "ENOENT") {
            console.error("[Stockage fichiers] Échec du nettoyage après import :", cleanupError);
          }
        }
      }
      return res.status(500).json({ message: "L'import du fichier a échoué." });
    }
  }

  static async content(req: Request, res: Response): Promise<Response | void> {
    try {
      const file = await StoredFile.findByPk(Number(req.params.id));
      if (!file || !canAccess(req, file)) return res.status(404).json({ message: "Fichier introuvable." });
      const filePath = safePublicFile(file);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return res.status(404).json({ message: "Le fichier référencé n'est pas présent sur le stockage." });
      }
      const currentHash = await fileHash(filePath);
      if (file.integrityHash && currentHash !== file.integrityHash) {
        return res.status(409).json({ message: "Le fichier a changé depuis son indexation ; son aperçu est bloqué." });
      }
      if (!file.integrityHash) await file.update({ integrityHash: currentHash, taille: fs.statSync(filePath).size });
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.nomFichier)}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.sendFile(filePath);
    } catch (error) {
      console.error("[Stockage fichiers] Échec de lecture :", error);
      return res.status(500).json({ message: "Impossible de lire le fichier." });
    }
  }

  static async verify(req: Request, res: Response): Promise<Response> {
    try {
      const file = await StoredFile.findByPk(Number(req.params.id));
      if (!file || !canAccess(req, file)) return res.status(404).json({ message: "Fichier introuvable." });
      const filePath = safePublicFile(file);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return res.status(404).json({ valid: false, message: "Fichier manquant sur le stockage." });
      }
      const currentHash = await fileHash(filePath);
      if (!file.integrityHash) {
        await file.update({ integrityHash: currentHash, taille: fs.statSync(filePath).size });
        return res.status(200).json({ valid: true, baselineCreated: true, sha256: currentHash });
      }
      return res.status(200).json({
        valid: currentHash === file.integrityHash,
        baselineCreated: false,
        expectedSha256: file.integrityHash,
        actualSha256: currentHash
      });
    } catch (error) {
      console.error("[Stockage fichiers] Échec de vérification d'intégrité :", error);
      return res.status(500).json({ message: "La vérification d'intégrité a échoué." });
    }
  }

  static async exportCsv(req: Request, res: Response): Promise<Response> {
    try {
      await refreshLegacyIndex();
      const files = filterFiles(await StoredFile.findAll(), req);
      const columns = [
        "id", "titre", "nomFichier", "categorie", "anneeAcademiqueId", "etablissementId",
        "filiereId", "filiere", "niveauEtudeId", "parcoursId", "classeId", "status", "integrityHash"
      ];
      const rows = files.map(file => {
        const entry = describeFile(file) as Record<string, unknown>;
        return columns.map(column => csvCell(entry[column])).join(";");
      });
      const csv = `\uFEFF${columns.join(";")}\r\n${rows.join("\r\n")}`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="catalogue-fichiers.csv"');
      return res.status(200).send(csv);
    } catch (error) {
      console.error("[Stockage fichiers] Échec de l'export :", error);
      return res.status(500).json({ message: "Impossible d'exporter le catalogue." });
    }
  }
}
