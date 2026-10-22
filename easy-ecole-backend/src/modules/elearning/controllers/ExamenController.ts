import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import ElearningFinanceService, { ElearningFinanceError } from "../services/ElearningFinanceService";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { Examen } from "../models/Examen";
import { NoteExamen } from "../models/NoteExamen";
import { SelectionCours } from "../models/SelectionCours";

const EXAMEN_DIR = path.resolve(process.cwd(), "public", "elearning", "protected", "examens");

function isAdministrator(req: Request): boolean {
  const role = (req as any).utilisateurRole;
  return role === RolesUtilisateur.ADMIN || role === RolesUtilisateur.INSTITUTION;
}

function sendProtectedFile(file: string, res: Response, download: boolean): void {
  const filePath = path.resolve(process.cwd(), file);
  if (!filePath.startsWith(`${EXAMEN_DIR}${path.sep}`) || !fs.existsSync(filePath)) {
    res.status(404).json({ success: false, message: "Sujet d'examen introuvable." });
    return;
  }
  if (download) res.download(filePath, "sujet-examen.pdf");
  else res.sendFile(filePath);
}

export default class ExamenController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    if (!isAdministrator(req)) return res.status(403).json({ success: false, message: "Les examens sont réservés à l'administration." });
    try {
      const year = await ElearningFinanceService.getActiveYear();
      const examens = await Examen.findAll({
        where: { anneeAcademiqueId: year.id },
        include: [{ association: Examen.associations.cours }],
        order: [["dateExamen", "ASC"]],
      });
      return res.status(200).json(examens);
    } catch (error) {
      if (error instanceof ElearningFinanceError) return res.status(error.statusCode).json({ success: false, message: error.message });
      console.error("[E-learning] Liste des examens indisponible:", error);
      return res.status(500).json({ success: false, message: "Impossible de charger les examens." });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    if (!isAdministrator(req)) return res.status(403).json({ success: false, message: "Seule l'administration peut gérer les examens." });
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "Le sujet PDF de l'examen est obligatoire." });
    const coursId = Number(req.body.coursId);
    try {
      const year = req.body.anneeAcademiqueId
        ? await ElearningFinanceService.getActiveYear()
        : await ElearningFinanceService.getActiveYear();
      const course = await CoursEnLigne.findOne({ where: { id: coursId, anneeAcademiqueId: year.id } });
      if (!course) {
        await fs.promises.unlink(file.path);
        return res.status(404).json({ success: false, message: "Cours e-learning introuvable pour l'année active." });
      }
      const existing = await Examen.findOne({ where: { coursId, anneeAcademiqueId: year.id } });
      if (existing) {
        await fs.promises.unlink(file.path);
        return res.status(409).json({ success: false, message: "Un examen annuel existe déjà pour ce cours." });
      }
      const dateExamen = req.body.dateExamen ? new Date(req.body.dateExamen) : null;
      if (dateExamen && Number.isNaN(dateExamen.getTime())) {
        await fs.promises.unlink(file.path);
        return res.status(400).json({ success: false, message: "Date d'examen invalide." });
      }
      const examen = await Examen.create({
        coursId,
        anneeAcademiqueId: year.id,
        dateExamen,
        lieu: req.body.lieu ? String(req.body.lieu).slice(0, 255) : null,
        dureeMinutes: req.body.dureeMinutes ? Number(req.body.dureeMinutes) : null,
        sujetFichier: path.relative(process.cwd(), file.path),
        statut: req.body.statut === "publie" ? "publie" : "brouillon",
        creePar: Number((req as any).utilisateurId),
      });
      await ElearningFinanceService.recordAudit(
        Number((req as any).utilisateurId),
        String((req as any).utilisateurRole),
        "examen.cree",
        "examen",
        examen.id,
        { coursId, anneeAcademiqueId: year.id }
      );
      return res.status(201).json(examen);
    } catch (error) {
      console.error("[E-learning] Création d'examen impossible:", error);
      return res.status(500).json({ success: false, message: "Impossible d'enregistrer l'examen." });
    }
  }

  static async sujet(req: Request, res: Response): Promise<void> {
    if (!isAdministrator(req)) { res.status(403).json({ success: false, message: "Le sujet d'examen est confidentiel." }); return; }
    try {
      const examen = await Examen.findByPk(req.params.id);
      if (!examen) { res.status(404).json({ success: false, message: "Examen introuvable." }); return; }
      sendProtectedFile(examen.sujetFichier, res, false);
    } catch (error) {
      console.error("[E-learning] Lecture du sujet d'examen impossible:", error);
      res.status(500).json({ success: false, message: "Impossible de lire le sujet." });
    }
  }

  static async impression(req: Request, res: Response): Promise<void> {
    if (!isAdministrator(req)) { res.status(403).json({ success: false, message: "L'impression des sujets est réservée à l'administration." }); return; }
    try {
      const examen = await Examen.findByPk(req.params.id);
      if (!examen) { res.status(404).json({ success: false, message: "Examen introuvable." }); return; }
      sendProtectedFile(examen.sujetFichier, res, true);
    } catch (error) {
      console.error("[E-learning] Impression du sujet d'examen impossible:", error);
      res.status(500).json({ success: false, message: "Impossible de préparer l'impression." });
    }
  }

  static async noter(req: Request, res: Response): Promise<Response> {
    if (!isAdministrator(req)) return res.status(403).json({ success: false, message: "La saisie des résultats est réservée à l'administration." });
    const utilisateurId = Number(req.body.utilisateurId);
    const note = Number(req.body.note);
    if (!Number.isInteger(utilisateurId) || utilisateurId <= 0 || !Number.isFinite(note) || note < 0 || note > 20) {
      return res.status(400).json({ success: false, message: "Étudiant valide et note comprise entre 0 et 20 requis." });
    }
    try {
      const examen = await Examen.findByPk(req.params.id);
      if (!examen) return res.status(404).json({ success: false, message: "Examen introuvable." });
      const inscrit = await SelectionCours.findOne({
        where: { utilisateurId, coursId: examen.coursId, anneeAcademiqueId: examen.anneeAcademiqueId, statut: "acces_ouvert" },
      });
      if (!inscrit) return res.status(400).json({ success: false, message: "Cet étudiant n'a pas acquis le cours concerné." });
      const [result] = await NoteExamen.findOrCreate({
        where: { examenId: examen.id, utilisateurId },
        defaults: {
          examenId: examen.id,
          utilisateurId,
          note,
          commentaire: req.body.commentaire ? String(req.body.commentaire) : null,
          saisiePar: Number((req as any).utilisateurId),
        },
      });
      if (result.note !== note || result.commentaire !== (req.body.commentaire || null)) {
        await result.update({
          note,
          commentaire: req.body.commentaire ? String(req.body.commentaire) : null,
          saisiePar: Number((req as any).utilisateurId),
        });
      }
      await ElearningFinanceService.recordAudit(Number((req as any).utilisateurId), String((req as any).utilisateurRole), "examen.note.saisie", "note_examen", result.id, { examenId: examen.id, utilisateurId, note });
      return res.status(200).json(result);
    } catch (error) {
      console.error("[E-learning] Saisie de la note d'examen impossible:", error);
      return res.status(500).json({ success: false, message: "Impossible d'enregistrer la note." });
    }
  }
}
