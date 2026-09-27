import { Request, Response } from "express";
import ExcelJS from "exceljs";
import mammoth from "mammoth";
import * as cheerio from "cheerio";
import * as path from "path";
import * as fs from "fs";
import * as bcrypt from "bcrypt";
import { Op } from "sequelize";
import { Cours } from "../models/Cours";
import { Ecue } from "../models/Ecue";
import { Parcours } from "../models/Parcours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { AdresseApprenant } from "../../auth/models/AdresseApprenant";
import { IdentiteApprenant } from "../../auth/models/IdentiteApprenant";
import { InformationsParentsApprenant } from "../../auth/models/InformationsParentsApprenant";
import { InformationsSalarieApprenant } from "../../auth/models/InformationsSalarieApprenant";
import { PersonnePrevenirApprenant } from "../../auth/models/PersonnePrevenirApprenant";
import { Session } from "../models/Session";
import { DemandeInscription } from "../models/DemandeInscription";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { CursusApprenant } from "../models/CursusApprenant";
import { SalleDeClasse } from "../models/SalleDeClasse";
import { SemestreAcademique } from "../models/SemestreAcademique";
import { ParentEnfant } from "../../parent/models/ParentEnfant";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { QUEUE_NAMES, QueueService } from "../../../core/queue/QueueService";
import { Document, Paragraph, Table, TableRow, TableCell, TableBorders, TextRun, AlignmentType, VerticalAlign, WidthType, VerticalMerge, GridSpan, Packer, TableLayoutType } from "docx";
import { CoursParticipant } from "../models/CoursParticipant";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { TypeNoteEvaluation } from "../models/TypeNoteEvaluation";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { TypeOperationBordereau } from "../models/TypeOperationBordereau";

// ---------------------------------------------------------------------------
//  UTILITIES
// ---------------------------------------------------------------------------

const TEMP_DIR = "public/excel/";
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const WORD_TEMPLATE_PATHS: Record<string, string> = {
  "master-gc": "master-pro-gc-esa-2025.docx",
  "licence-act": "licence-pro-act-esa-2025.docx",
};

/** Genère un mot de passe temporaire aléatoire */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd + "@A1";
}

/** Crée ou récupère un parcours par son titre (fallback) */
async function resolveParcours(titre: string): Promise<Parcours | null> {
  return await Parcours.findOne({ where: { titre: { [Op.like]: titre } } });
}

/** Crée ou récupère un enseignant par email */
async function resolveEnseignant(email: string): Promise<Enseignant | null> {
  const user = await Utilisateur.findOne({
    where: { email, role: RolesUtilisateur.ENSEIGNANT },
    include: [{ association: Utilisateur.associations.enseignant }],
  });
  return user?.enseignant ?? null;
}

/** Formate une date Excel (nombre sériel ou string) en Date */
function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  // Excel date serial number
  if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569);
    return new Date(utcDays * 86400 * 1000);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Nettoie un nom de feuille Excel (max 31 car., sans caractères interdits) */
function sanitizeSheetName(name: string): string {
  return name.replace(/[\\\/\?\*\[\]:]/g, "").substring(0, 31);
}

/** Convertit une valeur de query param en entier (ou undefined si absente/invalide) */
function parseIntParam(value: any): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : Math.trunc(n);
}

/**
 * Normalise un libellé de rôle vers la valeur de l'enum RolesUtilisateur.
 * Accepte les valeurs exactes de l'enum (ex: "ressources_humaines") ainsi que
 * des alias usuels (ex: "RH", "COMPTABLE", "CAISSIER_BANQUE", "ETUDIANT").
 */
function normalizeRole(raw: string): RolesUtilisateur | null {
  const v = raw.trim().toLowerCase();
  const alias: Record<string, string> = {
    rh: RolesUtilisateur.RESSOURCES_HUMAINES,
    ressource_humaine: RolesUtilisateur.RESSOURCES_HUMAINES,
    ressources_humaines: RolesUtilisateur.RESSOURCES_HUMAINES,
    comptable: RolesUtilisateur.CABINET_COMPTABLE,
    comptables: RolesUtilisateur.CABINET_COMPTABLE,
    cabinet_comptable: RolesUtilisateur.CABINET_COMPTABLE,
    caissier: RolesUtilisateur.CAISSIER_BANQUE,
    caissier_banque: RolesUtilisateur.CAISSIER_BANQUE,
    institution: RolesUtilisateur.INSTITUTION,
    admin: RolesUtilisateur.ADMIN,
    parent: RolesUtilisateur.PARENT,
    enseignant: RolesUtilisateur.ENSEIGNANT,
    apprenant: RolesUtilisateur.APPRENANT,
    etudiant: RolesUtilisateur.APPRENANT,
    comite: RolesUtilisateur.COMITE_ORIENTATION,
    comite_orientation: RolesUtilisateur.COMITE_ORIENTATION,
  };
  const normalized = alias[v] ?? v;
  return (Object.values(RolesUtilisateur) as string[]).includes(normalized)
    ? (normalized as RolesUtilisateur)
    : null;
}

/** Interprète la colonne "Statut" d'un template (actif/oui/1/true) */
function isActifStatut(value: string | null): boolean {
  if (!value) return false;
  return ["actif", "oui", "yes", "1", "true"].includes(value.trim().toLowerCase());
}

/** Nom de feuille Excel utilisé pour chaque rôle (template / import) */
const ROLE_SHEET_NAMES: Record<string, string> = {
  [RolesUtilisateur.INSTITUTION]: "Institution",
  [RolesUtilisateur.CAISSIER_BANQUE]: "Caissiers",
  [RolesUtilisateur.RESSOURCES_HUMAINES]: "RH",
  [RolesUtilisateur.CABINET_COMPTABLE]: "Comptables",
  [RolesUtilisateur.COMITE_ORIENTATION]: "Comite",
  [RolesUtilisateur.ADMIN]: "Admins",
  [RolesUtilisateur.PARENT]: "Parents",
  [RolesUtilisateur.ENSEIGNANT]: "Enseignants",
  [RolesUtilisateur.APPRENANT]: "Apprenants",
};

/** Libellé lisible d'un rôle (instructions / messages) */
const ROLE_LABELS: Record<string, string> = {
  [RolesUtilisateur.INSTITUTION]: "Institution",
  [RolesUtilisateur.CAISSIER_BANQUE]: "Caissier banque",
  [RolesUtilisateur.RESSOURCES_HUMAINES]: "Ressources humaines",
  [RolesUtilisateur.CABINET_COMPTABLE]: "Cabinet comptable",
  [RolesUtilisateur.COMITE_ORIENTATION]: "Comité d'orientation",
  [RolesUtilisateur.ADMIN]: "Administrateur",
  [RolesUtilisateur.PARENT]: "Parent",
  [RolesUtilisateur.ENSEIGNANT]: "Enseignant",
  [RolesUtilisateur.APPRENANT]: "Apprenant",
};

// ---------------------------------------------------------------------------
//  STYLES COMMUNS
// ---------------------------------------------------------------------------
const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1E40AF" } };
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const BORDER_THIN = { style: "thin" as const, color: { argb: "FFCCCCCC" } };

function applyHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };
  });
}

function applyDataStyle(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.border = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

// ---------------------------------------------------------------------------
//  FONCTIONS UTILITAIRES DE PARSING
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  return text.replace(/\u00A0/g, ' ').replace(/\u2013/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();
}

function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return { row: parseInt(match[2], 10), col: 0 };
}

function columnLetterToIndex(letter: string): number {
  let col = 0;
  for (let i = 0; i < letter.length; i++) col = col * 26 + (letter.charCodeAt(i) - 64);
  return col;
}

function isPartOfMerge(ws: ExcelJS.Worksheet, row: number, col: number, masterCells: Set<string>): boolean {
  if (!ws.model.merges) return false;
  for (const mergeStr of ws.model.merges as string[]) {
    const parts = mergeStr.split(':');
    if (parts.length !== 2) continue;
    const from = parseCellRef(parts[0]);
    const to = parseCellRef(parts[1]);
    if (!from || !to) continue;
    const fromCol = columnLetterToIndex(parts[0].replace(/\d+/, ''));
    const toCol = columnLetterToIndex(parts[1].replace(/\d+/, ''));
    if (row >= from.row && row <= to.row && col >= fromCol && col <= toCol) {
      if (row !== from.row || col !== fromCol) return true;
    }
  }
  return false;
}

function detectFormat(matrix: string[][]): 'A' | 'B' {
  const row0 = matrix[0] || [];
  const row1 = matrix[1] || [];

  const hasCodeDeL = row0.some(h => h.toUpperCase().includes('CODE DE L'));
  const hasContenus = row0.some(h => h.toUpperCase().includes('CONTENUS DES ENSEIGNEMENTS'));
  const hasIntituleDes = row0.some(h => h.toUpperCase().includes('INTITULE DES ENSEIGNEMENTS'));
  const hasMatiere = row0.some(h => h.toUpperCase().includes('MATIERE'));
  const hasUnite = row0.some(h => h.toUpperCase().includes('UNITE D\'ENSEIGNEMENT'));

  // Maquettes ESA à 2 lignes d'en-tête : ligne 2 contient UE + ECUE (robuste aux espaces)
  const norm = (s: string) => s.toUpperCase().replace(/\s+/g, '').trim();
  const hasUeEcueSplit = (() => {
    for (let r = 1; r < Math.min(4, matrix.length); r++) {
      const row = matrix[r] || [];
      const hasUe = row.some(h => norm(h) === 'UE');
      const hasEcue = row.some(h => norm(h) === 'ECUE');
      if (hasUe && hasEcue) return true;
    }
    return false;
  })();

  // Ligne 1 contient TYPE ou TYPES + TOTAL PRESENTIEL -> Format B (robuste à TOTALPRESENTIEL collé par mammoth)
  const hasTypeVariant = row0.some(h => norm(h).includes('TYPE'));
  const hasTotalPresentiel = row0.some(h => norm(h).includes('TOTALPRESENTIEL'));

  if (hasUeEcueSplit || (hasTypeVariant && hasTotalPresentiel)) return 'B';

  // Tests existants pour Format A (template simple Code/Intitulé)
  if (hasCodeDeL && hasContenus) return 'A';
  if (hasCodeDeL && (hasIntituleDes || hasMatiere || hasUnite)) return 'B';
  if (hasCodeDeL) return 'B';

  // Fallback pour template simple
  return 'A';
}

export async function lireTableauWord(filePath: string): Promise<string[][]> {
  let result: { value: string };
  try {
    result = await mammoth.convertToHtml({ path: filePath });
  } catch (e: any) {
    throw new Error("Fichier Word invalide ou corrompu: " + (e?.message || String(e)));
  }
  const $ = cheerio.load(result.value);
  if ($('table').length === 0) throw new Error("Impossible de trouver un tableau dans le document Word");

  const matrix: string[][] = [];
  $('table').each((_tableIndex, table) => {
    const rawRows: { cells: { text: string; rowspan: number; colspan: number }[] }[] = [];
    $(table).find('tr').each((_i, el) => {
      const cells: { text: string; rowspan: number; colspan: number }[] = [];
      $(el).find('td, th').each((_j, cell) => {
        const cellEl = $(cell);
        const text = normalizeText(cellEl.text());
        cells.push({ text, rowspan: parseInt(cellEl.attr('rowspan') || '1', 10), colspan: parseInt(cellEl.attr('colspan') || '1', 10) });
      });
      if (cells.length > 0) rawRows.push({ cells });
    });
    if (rawRows.length < 2) return;

    // The two-level header has 10 visible cells, while data rows have 11.
    // Keeping the maximum width prevents the teacher column from shifting data.
    const headerCols = Math.max(11, ...rawRows.map(row => row.cells.reduce((sum, cell) => sum + cell.colspan, 0)));
    const activeRowspans: { text: string; remaining: number }[] = [];
    for (const rawRow of rawRows) {
      const row: string[] = new Array(headerCols).fill('');
      let col = 0;
      for (const cell of rawRow.cells) {
        while (col < headerCols && row[col] !== '') col++;
        if (col >= headerCols) break;
        row[col] = cell.text;
        if (cell.rowspan > 1) {
          for (let offset = 0; offset < cell.colspan && col + offset < headerCols; offset++) {
            activeRowspans[col + offset] = { text: cell.text, remaining: cell.rowspan - 1 };
          }
        }
        for (let offset = 1; offset < cell.colspan && col + offset < headerCols; offset++) row[col + offset] = '';
        col += cell.colspan;
      }
      for (let index = 0; index < headerCols; index++) {
        if (!row[index] && activeRowspans[index]?.remaining > 0) {
          row[index] = activeRowspans[index].text;
          activeRowspans[index].remaining--;
        }
      }
      matrix.push(row);
    }
  });
  if (matrix.length < 1) throw new Error("Le document Word doit contenir au moins un tableau");
  return matrix;
}

/**
 * Lit un tableau Word simple (1 ligne d'en-tête + données) sans logique de fusions complexes.
 * Retourne une matrice string[][] où chaque ligne est un tableau de cellules textuelles.
 * Utilisée pour les imports Enseignants, Apprenants, Utilisateurs qui ont des tableaux simples.
 */
export async function lireTableauWordSimple(filePath: string): Promise<string[][]> {
  let result: { value: string };
  try {
    result = await mammoth.convertToHtml({ path: filePath });
  } catch (e: any) {
    throw new Error("Fichier Word invalide ou corrompu: " + (e?.message || String(e)));
  }
  const $ = cheerio.load(result.value);
  if ($('table').length === 0) throw new Error("Impossible de trouver un tableau dans le document Word");

  const matrix: string[][] = [];
  $('table').first().find('tr').each((_i, el) => {
    const cells: string[] = [];
    $(el).find('td, th').each((_j, cell) => {
      cells.push(normalizeText($(cell).text()));
    });
    if (cells.some(c => c !== '')) matrix.push(cells);
  });
  if (matrix.length < 1) throw new Error("Le document Word doit contenir au moins un tableau");
  return matrix;
}

async function lireTableauExcel(filePath: string): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.getWorksheet("UE");
  if (!ws) throw new Error("Feuille 'UE' introuvable dans le fichier Excel");

  const matrix: string[][] = [];
  const rowCount = ws.rowCount;
  const colCount = ws.columnCount || 11;

  const masterCells: Set<string> = new Set();
  if (ws.model.merges) {
    for (const mergeStr of ws.model.merges as string[]) {
      const parts = mergeStr.split(':');
      if (parts.length !== 2) continue;
      const from = parseCellRef(parts[0]);
      if (!from) continue;
      masterCells.add(`${from.row}-${columnLetterToIndex(parts[0].replace(/\d+/, ''))}`);
    }
  }

  for (let i = 1; i <= rowCount; i++) {
    const row = ws.getRow(i);
    const cells: string[] = [];
    for (let j = 1; j <= colCount; j++) {
      const cell = row.getCell(j);
      const key = `${i}-${j}`;
      let val: any = cell.value;
      if (!masterCells.has(key) && val !== undefined && val !== null && val !== '') {
        if (isPartOfMerge(ws, i, j, masterCells)) val = undefined;
      }
      cells.push(val ? String(val).replace(/\s+/g, ' ').trim() : '');
    }
    if (cells.some(c => c !== '')) matrix.push(cells);
  }
  if (matrix.length < 2) throw new Error("Le fichier Excel doit contenir un tableau avec au moins une ligne d'en-têtes et une ligne de données");
  return matrix;
}

/**
 * Crée un document Word (.docx) simple avec un tableau ayant les colonnes indiquées.
 * Utilisé pour les templates Word d'import.
 */
async function createWordTemplate(headers: string[], title: string): Promise<Buffer> {
  const headerCells = headers.map(h => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 9, font: "Calibri" })] }), ],
    borders: { top: { style: "single", size: 4, color: "999999" }, bottom: { style: "single", size: 4, color: "999999" }, left: { style: "single", size: 4, color: "999999" }, right: { style: "single", size: 4, color: "999999" } },
    shading: { fill: "1E40AF" },
  }));

  const table = new Table({
    rows: [new TableRow({ children: headerCells })],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: { top: { style: "single", size: 4, color: "999999" }, bottom: { style: "single", size: 4, color: "999999" }, left: { style: "single", size: 4, color: "999999" }, right: { style: "single", size: 4, color: "999999" } },
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 16, font: "Calibri" })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 200 } }),
        table,
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

// ===========================================================================
//  CONTROLLER
// ===========================================================================

export default class ExcelController {

  // ========================================================================
  //  UE (COURS) — Import / Export / Template
  // ========================================================================

  /**
   * GET /excel/ue/template
   * Télécharge un fichier Excel vierge avec les colonnes attendues pour les UE.
   */
  static async downloadUeTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet("UE");

      ws.columns = [
        { header: "Code", key: "code", width: 15 },
        { header: "Intitulé", key: "intitule", width: 40 },
        { header: "Crédit", key: "credit", width: 10 },
        { header: "Crédit ECTS", key: "creditEcts", width: 12 },
        { header: "Semestre", key: "semestre", width: 14 },
        { header: "Coefficient", key: "coefficient", width: 12 },
        { header: "Volume horaire", key: "volumeHoraire", width: 16 },
        { header: "Obligatoire (O/N)", key: "estObligatoire", width: 18 },
        { header: "Objectifs", key: "objectifs", width: 30 },
        { header: "Parcours (titre)", key: "parcours", width: 25 },
        { header: "Enseignant (email)", key: "enseignantEmail", width: 28 },
      ];

      const headerRow = ws.getRow(1);
      applyHeaderStyle(headerRow);

      // Ligne d'exemple (optionnelle)
      ws.addRow({
        code: "INF101",
        intitule: "Introduction à la programmation",
        credit: 4,
        creditEcts: 6,
        semestre: "semestre1",
        coefficient: 3,
        volumeHoraire: 40,
        estObligatoire: "O",
        objectifs: "Acquérir les bases de la programmation",
        parcours: "Licence Informatique",
        enseignantEmail: "prof@example.com",
      });

