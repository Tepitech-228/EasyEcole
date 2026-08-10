import { Request, Response } from "express";
import ExcelJS from "exceljs";
import * as fs from "fs";
import * as bcrypt from "bcrypt";
import { Op } from "sequelize";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { Session } from "../models/Session";
import { DemandeInscription } from "../models/DemandeInscription";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { CursusApprenant } from "../models/CursusApprenant";
import { SalleDeClasse } from "../models/SalleDeClasse";
import { SemestreAcademique } from "../models/SemestreAcademique";
import { ParentEnfant } from "../../parent/models/ParentEnfant";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

// ---------------------------------------------------------------------------
//  UTILITIES
// ---------------------------------------------------------------------------

const TEMP_DIR = "public/excel/";
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

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
  static async importUe(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });

    const results: { code?: string; intitule?: string; statut: string; message: string }[] = [];
    const filePath = req.file.path;

    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      const ws = wb.getWorksheet("UE");
      if (!ws) return res.status(400).json({ success: false, message: "Feuille 'UE' introuvable dans le fichier" });

      const rowCount = ws.rowCount;
      let imported = 0, errors = 0;

      for (let i = 2; i <= rowCount; i++) {
        const row = ws.getRow(i);
        const code = row.getCell(1)?.toString()?.trim();
        const intitule = row.getCell(2)?.toString()?.trim();
        const credit = parseInt(row.getCell(3)?.toString()) || 0;
        const creditEcts = parseInt(row.getCell(4)?.toString()) || 0;
        const semestre = row.getCell(5)?.toString()?.trim() || null;
        const coefficient = parseInt(row.getCell(6)?.toString()) || 0;
        const volumeHoraire = parseInt(row.getCell(7)?.toString()) || 0;
        const estObligatoireRaw = row.getCell(8)?.toString()?.trim()?.toUpperCase();
        const estObligatoire = estObligatoireRaw === "O" || estObligatoireRaw === "OUI" || estObligatoireRaw === "YES";
        const objectifs = row.getCell(9)?.toString()?.trim() || null;
        const parcoursTitre = row.getCell(10)?.toString()?.trim();
        const enseignantEmail = row.getCell(11)?.toString()?.trim() || null;

        if (!code || !intitule || !parcoursTitre) {
          errors++;
          results.push({ code, intitule, statut: "erreur", message: "Code, intitulé et parcours sont obligatoires" });
          continue;
        }

        try {
          const parcours = await resolveParcours(parcoursTitre);
          if (!parcours) {
            errors++;
            results.push({ code, intitule, statut: "erreur", message: `Parcours "${parcoursTitre}" introuvable` });
            continue;
          }

          let enseignantId = null;
          if (enseignantEmail) {
            const ens = await resolveEnseignant(enseignantEmail);
            if (!ens) {
              errors++;
              results.push({ code, intitule, statut: "erreur", message: `Enseignant "${enseignantEmail}" introuvable` });
              continue;
            }
            enseignantId = ens.id;
          }

          const [cours, created] = await Cours.findOrCreate({
            where: { code, parcoursId: parcours.id },
            defaults: {
              code,
              intitule,
              parcoursId: parcours.id,
              credit,
              creditEcts,
              semestre: semestre || undefined,
              coefficient,
              volumeHoraire,
              estObligatoire,
              objectifs,
              enseignantId,
            },
          } as any);

          if (!created) {
            await cours.update({
              intitule, credit, creditEcts,
              semestre: semestre || undefined,
              coefficient,
              volumeHoraire, estObligatoire, objectifs, enseignantId,
            } as any);
          }

          imported++;
          results.push({ code, intitule, statut: "succès", message: created ? "Créé" : "Mis à jour" });
        } catch (err: any) {
          errors++;
          results.push({ code, intitule, statut: "erreur", message: err.message });
        }
      }

      return res.status(200).json({ success: true, importedCount: imported, errorCount: errors, details: results });
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
   * POST /excel/enseignants/import
   */
  static async importEnseignants(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    const filePath = req.file.path;
    const results: { email?: string; statut: string; message: string; motDePasse?: string }[] = [];

    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      const ws = wb.getWorksheet("Enseignants");
      if (!ws) return res.status(400).json({ success: false, message: "Feuille 'Enseignants' introuvable" });

      let imported = 0, errors = 0;

      for (let i = 2; i <= ws.rowCount; i++) {
        const row = ws.getRow(i);
        const nom = row.getCell(1)?.toString()?.trim();
        const prenoms = row.getCell(2)?.toString()?.trim();
        const email = row.getCell(3)?.toString()?.trim();
        const identifiant = row.getCell(4)?.toString()?.trim();
        const contact = row.getCell(5)?.toString()?.trim() || null;
        const fonction = row.getCell(6)?.toString()?.trim() || null;
        const dateNaissance = parseExcelDate(row.getCell(7)?.value);
        const lieuNaissance = row.getCell(8)?.toString()?.trim() || null;

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
            nom,
            prenoms,
            email: email!,
            identifiant: identifiant!,
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
          fonction: e.fonction,
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
        { header: "Nom", key: "nom", width: 18 },
        { header: "Prénoms", key: "prenoms", width: 22 },
        { header: "Email", key: "email", width: 28 },
        { header: "Identifiant", key: "identifiant", width: 16 },
        { header: "Contact", key: "contact", width: 16 },
        { header: "Date naissance (JJ/MM/AAAA)", key: "dateNaissance", width: 26 },
        { header: "Lieu naissance", key: "lieuNaissance", width: 18 },
        { header: "Session (titre)", key: "session", width: 22 },
        { header: "Parcours (titre)", key: "parcours", width: 22 },
      ];

      applyHeaderStyle(ws.getRow(1));

      ws.addRow({
        nom: "Diallo",
        prenoms: "Aminata",
        email: "aminata.diallo@etu.com",
        identifiant: "adiallo",
        contact: "+221 76 123 45 67",
        dateNaissance: "01/01/2000",
        lieuNaissance: "Thiès",
        session: "2025-2026",
        parcours: "Licence Informatique",
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
   * POST /excel/apprenants/import
   * Crée l'utilisateur + l'apprenant + la demande d'inscription liée à la session/parcours.
   */
  static async importApprenants(req: Request, res: Response): Promise<Response> {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    const filePath = req.file.path;
    const results: { email?: string; statut: string; message: string; motDePasse?: string }[] = [];

    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      const ws = wb.getWorksheet("Apprenants");
      if (!ws) return res.status(400).json({ success: false, message: "Feuille 'Apprenants' introuvable" });

      let imported = 0, errors = 0;

      for (let i = 2; i <= ws.rowCount; i++) {
        const row = ws.getRow(i);
        const nom = row.getCell(1)?.toString()?.trim();
        const prenoms = row.getCell(2)?.toString()?.trim();
        const email = row.getCell(3)?.toString()?.trim();
        const identifiant = row.getCell(4)?.toString()?.trim();
        const contact = row.getCell(5)?.toString()?.trim() || null;
        const dateNaissance = parseExcelDate(row.getCell(6)?.value);
        const lieuNaissance = row.getCell(7)?.toString()?.trim();
        const sessionTitre = row.getCell(8)?.toString()?.trim();
        const parcoursTitre = row.getCell(9)?.toString()?.trim();

        if (!nom || !prenoms || !email || !identifiant || !dateNaissance || !lieuNaissance || !sessionTitre || !parcoursTitre) {
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
          const parcours = await resolveParcours(parcoursTitre);
          if (!parcours) {
            errors++;
            results.push({ email, statut: "erreur", message: `Parcours "${parcoursTitre}" introuvable` });
            continue;
          }

          // 4. Créer utilisateur
          const tempPassword = generateTempPassword();
          const utilisateur = await Utilisateur.create({
            nom,
            prenoms,
            email: email!,
            identifiant: identifiant!,
            contact: contact || '',
            motDePasse: bcrypt.hashSync(tempPassword, 12),
            role: RolesUtilisateur.APPRENANT,
          });

          // 5. Créer apprenant
          await Apprenant.create({
            utilisateurId: utilisateur.id,
            dateNaissance,
            lieuNaissance,
          } as any);

          // 6. Créer demande d'inscription (auto-redirection)
          await DemandeInscription.create({
            utilisateurId: utilisateur.id,
            sessionId: session.id,
            dateDemande: new Date(),
            matricule: `TMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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

      ws.columns = [
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
      ];

      applyHeaderStyle(ws.getRow(1));

      cursusList.forEach((c: any) => {
        const u = c.utilisateur;
        const dossier = dossierByUserId.get(c.utilisateurId);
        const parcoursTitre = c.parcours?.titre ?? c.intituleParcours ?? "";
        const sallesClasse = sallesByClasseId.get(c.classeId) ?? [];
        const row = ws.addRow({
          matricule: dossier?.matricule ?? "",
          nom: u?.nom ?? "",
          prenoms: u?.prenoms ?? "",
          email: u?.email ?? "",
          telephone: u?.contact ?? "",
          sexe: "", // champ non modélisé dans la base (voir rapport)
          parcours: parcoursTitre,
          filiere: parcoursTitre,
          classe: c.classe?.libelle ?? "",
          niveau: c.niveauEtude?.libelle ?? "",
          promotion: c.anneeAcademique?.libelle ?? "",
          salle: sallesClasse.join(", "),
          statutDossier: dossier?.statut ?? "",
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
          specialite: e.fonction ?? "",
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
          rowData.fonction = profil?.fonction ?? "";
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
   * Importe des utilisateurs depuis un fichier Excel (template par rôle).
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

    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);

      const sheetName = ROLE_SHEET_NAMES[role] ?? "Utilisateurs";
      let ws = wb.getWorksheet(sheetName);
      if (!ws) ws = wb.worksheets[0]; // fallback : première feuille
      if (!ws) return res.status(400).json({ success: false, message: "Aucune feuille de calcul trouvée dans le fichier" });

      let imported = 0, errors = 0;

      for (let i = 2; i <= ws.rowCount; i++) {
        const row = ws.getRow(i);
        const nom = row.getCell(1)?.toString()?.trim();
        const prenoms = row.getCell(2)?.toString()?.trim();
        const email = row.getCell(3)?.toString()?.trim();
        const telephone = row.getCell(4)?.toString()?.trim() || null;
        const identifiant = row.getCell(5)?.toString()?.trim();
        const motDePasseSaisi = row.getCell(6)?.toString()?.trim() || null;
        const col7 = row.getCell(7)?.toString()?.trim() || null; // statut | dateNaissance | matricule enfant
        const col8 = row.getCell(8)?.toString()?.trim() || null; // lieuNaissance
        const col9 = row.getCell(9)?.toString()?.trim() || null; // fonction

        if (!nom && !prenoms && !email && !identifiant) continue; // ligne vide

        if (!nom || !prenoms || !email || !identifiant) {
          errors++;
          results.push({ ligne: i, email, statut: "erreur", message: "Nom, prénoms, email et identifiant sont obligatoires" });
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
              results.push({ ligne: i, email, statut: "erreur", message: `Matricule enfant "${col7}" introuvable ou non rattaché à un apprenant` });
              continue;
            }
          }

          if (role === RolesUtilisateur.APPRENANT && (!dateNaissance || !lieuNaissance)) {
            errors++;
            results.push({ ligne: i, email, statut: "erreur", message: "Date naissance et lieu naissance sont obligatoires pour un apprenant" });
            continue;
          }

          // 1. Email unique
          const existant = await Utilisateur.findOne({ where: { email } });
          if (existant) {
            errors++;
            results.push({ ligne: i, email, statut: "erreur", message: "Cet email est déjà utilisé" });
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
            ligne: i,
            email,
            statut: "succès",
            message: "Compte créé",
            motDePasse: motDePasseSaisi ? undefined : motDePasseFinal,
          });
        } catch (err: any) {
          errors++;
          results.push({ ligne: i, email, statut: "erreur", message: err.message });
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
