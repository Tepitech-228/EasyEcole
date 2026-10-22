import { Request, Response } from "express";
import path from "path";
import { Devoir } from "../models/Devoir";
import { SoumissionDevoir } from "../models/SoumissionDevoir";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Op } from "sequelize";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { SelectionCours } from "../models/SelectionCours";
import ElearningAccessService from "../services/ElearningAccessService";
import ElearningFinanceService, { ElearningFinanceError } from "../services/ElearningFinanceService";
import fs from "fs";

function currentActor(req: Request): { id: number; role: string } {
  return { id: Number((req as any).utilisateurId), role: String((req as any).utilisateurRole) };
}

export default class DevoirController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const coursId = req.query.coursId ? Number(req.query.coursId) : undefined;
      const where: Record<string, unknown> = {};
      if (coursId) where.coursId = coursId;
      const { id: userId, role } = currentActor(req);
      if (role === RolesUtilisateur.APPRENANT) {
        const selections = await SelectionCours.findAll({
          where: { utilisateurId: userId, statut: "acces_ouvert" },
          attributes: ["coursId"],
        });
        where.coursId = coursId
          ? selections.some(selection => Number(selection.coursId) === coursId) ? coursId : -1
          : selections.map(selection => Number(selection.coursId));
        where.statut = "publie";
        const devoirs = await Devoir.findAll({
          where,
          include: [{ association: Devoir.associations.cours }],
          order: [['dateLimite', 'ASC']]
        });
        const result = [];
        for (const d of devoirs) {
          const soumission = await SoumissionDevoir.findOne({
            where: { devoirId: d.id, apprenantId: userId }
          });
          result.push({ ...d.toJSON(), soumission: soumission || null });
        }
        return res.status(200).send(result);
      }

      if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
        const managedCourses = await CoursEnLigne.findAll({
          where: { [Op.or]: [{ professeurId: userId }, { enseignantId: userId }, { chargeSupportId: userId }] },
          attributes: ["id"],
        });
        const managedIds = managedCourses.map(course => Number(course.id));
        if (!managedIds.length) {
          return res.status(403).json({ success: false, message: "Accès aux devoirs non autorisé." });
        }
        where.coursId = coursId ? managedIds.includes(coursId) ? coursId : -1 : managedIds;
      }
      const devoirs = await Devoir.findAll({
        where,
        include: [
          { association: Devoir.associations.cours },
          { association: Devoir.associations.enseignant, attributes: ['id', 'nom', 'prenoms'] }
        ],
        order: [['dateLimite', 'ASC']]
      });
      return res.status(200).send(devoirs);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const devoir = await Devoir.findByPk(req.params.id, {
        include: [
          { association: Devoir.associations.cours },
          { association: Devoir.associations.enseignant, attributes: ['id', 'nom', 'prenoms'] }
        ]
      });
      if (!devoir) return res.status(404).json({ success: false, message: "Devoir non trouvé" });

      const { id: userId, role } = currentActor(req);
      if (!await ElearningAccessService.canAccessCourse(userId, role, Number(devoir.coursId))) {
        return res.status(403).json({ success: false, message: "Accès à ce cours non autorisé." });
      }
      let soumissions: any[] = [];
      if (role === RolesUtilisateur.APPRENANT) {
        soumissions = await SoumissionDevoir.findAll({
          where: { devoirId: devoir.id, apprenantId: userId },
          include: [{ association: SoumissionDevoir.associations.apprenant, attributes: ['id', 'nom', 'prenoms'] }]
        });
      } else {
        soumissions = await SoumissionDevoir.findAll({
          where: { devoirId: devoir.id },
          include: [{ association: SoumissionDevoir.associations.apprenant, attributes: ['id', 'nom', 'prenoms'] }]
        });
      }

      const payload = devoir.toJSON() as any;
      if (role === RolesUtilisateur.APPRENANT) delete payload.sujetFichier;
      return res.status(200).send({ ...payload, soumissions });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { id: userId, role } = currentActor(req);
      const coursId = Number(req.body.coursId);
      const semestre = Number(req.body.semestre);
      const removeUploadedFile = async () => {
        if (req.file) await fs.promises.unlink(req.file.path).catch(error => console.error("[E-learning] Fichier temporaire impossible à supprimer:", error));
      };
      const year = await ElearningFinanceService.getActiveYear();
      if (![1, 2].includes(semestre)) {
        await removeUploadedFile();
        return res.status(400).json({ success: false, message: "Le devoir doit être rattaché au semestre 1 ou 2." });
      }
      if (!await ElearningAccessService.canManageCourse(userId, role, coursId)) {
        await removeUploadedFile();
        return res.status(403).json({ success: false, message: "Seul le professeur ou le chargé de support du cours peut créer un devoir." });
      }
      const course = await CoursEnLigne.findByPk(coursId);
      if (!course || Number(course.anneeAcademiqueId) !== Number(year.id)) {
        await removeUploadedFile();
        return res.status(400).json({ success: false, message: "Le cours doit appartenir à l'année e-learning active." });
      }
      if (!req.body.titre || !req.body.dateLimite) {
        await removeUploadedFile();
        return res.status(400).json({ success: false, message: "Le titre et la date limite sont requis." });
      }
      const existing = await Devoir.findOne({ where: { coursId, anneeAcademiqueId: year.id, semestre } });
      if (existing) {
        await removeUploadedFile();
        return res.status(409).json({ success: false, message: `Un devoir existe déjà pour le semestre ${semestre}.` });
      }
      if (req.file && path.extname(req.file.originalname).toLowerCase() !== ".pdf") {
        await fs.promises.unlink(req.file.path);
        return res.status(400).json({ success: false, message: "Le sujet du devoir doit être un fichier PDF." });
      }
      const statut = req.body.statut === "publie" ? "publie" : "brouillon";
      if (statut === "publie" && !req.file) {
        return res.status(400).json({ success: false, message: "Un sujet PDF est obligatoire pour publier le devoir." });
      }
      const dateLimite = new Date(req.body.dateLimite);
      const poids = Number(req.body.poids ?? 50);
      if (Number.isNaN(dateLimite.getTime()) || !Number.isFinite(poids) || poids <= 0 || poids > 100) {
        await removeUploadedFile();
        return res.status(400).json({ success: false, message: "Date limite ou pondération invalide." });
      }
      const devoir = await Devoir.create({
        titre: req.body.titre,
        description: req.body.description,
        dateLimite,
        coursId,
        enseignantId: Number(course.professeurId || course.enseignantId || userId),
        semestre: semestre as 1 | 2,
        anneeAcademiqueId: year.id,
        consignes: req.body.consignes || null,
        poids,
        statut,
        datePublication: statut === "publie" ? new Date() : null,
        sujetFichier: req.file ? path.relative(process.cwd(), req.file.path) : null,
        fichier: req.file?.filename || null,
      });
      await ElearningFinanceService.recordAudit(userId, role, "devoir.cree", "devoir", Number(devoir.id), { coursId, semestre });
      return res.status(201).send(devoir);
    } catch (error) {
      if (error instanceof ElearningFinanceError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(400).json({ success: false, error });
    }
  }

  static async soumettre(req: Request, res: Response): Promise<Response> {
    try {
      const devoir = await Devoir.findByPk(req.params.id);
      if (!devoir) return res.status(404).json({ success: false, message: "Devoir non trouvé" });
      const { id: userId, role } = currentActor(req);
      const file = req.file;
      if (role !== RolesUtilisateur.APPRENANT
        || !await ElearningAccessService.canAccessCourse(userId, role, Number(devoir.coursId))) {
        if (file) await fs.promises.unlink(file.path);
        return res.status(403).json({ success: false, message: "Seul un étudiant inscrit à ce cours peut déposer un devoir." });
      }
      if (devoir.statut !== "publie") {
        if (file) await fs.promises.unlink(file.path);
        return res.status(409).json({ success: false, message: "Ce devoir n'est pas publié." });
      }
      if (new Date(devoir.dateLimite).getTime() < Date.now()) {
        if (file) await fs.promises.unlink(file.path);
        return res.status(409).json({ success: false, message: "La date limite de dépôt est dépassée." });
      }
      if (!file) return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
      if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
        await fs.promises.unlink(file.path);
        return res.status(400).json({ success: false, message: "Le devoir rendu doit être un fichier PDF." });
      }

      const soumission = await SoumissionDevoir.create({
        devoirId: Number(req.params.id),
        apprenantId: userId,
        fichier: path.relative(process.cwd(), file.path),
      });
      return res.status(201).send(soumission);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async noter(req: Request, res: Response): Promise<Response> {
    try {
      const soumission = await SoumissionDevoir.findByPk(req.params.soumissionId);
      if (!soumission) return res.status(404).json({ success: false, message: "Soumission non trouvée" });
      const devoir = await Devoir.findByPk(req.params.id);
      if (!devoir) return res.status(404).json({ success: false, message: "Devoir non trouvé" });
      const { id: userId, role } = currentActor(req);
      if (!await ElearningAccessService.canGradeCourse(userId, role, Number(devoir.coursId))) {
        return res.status(403).json({ success: false, message: "Seul le professeur responsable peut corriger ce devoir." });
      }
      const note = Number(req.body.note);
      if (!Number.isFinite(note) || note < 0 || note > 20) {
        return res.status(400).json({ success: false, message: "La note doit être comprise entre 0 et 20." });
      }
      await soumission.update({
        note,
        commentaire: req.body.commentaire || null,
        dateCorrection: new Date(),
        corrigePar: userId,
      });
      await ElearningFinanceService.recordAudit(userId, role, "devoir.corrige", "soumission", Number(soumission.id), { devoirId: devoir.id, note });
      return res.status(200).send(soumission);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async downloadSoumission(req: Request, res: Response): Promise<void> {
    try {
      const soumission = await SoumissionDevoir.findByPk(req.params.soumissionId);
      if (!soumission) { res.status(404).json({ success: false }); return; }
      const devoir = await Devoir.findByPk(req.params.id);
      if (!devoir) { res.status(404).json({ success: false }); return; }
      const { id: userId, role } = currentActor(req);
      if (role === RolesUtilisateur.APPRENANT
        ? Number(soumission.apprenantId) !== userId
        : !await ElearningAccessService.canManageCourse(userId, role, Number(devoir.coursId))) {
        res.status(403).json({ success: false, message: "Accès à cette copie non autorisé." });
        return;
      }
      const filePath = path.resolve(process.cwd(), soumission.fichier);
      const basePath = path.resolve(process.cwd(), "public", "elearning", "protected", "soumissions");
      if (!filePath.startsWith(`${basePath}${path.sep}`) || !fs.existsSync(filePath)) { res.status(404).json({ success: false }); return; }
      res.download(filePath);
    } catch (error) { console.error("[E-learning] Téléchargement de soumission impossible:", error); res.status(500).json({ success: false }); }
  }

  static async downloadSujet(req: Request, res: Response): Promise<void> {
    try {
      const devoir = await Devoir.findByPk(req.params.id);
      if (!devoir || devoir.statut !== "publie") { res.status(404).json({ success: false, message: "Sujet de devoir introuvable." }); return; }
      const { id: userId, role } = currentActor(req);
      if (!await ElearningAccessService.canAccessCourse(userId, role, Number(devoir.coursId))) {
        res.status(403).json({ success: false, message: "Accès au sujet non autorisé." });
        return;
      }
      const filePath = path.resolve(process.cwd(), String(devoir.sujetFichier || ""));
      const basePath = path.resolve(process.cwd(), "public", "elearning", "protected", "devoirs");
      if (!devoir.sujetFichier || !filePath.startsWith(`${basePath}${path.sep}`) || !fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: "Fichier du sujet introuvable." });
        return;
      }
      res.sendFile(filePath);
    } catch (error) {
      console.error("[E-learning] Téléchargement du sujet impossible:", error);
      res.status(500).json({ success: false, message: "Impossible de servir le sujet." });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const devoir = await Devoir.findByPk(req.params.id);
      if (!devoir) return res.status(404).json({ success: false });
      const { id: userId, role } = currentActor(req);
      if (!await ElearningAccessService.canManageCourse(userId, role, Number(devoir.coursId))) {
        return res.status(403).json({ success: false, message: "Gestion du cours non autorisée." });
      }
      const submissions = await SoumissionDevoir.count({ where: { devoirId: devoir.id } });
      if (submissions > 0) {
        await devoir.update({ statut: "ferme" });
        return res.status(200).json({ success: true, statut: "ferme", historiqueConserve: true });
      }
      await devoir.destroy();
      return res.status(200).json({ success: true });
    } catch (error) { console.error("[E-learning] Suppression du devoir impossible:", error); return res.status(500).json({ success: false }); }
  }
}