      // Ajouter une feuille d'instructions
      const instr = wb.addWorksheet("Instructions");
      instr.addRow(["Import des Unités d'Enseignement (UE)"]);
      instr.addRow([]);
      instr.addRow(["Colonnes obligatoires : Code, Intitulé, Parcours"]);
      instr.addRow(["Semestre : semestre1 à semestre6"]);
      instr.addRow(["Obligatoire : O (oui) ou N (non), laisser vide = non"]);
      instr.addRow(["Enseignant : utiliser l'adresse email de l'enseignant"]);
      instr.addRow(["Parcours : le titre exact du parcours existant"]);
      instr.addRow([]);
      instr.addRow(["La première ligne d'exemple peut être supprimée."]);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"template-ue.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error) {
      console.error("Erreur téléchargement template UE:", error);
      return res.status(500).json({ success: false, message: "Erreur lors de la génération du template" });
    }
  }

  /**
   * POST /excel/ue/import
   * Importe des UE depuis un fichier Excel.
   */
  static async importUeAsync(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });

    try {
      const job = await QueueService.getInstance().add(
        QUEUE_NAMES.EXCEL_IMPORT,
        { filePath: req.file.path, importType: 'ue', utilisateurId: (req as any).utilisateurId },
      );
      return res.status(202).json({ success: true, status: 'queued', jobId: job.id });
    } catch (error: any) {
      fs.unlink(req.file.path, () => {});
      return res.status(503).json({ success: false, message: 'File Excel indisponible' });
    }
  }

  static async importEnseignantsAsync(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    try {
      const job = await QueueService.getInstance().add(
        QUEUE_NAMES.EXCEL_IMPORT,
        { filePath: req.file.path, importType: 'enseignants', utilisateurId: (req as any).utilisateurId },
      );
      return res.status(202).json({ success: true, status: 'queued', jobId: job.id });
    } catch (error: any) {
      fs.unlink(req.file.path, () => {});
      return res.status(503).json({ success: false, message: 'File Excel indisponible' });
    }
  }

    static async importUe(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });

    const results: { code?: string; intitule?: string; ecueCode?: string; ligne?: number; semestre?: string; categorie?: string | null; statut: string; message: string; coursId?: number; ecueLibelle?: string; type?: string | null; cmHoraire?: number; tdTpHoraire?: number; tpeHoraire?: number; creditEcts?: number; enseignant?: string | null; enseignantId?: number }[] = [];
    const filePath = req.file.path;
    const isWord = /\.docx$/i.test(req.file.originalname);
    const enseignantIds = new Set<number>();

    try {
      const matrix = isWord ? await lireTableauWord(filePath) : await lireTableauExcel(filePath);
      if (matrix.length < 1) return res.status(400).json({ success: false, message: "Le fichier ne contient aucun tableau exploitable" });

      const format = detectFormat(matrix);
      const semestreDemande = (req.body.semestre as string) || '';
      const parcoursTitre = (req.body.parcoursTitre as string) || '';
      let imported = 0, errors = 0, ignored = 0;
      const ignoredRows: { ligne: number; raison: string }[] = [];
      const hasImportableData = matrix.slice(1).some(row => {
        const text = row.map(cell => normalizeText(cell)).join(' ').toUpperCase();
        return text.length > 0
          && !text.includes('CODE DE L')
          && !text.includes('CONTENUS DES ENSEIGNEMENTS')
          && text !== 'UE ECUE'
          && !text.includes("UNITES D'ENSEIGNEMENT")
          && !text.includes('TOTAL SEMESTRE');
      });
      if (!hasImportableData) {
        return res.status(200).json({ success: true, importedCount: 0, errorCount: 0, ignoredCount: matrix.length - 1, details: [], message: "Maquette vide importée" });
      }

      if (format === 'A') {
        const headerRow = matrix[0].map(c => c.toUpperCase());
        const col = (label: string, fallback: number): number => {
          const idx = headerRow.findIndex(v => v.includes(label));
          return idx >= 0 ? idx + 1 : fallback;
        };
        for (let i = 1; i < matrix.length; i++) {
          const row = matrix[i];
          const code = row[col('CODE DE L', 1) - 1] || '';
          const intitule = row[col('INTITULE DE L', 2) - 1] || '';
          const parcours = parcoursTitre || row[col('INTITULE DE L', 2)];
          if (!code || !intitule || !parcours) {
            errors++;
            results.push({ code, intitule, ligne: i + 1, semestre: semestreDemande || 'semestre1', categorie: null, statut: "erreur", message: "Code, intitulé et parcours sont obligatoires" });
            continue;
          }
          try {
            const p = await resolveParcours(parcours);
            if (!p) { errors++; results.push({ code, intitule, ligne: i + 1, semestre: semestreDemande || 'semestre1', categorie: null, statut: "erreur", message: `Parcours "${parcours}" introuvable` }); continue; }
            const credit = parseInt(row[col('CREDIT', 10) - 1] || '0') || 0;
            const creditEcts = credit || parseFloat(row[col('CREDIT', 10) - 1] || '0') || 0;
            const cmHoraire = parseInt(row[col('CM', 5) - 1] || '0') || 0;
            const tdTpHoraire = parseInt(row[col('TD/TP', 6) - 1] || '0') || 0;
            const tpeHoraire = parseInt(row[col('TPE', 7) - 1] || '0') || 0;
            const ecueType = (row[col('TYPE', 4) - 1] || '').toUpperCase() || null;
            const [cours, created] = await Cours.findOrCreate({
              where: { code, parcoursId: p.id },
              defaults: { code, intitule, parcoursId: p.id, credit, creditEcts, semestre: semestreDemande || 'semestre1', coefficient: credit, volumeHoraire: cmHoraire + tdTpHoraire, estObligatoire: true, objectifs: null, enseignantId: null, categorieUe: null },
            } as any);
            if (!created) await cours.update({ intitule, credit, creditEcts, semestre: semestreDemande || 'semestre1', coefficient: credit, volumeHoraire: cmHoraire + tdTpHoraire, estObligatoire: true, objectifs: null } as any);
            const ecueCode = row[col('CONTENUS DES ENSEIGNEMENTS', 3) - 1] || `${code}-${i}`;
            const ecueLibelle = row[col('CONTENUS DES ENSEIGNEMENTS', 3) - 1] || intitule;
            if (ecueCode) {
              const [ecue, ecueCreated] = await Ecue.findOrCreate({ where: { code: ecueCode, coursId: cours.id }, defaults: { code: ecueCode, libelle: ecueLibelle, coursId: cours.id, creditEcts, cmHoraire, tdTpHoraire, tpeHoraire, type: ['F', 'T', 'S', 'C', 'L', 'M'].includes(ecueType || '') ? ecueType : null, enseignantId: null } as any });
              if (!ecueCreated) await ecue.update({ libelle: ecueLibelle, creditEcts, cmHoraire, tdTpHoraire, tpeHoraire, type: ecueType } as any);
              imported++;
              const enseignantId = (ecue.enseignantId as unknown as number) || null;
              if (enseignantId) enseignantIds.add(enseignantId);
              results.push({ code, intitule, ecueCode, ligne: i + 1, semestre: semestreDemande || 'semestre1', categorie: null, statut: "succès", message: created ? "Créé" : "Mis à jour", coursId: cours.id, ecueLibelle, type: ecueType, cmHoraire, tdTpHoraire, tpeHoraire, creditEcts, enseignantId: enseignantId as number | undefined });
            }
          } catch (err: any) { errors++; results.push({ code, intitule, ligne: i + 1, semestre: semestreDemande || 'semestre1', categorie: null, statut: "erreur", message: err.message }); }
        }
      } else {
        // FORMAT B
        let currentCategorieUe: 'MINEURE' | 'MAJEURE' | 'LIBRE' | null = null;
        let blockUeCode = '';
        let blockUeIntitule = '';
        let blockSemestre = '';
        let blockEcueData: Array<{ ecueCode: string; ecueLibelle: string; cmHoraire: number; tdTpHoraire: number; tpeHoraire: number; creditEcts: number; type: string | null; ligne: number }> = [];

        if (!parcoursTitre) return res.status(400).json({ success: false, message: "Le parcours (parcoursTitre) est obligatoire pour le Format B" });
        const parcours = await resolveParcours(parcoursTitre);
        if (!parcours) return res.status(400).json({ success: false, message: `Parcours "${parcoursTitre}" introuvable` });
        const parcoursId = parcours.id;

        const detectSemestre = (text: string): string | null => {
          const match = normalizeText(text).match(/(?:TOTAL\s+)?SEMESTRE\s*([1-6])/i);
          return match ? `semestre${match[1]}` : null;
        };

        const detectNextSemestre = (rowIndex: number): string => {
          for (let index = rowIndex; index < matrix.length; index++) {
            const detected = detectSemestre(matrix[index].join(' '));
            if (detected) return detected;
          }
          return semestreDemande || 'semestre1';
        };

        const parseMatiereCell = (cellValue: string): { ecueCode: string; ecueLibelle: string } | null => {
          const text = normalizeText(cellValue).trim();
          if (!text) return null;
          const match = text.match(/^(\d+)[\.\-]([A-Z0-9]+)\s*:\s*(.+)$/i);
          if (match) return { ecueCode: match[2].trim(), ecueLibelle: match[3].trim() };
          const match2 = text.match(/^([A-Z0-9]+)\s*:\s*(.+)$/i);
          if (match2) return { ecueCode: match2[1].trim(), ecueLibelle: match2[2].trim() };
          return null;
        };

        const flushBlock = async (): Promise<void> => {
          if (!blockUeCode) return;
          try {
            const creditSum = blockEcueData.reduce((s, e) => s + e.creditEcts, 0);
            const volumeSum = blockEcueData.reduce((s, e) => s + e.cmHoraire + e.tdTpHoraire, 0);
            const [cours, created] = await Cours.findOrCreate({
              where: { code: blockUeCode, parcoursId },
              defaults: { code: blockUeCode, intitule: blockUeIntitule, parcoursId, credit: creditSum || null, creditEcts: creditSum || null, semestre: blockSemestre || semestreDemande || 'semestre1', coefficient: creditSum || null, volumeHoraire: volumeSum || null, estObligatoire: true, objectifs: null, enseignantId: null, categorieUe: currentCategorieUe },
            } as any);
            if (!created) await cours.update({ intitule: blockUeIntitule, credit: creditSum || null, creditEcts: creditSum || null, semestre: blockSemestre || semestreDemande || 'semestre1', coefficient: creditSum || null, volumeHoraire: volumeSum || null, estObligatoire: true, objectifs: null, categorieUe: currentCategorieUe } as any);
            for (const ed of blockEcueData) {
              const [ecue, ecueCreated] = await Ecue.findOrCreate({ where: { code: ed.ecueCode, coursId: cours.id }, defaults: { code: ed.ecueCode, libelle: ed.ecueLibelle, coursId: cours.id, creditEcts: ed.creditEcts, cmHoraire: ed.cmHoraire, tdTpHoraire: ed.tdTpHoraire, tpeHoraire: ed.tpeHoraire, type: ed.type, enseignantId: null } as any });
              if (!ecueCreated) await ecue.update({ libelle: ed.ecueLibelle, creditEcts: ed.creditEcts, cmHoraire: ed.cmHoraire, tdTpHoraire: ed.tdTpHoraire, tpeHoraire: ed.tpeHoraire, type: ed.type } as any);
imported++;
               const enseignantId = (ecue.enseignantId as unknown as number) || null;
               if (enseignantId) enseignantIds.add(enseignantId);
               results.push({ code: blockUeCode, intitule: blockUeIntitule, ecueCode: ed.ecueCode, ligne: ed.ligne, semestre: blockSemestre || semestreDemande || 'semestre1', categorie: currentCategorieUe, statut: "succès", message: ecueCreated ? "Créé" : "Mis à jour", coursId: cours.id, ecueLibelle: ed.ecueLibelle, type: ed.type, cmHoraire: ed.cmHoraire, tdTpHoraire: ed.tdTpHoraire, tpeHoraire: ed.tpeHoraire, creditEcts: ed.creditEcts, enseignantId: enseignantId as number | undefined });
             }
          } catch (err: any) { console.error(`Erreur flush block UE ${blockUeCode}:`, err.message); }
          blockEcueData = [];
        };

        for (let i = 2; i < matrix.length; i++) {
          const row = matrix[i];
          const isSection = row.some(c => { const t = normalizeText(c).toUpperCase(); return t.includes('UNITES D\'ENSEIGNEMENT MINEURES') || t.includes('UNITES D\'ENSEIGNEMENT MAJEURES') || t.includes('UNITES D\'ENSEIGNEMENT LIBRES'); });
           if (isSection) { await flushBlock(); const ts = row.map(c => normalizeText(c).toUpperCase()).join(' '); if (ts.includes('MINEURES')) currentCategorieUe = 'MINEURE'; else if (ts.includes('MAJEURES')) currentCategorieUe = 'MAJEURE'; else if (ts.includes('LIBRES')) currentCategorieUe = 'LIBRE'; ignored++; ignoredRows.push({ ligne: i + 1, raison: `Ligne ignorée : section ${currentCategorieUe}` }); continue; }
           const rowSemestre = detectSemestre(row.join(' '));
           if (rowSemestre && row.map(c => normalizeText(c).toUpperCase()).join(' ').includes('TOTAL')) {
             await flushBlock();
             ignored++;
             ignoredRows.push({ ligne: i + 1, raison: `Ligne ignorée : total ${rowSemestre}` });
             continue;
           }
          const rowHeaderText = row.map(c => normalizeText(c).toUpperCase()).join(' ');
          if (rowHeaderText.includes('CODE DE L') || rowHeaderText.includes('CONTENUS DES ENSEIGNEMENTS') || rowHeaderText === 'UE ECUE' || rowHeaderText.includes('TYPE') || rowHeaderText.includes('TOTAL PRESENTIEL')) {
            continue;
          }

          const normalizedRow = row.map(cell => normalizeText(cell || ''));
          const typeIndex = normalizedRow.findIndex(cell => /^[FTSCLM]$/i.test(cell));
          const isContinuationCode = /^\d+[\.\-][A-Z0-9]+\s*:/i.test(normalizedRow[0]);
          const cellCodeUE = isContinuationCode ? '' : normalizedRow[0];
          const cellIntituleUE = isContinuationCode ? '' : normalizedRow[1];
          const cellMatiere = isContinuationCode ? normalizedRow[0] : normalizedRow[2];
          const metricStart = typeIndex >= 0 ? typeIndex + 1 : 4;
          const cellType = typeIndex >= 0 ? normalizedRow[typeIndex] : '';
          const cellCM = normalizedRow[metricStart] || '';
          const cellTD = normalizedRow[metricStart + 1] || '';
          const cellTPE = normalizedRow[metricStart + 2] || '';
          const cellCredit = normalizedRow[metricStart + 5] || normalizedRow[9] || '';
          if (!cellCodeUE && !cellMatiere) continue;

          const isNewBlock = cellCodeUE !== '' && cellCodeUE !== blockUeCode;
          const isRowspanContinuation = cellCodeUE === '' && cellMatiere !== '';
          const isUeWithoutMatiere = cellCodeUE !== '' && cellMatiere === '';
          const isSameUeNewMatiere = cellCodeUE !== '' && cellCodeUE === blockUeCode && cellMatiere !== '';

          if (isNewBlock || isUeWithoutMatiere) {
            await flushBlock();
            blockUeCode = cellCodeUE;
            blockUeIntitule = cellIntituleUE || cellCodeUE;
            blockSemestre = detectNextSemestre(i);
            const parsed = parseMatiereCell(cellMatiere);
            const cmH = parseInt(cellCM) || 0, tdT = parseInt(cellTD) || 0, tpe = parseInt(cellTPE) || 0, cr = parseInt(cellCredit) || 0;
            const et = cellType.toUpperCase() || null;
            const vt = ['F', 'T', 'S', 'C', 'L', 'M'].includes(et || '') ? et : null;
            blockEcueData.push(parsed
              ? { ecueCode: parsed.ecueCode, ecueLibelle: parsed.ecueLibelle, cmHoraire: cmH, tdTpHoraire: tdT, tpeHoraire: tpe, creditEcts: cr, type: vt, ligne: i + 1 }
              : { ecueCode: blockUeCode, ecueLibelle: blockUeIntitule || blockUeCode, cmHoraire: cmH, tdTpHoraire: tdT, tpeHoraire: tpe, creditEcts: cr, type: vt, ligne: i + 1 });
          } else if (isRowspanContinuation || isSameUeNewMatiere) {
            const parsed = parseMatiereCell(cellMatiere);
            const cmH = parseInt(cellCM) || 0, tdT = parseInt(cellTD) || 0, tpe = parseInt(cellTPE) || 0, cr = parseInt(cellCredit) || 0;
            const et = cellType.toUpperCase() || null;
            const vt = ['F', 'T', 'S', 'C', 'L', 'M'].includes(et || '') ? et : null;
            if (parsed) blockEcueData.push({ ecueCode: parsed.ecueCode, ecueLibelle: parsed.ecueLibelle, cmHoraire: cmH, tdTpHoraire: tdT, tpeHoraire: tpe, creditEcts: cr, type: vt, ligne: i + 1 });
          }
        }
        await flushBlock();
      }

      // Résolution groupée des noms d'enseignants (UNE requête)
      let enseignantMap: Map<number, string> = new Map();
      if (enseignantIds.size > 0) {
        try {
          const enseignants = await Enseignant.findAll({
            where: { id: { [Op.in]: Array.from(enseignantIds) } },
            include: [{ association: Enseignant.associations.utilisateur, attributes: ["nom", "prenoms"] }],
          });
          for (const ens of enseignants) {
            const user = (ens as any).utilisateur;
            if (user) {
              enseignantMap.set(ens.id as unknown as number, `${user.prenoms} ${user.nom}`);
            }
          }
        } catch { /* ignore, enseignant restera null */ }
      }
      for (const r of results) {
        if (r.enseignantId && enseignantMap.has(r.enseignantId)) {
          r.enseignant = enseignantMap.get(r.enseignantId)!;
        } else if (r) {
          r.enseignant = null;
        }
      }

      return res.status(200).json({ success: true, importedCount: imported, errorCount: errors, ignoredCount: ignored, details: results, ignoredRows: ignoredRows });
    } catch (error: any) {
      console.error("Erreur import UE:", error);
      return res.status(500).json({ success: false, message: error.message });
    } finally {
      fs.unlink(filePath, () => {});
    }
  }

  /**
   * GET /excel/ue/export
   * Exporte toutes les UE (Cours) au format Excel.
   */
  static async exportUe(req: Request, res: Response): Promise<Response> {
    try {
      const coursList = await Cours.findAll({
        include: [
          { association: Cours.associations.parcours, attributes: ["titre"] },
          {
            association: Cours.associations.enseignant,
            attributes: ["id"],
            include: [{ association: Enseignant.associations.utilisateur, attributes: ["email"] }],
          },
        ],
      });

      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet(sanitizeSheetName("UE"));

      ws.columns = [
        { header: "Code", key: "code", width: 15 },
        { header: "Intitulé", key: "intitule", width: 40 },
        { header: "Crédit", key: "credit", width: 10 },
        { header: "Crédit ECTS", key: "creditEcts", width: 12 },
        { header: "Semestre", key: "semestre", width: 14 },
        { header: "Coefficient", key: "coefficient", width: 12 },
        { header: "Volume horaire", key: "volumeHoraire", width: 16 },
        { header: "Obligatoire", key: "estObligatoire", width: 14 },
        { header: "Objectifs", key: "objectifs", width: 30 },
        { header: "Parcours", key: "parcours", width: 25 },
        { header: "Enseignant", key: "enseignantEmail", width: 28 },
      ];

      applyHeaderStyle(ws.getRow(1));

      coursList.forEach((c, i) => {
        const row = ws.addRow({
          code: c.code,
          intitule: c.intitule,
          credit: c.credit,
          creditEcts: c.creditEcts,
          semestre: c.semestre,
          coefficient: c.coefficient,
          volumeHoraire: c.volumeHoraire,
          estObligatoire: c.estObligatoire ? "Oui" : "Non",
          objectifs: c.objectifs,
          parcours: (c as any).parcours?.titre ?? "",
          enseignantEmail: (c as any).enseignant?.utilisateur?.email ?? "",
        });
        applyDataStyle(row);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"ue.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error: any) {
      console.error("Erreur export UE:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /excel/ue/export-word
   * Exporte les UE/ECUE dans la structure de tableau des maquettes ESA, rempli avec les données réelles.
   * Query: parcoursTitre (obligatoire).
   */
  static async exportUeWord(req: Request, res: Response): Promise<Response> {
    try {
      const parcoursTitre = String(req.query.parcoursTitre || req.query.modele || "").trim();
      if (!parcoursTitre) {
        return res.status(400).json({ success: false, message: "parcoursTitre requis" });
      }

      const parcours = await resolveParcours(parcoursTitre);
      if (!parcours) {
        return res.status(404).json({ success: false, message: `Parcours "${parcoursTitre}" introuvable` });
      }
      const parcoursId = parcours.id;

      const coursList = await Cours.findAll({
        where: { parcoursId },
        include: [
          { association: Cours.associations.ecues, order: [["code", "ASC"]] },
          { association: Cours.associations.parcours, attributes: ["titre", "type", "grade"] },
        ],
      }) as any;

      if (coursList.length === 0) {
        return res.status(404).json({ success: false, message: `Aucun UE trouvé pour le parcours "${parcoursTitre}"` });
      }

      const typeLabel = parcours.type ? `${parcours.type} ${parcours.grade || ""}`.trim() : parcours.type || "";
      const firstCours = coursList[0];
      const annee = (firstCours as any).annee || new Date().getFullYear().toString();
      const title = `${typeLabel} – ${annee}`;
      const slug = `${parcours.type?.toLowerCase() || "master"}-${parcoursTitre.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

      // Helpers
      const thinBorder = {
        top: { style: "single" as any, size: 4, color: "999999" },
        bottom: { style: "single" as any, size: 4, color: "999999" },
        left: { style: "single" as any, size: 4, color: "999999" },
        right: { style: "single" as any, size: 4, color: "999999" },
        insideH: { style: "single" as any, size: 4, color: "999999" },
        insideV: { style: "single" as any, size: 4, color: "999999" },
      };

      const makeHeaderCell = (text: string, colSpan: number = 1, isMerged = false): TableCell => {
        const para = new Paragraph({
          children: [new TextRun({ text, bold: true, size: 9, font: "Calibri" })],
          alignment: AlignmentType.CENTER,
          verticalAlign: VerticalAlign.CENTER,
        } as any);
        const opts: Record<string, any> = {
          children: [para],
          borders: thinBorder,
          shading: { fill: "1E40AF" },
        };
        if (colSpan > 1) opts.gridSpan = new GridSpan(colSpan);
        if (isMerged) opts.verticalMerge = new VerticalMerge({ merge: "continue" } as any);
        return new TableCell(opts as any);
      };

      const makeDataCell = (text: string, vMerge?: VerticalMerge): TableCell => {
        const para = new Paragraph({
          children: [new TextRun({ text, size: 9, font: "Calibri" })],
          alignment: AlignmentType.CENTER,
          verticalAlign: VerticalAlign.CENTER,
        } as any);
        const opts: Record<string, any> = {
          children: [para],
          borders: thinBorder,
        };
        if (vMerge) opts.verticalMerge = vMerge;
        return new TableCell(opts as any);
      };

      const makeSectionCell = (text: string): TableCell => {
        const para = new Paragraph({
          children: [new TextRun({ text, bold: true, size: 10, font: "Calibri" })],
          alignment: AlignmentType.CENTER,
          verticalAlign: VerticalAlign.CENTER,
        } as any);
        return new TableCell({
          gridSpan: new GridSpan(11),
          children: [para],
          borders: thinBorder,
          shading: { fill: "D9E2F3" },
        } as any);
      };

      // Construire le document
      const children: any[] = [];

      children.push(new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 18, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${parcours.titre} — ${annee}`, size: 12, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
      }));
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

      // Regrouper par semestre
      const semMap: Record<string, any[]> = {};
      for (const cours of coursList) {
        const s: string = cours.semestre || "semestre1";
        if (!semMap[s]) semMap[s] = [];
        semMap[s].push(cours);
      }
      const sortedSemestres = Object.keys(semMap).sort((a: string, b: string) => {
        return parseInt(a.replace("semestre", "")) - parseInt(b.replace("semestre", ""));
      });

      for (const sem of sortedSemestres) {
        const coursInSem = semMap[sem];
        const mineures = coursInSem.filter((c: any) => c.categorieUe === "MINEURE").sort((a: any, b: any) => a.code.localeCompare(b.code));
        const majeures = coursInSem.filter((c: any) => c.categorieUe === "MAJEURE").sort((a: any, b: any) => a.code.localeCompare(b.code));
        const libres = coursInSem.filter((c: any) => c.categorieUe === "LIBRE").sort((a: any, b: any) => a.code.localeCompare(b.code));

        const allSections = [
          ...mineures.map(c => ({ data: c, section: "UNITES D'ENSEIGNEMENT MINEURES" })),
          ...majeures.map(c => ({ data: c, section: "UNITES D'ENSEIGNEMENT MAJEURES" })),
          ...libres.map(c => ({ data: c, section: "UNITES D'ENSEIGNEMENT LIBRES" })),
        ];

        const rows: TableRow[] = [];

        // Header level 1
        rows.push(new TableRow({
          children: [
            makeHeaderCell("CODE DE L'UE"),
            makeHeaderCell("CONTENUS DES ENSEIGNEMENTS", 2),
            makeHeaderCell("TYPE"),
            makeHeaderCell("CM"),
            makeHeaderCell("TD/TP"),
            makeHeaderCell("TPE"),
            makeHeaderCell("TOTAL"),
            makeHeaderCell("TOTAL PRESENTIEL"),
            makeHeaderCell("CREDIT"),
            makeHeaderCell("ENSEIGNANT/QUALIFICATION/STATUT"),
          ],
        }));

        // Header level 2
        rows.push(new TableRow({
          children: [
            makeHeaderCell(""),
            makeHeaderCell("UE"),
            makeHeaderCell("ECUE"),
            makeHeaderCell("TYPE"),
            makeHeaderCell("CM"),
            makeHeaderCell("TD/TP"),
            makeHeaderCell("TPE"),
            makeHeaderCell("TOTAL"),
            makeHeaderCell("TOTAL PRESENTIEL"),
            makeHeaderCell("CREDIT"),
            makeHeaderCell("ENSEIGNANT/QUALIFICATION/STATUT"),
          ],
        }));

        let prevSection = "";
        for (const { data: cours, section } of allSections) {
          if (section !== prevSection) {
            rows.push(new TableRow({ children: [makeSectionCell(section)] }));
            prevSection = section;
          }

          const ecues = cours.ecues || [];
          if (ecues.length === 0) {
            rows.push(new TableRow({
              children: [
                makeDataCell(cours.code),
                makeDataCell(cours.intitule),
                makeDataCell(""), makeDataCell(""), makeDataCell(""),
                makeDataCell(""), makeDataCell(""), makeDataCell(""),
                makeDataCell(String(cours.credit || "")), makeDataCell(""),
              ],
            }));
          } else {
            const ueVM = ecues.length > 1 ? new VerticalMerge({ merge: "restart" } as any) : undefined;
            rows.push(new TableRow({
              children: [
                makeDataCell(cours.code, ueVM),
                makeDataCell(cours.intitule, ueVM),
                makeDataCell(ecues[0].type || ""),
                makeDataCell(String(ecues[0].cmHoraire || "")),
                makeDataCell(String(ecues[0].tdTpHoraire || "")),
                makeDataCell(String(ecues[0].tpeHoraire || "")),
                makeDataCell(String((ecues[0].cmHoraire || 0) + (ecues[0].tdTpHoraire || 0) + (ecues[0].tpeHoraire || 0))),
                makeDataCell(String((ecues[0].cmHoraire || 0) + (ecues[0].tdTpHoraire || 0) + (ecues[0].tpeHoraire || 0))),
                makeDataCell(String(ecues[0].creditEcts || "")),
                makeDataCell(""),
              ],
            }));
            for (let i = 1; i < ecues.length; i++) {
              const vmCont = new VerticalMerge({ merge: "continue" } as any);
              rows.push(new TableRow({
                children: [
                  makeDataCell("", vmCont),
                  makeDataCell("", vmCont),
                  makeDataCell(ecues[i].type || ""),
                  makeDataCell(String(ecues[i].cmHoraire || "")),
                  makeDataCell(String(ecues[i].tdTpHoraire || "")),
                  makeDataCell(String(ecues[i].tpeHoraire || "")),
                  makeDataCell(String((ecues[i].cmHoraire || 0) + (ecues[i].tdTpHoraire || 0) + (ecues[i].tpeHoraire || 0))),
                  makeDataCell(String((ecues[i].cmHoraire || 0) + (ecues[i].tdTpHoraire || 0) + (ecues[i].tpeHoraire || 0))),
                  makeDataCell(String(ecues[i].creditEcts || "")),
                  makeDataCell(""),
                ],
              }));
            }
          }
        }

        const semNum = sem.replace("semestre", "");
        rows.push(new TableRow({
          children: [makeDataCell(`TOTAL SEMESTRE ${semNum}`)],
        }));

        const table = new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          borders: thinBorder,
        });

        children.push(table);
        children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
      }

      const doc = new Document({
        sections: [{ properties: {}, children }],
      });

      const buffer = await Packer.toBuffer(doc);
      const filename = `maquette-${slug}.docx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.status(200).send(buffer);

    } catch (error: any) {
      console.error("Erreur export Word UE:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

// ========================================================================
//  ENSEIGNANTS — Import / Export / Template
// ========================================================================

/**
 * GET /excel/enseignants/template
 */
static async downloadEnseignantTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet("Enseignants");

      ws.columns = [
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Identifiant", key: "identifiant", width: 18 },
        { header: "Contact", key: "contact", width: 18 },
        { header: "Fonction", key: "fonction", width: 25 },
        { header: "Date naissance (JJ/MM/AAAA)", key: "dateNaissance", width: 28 },
        { header: "Lieu naissance", key: "lieuNaissance", width: 20 },
      ];

      applyHeaderStyle(ws.getRow(1));

      ws.addRow({
        nom: "Dupont",
        prenoms: "Jean Marc",
        email: "jean.dupont@ecole.com",
        identifiant: "jdupont",
        contact: "+221 77 123 45 67",
        fonction: "Professeur de Mathématiques",
        dateNaissance: "15/06/1980",
        lieuNaissance: "Dakar",
      });

      const instr = wb.addWorksheet("Instructions");
      instr.addRow(["Import des Enseignants"]);
      instr.addRow([]);
      instr.addRow(["Colonnes obligatoires : Nom, Prénoms, Email, Identifiant"]);
      instr.addRow(["Un mot de passe temporaire sera généré automatiquement."]);
      instr.addRow(["L'email doit être unique — si déjà existant, la ligne sera ignorée."]);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"template-enseignants.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error) {
      console.error("Erreur template enseignants:", error);
      return res.status(500).json({ success: false, message: "Erreur lors de la génération du template" });
    }
  }

  /**
 * GET /excel/enseignants/template-word
 * Télécharge un template Word pour l'import des enseignants.
 */
  static async downloadEnseignantWordTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const headers = ["Nom", "Prénoms", "Email", "Identifiant", "Contact", "Fonction", "Date naissance (JJ/MM/AAAA)", "Lieu naissance"];
      const buffer = await createWordTemplate(headers, "Template Enseignants");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", "attachment; filename=\"template-enseignants.docx\"");
      return res.status(200).send(buffer);
    } catch (error) {
      console.error("Erreur template Word enseignants:", error);
      return res.status(500).json({ success: false, message: "Erreur lors de la génération du template Word" });
    }
  }

  /**
    * POST /excel/enseignants/import
    * Supporte .xlsx et .docx.
    */
  static async importEnseignants(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    const filePath = req.file.path;
    const results: { email?: string; statut: string; message: string; motDePasse?: string }[] = [];
    const isWord = /\.docx$/i.test(req.file.originalname);

    try {
      let rows: string[][];
      if (isWord) {
        rows = await lireTableauWordSimple(filePath);
      } else {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(filePath);
        const ws = wb.getWorksheet("Enseignants");
        if (!ws) return res.status(400).json({ success: false, message: "Feuille 'Enseignants' introuvable" });
        rows = [];
        for (let i = 2; i <= ws.rowCount; i++) {
          const row = ws.getRow(i);
          const cells: string[] = [];
          for (let j = 1; j <= 8; j++) cells.push(row.getCell(j)?.toString()?.trim() || '');
          if (cells.some(c => c !== '')) rows.push(cells);
        }
      }
      if (rows.length < 1) return res.status(400).json({ success: false, message: "Le fichier ne contient aucune ligne exploitable" });

      let imported = 0, errors = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nom = row[0] || '';
        const prenoms = row[1] || '';
        const email = row[2] || '';
        const identifiant = row[3] || '';
        const contact = row[4] || null;
        const fonction = row[5] || null;
        const dateNaissance = parseExcelDate(row[6]);
        const lieuNaissance = row[7] || null;

        if (!nom || !prenoms || !email || !identifiant) {
          errors++;
          results.push({ email, statut: "erreur", message: "Nom, prénoms, email et identifiant sont obligatoires" });
          continue;
        }

        try {
          const existant = await Utilisateur.findOne({ where: { email } });
          if (existant) {
            errors++;
            results.push({ email, statut: "erreur", message: "Cet email est déjà utilisé" });
            continue;
          }

          const tempPassword = generateTempPassword();
          const utilisateur = await Utilisateur.create({
            nom, prenoms,
            email: email!, identifiant: identifiant!,
            contact: contact || '',
            motDePasse: bcrypt.hashSync(tempPassword, 12),
            role: RolesUtilisateur.ENSEIGNANT,
          });

          await Enseignant.create({
            utilisateurId: utilisateur.id,
            dateNaissance: dateNaissance ?? undefined,
            lieuNaissance: lieuNaissance ?? undefined,
            fonction: fonction ?? undefined,
          } as any);

          imported++;
          results.push({ email, statut: "succès", message: "Enseignant créé", motDePasse: tempPassword });
        } catch (err: any) {
          errors++;
          results.push({ email, statut: "erreur", message: err.message });
        }
      }

      return res.status(200).json({ success: true, importedCount: imported, errorCount: errors, details: results });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    } finally {
      fs.unlink(filePath, () => {});
    }
  }

  /**
   * GET /excel/enseignants/export
   */
  static async exportEnseignants(req: Request, res: Response): Promise<Response> {
    try {
      const enseignants = await Enseignant.findAll({
        include: [{ association: Enseignant.associations.utilisateur }],
      });

      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet(sanitizeSheetName("Enseignants"));

      ws.columns = [
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Identifiant", key: "identifiant", width: 18 },
        { header: "Contact", key: "contact", width: 18 },
        { header: "Fonction", key: "fonction", width: 25 },
        { header: "Date naissance", key: "dateNaissance", width: 18 },
        { header: "Lieu naissance", key: "lieuNaissance", width: 20 },
      ];

      applyHeaderStyle(ws.getRow(1));

      enseignants.forEach((e) => {
        const u = e.utilisateur!;
        const row = ws.addRow({
          nom: u.nom,
          prenoms: u.prenoms,
          email: u.email,
          identifiant: u.identifiant,
          contact: u.contact,
          fonction: e.fonctionAdministrative,
          dateNaissance: e.dateNaissance ? new Date(e.dateNaissance).toLocaleDateString("fr-FR") : "",
          lieuNaissance: e.lieuNaissance,
        });
        applyDataStyle(row);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"enseignants.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========================================================================
  //  APPRENANTS — Import / Export / Template
  // ========================================================================

  /**
   * GET /excel/apprenants/template
   */
  static async downloadApprenantTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet("Apprenants");

      ws.columns = [
        // Colonnes existantes (13)
        { header: "Matricule", key: "matricule", width: 18 },
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 24 },
        { header: "Identifiant", key: "identifiant", width: 16 },
        { header: "Email", key: "email", width: 28 },
        { header: "Téléphone", key: "telephone", width: 18 },
        { header: "Sexe", key: "sexe", width: 8 },
        { header: "Parcours", key: "parcours", width: 26 },
        { header: "Filière", key: "filiere", width: 26 },
        { header: "Classe", key: "classe", width: 18 },
        { header: "Niveau", key: "niveau", width: 16 },
        { header: "Promotion (année académique)", key: "promotion", width: 24 },
        { header: "Salle", key: "salle", width: 20 },
        { header: "Statut dossier", key: "statutDossier", width: 16 },
        // Nouvelles colonnes (Apprenant)
        { header: "Date naissance", key: "dateNaissance", width: 18 },
        { header: "Lieu naissance", key: "lieuNaissance", width: 18 },
        { header: "Nationalité", key: "nationalite", width: 18 },
        { header: "Type pièce identité", key: "typePieceIdentite", width: 20 },
        { header: "Numéro pièce", key: "numeroPiece", width: 20 },
        { header: "Statut handicap", key: "statutHandicap", width: 14 },
        { header: "Nature handicap", key: "natureHandicap", width: 22 },
        { header: "Année obtention Bac", key: "anneeObtentionBac", width: 18 },
        { header: "Série Bac", key: "serieBac", width: 18 },
        { header: "Photo", key: "photo", width: 20 },
        { header: "QR Code", key: "qrCode", width: 20 },
        // Nouvelles colonnes (Adresse)
        { header: "Boîte postale", key: "boitePostale", width: 20 },
        { header: "Quartier", key: "quartier", width: 20 },
        { header: "Ville", key: "ville", width: 20 },
        { header: "Pays", key: "pays", width: 20 },
        { header: "Tél domicile", key: "telDomicile", width: 18 },
        // Nouvelles colonnes (Parents)
        { header: "Nom Père", key: "nomPere", width: 22 },
        { header: "Profession Père", key: "professionPere", width: 24 },
        { header: "Nom Mère", key: "nomMere", width: 22 },
        { header: "Profession Mère", key: "professionMere", width: 24 },
        // Nouvelles colonnes (Personne à prévenir)
        { header: "Nom personne prévenir", key: "nomPersonnePrevenir", width: 24 },
        { header: "Tél personne prévenir", key: "telPersonnePrevenir", width: 20 },
        // Nouvelles colonnes (Salarié)
        { header: "Est salarié", key: "estSalarie", width: 14 },
        { header: "Profession", key: "professionSalarie", width: 24 },
        // Colonnes import spécifiques (Session, Parcours)
        { header: "Session (titre)", key: "session", width: 22 },
        { header: "Parcours (titre)", key: "parcoursImport", width: 22 },
      ];

      applyHeaderStyle(ws.getRow(1));

      ws.addRow({
        nom: "Diallo",
        prenoms: "Aminata",
        identifiant: "adiallo",
        email: "aminata.diallo@etu.com",
        contact: "+221 76 123 45 67",
        sexe: "F",
        parcours: "Licence Informatique",
        filiere: "Licence Informatique",
        classe: "Licence 1",
        niveau: "Licence",
        promotion: "2025-2026",
        salle: "Amphithéâtre A",
        statutDossier: "complet",
        dateNaissance: "01/01/2000",
        lieuNaissance: "Thiès",
        nationalite: "Sénégalaise",
        typePieceIdentite: "CNI",
        numeroPiece: "",
        statutHandicap: "Non",
        natureHandicap: "",
        anneeObtentionBac: "2019",
        serieBac: "LLCE",
        photo: "",
        qrCode: "",
        boitePostale: "",
        quartier: "",
        ville: "Thiès",
        pays: "Sénégal",
        telDomicile: "",
        nomPere: "",
        professionPere: "",
        nomMere: "",
        professionMere: "",
        nomPersonnePrevenir: "",
        telPersonnePrevenir: "",
        estSalarie: "Non",
        professionSalarie: "",
        session: "2025-2026",
        parcoursImport: "Licence Informatique",
      });

      const instr = wb.addWorksheet("Instructions");
      instr.addRow(["Import des Apprenants (Étudiants)"]);
      instr.addRow([]);
      instr.addRow([
        "Colonnes obligatoires : Nom, Prénoms, Email, Identifiant, " +
        "Date naissance, Lieu naissance, Session, Parcours"
      ]);
      instr.addRow([]);
      instr.addRow([
        "Un compte utilisateur sera créé avec le rôle 'apprenant'.",
      ]);
      instr.addRow([
        "Une demande d'inscription sera automatiquement créée et rattachée " +
        "à la session et au parcours spécifiés."
      ]);
      instr.addRow([
        "L'apprenant pourra directement se connecter et poursuivre son onboarding."
      ]);
      instr.addRow([]);
      instr.addRow([
        "Session : le titre de la session doit déjà exister dans le système."
      ]);
      instr.addRow([
        "Parcours : le titre du parcours doit déjà exister dans le système."
      ]);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"template-apprenants.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error) {
      console.error("Erreur template apprenants:", error);
      return res.status(500).json({ success: false, message: "Erreur lors de la génération du template" });
    }
  }

  /**
   * GET /excel/apprenants/template-word
   * Télécharge un template Word pour l'import des apprenants.
   */
  static async downloadApprenantWordTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const headers = [
        "Matricule", "Nom", "Prénoms", "Identifiant", "Email", "Téléphone", "Sexe",
        "Parcours", "Filière", "Classe", "Niveau", "Promotion", "Salle", "Statut dossier",
        "Date naissance", "Lieu naissance", "Nationalité", "Type pièce identité", "Numéro pièce",
        "Statut handicap", "Nature handicap", "Année obtention Bac", "Série Bac",
        "Photo", "QR Code", "Boîte postale", "Quartier", "Ville", "Pays", "Tél domicile",
        "Nom Père", "Profession Père", "Nom Mère", "Profession Mère",
        "Nom personne prévenir", "Tél personne prévenir", "Est salarié", "Profession",
        "Session (titre)", "Parcours (titre)"
      ];
      const buffer = await createWordTemplate(headers, "Template Apprenants");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", "attachment; filename=\"template-apprenants.docx\"");
      return res.status(200).send(buffer);
    } catch (error) {
      console.error("Erreur template Word apprenants:", error);
      return res.status(500).json({ success: false, message: "Erreur lors de la génération du template Word" });
    }
  }

  /**
    * POST /excel/apprenants/import
    * Crée l'utilisateur + l'apprenant + la demande d'inscription liée à la session/parcours.
    * Supporte .xlsx et .docx.
    */
  static async importApprenants(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    const filePath = req.file.path;
    const results: { email?: string; statut: string; message: string; motDePasse?: string }[] = [];
    const isWord = /\.docx$/i.test(req.file.originalname);

    try {
      let rows: string[][];
      if (isWord) {
        rows = await lireTableauWordSimple(filePath);
      } else {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(filePath);
        const ws = wb.getWorksheet("Apprenants");
        if (!ws) return res.status(400).json({ success: false, message: "Feuille 'Apprenants' introuvable" });
        rows = [];
        // Lecture de toutes les 38 colonnes
        for (let i = 2; i <= ws.rowCount; i++) {
          const row = ws.getRow(i);
          const cells: string[] = [];
          for (let j = 1; j <= 40; j++) cells.push(row.getCell(j)?.toString()?.trim() || '');
          if (cells.some(c => c !== '')) rows.push(cells);
        }
      }
      if (rows.length < 1) return res.status(400).json({ success: false, message: "Le fichier ne contient aucune ligne exploitable" });

      let imported = 0, errors = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // Colonnes existantes (13)
        const matricule = row[0] || '';
        const nom = row[1] || '';
        const prenoms = row[2] || '';
        const identifiant = row[3] || '';
        const email = row[4] || '';
        const contact = row[5] || null;
        const sexe = row[6] || 'M';
        const parcoursTitre = row[7] || '';
        const filiereTitre = row[8] || '';
        const classeLibelle = row[9] || '';
        const niveauLibelle = row[10] || '';
        const promotion = row[11] || '';
        const salle = row[12] || '';
        const statutDossier = row[13] || '';
        // Nouvelles colonnes (Apprenant)
        const dateNaissance = parseExcelDate(row[14]);
        const lieuNaissance = row[15] || null;
        const nationalite = row[16] || '';
        const typePieceIdentite = row[17] || '';
        const numeroPiece = row[18] || '';
        const statutHandicap = (row[19] || '').toLowerCase() === 'oui' || (row[19] || '').toLowerCase() === 'true' ? true : false;
        const natureHandicap = row[20] || null;
        const anneeObtentionBac = row[21] || null;
        const serieBac = row[22] || null;
        const photo = row[23] || null;
        const qrCode = row[24] || null;
        // Nouvelles colonnes (Adresse)
        const boitePostale = row[25] || '';
        const quartier = row[26] || '';
        const ville = row[27] || '';
        const pays = row[28] || '';
        const telDomicile = row[29] || null;
        // Nouvelles colonnes (Parents)
        const nomPere = row[30] || '';
        const professionPere = row[31] || '';
        const nomMere = row[32] || '';
        const professionMere = row[33] || '';
        // Nouvelles colonnes (Personne à prévenir)
        const nomPersonnePrevenir = row[34] || '';
        const telPersonnePrevenir = row[35] || null;
        // Nouvelles colonnes (Salarié)
        const estSalarie = (row[36] || '').toLowerCase() === 'oui' || (row[36] || '').toLowerCase() === 'true' ? true : false;
        const professionSalarie = row[37] || null;
        // Colonnes import spécifiques
        const sessionTitre = row[38] || '';
        const parcoursImportTitre = row[39] || '';

        // Validation des champs obligatoires
        if (!nom || !prenoms || !email || !identifiant || !dateNaissance || !lieuNaissance || !sessionTitre || !parcoursImportTitre) {
          errors++;
          results.push({
            email,
            statut: "erreur",
            message: "Tous les champs sont obligatoires : nom, prénoms, email, identifiant, date naissance, lieu naissance, session, parcours",
          });
          continue;
        }

        try {
          // 1. Vérifier email unique
          const existant = await Utilisateur.findOne({ where: { email } });
          if (existant) {
            errors++;
            results.push({ email, statut: "erreur", message: "Cet email est déjà utilisé" });
            continue;
          }

          // 2. Résoudre session
          const session = await Session.findOne({ where: { description: { [Op.like]: sessionTitre } } });
          if (!session) {
            errors++;
            results.push({ email, statut: "erreur", message: `Session "${sessionTitre}" introuvable` });
            continue;
          }

          // 3. Résoudre parcours
          const parcours = await resolveParcours(parcoursImportTitre);
          if (!parcours) {
            errors++;
            results.push({ email, statut: "erreur", message: `Parcours "${parcoursImportTitre}" introuvable` });
            continue;
          }

          // 4. Créer utilisateur
          const tempPassword = generateTempPassword();
          const utilisateur = await Utilisateur.create({
            nom, prenoms,
            email: email!, identifiant: identifiant!,
            contact: contact || '',
            motDePasse: bcrypt.hashSync(tempPassword, 12),
            role: RolesUtilisateur.APPRENANT,
          });

          // 5. Créer les enregistrements associés (adresse, parents, personne à prévenir, salarié)
          // Création de l'adresse
          const adresse = await AdresseApprenant.create({
            boitePostale: boitePostale || undefined,
            quartier: quartier || undefined,
            ville: ville || undefined,
            pays: pays || undefined,
            telDomicile: telDomicile || undefined,
          } as any);

          // Création des informations parents
          const infosParents = await InformationsParentsApprenant.create({
            nomPrenomsPere: nomPere || undefined,
            professionPere: professionPere || undefined,
            nomPrenomsMere: nomMere || undefined,
            professionMere: professionMere || undefined,
          } as any);

          // Création de la personne à prévenir (si renseignée)
          let personnePrevenirId: string | undefined;
          if (nomPersonnePrevenir) {
            const parts = nomPersonnePrevenir.split(' ');
            const personneNom = parts[0] || '';
            const personnePrenoms = parts.slice(1).join(' ') || '';
            const personnePrevenir = await PersonnePrevenirApprenant.create({
              nom: personneNom,
              prenoms: personnePrenoms,
              telMobile: telPersonnePrevenir || undefined,
            } as any);
            personnePrevenirId = personnePrevenir.id;
          }

          // Création des informations salarié
          const infoSalarie = await InformationsSalarieApprenant.create({
            estSalarie,
            profession: professionSalarie || undefined,
          } as any);

          // 6. Créer apprenant avec tous les champs et les foreign keys
          await Apprenant.create({
            utilisateurId: utilisateur.id,
            dateNaissance,
            lieuNaissance,
            sexe,
            nationalite,
            typePieceIdentite,
            numeroPiece,
            statutHandicap,
            natureHandicap,
            anneeObtentionBac,
            serieBac,
            photo,
            qrCode,
            adresseId: adresse.id,
            informationsParentsId: infosParents.id,
            personnePrevenirId,
            informationsSalarieId: infoSalarie.id,
          } as any);

          // 7. Créer demande d'inscription (auto-redirection)
          await DemandeInscription.create({
            utilisateurId: utilisateur.id,
            sessionId: session.id,
            dateDemande: new Date(),
            matricule: matricule || `TMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          });

          imported++;
          results.push({ email, statut: "succès", message: "Apprenant créé avec demande d'inscription", motDePasse: tempPassword });
        } catch (err: any) {
          errors++;
          results.push({ email, statut: "erreur", message: err.message });
        }
      }

      return res.status(200).json({ success: true, importedCount: imported, errorCount: errors, details: results });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    } finally {
      fs.unlink(filePath, () => {});
    }
  }

  /**
   * POST /excel/apprenants/import/migration
   * Import complet des apprenants depuis un fichier de migration (3 feuilles : Identité, Cursus, Finance)
   */
  static async importApprenantsMigration(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    
    const filePath = req.file.path;
    const isWord = /\.docx$/i.test(req.file.originalname);
    
    if (isWord) {
      return res.status(400).json({ success: false, message: "Le format Word n'est pas supporté pour l'import migration. Utilisez le format Excel (.xlsx)" });
    }
    
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      
      // Parse Identité sheet
      const wsIdentite = wb.getWorksheet("Identité");
      if (!wsIdentite) return res.status(400).json({ success: false, message: "Feuille 'Identité' introuvable" });
      
      // Parse Cursus sheet
      const wsCursus = wb.getWorksheet("Cursus");
      if (!wsCursus) return res.status(400).json({ success: false, message: "Feuille 'Cursus' introuvable" });
      
      // Parse Finance sheet
      const wsFinance = wb.getWorksheet("Finance");
      if (!wsFinance) return res.status(400).json({ success: false, message: "Feuille 'Finance' introuvable" });
      
      // Process Identité data
      const apprenantsData = [];
      for (let rowNum = 2; rowNum <= wsIdentite.rowCount; rowNum++) {
        const row = wsIdentite.getRow(rowNum);
        const values = [];
        for (let colNum = 1; colNum <= 40; colNum++) {
          values.push(row.getCell(colNum)?.toString()?.trim() || '');
        }
        if (values.some(v => v !== '')) {
          apprenantsData.push(values);
        }
      }
      
      // Process Cursus data
      const cursusData = [];
      for (let rowNum = 2; rowNum <= wsCursus.rowCount; rowNum++) {
        const row = wsCursus.getRow(rowNum);
        const values = [];
        for (let colNum = 1; colNum <= 15; colNum++) {
          values.push(row.getCell(colNum)?.toString()?.trim() || '');
        }
        if (values.some(v => v !== '')) {
          cursusData.push(values);
        }
      }
      
      // Process Finance data
      const financeData = [];
      for (let rowNum = 2; rowNum <= wsFinance.rowCount; rowNum++) {
        const row = wsFinance.getRow(rowNum);
        const values = [];
        for (let colNum = 1; colNum <= 25; colNum++) {
          values.push(row.getCell(colNum)?.toString()?.trim() || '');
        }
        if (values.some(v => v !== '')) {
          financeData.push(values);
        }
      }
      
      // Import each apprenant from Identité data
      let imported = 0, errors = 0;
      const results = [];
      
      for (const values of apprenantsData) {
        try {
          const [
            matricule, nom, prenoms, email, telephone, sexe, parcours, filiere, classe, niveau, promotion, salle, statutDossier,
            dateNaissance, lieuNaissance, nationalite, typePieceIdentite, numeroPiece, statutHandicap, natureHandicap,
            anneeObtentionBac, serieBac, photo, qrCode,
            boitePostale, quartier, ville, pays, telDomicile,
            nomPere, professionPere, nomMere, professionMere,
            nomPersonnePrevenir, telPersonnePrevenir,
            estSalarie, professionSalarie
          ] = values;
          
          // Validate required fields
          if (!nom || !prenoms || !email) {
            errors++;
            results.push({ email, statut: "erreur", message: "Champs obligatoires manquants : nom, prénoms, email" });
            continue;
          }
          
          // Check if user already exists
          let utilisateur = await Utilisateur.findOne({ where: { email } });
          let isNewUser = false;
          
          if (!utilisateur) {
            // Create new user
            const tempPassword = generateTempPassword();
            utilisateur = await Utilisateur.create({
              nom,
              prenoms,
              email: email!,
              identifiant: email.split('@')[0], // Simple identifiant from email
              contact: telephone || '',
              motDePasse: bcrypt.hashSync(tempPassword, 12),
              role: RolesUtilisateur.APPRENANT,
            });
            isNewUser = true;
            
            // Store temp password for result
            results.push({ email, statut: "succès", message: "Utilisateur créé", motDePasse: tempPassword });
          } else {
            results.push({ email, statut: "succès", message: "Utilisateur existant mis à jour" });
          }
          
          // Create or update apprenant
          let apprenant = await Apprenant.findOne({ where: { utilisateurId: utilisateur.id } });
          if (!apprenant) {
            apprenant = await Apprenant.create({ utilisateurId: utilisateur.id } as any);
          }
          
          // Update apprenant fields - use proper defaults for required fields
          apprenant.dateNaissance = dateNaissance ? new Date(dateNaissance) : new Date(); // Default to today if empty
          apprenant.lieuNaissance = lieuNaissance || "Inconnu"; // Required field
          apprenant.sexe = (sexe === 'M' || sexe === 'F' || sexe === 'Autre') ? sexe : 'M'; // Must be valid enum
          apprenant.nationalite = nationalite || 'Ivoirienne';
          apprenant.typePieceIdentite = typePieceIdentite || '';
          apprenant.numeroPiece = numeroPiece || '';
          apprenant.statutHandicap = statutHandicap?.toLowerCase() === 'oui' || statutHandicap?.toLowerCase() === 'true';
          (apprenant as any).natureHandicap = natureHandicap || null;
          (apprenant as any).anneeObtentionBac = anneeObtentionBac || null;
          (apprenant as any).serieBac = serieBac || null;
          (apprenant as any).photo = photo || null;
          (apprenant as any).qrCode = qrCode || null;
          apprenant.statutEtudiant = statutDossier === 'archive' ? 'ancien' : 'nouveau'; // Map from dossier statut
          apprenant.periode = null; // Not in Identité sheet, leave as null
          await apprenant.save();
          
          // Create or update adresse
          let adresse = await AdresseApprenant.findOne({ where: { apprenantId: apprenant.id } });
          if (!adresse) {
            adresse = await AdresseApprenant.create({ apprenantId: apprenant.id } as any);
          }
          (adresse as any).boitePostale = boitePostale || null;
          (adresse as any).quartier = quartier || null;
          (adresse as any).ville = ville || null;
          (adresse as any).pays = pays || null;
          (adresse as any).telDomicile = telDomicile || null;
          await adresse.save();
          apprenant.adresseId = adresse.id;
          
          // Create or update informations parents
          let infosParents = await InformationsParentsApprenant.findOne({ where: { apprenantId: apprenant.id } });
          if (!infosParents) {
            infosParents = await InformationsParentsApprenant.create({ apprenantId: apprenant.id } as any);
          }
          (infosParents as any).nomPrenomsPere = nomPere || null;
          (infosParents as any).professionPere = professionPere || null;
          (infosParents as any).nomPrenomsMere = nomMere || null;
          (infosParents as any).professionMere = professionMere || null;
          await infosParents.save();
          apprenant.informationsParentsId = infosParents.id;
          
          // Create or update personne à prévenir
          let personnePrevenirId = null;
          if (nomPersonnePrevenir) {
            let personnePrevenir = await PersonnePrevenirApprenant.findOne({ where: { apprenantId: apprenant.id } });
            if (!personnePrevenir) {
              personnePrevenir = await PersonnePrevenirApprenant.create({ apprenantId: apprenant.id } as any);
            }
            const parts = nomPersonnePrevenir.split(' ');
            (personnePrevenir as any).nom = parts[0] || null;
            (personnePrevenir as any).prenoms = parts.slice(1).join(' ') || null;
            (personnePrevenir as any).telMobile = telPersonnePrevenir || null;
            await personnePrevenir.save();
            personnePrevenirId = personnePrevenir.id;
          }
          (apprenant as any).personnePrevenirId = personnePrevenirId;
          
          // Create or update informations salarié
          let infoSalarie = await InformationsSalarieApprenant.findOne({ where: { apprenantId: apprenant.id } });
          if (!infoSalarie) {
            infoSalarie = await InformationsSalarieApprenant.create({ apprenantId: apprenant.id } as any);
          }
          infoSalarie.estSalarie = estSalarie?.toLowerCase() === 'oui' || estSalarie?.toLowerCase() === 'true' ? true : false;
          (infoSalarie as any).profession = professionSalarie || null;
          await infoSalarie.save();
          apprenant.informationsSalarieId = infoSalarie.id;
          
          await apprenant.save();
          
          // Update dossier if matricule provided
          if (matricule) {
            let dossier = await DossierEtudiant.findOne({ where: { matricule } });
            if (!dossier) {
              dossier = await DossierEtudiant.create({ matricule, utilisateurId: utilisateur.id } as any);
            }
            // Map statutDossier to correct enum
            const statutMap: Record<string, 'actif' | 'suspendu' | 'archive'> = {
              'actif': 'actif',
              'suspendu': 'suspendu',
              'archive': 'archive',
              'en cours': 'actif',
              'validé': 'actif',
              'validée': 'actif'
            };
            dossier.statut = statutMap[statutDossier?.toLowerCase().trim()] || 'actif';
            await dossier.save();
          }
          
          // Process cursus data for this user
          const cursusRows = cursusData.filter(row => String(row[1]) === String(utilisateur.id)); // utilisateurId column
          for (const cursusRow of cursusRows) {
            const [
              cursusApprenantId, utilisateurIdStr, matriculeCursus, parcoursIdStr, parcoursTitre, niveauIdStr, classeIdStr, classeLibelle, anneeAcademiqueIdStr, anneeLibelle, etablissementIdStr, statutEtudiantStr, periodeStr
            ] = cursusRow;
            
            // Find or create cursus apprenant
            let cursusApprenant = await CursusApprenant.findOne({ where: { id: cursusApprenantId || 0 } });
            if (!cursusApprenant && cursusApprenantId && cursusApprenantId !== '') {
              cursusApprenant = await CursusApprenant.create({ id: parseInt(cursusApprenantId), utilisateurId: utilisateur.id } as any);
            } else if (!cursusApprenant) {
              cursusApprenant = await CursusApprenant.create({ utilisateurId: utilisateur.id } as any);
            }
            
            // Update cursus apprenant fields
            if (parcoursIdStr && parcoursIdStr !== '') cursusApprenant.parcoursId = parseInt(parcoursIdStr);
            if (niveauIdStr && niveauIdStr !== '') cursusApprenant.niveauEtudeId = parseInt(niveauIdStr);
            if (classeIdStr && classeIdStr !== '') cursusApprenant.classeId = parseInt(classeIdStr);
            if (anneeAcademiqueIdStr && anneeAcademiqueIdStr !== '') cursusApprenant.anneeAcademiqueId = parseInt(anneeAcademiqueIdStr);
            if (etablissementIdStr && etablissementIdStr !== '') (cursusApprenant as any).etablissementId = etablissementIdStr;
            if (statutEtudiantStr === 'nouveau' || statutEtudiantStr === 'ancien') cursusApprenant.statutReinscription = statutEtudiantStr;
            if (periodeStr === 'matin' || periodeStr === 'soir' || periodeStr === 'en_ligne') (cursusApprenant as any).periode = periodeStr; // Cast to any for now
            await cursusApprenant.save();
          }
          
          // Process finance data for this user
          const financeRows = financeData.filter(row => {
            const emailFinance = row[3]; // Email column in finance sheet
            return emailFinance === email;
          });
          
          for (const financeRow of financeRows) {
            const [
              matriculeFin, nomFin, prenomsFin, emailFin, sessionIdStr, sessionLibelle, anneeAcademiqueFin, semestre,
              dossierEtudiantIdStr, echeanceIdStr, echeanceMontantStr, echeanceDateStr, echeanceStatut,
              bordereauIdStr, bordereauReference, bordereauMontantStr, bordereauDateDepotStr, bordereauStatut,
              typeOperationLibelle, sommePayeeStr, resteAPayerStr, datePaiementStr
            ] = financeRow;
            
            // Find or create dossier by matricule or ID
            let dossier = null;
            if (matriculeFin) {
              dossier = await DossierEtudiant.findOne({ where: { matricule: matriculeFin } });
            }
            if (!dossier && dossierEtudiantIdStr && dossierEtudiantIdStr !== '') {
              dossier = await DossierEtudiant.findByPk(parseInt(dossierEtudiantIdStr));
            }
            if (!dossier) {
              dossier = await DossierEtudiant.create({ matricule: matriculeFin || `MAT-${Date.now()}`, utilisateurId: utilisateur.id } as any);
            }
            
            // Find or create echeance
            let echeance = null;
            if (echeanceIdStr && echeanceIdStr !== '') {
              echeance = await Echeance.findByPk(parseInt(echeanceIdStr));
            }
            if (!echeance) {
              echeance = await Echeance.create({
                dossierEtudiantId: dossier.id,
                montant: parseFloat(echeanceMontantStr) || 0,
                dateLimite: echeanceDateStr ? new Date(echeanceDateStr) : new Date(), // Default to today if empty
                statut: echeanceStatut === 'impaye' || echeanceStatut === 'paye' || echeanceStatut === 'en_retard' || echeanceStatut === 'partiel' 
                       ? echeanceStatut : 'impaye' // Default if invalid
              } as any);
            } else {
              // Update existing echeance
              if (echeanceMontantStr && echeanceMontantStr !== '') echeance.montant = parseFloat(echeanceMontantStr);
              if (echeanceDateStr && echeanceDateStr !== '') echeance.dateLimite = new Date(echeanceDateStr);
              if (echeanceStatut === 'impaye' || echeanceStatut === 'paye' || echeanceStatut === 'en_retard' || echeanceStatut === 'partiel') {
                echeance.statut = echeanceStatut;
              }
              await echeance.save();
            }
            
            // Find or create bordereau
            let bordereau = null;
            if (bordereauIdStr && bordereauIdStr !== '') {
              bordereau = await Bordereau.findByPk(parseInt(bordereauIdStr));
            }
            if (!bordereau && bordereauReference && bordereauReference !== '') {
              bordereau = await Bordereau.findOne({ where: { referenceBancaire: bordereauReference } });
            }
            if (!bordereau) {
              bordereau = await Bordereau.create({
                echeanceId: echeance.id,
                numeroBordereau: bordereauReference || null,
                montant: bordereauMontantStr && bordereauMontantStr !== '' ? parseFloat(bordereauMontantStr) : null,
                dateSoumission: bordereauDateDepotStr ? new Date(bordereauDateDepotStr) : undefined,
                statut: bordereauStatut === 'en_attente' || bordereauStatut === 'valide' || bordereauStatut === 'rejete' || 
                       bordereauStatut === 'en_saisie_comptable' || bordereauStatut === 'traite'
                       ? bordereauStatut : 'en_attente',
                typeOperationId: 1 // Default type operation
              } as any);
            } else {
              // Update existing bordereau
              if (bordereauReference && bordereauReference !== '') bordereau.numeroBordereau = bordereauReference;
              if (bordereauMontantStr && bordereauMontantStr !== '') bordereau.montant = parseFloat(bordereauMontantStr);
              if (bordereauDateDepotStr && bordereauDateDepotStr !== '') bordereau.dateSoumission = new Date(bordereauDateDepotStr);
              if (bordereauStatut === 'en_attente' || bordereauStatut === 'valide' || bordereauStatut === 'rejete' || 
                 bordereauStatut === 'en_saisie_comptable' || bordereauStatut === 'traite') {
                bordereau.statut = bordereauStatut;
              }
              if (typeOperationLibelle && typeOperationLibelle !== '') {
                // Find or create type operation
                let typeOp = await TypeOperationBordereau.findOne({ where: { libelle: typeOperationLibelle } });
                if (!typeOp) {
                  typeOp = await TypeOperationBordereau.create({ libelle: typeOperationLibelle } as any);
                }
                bordereau.typeOperationId = typeOp.id;
              }
              await bordereau.save();
            }
            
            // Update echeance with payment info if provided
            if (sommePayeeStr && sommePayeeStr !== '') {
              const sommePayee = parseFloat(sommePayeeStr);
              echeance.montantPaye = sommePayee;
              echeance.datePaiement = datePaiementStr ? new Date(datePaiementStr) : null;
              // Recalculate statut based on payment
              const resteAPayer = (echeance.montant || 0) - sommePayee;
              if (sommePayee === 0) {
                echeance.statut = 'impaye';
              } else if (resteAPayer === 0) {
                echeance.statut = 'paye';
              } else {
                echeance.statut = 'partiel';
              }
              await echeance.save();
            }
            
            imported++;
          }
          
          if (financeRows.length === 0 && !isNewUser) {
            // Still count as imported if no finance data but user existed
            imported++;
          }
          
        } catch (err: any) {
          errors++;
          const email = values[3] || 'unknown';
          results.push({ email, statut: "erreur", message: err.message });
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        importedCount: imported, 
        errorCount: errors, 
        details: results 
      });
      
    } catch (error: any) {
      console.error("Erreur import migration complet:", error);
      return res.status(500).json({ success: false, message: error.message });
    } finally {
      fs.unlink(filePath, () => {});
    }
  }

  /**
   * GET /excel/apprenants/export
   */
  static async exportApprenants(req: Request, res: Response): Promise<Response> {
    try {
      const apprenants = await Apprenant.findAll({
        include: [
          { association: Apprenant.associations.utilisateur },
          {
            association: Apprenant.associations.identite,
            attributes: ["nationalite", "situationMatrimoniale", "etatPhysique"],
          },
        ],
      });

      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet(sanitizeSheetName("Apprenants"));

      ws.columns = [
        { header: "Nom", key: "nom", width: 18 },
        { header: "Prénoms", key: "prenoms", width: 22 },
        { header: "Email", key: "email", width: 28 },
        { header: "Identifiant", key: "identifiant", width: 16 },
        { header: "Contact", key: "contact", width: 16 },
        { header: "Date naissance", key: "dateNaissance", width: 18 },
        { header: "Lieu naissance", key: "lieuNaissance", width: 18 },
        { header: "Nationalité", key: "nationalite", width: 16 },
        { header: "Situation matrimoniale", key: "situationMatrimoniale", width: 22 },
      ];

      applyHeaderStyle(ws.getRow(1));

      apprenants.forEach((a) => {
        const u = a.utilisateur!;
        const identite = (a as any).identite;
        const row = ws.addRow({
          nom: u.nom,
          prenoms: u.prenoms,
          email: u.email,
          identifiant: u.identifiant,
          contact: u.contact,
          dateNaissance: a.dateNaissance ? new Date(a.dateNaissance).toLocaleDateString("fr-FR") : "",
          lieuNaissance: a.lieuNaissance,
          nationalite: identite?.nationalite ?? "",
          situationMatrimoniale: identite?.situationMatrimoniale ?? "",
        });
        applyDataStyle(row);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"apprenants.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========================================================================
  //  APPRENANTS (ÉTUDIANTS) — Export filtré (Lot C)
  // ========================================================================

  /**
   * GET /excel/apprenants/export/filtres
   * Exporte les apprenants (étudiants) avec filtres :
   *   parcoursId, filiereId (alias de parcoursId), anneeAcademiqueId,
   *   salleId, niveauId, classeId.
   * NB : la « filière » n'a pas de modèle dédié dans EasyEcole — elle est
   * portée par Parcours. filiereId est donc traité comme parcoursId.
   */
  static async exportApprenantsFiltres(req: Request, res: Response): Promise<Response> {
    try {
      const { parcoursId, filiereId, anneeAcademiqueId, salleId, niveauId, classeId } = req.query as Record<string, string>;

      // « Filière » = Parcours dans ce modèle (pas de modèle Filiere dédié)
      const parcoursIdFinal = parseIntParam(parcoursId ?? filiereId);
      const anneeIdFinal = parseIntParam(anneeAcademiqueId);
      const niveauIdFinal = parseIntParam(niveauId);
      const classeIdFinal = parseIntParam(classeId);
      const salleIdFinal = parseIntParam(salleId);

      const where: Record<string, any> = {};
      if (parcoursIdFinal) where.parcoursId = parcoursIdFinal;
      if (anneeIdFinal) where.anneeAcademiqueId = anneeIdFinal;
      if (niveauIdFinal) where.niveauEtudeId = niveauIdFinal;
      if (classeIdFinal) where.classeId = classeIdFinal;

      // Filtre salle : une salle est rattachée à une classe (et/ou un parcours)
      if (salleIdFinal) {
        const salle = await SalleDeClasse.findByPk(salleIdFinal);
        if (!salle) return res.status(400).json({ success: false, message: "Salle introuvable" });
        if (salle.classeId) {
          where.classeId = salle.classeId;
        } else if (salle.parcoursId) {
          where.parcoursId = salle.parcoursId;
        }
      }

      const cursusList = await CursusApprenant.findAll({
        where: where as any,
        include: [
          { association: CursusApprenant.associations.utilisateur },
          { association: CursusApprenant.associations.parcours, attributes: ["id", "titre"] },
          { association: CursusApprenant.associations.classe, attributes: ["id", "libelle"] },
          { association: CursusApprenant.associations.niveauEtude, attributes: ["id", "libelle"] },
          { association: CursusApprenant.associations.anneeAcademique, attributes: ["id", "libelle"] },
        ],
      } as any);

      // Dossiers étudiants (matricule / statut dossier)
      const userIds = cursusList.map((c) => (c as any).utilisateurId).filter(Boolean);
      const dossiers = userIds.length
        ? await DossierEtudiant.findAll({ where: { utilisateurId: { [Op.in]: userIds } } as any })
        : [];
      const dossierByUserId = new Map(dossiers.map((d) => [d.utilisateurId, d] as [number, DossierEtudiant]));

      // Charger les Apprenants avec toutes leurs associations pour l'export complet
      const apprenants = userIds.length
        ? await Apprenant.findAll({
            where: { utilisateurId: { [Op.in]: userIds } } as any,
            include: [
              { association: Apprenant.associations.utilisateur },
              { association: Apprenant.associations.adresse },
              { association: Apprenant.associations.informationsParents },
              { association: Apprenant.associations.personnePrevenir },
              { association: Apprenant.associations.informationsSalarie },
            ],
          } as any)
        : [];
      const apprenantByUserId = new Map(apprenants.map((a: any) => [a.utilisateurId, a] as [number, Apprenant]));

      // Salles associées aux classes des apprenants (une classe peut avoir plusieurs salles)
      const classeIds = [...new Set(cursusList.map((c) => (c as any).classeId).filter(Boolean))];
      const salles = classeIds.length
        ? await SalleDeClasse.findAll({ where: { classeId: { [Op.in]: classeIds } } as any, attributes: ["id", "libelle", "classeId"] })
        : [];
      const sallesByClasseId = new Map<number, string[]>();
      salles.forEach((s) => {
        if (!s.classeId) return;
        const arr = sallesByClasseId.get(s.classeId) ?? [];
        arr.push(s.libelle);
        sallesByClasseId.set(s.classeId, arr);
      });

      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet(sanitizeSheetName("Apprenants"));

      // ws.columns : 13 colonnes existantes + 23 nouvelles colonnes = 36 colonnes au total
      ws.columns = [
        // --- 13 colonnes existantes ---
        { header: "Matricule", key: "matricule", width: 18 },
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 24 },
        { header: "Email", key: "email", width: 28 },
        { header: "Téléphone", key: "telephone", width: 18 },
        { header: "Sexe", key: "sexe", width: 8 },
        { header: "Parcours", key: "parcours", width: 26 },
        { header: "Filière", key: "filiere", width: 26 },
        { header: "Classe", key: "classe", width: 18 },
        { header: "Niveau", key: "niveau", width: 16 },
        { header: "Promotion (année académique)", key: "promotion", width: 24 },
        { header: "Salle", key: "salle", width: 20 },
        { header: "Statut dossier", key: "statutDossier", width: 16 },
        // --- Nouvelles colonnes (Apprenant) ---
        { header: "Date naissance", key: "dateNaissance", width: 18 },
        { header: "Lieu naissance", key: "lieuNaissance", width: 18 },
        { header: "Nationalité", key: "nationalite", width: 18 },
        { header: "Type pièce identité", key: "typePieceIdentite", width: 20 },
        { header: "Numéro pièce", key: "numeroPiece", width: 20 },
        { header: "Statut handicap", key: "statutHandicap", width: 14 },
        { header: "Nature handicap", key: "natureHandicap", width: 22 },
        { header: "Année obtention Bac", key: "anneeObtentionBac", width: 18 },
        { header: "Série Bac", key: "serieBac", width: 18 },
        { header: "Photo", key: "photo", width: 20 },
        { header: "QR Code", key: "qrCode", width: 20 },
        // --- Nouvelles colonnes (Adresse) ---
        { header: "Boîte postale", key: "boitePostale", width: 20 },
        { header: "Quartier", key: "quartier", width: 20 },
        { header: "Ville", key: "ville", width: 20 },
        { header: "Pays", key: "pays", width: 20 },
        { header: "Tél domicile", key: "telDomicile", width: 18 },
        // --- Nouvelles colonnes (Parents) ---
        { header: "Nom Père", key: "nomPere", width: 22 },
        { header: "Profession Père", key: "professionPere", width: 24 },
        { header: "Nom Mère", key: "nomMere", width: 22 },
        { header: "Profession Mère", key: "professionMere", width: 24 },
        // --- Nouvelles colonnes (Personne à prévenir) ---
        { header: "Nom personne prévenir", key: "nomPersonnePrevenir", width: 24 },
        { header: "Tél personne prévenir", key: "telPersonnePrevenir", width: 20 },
        // --- Nouvelles colonnes (Salarié) ---
        { header: "Est salarié", key: "estSalarie", width: 14 },
        { header: "Profession", key: "professionSalarie", width: 24 },
      ];

      applyHeaderStyle(ws.getRow(1));

      cursusList.forEach((c: any) => {
        const u = c.utilisateur;
        const dossier = dossierByUserId.get(c.utilisateurId);
        const apprenant = apprenantByUserId.get(c.utilisateurId);
        const parcoursTitre = c.parcours?.titre ?? c.intituleParcours ?? "";
        const sallesClasse = sallesByClasseId.get(c.classeId) ?? [];

        // Données adresse
        const adresse = apprenant?.adresse;
        // Données parents
        const infosParents = apprenant?.informationsParents;
        // Données personne à prévenir
        const personnePrevenir = apprenant?.personnePrevenir;
        // Données salarié
        const infoSalarie = apprenant?.informationsSalarie;

        const row = ws.addRow({
          // Colonnes existantes (13)
          matricule: dossier?.matricule ?? "",
          nom: u?.nom ?? "",
          prenoms: u?.prenoms ?? "",
          email: u?.email ?? "",
          telephone: u?.contact ?? "",
          sexe: apprenant?.sexe ?? "", // CORRIGÉ : rempli depuis Apprenant.sexe
          parcours: parcoursTitre,
          filiere: parcoursTitre,
          classe: c.classe?.libelle ?? "",
          niveau: c.niveauEtude?.libelle ?? "",
          promotion: c.anneeAcademique?.libelle ?? "",
          salle: sallesClasse.join(", "),
          statutDossier: dossier?.statut ?? "",
          // Nouvelles colonnes Apprenant
          dateNaissance: apprenant?.dateNaissance ? new Date(apprenant.dateNaissance).toLocaleDateString("fr-FR") : "",
          lieuNaissance: apprenant?.lieuNaissance ?? "",
          nationalite: apprenant?.nationalite ?? "",
          typePieceIdentite: apprenant?.typePieceIdentite ?? "",
          numeroPiece: apprenant?.numeroPiece ?? "",
          statutHandicap: apprenant?.statutHandicap ? (apprenant.statutHandicap ? "Oui" : "Non") : "",
          natureHandicap: apprenant?.natureHandicap ?? "",
          anneeObtentionBac: apprenant?.anneeObtentionBac ?? "",
          serieBac: apprenant?.serieBac ?? "",
          photo: apprenant?.photo ?? "",
          qrCode: apprenant?.qrCode ?? "",
          // Nouvelles colonnes Adresse
          boitePostale: adresse?.boitePostale ?? "",
          quartier: adresse?.quartier ?? "",
          ville: adresse?.ville ?? "",
          pays: adresse?.pays ?? "",
          telDomicile: adresse?.telDomicile ?? "",
          // Nouvelles colonnes Parents
          nomPere: infosParents?.nomPrenomsPere ?? "",
          professionPere: infosParents?.professionPere ?? "",
          nomMere: infosParents?.nomPrenomsMere ?? "",
          professionMere: infosParents?.professionMere ?? "",
          // Nouvelles colonnes Personne à prévenir
          nomPersonnePrevenir: personnePrevenir ? `${personnePrevenir.nom} ${personnePrevenir.prenoms}`.trim() : "",
          telPersonnePrevenir: personnePrevenir?.telMobile ?? "",
          // Nouvelles colonnes Salarié
          estSalarie: infoSalarie?.estSalarie ? (infoSalarie.estSalarie ? "Oui" : "Non") : "",
          professionSalarie: infoSalarie?.profession ?? "",
        });
        applyDataStyle(row);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"apprenants_filtres.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error: any) {
      console.error("Erreur export apprenants filtré:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========================================================================
  //  APPRENANTS (ÉTUDIANTS) — Export Migration Complet
  // ========================================================================

  /**
   * GET /excel/apprenants/export/migration
   * Export complet des apprenants pour migration avec plusieurs feuilles :
   *   - Identité : toutes les 36 colonnes (données personnelles, adresse, parents, etc.)
   *   - Cursus : parcours, niveau, classe, année académique
   *   - Finance : dossiers, échéances, paiements
   */
  static async exportApprenantsComplet(req: Request, res: Response): Promise<Response> {
    try {
      // --- Charger tous les apprenants avec leurs associations ---
      const apprenants = await Apprenant.findAll({
        include: [
          { association: Apprenant.associations.utilisateur },
          { association: Apprenant.associations.adresse },
          { association: Apprenant.associations.informationsParents },
          { association: Apprenant.associations.personnePrevenir },
          { association: Apprenant.associations.informationsSalarie },
          { association: Apprenant.associations.identite },
        ],
      } as any);

      const userIds = apprenants.map((a: any) => a.utilisateurId).filter(Boolean);
      const dossiers = userIds.length
        ? await DossierEtudiant.findAll({ where: { utilisateurId: { [Op.in]: userIds } } as any })
        : [];
      const dossierByUserId = new Map(dossiers.map((d) => [d.utilisateurId, d] as [number, DossierEtudiant]));

      // Charger les cursus pour la feuille Cursus
      const cursusList = await CursusApprenant.findAll({
        include: [
          { association: CursusApprenant.associations.utilisateur },
          { association: CursusApprenant.associations.parcours, attributes: ["id", "titre"] },
          { association: CursusApprenant.associations.classe, attributes: ["id", "libelle"] },
          { association: CursusApprenant.associations.niveauEtude, attributes: ["id", "libelle"] },
          { association: CursusApprenant.associations.anneeAcademique, attributes: ["id", "libelle"] },
          { association: CursusApprenant.associations.etablissement, attributes: ["id", "nom"] },
          {
            association: CursusApprenant.associations.demandeInscription,
            include: [
              {
                association: DemandeInscription.associations.session,
                include: [
                  { association: Session.associations.anneeAcademique, attributes: ["id", "libelle"] },
                ],
              },
            ],
          },
        ],
      } as any);

      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";

      // ====================================================================
      //  FEUILLE 1 : Identité (36 colonnes)
      // ====================================================================
      const wsIdentite = wb.addWorksheet(sanitizeSheetName("Identité"));

      const identiteColumns = [
        // Colonnes existantes (13)
        { header: "Matricule", key: "matricule", width: 18 },
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 24 },
        { header: "Email", key: "email", width: 28 },
        { header: "Téléphone", key: "telephone", width: 18 },
        { header: "Sexe", key: "sexe", width: 8 },
        { header: "Parcours", key: "parcours", width: 26 },
        { header: "Filière", key: "filiere", width: 26 },
        { header: "Classe", key: "classe", width: 18 },
        { header: "Niveau", key: "niveau", width: 16 },
        { header: "Promotion (année académique)", key: "promotion", width: 24 },
        { header: "Salle", key: "salle", width: 20 },
        { header: "Statut dossier", key: "statutDossier", width: 16 },
        // Nouvelles colonnes (Apprenant)
        { header: "Date naissance", key: "dateNaissance", width: 18 },
        { header: "Lieu naissance", key: "lieuNaissance", width: 18 },
        { header: "Nationalité", key: "nationalite", width: 18 },
        { header: "Type pièce identité", key: "typePieceIdentite", width: 20 },
        { header: "Numéro pièce", key: "numeroPiece", width: 20 },
        { header: "Statut handicap", key: "statutHandicap", width: 14 },
        { header: "Nature handicap", key: "natureHandicap", width: 22 },
        { header: "Année obtention Bac", key: "anneeObtentionBac", width: 18 },
        { header: "Série Bac", key: "serieBac", width: 18 },
        { header: "Photo", key: "photo", width: 20 },
        { header: "QR Code", key: "qrCode", width: 20 },
        // Nouvelles colonnes (Adresse)
        { header: "Boîte postale", key: "boitePostale", width: 20 },
        { header: "Quartier", key: "quartier", width: 20 },
        { header: "Ville", key: "ville", width: 20 },
        { header: "Pays", key: "pays", width: 20 },
        { header: "Tél domicile", key: "telDomicile", width: 18 },
        // Nouvelles colonnes (Parents)
        { header: "Nom Père", key: "nomPere", width: 22 },
        { header: "Profession Père", key: "professionPere", width: 24 },
        { header: "Nom Mère", key: "nomMere", width: 22 },
        { header: "Profession Mère", key: "professionMere", width: 24 },
        // Nouvelles colonnes (Personne à prévenir)
        { header: "Nom personne prévenir", key: "nomPersonnePrevenir", width: 24 },
        { header: "Tél personne prévenir", key: "telPersonnePrevenir", width: 20 },
        // Nouvelles colonnes (Salarié)
        { header: "Est salarié", key: "estSalarie", width: 14 },
        { header: "Profession", key: "professionSalarie", width: 24 },
      ];

      wsIdentite.columns = identiteColumns;
      applyHeaderStyle(wsIdentite.getRow(1));

      apprenants.forEach((a: any) => {
        const u = a.utilisateur;
        const dossier = dossierByUserId.get(a.utilisateurId);
        const adresse = a.adresse;
        const infosParents = a.informationsParents;
        const personnePrevenir = a.personnePrevenir;
        const infoSalarie = a.informationsSalarie;
        // Trouver le cursus correspondant
        const cursus = cursusList.find((c: any) => c.utilisateurId === a.utilisateurId);
        const parcoursTitre = cursus?.parcours?.titre ?? cursus?.intituleParcours ?? "";
        const sallesClasse = cursus?.classe ? [cursus.classe.libelle] : [];

        wsIdentite.addRow({
          // Existantes (13)
          matricule: dossier?.matricule ?? "",
          nom: u?.nom ?? "",
          prenoms: u?.prenoms ?? "",
          email: u?.email ?? "",
          telephone: u?.contact ?? "",
          sexe: a.sexe ?? "",
          parcours: parcoursTitre,
          filiere: parcoursTitre,
          classe: cursus?.classe?.libelle ?? "",
          niveau: cursus?.niveauEtude?.libelle ?? "",
          promotion: cursus?.anneeAcademique?.libelle ?? "",
          salle: sallesClasse.join(", "),
          statutDossier: dossier?.statut ?? "",
          // Nouvelles (Apprenant)
          dateNaissance: a.dateNaissance ? new Date(a.dateNaissance).toLocaleDateString("fr-FR") : "",
          lieuNaissance: a.lieuNaissance ?? "",
          nationalite: a.nationalite ?? "",
          typePieceIdentite: a.typePieceIdentite ?? "",
          numeroPiece: a.numeroPiece ?? "",
          statutHandicap: a.statutHandicap ? "Oui" : "Non",
          natureHandicap: a.natureHandicap ?? "",
          anneeObtentionBac: a.anneeObtentionBac ?? "",
          serieBac: a.serieBac ?? "",
          photo: a.photo ?? "",
          qrCode: a.qrCode ?? "",
          // Nouvelles (Adresse)
          boitePostale: adresse?.boitePostale ?? "",
          quartier: adresse?.quartier ?? "",
          ville: adresse?.ville ?? "",
          pays: adresse?.pays ?? "",
          telDomicile: adresse?.telDomicile ?? "",
          // Nouvelles (Parents)
          nomPere: infosParents?.nomPrenomsPere ?? "",
          professionPere: infosParents?.professionPere ?? "",
          nomMere: infosParents?.nomPrenomsMere ?? "",
          professionMere: infosParents?.professionMere ?? "",
          // Nouvelles (Personne à prévenir)
          nomPersonnePrevenir: personnePrevenir ? `${personnePrevenir.nom} ${personnePrevenir.prenoms}`.trim() : "",
          telPersonnePrevenir: personnePrevenir?.telMobile ?? "",
          // Nouvelles (Salarié)
          estSalarie: infoSalarie?.estSalarie ? "Oui" : "Non",
          professionSalarie: infoSalarie?.profession ?? "",
        });
        applyDataStyle(wsIdentite.getRow(wsIdentite.rowCount));
      });

      // ====================================================================
      //  FEUILLE 2 : Cursus
      // ====================================================================
      const wsCursus = wb.addWorksheet(sanitizeSheetName("Cursus"));
      wsCursus.columns = [
        { header: "CursusApprenantId", key: "cursusApprenantId", width: 18 },
        { header: "UtilisateurId", key: "utilisateurId", width: 14 },
        { header: "Matricule", key: "matricule", width: 18 },
        { header: "ParcoursId", key: "parcoursId", width: 14 },
        { header: "Parcours titre", key: "parcoursTitre", width: 26 },
        { header: "NiveauId", key: "niveauId", width: 14 },
        { header: "ClasseId", key: "classeId", width: 14 },
        { header: "Classe libellé", key: "classeLibelle", width: 24 },
        { header: "Année académiqueId", key: "anneeAcademiqueId", width: 16 },
        { header: "Année libellé", key: "anneeLibelle", width: 24 },
        { header: "EtablissementId", key: "etablissementId", width: 16 },
        { header: "Statut étudiant", key: "statutEtudiant", width: 16 },
        { header: "Période", key: "periode", width: 14 },
      ];
      applyHeaderStyle(wsCursus.getRow(1));

      cursusList.forEach((c: any) => {
        const a = apprenants.find((a: any) => a.utilisateurId === c.utilisateurId);
        wsCursus.addRow({
          cursusApprenantId: c.id,
          utilisateurId: c.utilisateurId,
          matricule: dossierByUserId.get(c.utilisateurId)?.matricule ?? "",
          parcoursId: c.parcoursId ?? "",
          parcoursTitre: c.parcours?.titre ?? c.intituleParcours ?? "",
          niveauId: c.niveauEtudeId ?? "",
          classeId: c.classeId ?? "",
          classeLibelle: c.classe?.libelle ?? "",
          anneeAcademiqueId: c.anneeAcademiqueId ?? "",
          anneeLibelle: c.anneeAcademique?.libelle ?? "",
          etablissementId: c.etablissementId ?? "",
          statutEtudiant: a?.statutEtudiant ?? "",
          periode: a?.periode ?? "",
        });
        applyDataStyle(wsCursus.getRow(wsCursus.rowCount));
      });

      // Charger les Dossiers avec Échéances -> Bordereaux -> TypeOperationBordereau
      const dossiersWithDetails = await DossierEtudiant.findAll({
        where: { utilisateurId: { [Op.in]: userIds } } as any,
        include: [
          {
            association: DossierEtudiant.associations.echeances as any,
            include: [
              {
                association: Echeance.associations.bordereaux as any,
                include: [
                  { association: Bordereau.associations.typeOperation as any, attributes: ["id", "libelle"] },
                ],
              },
            ],
          },
        ],
      } as any);
      const dossierById = new Map(dossiersWithDetails.map((d: any) => [d.id, d] as [number, DossierEtudiant]));

      // ====================================================================
      //  FEUILLE 3 : Finance (enrichie)
      // ====================================================================
      const wsFinance = wb.addWorksheet(sanitizeSheetName("Finance"));
      wsFinance.columns = [
        // --- Identification ---
        { header: "Matricule", key: "matricule", width: 18 },
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 24 },
        { header: "Email", key: "email", width: 28 },
        // --- Session ---
        { header: "Session ID", key: "sessionId", width: 14 },
        { header: "Session Libellé", key: "sessionLibelle", width: 24 },
        { header: "Année Académique", key: "anneeAcademique", width: 22 },
        { header: "Semestre", key: "semestre", width: 14 },
        // --- Dossier / Échéance ---
        { header: "DossierEtudiant ID", key: "dossierEtudiantId", width: 18 },
        { header: "Echeance ID", key: "echeanceId", width: 14 },
        { header: "Echeance Montant", key: "echeanceMontant", width: 16 },
        { header: "Echeance Date", key: "echeanceDate", width: 18 },
        { header: "Echeance Statut", key: "echeanceStatut", width: 16 },
        // --- Bordereau ---
        { header: "Bordereau ID", key: "bordereauId", width: 16 },
        { header: "Bordereau Référence", key: "bordereauReference", width: 22 },
        { header: "Bordereau Montant", key: "bordereauMontant", width: 16 },
        { header: "Bordereau Date Dépôt", key: "bordereauDateDepot", width: 18 },
        { header: "Bordereau Statut", key: "bordereauStatut", width: 16 },
        { header: "Type Opération Bordereau", key: "typeOperationLibelle", width: 26 },
        // --- Paiement ---
        { header: "Somme Payée", key: "sommePayee", width: 16 },
        { header: "Reste à Payer", key: "resteAPayer", width: 18 },
        { header: "Date Paiement", key: "datePaiement", width: 18 },
      ];
      applyHeaderStyle(wsFinance.getRow(1));

      // Populate Finance data: one row per Echeance (with its Bordereaux)
      apprenants.forEach((a: any) => {
        const u = a.utilisateur;
        const cursus = cursusList.find((c: any) => c.utilisateurId === a.utilisateurId);
        const dossier = dossierByUserId.get(a.utilisateurId);
        const dossierDetails = dossier ? dossierById.get(dossier.id) : undefined;

        // Session info from CursusApprenant -> DemandeInscription -> Session -> AnneeAcademique
        const demandeInscription = cursus?.demandeInscription;
        const session = demandeInscription?.session;
        const anneeAcademique = session?.anneeAcademique;

        const nom = u?.nom ?? "";
        const prenoms = u?.prenoms ?? "";
        const email = u?.email ?? "";
        const matricule = dossier?.matricule ?? "";

        // If no dossier/echeances, still emit one row with empty finance data
        if (!dossierDetails || !dossierDetails.echeances || dossierDetails.echeances.length === 0) {
          wsFinance.addRow({
            matricule, nom, prenoms, email,
            sessionId: session?.id ?? "",
            sessionLibelle: session?.description ?? "",
            anneeAcademique: anneeAcademique?.libelle ?? "",
            semestre: "",
            dossierEtudiantId: dossier?.id ?? "",
            echeanceId: "",
            echeanceMontant: "",
            echeanceDate: "",
            echeanceStatut: "",
            bordereauId: "",
            bordereauReference: "",
            bordereauMontant: "",
            bordereauDateDepot: "",
            bordereauStatut: "",
            typeOperationLibelle: "",
            sommePayee: "",
            resteAPayer: "",
            datePaiement: "",
          });
          applyDataStyle(wsFinance.getRow(wsFinance.rowCount));
          return;
        }

        // Emit one row per Echeance (with all its Bordereaux)
        dossierDetails.echeances.forEach((echeance: any) => {
          const bordereaux = echeance.bordereaux ?? [];
          if (bordereaux.length === 0) {
            // No bordereau: still emit row with echeance info
            wsFinance.addRow({
              matricule, nom, prenoms, email,
              sessionId: session?.id ?? "",
              sessionLibelle: session?.description ?? "",
              anneeAcademique: anneeAcademique?.libelle ?? "",
              semestre: "",
              dossierEtudiantId: dossier?.id ?? "",
              echeanceId: echeance.id,
              echeanceMontant: echeance.montant ?? "",
              echeanceDate: echeance.dateLimite ? new Date(echeance.dateLimite).toLocaleDateString("fr-FR") : "",
              echeanceStatut: echeance.statut ?? "",
              bordereauId: "",
              bordereauReference: "",
              bordereauMontant: "",
              bordereauDateDepot: "",
              bordereauStatut: "",
              typeOperationLibelle: "",
              sommePayee: echeance.montantPaye ?? 0,
              resteAPayer: (echeance.montant ?? 0) - (echeance.montantPaye ?? 0),
              datePaiement: echeance.datePaiement ? new Date(echeance.datePaiement).toLocaleDateString("fr-FR") : "",
            });
          } else {
            // One row per bordereau
            bordereaux.forEach((bordereau: any) => {
              wsFinance.addRow({
                matricule, nom, prenoms, email,
                sessionId: session?.id ?? "",
                sessionLibelle: session?.description ?? "",
                anneeAcademique: anneeAcademique?.libelle ?? "",
                semestre: "",
                dossierEtudiantId: dossier?.id ?? "",
                echeanceId: echeance.id,
                echeanceMontant: echeance.montant ?? "",
                echeanceDate: echeance.dateLimite ? new Date(echeance.dateLimite).toLocaleDateString("fr-FR") : "",
                echeanceStatut: echeance.statut ?? "",
                bordereauId: bordereau.id,
                bordereauReference: bordereau.numeroBordereau ?? bordereau.referenceBancaire ?? "",
                bordereauMontant: bordereau.montant ?? "",
                bordereauDateDepot: bordereau.dateSoumission ? new Date(bordereau.dateSoumission).toLocaleDateString("fr-FR") : "",
                bordereauStatut: bordereau.statut ?? "",
                typeOperationLibelle: bordereau.typeOperation?.libelle ?? "",
                sommePayee: bordereau.montant ?? echeance.montantPaye ?? 0,
                resteAPayer: echeance.montant - (bordereau.montant ?? echeance.montantPaye ?? 0),
                datePaiement: bordereau.datePaiement ? new Date(bordereau.datePaiement).toLocaleDateString("fr-FR") : "",
              });
            });
          }
          applyDataStyle(wsFinance.getRow(wsFinance.rowCount));
        });
      });

      // ====================================================================
      //  FEUILLE 4 : Notes
      // ====================================================================
      const wsNotes = wb.addWorksheet(sanitizeSheetName("Notes"));

      const notesColumns = [
        { header: "Matricule", key: "matricule", width: 18 },
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 24 },
        { header: "Email", key: "email", width: 28 },
        { header: "Cours Code", key: "coursCode", width: 15 },
        { header: "Cours Intitulé", key: "coursIntitule", width: 35 },
        { header: "ECUE Code", key: "ecueCode", width: 15 },
        { header: "ECUE Intitulé", key: "ecueIntitule", width: 35 },
        { header: "Note", key: "note", width: 10 },
        { header: "Coefficient", key: "coefficient", width: 12 },
        { header: "Crédit", key: "credit", width: 10 },
        { header: "Semestre", key: "semestre", width: 14 },
        { header: "Année Académique", key: "anneeAcademique", width: 20 },
        { header: "Type Note", key: "typeNote", width: 16 },
        { header: "Date Saisie", key: "dateSaisie", width: 16 },
        { header: "Enseignant Nom", key: "enseignantNom", width: 25 },
        { header: "Enseignant Email", key: "enseignantEmail", width: 30 },
        { header: "Enseignant ID", key: "enseignantId", width: 14 },
      ];

      wsNotes.columns = notesColumns;
      applyHeaderStyle(wsNotes.getRow(1));

      // --- Requêtes batch pour les notes ---
      const cursusApprenantIds = cursusList.map((c: any) => c.id).filter(Boolean);

      // Charger les CoursParticipant avec leurs associations (cours, ecues, enseignant, cursusApprenant/utilisateur)
      const coursParticipants = cursusApprenantIds.length
        ? await CoursParticipant.findAll({
            where: { cursusApprenantId: { [Op.in]: cursusApprenantIds } },
            include: [
              { association: CoursParticipant.associations.cours, include: [
                { association: Cours.associations.ecues },
                { association: Cours.associations.enseignant, include: [
                  { association: Enseignant.associations.utilisateur, attributes: ["nom", "prenoms", "email"] }
                ]},
                { association: Cours.associations.parcours, attributes: ["titre"] },
                { association: Cours.associations.classe, attributes: ["libelle"] },
              ]},
              { association: CoursParticipant.associations.cursusApprenant, include: [
                { association: CursusApprenant.associations.utilisateur }
              ]},
            ],
          } as any)
        : [];

      // Charger les NoteEvaluation avec leurs listeNoteEvaluation et typeNoteEvaluation
      const cpIds = coursParticipants.map((cp: any) => cp.id).filter(Boolean);
      const notesEvaluations = cpIds.length
        ? await NoteEvaluation.findAll({
            where: { coursParticipantId: { [Op.in]: cpIds } },
            include: [
              { association: NoteEvaluation.associations.listeNoteEvaluation, include: [
                { association: ListeNoteEvaluation.associations.typeNoteEvaluation, attributes: ["libelle"] },
                { association: ListeNoteEvaluation.associations.anneeAcademique, attributes: ["libelle"] },
                { association: ListeNoteEvaluation.associations.enseignant, include: [
                  { association: Enseignant.associations.utilisateur, attributes: ["nom", "prenoms", "email"] }
                ]},
              ]},
            ],
          } as any)
        : [];

      // Construire une map: coursParticipantId -> liste de NoteEvaluation
      const notesByCpId = new Map<number, any[]>();
      notesEvaluations.forEach((ne: any) => {
        const cpId = ne.coursParticipantId;
        const arr = notesByCpId.get(cpId) ?? [];
        arr.push(ne);
        notesByCpId.set(cpId, arr);
      });

      // Pour chaque CoursParticipant, générer les lignes (avec ou sans note)
      const notesPerStudentLimit = 5; // Limite pour test, structure prête pour tout volume
      let noteRowCount = 0;

      coursParticipants.forEach((cp: any) => {
        const cursusApp = cp.cursusApprenant;
        const utilisateur = cursusApp?.utilisateur;
        if (!utilisateur) return;

        const cours = cp.cours;
        if (!cours) return;

        const notesForCp = notesByCpId.get(cp.id) ?? [];
        // Limiter à 5 notes par étudiant pour le test
        const notesToShow = notesForCp.slice(0, notesPerStudentLimit);

        if (notesToShow.length === 0) {
          // Si pas de note, lister le cours avec des champs vides
          const ecue = cours.ecues?.[0]; // Premier ECUE si existe
          const matricule = dossierByUserId.get(utilisateur.id)?.matricule ?? "";
          wsNotes.addRow({
            matricule: matricule,
            nom: utilisateur.nom ?? "",
            prenoms: utilisateur.prenoms ?? "",
            email: utilisateur.email ?? "",
            coursCode: cours.code ?? "",
            coursIntitule: cours.intitule ?? "",
            ecueCode: ecue?.code ?? "",
            ecueIntitule: ecue?.libelle ?? "",
            note: "",
            coefficient: cours.coefficient ?? "",
            credit: cours.credit ?? "",
            semestre: cours.semestre ?? "",
            anneeAcademique: "",
            typeNote: "",
            dateSaisie: "",
            enseignantNom: cours.enseignant?.utilisateur?.nom ?? "",
            enseignantEmail: cours.enseignant?.utilisateur?.email ?? "",
            enseignantId: cours.enseignantId ?? "",
          });
          applyDataStyle(wsNotes.getRow(wsNotes.rowCount));
          noteRowCount++;
        } else {
          notesToShow.forEach((ne: any) => {
            const lne = ne.listeNoteEvaluation;
            const typeNote = lne?.typeNoteEvaluation?.libelle ?? "";
            const ecue = cours.ecues?.[0]; // Premier ECUE principal
            const anneeLibelle = lne?.anneeAcademique?.libelle ?? "";
            const enseignant = lne?.enseignant;

            // Formater la date de saisie
            let dateSaisieStr = "";
            if (ne.createdAt) {
              dateSaisieStr = new Date(ne.createdAt).toLocaleDateString("fr-FR");
            }

            wsNotes.addRow({
              matricule: dossierByUserId.get(utilisateur.id)?.matricule ?? "",
              nom: utilisateur.nom ?? "",
              prenoms: utilisateur.prenoms ?? "",
              email: utilisateur.email ?? "",
              coursCode: cours.code ?? "",
              coursIntitule: cours.intitule ?? "",
              ecueCode: ecue?.code ?? "",
              ecueIntitule: ecue?.libelle ?? "",
              note: ne.note ?? "",
              coefficient: lne?.poidsTypeNoteEvaluation ?? cours.coefficient ?? "",
              credit: cours.credit ?? "",
              semestre: cours.semestre ?? "",
              anneeAcademique: anneeLibelle ?? "",
              typeNote: typeNote ?? "",
              dateSaisie: dateSaisieStr,
              enseignantNom: enseignant?.utilisateur?.nom ?? "",
              enseignantEmail: enseignant?.utilisateur?.email ?? "",
              enseignantId: enseignant?.id ?? "",
            });
            applyDataStyle(wsNotes.getRow(wsNotes.rowCount));
            noteRowCount++;
          });
        }
      });

      // ====================================================================
      //  FEUILLE 5 : Enseignants_Cours
      // ====================================================================
      const wsEnseignantsCours = wb.addWorksheet(sanitizeSheetName("Enseignants_Cours"));

      const ensCoursColumns = [
        { header: "Cours Code", key: "coursCode", width: 15 },
        { header: "Cours Intitulé", key: "coursIntitule", width: 35 },
        { header: "ECUE Code", key: "ecueCode", width: 15 },
        { header: "Parcours", key: "parcours", width: 26 },
        { header: "Semestre", key: "semestre", width: 14 },
        { header: "Enseignant Nom", key: "enseignantNom", width: 25 },
        { header: "Enseignant Email", key: "enseignantEmail", width: 30 },
        { header: "Enseignant ID", key: "enseignantId", width: 14 },
        { header: "Classe", key: "classe", width: 20 },
      ];

      wsEnseignantsCours.columns = ensCoursColumns;
      applyHeaderStyle(wsEnseignantsCours.getRow(1));

      // Charger tous les cours avec leurs associations
      const allCours = await Cours.findAll({
        include: [
          { association: Cours.associations.ecues },
          { association: Cours.associations.enseignant, include: [
            { association: Enseignant.associations.utilisateur, attributes: ["nom", "prenoms", "email"] }
          ]},
          { association: Cours.associations.parcours, attributes: ["titre"] },
          { association: Cours.associations.classe, attributes: ["libelle"] },
        ],
      }) as any;

      allCours.forEach((cours: any) => {
        const ecues = cours.ecues ?? [];
        if (ecues.length === 0) {
          // Cours sans ECUE : une ligne
          wsEnseignantsCours.addRow({
            coursCode: cours.code ?? "",
            coursIntitule: cours.intitule ?? "",
            ecueCode: "",
            parcours: cours.parcours?.titre ?? "",
            semestre: cours.semestre ?? "",
            enseignantNom: cours.enseignant?.utilisateur?.nom ?? "",
            enseignantEmail: cours.enseignant?.utilisateur?.email ?? "",
            enseignantId: cours.enseignantId ?? "",
            classe: cours.classe?.libelle ?? "",
          });
          applyDataStyle(wsEnseignantsCours.getRow(wsEnseignantsCours.rowCount));
        } else {
          ecues.forEach((ecue: any) => {
            wsEnseignantsCours.addRow({
              coursCode: cours.code ?? "",
              coursIntitule: cours.intitule ?? "",
              ecueCode: ecue.code ?? "",
              parcours: cours.parcours?.titre ?? "",
              semestre: cours.semestre ?? "",
              enseignantNom: cours.enseignant?.utilisateur?.nom ?? "",
              enseignantEmail: cours.enseignant?.utilisateur?.email ?? "",
              enseignantId: cours.enseignantId ?? "",
              classe: cours.classe?.libelle ?? "",
            });
            applyDataStyle(wsEnseignantsCours.getRow(wsEnseignantsCours.rowCount));
          });
        }
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="apprenants_migration_complet.xlsx"');
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error: any) {
      console.error("Erreur export migration complet:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========================================================================
  //  ENSEIGNANTS — Export filtré (Lot C)
  // ========================================================================

  /**
   * GET /excel/enseignants/export/filtres
   * Exporte les enseignants avec filtres : filiereId, coursId, anneeAcademiqueId.
   * Le filtre anneeAcademiqueId est appliqué via les semestres académiques du
   * parcours des cours enseignés (pas de lien direct Enseignant->Année).
   */
  static async exportEnseignantsFiltres(req: Request, res: Response): Promise<Response> {
    try {
      const { filiereId, coursId, anneeAcademiqueId } = req.query as Record<string, string>;

      const filiereIdFinal = parseIntParam(filiereId);
      const coursIdFinal = parseIntParam(coursId);
      const anneeIdFinal = parseIntParam(anneeAcademiqueId);

      // Parcours liés à l'année académique (via SemestreAcademique)
      let parcoursIdsAnnee: number[] | null = null;
      if (anneeIdFinal) {
        const semestres = await SemestreAcademique.findAll({
          where: { anneeAcademiqueId: anneeIdFinal } as any,
          attributes: ["parcoursId"],
        });
        parcoursIdsAnnee = [...new Set(semestres.map((s) => s.parcoursId).filter(Boolean))];
      }

      // Résolution des enseignants par leurs cours (filtres filiereId / coursId / annee)
      let matchedEnseignantIds: number[] | null = null;
      const coursWhere: Record<string, any> = {};
      if (coursIdFinal) coursWhere.id = coursIdFinal;

      if (filiereIdFinal && parcoursIdsAnnee !== null) {
        const ids = parcoursIdsAnnee.filter((p) => p === filiereIdFinal);
        if (ids.length === 0) matchedEnseignantIds = [];
        else coursWhere.parcoursId = { [Op.in]: ids };
      } else if (filiereIdFinal) {
        coursWhere.parcoursId = filiereIdFinal;
      } else if (parcoursIdsAnnee !== null) {
        coursWhere.parcoursId = { [Op.in]: parcoursIdsAnnee };
      }

      if (matchedEnseignantIds === null && Object.keys(coursWhere).length > 0) {
        const matched = await Cours.findAll({ where: coursWhere as any, attributes: ["enseignantId"] });
        matchedEnseignantIds = [...new Set(matched.map((c: any) => c.enseignantId).filter(Boolean))];
      }

      const enseignantWhere: any = matchedEnseignantIds !== null ? { id: { [Op.in]: matchedEnseignantIds } } : {};
      const enseignants = await Enseignant.findAll({
        where: enseignantWhere,
        include: [{ association: Enseignant.associations.utilisateur }],
      } as any);

      // Cours enseignés (concaténés) — tous les cours, par enseignant
      const coursTous = await Cours.findAll({ attributes: ["id", "intitule", "enseignantId"] });
      const coursParEnseignant = new Map<number, string[]>();
      coursTous.forEach((c: any) => {
        if (!c.enseignantId) return;
        const arr = coursParEnseignant.get(c.enseignantId) ?? [];
        arr.push(c.intitule);
        coursParEnseignant.set(c.enseignantId, arr);
      });

      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet(sanitizeSheetName("Enseignants"));

      ws.columns = [
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 24 },
        { header: "Email", key: "email", width: 30 },
        { header: "Téléphone", key: "telephone", width: 18 },
        { header: "Spécialité", key: "specialite", width: 28 },
        { header: "Statut", key: "statut", width: 12 },
        { header: "Cours enseignés", key: "cours", width: 50 },
      ];

      applyHeaderStyle(ws.getRow(1));

      enseignants.forEach((e: any) => {
        const u = e.utilisateur;
        const row = ws.addRow({
          nom: u?.nom ?? "",
          prenoms: u?.prenoms ?? "",
          email: u?.email ?? "",
          telephone: u?.contact ?? "",
          specialite: e.specialite ?? "",
          statut: u?.dateVerificationEmail ? "actif" : "inactif",
          cours: (coursParEnseignant.get(e.id) ?? []).join(", "),
        });
        applyDataStyle(row);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"enseignants_filtres.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error: any) {
      console.error("Erreur export enseignants filtré:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ========================================================================
  //  UTILISATEURS PAR RÔLE — Template / Import / Export (Lot C)
  // ========================================================================

  /**
   * GET /excel/utilisateurs/template?role=...
   * Télécharge un template Excel adapté au rôle demandé.
   */
  static async downloadUtilisateurTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const rawRole = (req.query.role as string | undefined)?.trim();
      const role = rawRole ? normalizeRole(rawRole) : null;
      if (rawRole && !role) {
        return res.status(400).json({
          success: false,
          message: `Rôle invalide. Valeurs acceptées : ${Object.values(RolesUtilisateur).join(", ")}`,
        });
      }

      const roleFinal = role ?? RolesUtilisateur.ADMIN;
      const sheetName = ROLE_SHEET_NAMES[roleFinal] ?? "Utilisateurs";

      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet(sheetName);

      const commonColumns = [
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 24 },
        { header: "Email", key: "email", width: 30 },
        { header: "Téléphone", key: "telephone", width: 18 },
        { header: "Identifiant", key: "identifiant", width: 18 },
        { header: "Mot de passe (optionnel)", key: "motDePasse", width: 24 },
      ];

      if (roleFinal === RolesUtilisateur.PARENT) {
        ws.columns = [...commonColumns, { header: "Matricule enfant (optionnel)", key: "enfantMatricule", width: 26 }];
      } else if (roleFinal === RolesUtilisateur.APPRENANT || roleFinal === RolesUtilisateur.ENSEIGNANT) {
        ws.columns = [
          ...commonColumns,
          { header: "Date naissance (JJ/MM/AAAA)", key: "dateNaissance", width: 26 },
          { header: "Lieu naissance", key: "lieuNaissance", width: 20 },
          ...(roleFinal === RolesUtilisateur.ENSEIGNANT
            ? [{ header: "Fonction / Spécialité", key: "fonction", width: 28 }]
            : []),
        ];
      } else {
        ws.columns = [...commonColumns, { header: "Statut (actif/inactif)", key: "statut", width: 20 }];
      }

      applyHeaderStyle(ws.getRow(1));

      // Ligne d'exemple
      const exemple: Record<string, any> = {
        nom: "Dupont",
        prenoms: "Jean",
        email: "jean.dupont@ecole.com",
        telephone: "+221 77 123 45 67",
        identifiant: "jdupont",
      };
      if (roleFinal === RolesUtilisateur.PARENT) {
        exemple.enfantMatricule = "ESA-2025-INF-XXXX";
      } else if (roleFinal === RolesUtilisateur.APPRENANT || roleFinal === RolesUtilisateur.ENSEIGNANT) {
        exemple.dateNaissance = "15/06/1995";
        exemple.lieuNaissance = "Dakar";
        if (roleFinal === RolesUtilisateur.ENSEIGNANT) exemple.fonction = "Professeur de Mathématiques";
      } else {
        exemple.statut = "actif";
      }
      ws.addRow(exemple);

      const instr = wb.addWorksheet("Instructions");
      instr.addRow([`Import des utilisateurs — rôle : ${ROLE_LABELS[roleFinal] ?? roleFinal}`]);
      instr.addRow([]);
      instr.addRow(["Colonnes obligatoires : Nom, Prénoms, Email, Identifiant"]);
      instr.addRow(["Mot de passe : laisser vide pour générer un mot de passe temporaire automatiquement."]);
      if (roleFinal === RolesUtilisateur.PARENT) {
        instr.addRow(["Matricule enfant : matricule d'un étudiant existant pour lier le parent (optionnel)."]);
      } else if (roleFinal === RolesUtilisateur.APPRENANT || roleFinal === RolesUtilisateur.ENSEIGNANT) {
        instr.addRow(["Date naissance : JJ/MM/AAAA — obligatoire pour un apprenant."]);
        instr.addRow(["Lieu naissance : obligatoire pour un apprenant."]);
      } else {
        instr.addRow(["Statut : 'actif' pour valider immédiatement le compte (email vérifié), sinon 'inactif'."]);
      }
      instr.addRow(["L'email doit être unique — si déjà existant, la ligne sera ignorée."]);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"template-utilisateurs.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error) {
      console.error("Erreur template utilisateurs:", error);
      return res.status(500).json({ success: false, message: "Erreur lors de la génération du template" });
    }
  }

/**
 * GET /excel/utilisateurs/template-word?role=...
 * Télécharge un template Word pour l'import d'utilisateurs par rôle.
 */
  static async downloadUtilisateurWordTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const rawRole = (req.query.role as string | undefined)?.trim();
      const role = rawRole ? normalizeRole(rawRole) : null;
      if (rawRole && !role) {
        return res.status(400).json({
          success: false,
          message: `Rôle invalide. Valeurs acceptées : ${Object.values(RolesUtilisateur).join(", ")}`,
        });
      }

      const roleFinal = role ?? RolesUtilisateur.ADMIN;
      const headers = ["Nom", "Prénoms", "Email", "Téléphone", "Identifiant", "Mot de passe (optionnel)"];

      let extraHeaders: string[] = [];
      if (roleFinal === RolesUtilisateur.PARENT) {
        extraHeaders = ["Matricule enfant (optionnel)"];
      } else if (roleFinal === RolesUtilisateur.APPRENANT || roleFinal === RolesUtilisateur.ENSEIGNANT) {
        extraHeaders = ["Date naissance (JJ/MM/AAAA)", "Lieu naissance"];
        if (roleFinal === RolesUtilisateur.ENSEIGNANT) extraHeaders.push("Fonction / Spécialité");
      } else {
        extraHeaders = ["Statut (actif/inactif)"];
      }

      const buffer = await createWordTemplate([...headers, ...extraHeaders], `Template Utilisateurs — ${ROLE_LABELS[roleFinal] ?? roleFinal}`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="template-utilisateurs.docx"`);
      return res.status(200).send(buffer);
    } catch (error) {
      console.error("Erreur template Word utilisateurs:", error);
      return res.status(500).json({ success: false, message: "Erreur lors de la génération du template Word" });
    }
  }

  /**
    * GET /excel/utilisateurs/export?role=...
    * Exporte tous les utilisateurs, filtrés par rôle si fourni.
    * Si le rôle a une table associée (Apprenant, Enseignant, ...), les infos
    * du profil sont incluses. Sans rôle : tous les utilisateurs.
    */
  static async exportUtilisateursParRole(req: Request, res: Response): Promise<Response> {
    try {
      const rawRole = (req.query.role as string | undefined)?.trim();
      const role = rawRole ? normalizeRole(rawRole) : undefined;
      if (rawRole && !role) {
        return res.status(400).json({
          success: false,
          message: `Rôle invalide. Valeurs acceptées : ${Object.values(RolesUtilisateur).join(", ")}`,
        });
      }

      const where: Record<string, any> = {};
      if (role) where.role = role;

      const includes: any[] = [];
      if (!role || role === RolesUtilisateur.APPRENANT) {
        includes.push({ association: Utilisateur.associations.apprenant, required: false });
      }
      if (!role || role === RolesUtilisateur.ENSEIGNANT) {
        includes.push({ association: Utilisateur.associations.enseignant, required: false });
      }
      if (!role || role === RolesUtilisateur.INSTITUTION) {
        includes.push({ association: Utilisateur.associations.institution, required: false });
      }
      if (!role || role === RolesUtilisateur.CAISSIER_BANQUE) {
        includes.push({ association: Utilisateur.associations.caissierBanque, required: false });
      }
      if (!role || role === RolesUtilisateur.COMITE_ORIENTATION) {
        includes.push({ association: Utilisateur.associations.comiteOrientation, required: false });
      }
      if (!role || role === RolesUtilisateur.PARENT) {
        includes.push({
          association: "parentEnfants" as any,
          required: false,
          include: [
            {
              association: "apprenant" as any,
              required: false,
              include: [{ association: Apprenant.associations.utilisateur, attributes: ["nom", "prenoms", "email"], required: false }],
            },
          ],
        });
      }

      const utilisateurs = await Utilisateur.findAll({
        where: where as any,
        include: includes,
        order: [["createdAt", "DESC"]],
      } as any);

      // Matricules des apprenants (colonne Matricule)
      const apprenantUserIds = utilisateurs
        .filter((u: any) => u.apprenant || role === RolesUtilisateur.APPRENANT)
        .map((u) => u.id);
      const dossiers = apprenantUserIds.length
        ? await DossierEtudiant.findAll({ where: { utilisateurId: { [Op.in]: apprenantUserIds } } as any })
        : [];
      const dossierByUserId = new Map(dossiers.map((d) => [d.utilisateurId, d] as [number, DossierEtudiant]));

      const showApprenant = !role || role === RolesUtilisateur.APPRENANT;
      const showProfil = !role || [
        RolesUtilisateur.APPRENANT,
        RolesUtilisateur.ENSEIGNANT,
        RolesUtilisateur.INSTITUTION,
        RolesUtilisateur.CAISSIER_BANQUE,
        RolesUtilisateur.COMITE_ORIENTATION,
      ].includes(role);
      const showParent = !role || role === RolesUtilisateur.PARENT;

      const columns: any[] = [
        { header: "Nom", key: "nom", width: 20 },
        { header: "Prénoms", key: "prenoms", width: 24 },
        { header: "Email", key: "email", width: 30 },
        { header: "Téléphone", key: "telephone", width: 18 },
        { header: "Identifiant", key: "identifiant", width: 18 },
        { header: "Rôle", key: "role", width: 22 },
        { header: "Statut", key: "statut", width: 12 },
        { header: "Date création", key: "createdAt", width: 20 },
      ];
      if (showApprenant) columns.push({ header: "Matricule", key: "matricule", width: 18 });
      if (showProfil) {
        columns.push({ header: "Fonction", key: "fonction", width: 26 });
        columns.push({ header: "Date naissance", key: "dateNaissance", width: 18 });
        columns.push({ header: "Lieu naissance", key: "lieuNaissance", width: 20 });
      }
      if (showParent) columns.push({ header: "Enfants", key: "enfants", width: 34 });

      const wb = new ExcelJS.Workbook();
      wb.creator = "EasyEcole";
      const ws = wb.addWorksheet(sanitizeSheetName(role ? (ROLE_SHEET_NAMES[role] ?? "Utilisateurs") : "Utilisateurs"));
      ws.columns = columns;
      applyHeaderStyle(ws.getRow(1));

      utilisateurs.forEach((u: any) => {
        const profil = u.apprenant || u.enseignant || u.institution || u.caissierBanque || u.comiteOrientation;
        const enfants = (u.parentEnfants ?? [])
          .map((pe: any) => {
            const enfant = pe.apprenant?.utilisateur;
            return enfant ? `${enfant.nom} ${enfant.prenoms}`.trim() : "";
          })
          .filter(Boolean)
          .join(", ");

        const rowData: Record<string, any> = {
          nom: u.nom,
          prenoms: u.prenoms,
          email: u.email,
          telephone: u.contact,
          identifiant: u.identifiant,
          role: u.role,
          statut: u.dateVerificationEmail ? "actif" : "inactif",
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "",
        };
        if (showApprenant) rowData.matricule = dossierByUserId.get(u.id)?.matricule ?? "";
        if (showProfil) {
          rowData.fonction = (profil as any).fonctionAdministrative ?? (profil as any).fonction ?? "";
          rowData.dateNaissance = profil?.dateNaissance ? new Date(profil.dateNaissance).toLocaleDateString("fr-FR") : "";
          rowData.lieuNaissance = profil?.lieuNaissance ?? "";
        }
        if (showParent) rowData.enfants = enfants;

        const row = ws.addRow(rowData);
        applyDataStyle(row);
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"utilisateurs.xlsx\"");
      await wb.xlsx.write(res);
      return res.status(200).end();
    } catch (error: any) {
      console.error("Erreur export utilisateurs:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
    * POST /excel/utilisateurs/import?role=...
    * Importe des utilisateurs depuis un fichier Excel (.xlsx) ou Word (.docx).
    * Crée automatiquement le compte Utilisateur (mot de passe généré si absent).
    * Retourne un rapport par ligne : { success, importedCount, errorCount, details }.
    */
  static async importUtilisateursParRole(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });

    const rawRole = (req.query.role as string | undefined)?.trim();
    const role = rawRole ? normalizeRole(rawRole) : null;
    if (!role) {
      return res.status(400).json({
        success: false,
        message: `Le paramètre 'role' est obligatoire. Valeurs acceptées : ${Object.values(RolesUtilisateur).join(", ")}`,
      });
    }

    const filePath = req.file.path;
    const results: { ligne: number; email?: string; statut: string; message: string; motDePasse?: string }[] = [];
    const isWord = /\.docx$/i.test(req.file.originalname);

    try {
      let rows: string[][];
      if (isWord) {
        rows = await lireTableauWordSimple(filePath);
      } else {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(filePath);
        const sheetName = ROLE_SHEET_NAMES[role] ?? "Utilisateurs";
        let ws = wb.getWorksheet(sheetName);
        if (!ws) ws = wb.worksheets[0]; // fallback : première feuille
        if (!ws) return res.status(400).json({ success: false, message: "Aucune feuille de calcul trouvée dans le fichier" });
        rows = [];
        for (let i = 2; i <= ws.rowCount; i++) {
          const row = ws.getRow(i);
          const cells: string[] = [];
          for (let j = 1; j <= 9; j++) cells.push(row.getCell(j)?.toString()?.trim() || '');
          if (cells.some(c => c !== '')) rows.push(cells);
        }
      }
      if (rows.length < 1) return res.status(400).json({ success: false, message: "Le fichier ne contient aucune ligne exploitable" });

      let imported = 0, errors = 0;

      for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx];
        const nom = row[0] || '';
        const prenoms = row[1] || '';
        const email = row[2] || '';
        const telephone = row[3] || null;
        const identifiant = row[4] || '';
        const motDePasseSaisi = row[5] || null;
        const col7 = row[6] || null; // statut | dateNaissance | matricule enfant
        const col8 = row[7] || null; // lieuNaissance
        const col9 = row[8] || null; // fonction

        if (!nom && !prenoms && !email && !identifiant) continue; // ligne vide

        if (!nom || !prenoms || !email || !identifiant) {
          errors++;
          results.push({ ligne: idx + 1, email, statut: "erreur", message: "Nom, prénoms, email et identifiant sont obligatoires" });
          continue;
        }

        try {
          // 0. Données spécifiques au rôle — validées AVANT création du compte
          let dateNaissance: Date | null = null;
          let lieuNaissance: string | null = null;
          let fonction: string | null = null;
          let apprenantEnfant: Apprenant | null = null;

          if (role === RolesUtilisateur.ENSEIGNANT) {
            dateNaissance = parseExcelDate(col7);
            lieuNaissance = col8;
            fonction = col9;
          } else if (role === RolesUtilisateur.APPRENANT) {
            dateNaissance = parseExcelDate(col7);
            lieuNaissance = col8;
          } else if (role === RolesUtilisateur.PARENT && col7) {
            const dossier = await DossierEtudiant.findOne({ where: { matricule: col7 } });
            if (dossier) {
              apprenantEnfant = await Apprenant.findOne({ where: { utilisateurId: dossier.utilisateurId } });
            }
            if (!dossier || !apprenantEnfant) {
              errors++;
              results.push({ ligne: idx + 1, email, statut: "erreur", message: `Matricule enfant "${col7}" introuvable ou non rattaché à un apprenant` });
              continue;
            }
          }

          if (role === RolesUtilisateur.APPRENANT && (!dateNaissance || !lieuNaissance)) {
            errors++;
            results.push({ ligne: idx + 1, email, statut: "erreur", message: "Date naissance et lieu naissance sont obligatoires pour un apprenant" });
            continue;
          }

          // 1. Email unique
          const existant = await Utilisateur.findOne({ where: { email } });
          if (existant) {
            errors++;
            results.push({ ligne: idx + 1, email, statut: "erreur", message: "Cet email est déjà utilisé" });
            continue;
          }

          // 2. Mot de passe : saisi ou généré automatiquement
          const motDePasseFinal = motDePasseSaisi || generateTempPassword();
          const dateVerificationEmail =
            role === RolesUtilisateur.APPRENANT || role === RolesUtilisateur.ENSEIGNANT || role === RolesUtilisateur.PARENT
              ? undefined
              : isActifStatut(col7)
                ? new Date()
                : undefined;

          // 3. Créer l'utilisateur
          const utilisateur = await Utilisateur.create({
            nom,
            prenoms,
            email: email!,
            identifiant: identifiant!,
            contact: telephone || "",
            motDePasse: bcrypt.hashSync(motDePasseFinal, 12),
            role,
            dateVerificationEmail,
          } as any);

          // 4. Enregistrements spécifiques au rôle
          if (role === RolesUtilisateur.ENSEIGNANT) {
            await Enseignant.create({
              utilisateurId: utilisateur.id,
              dateNaissance: dateNaissance ?? undefined,
              lieuNaissance: lieuNaissance ?? undefined,
              fonction: fonction ?? undefined,
            } as any);
          } else if (role === RolesUtilisateur.APPRENANT) {
            await Apprenant.create({
              utilisateurId: utilisateur.id,
              dateNaissance: dateNaissance!,
              lieuNaissance: lieuNaissance!,
            } as any);
          } else if (role === RolesUtilisateur.PARENT && apprenantEnfant) {
            await ParentEnfant.create({
              parentUtilisateurId: utilisateur.id,
              apprenantId: apprenantEnfant.id,
            } as any);
          }

          imported++;
          results.push({
            ligne: idx + 1,
            email,
            statut: "succès",
            message: "Compte créé",
            motDePasse: motDePasseSaisi ? undefined : motDePasseFinal,
          });
        } catch (err: any) {
          errors++;
          results.push({ ligne: idx + 1, email, statut: "erreur", message: err.message });
        }
      }

      return res.status(200).json({ success: true, importedCount: imported, errorCount: errors, details: results });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    } finally {
      fs.unlink(filePath, () => {});
    }
  }
}
