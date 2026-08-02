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
}
