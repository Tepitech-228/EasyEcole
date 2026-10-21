import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import ElearningFinanceService, { ElearningFinanceError } from "../services/ElearningFinanceService";
import { Encaissement } from "../models/Encaissement";
import { Enveloppe } from "../models/Enveloppe";
import { Mouvement } from "../models/Mouvement";
import { SelectionCours } from "../models/SelectionCours";
import { TarifCredit } from "../models/TarifCredit";
import { AnneeElearning } from "../models/AnneeElearning";
import { Utilisateur } from "../../auth/models/Utilisateur";

const RECOUVREMENT_ROLES = new Set<string>([
  RolesUtilisateur.ADMIN,
  RolesUtilisateur.INSTITUTION,
  RolesUtilisateur.CAISSIER_BANQUE,
  RolesUtilisateur.ESA_COMPTA,
  RolesUtilisateur.SECRETAIRE,
]);

function actor(req: Request): { id: number; role: string } {
  return {
    id: Number((req as any).utilisateurId),
    role: String((req as any).utilisateurRole),
  };
}

function canCollect(req: Request): boolean {
  return RECOUVREMENT_ROLES.has(actor(req).role);
}

function replyError(res: Response, error: unknown): Response {
  if (error instanceof ElearningFinanceError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  console.error("[E-learning Finance] Erreur de traitement:", error);
  return res.status(500).json({ success: false, message: "Erreur lors du traitement financier e-learning." });
}

export default class FinanceController {
  static async listAnnees(req: Request, res: Response): Promise<Response> {
    try {
      const years = await AnneeElearning.findAll({ order: [["dateDebut", "DESC"]] });
      return res.status(200).json(years);
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async createAnnee(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (current.role !== RolesUtilisateur.ADMIN && current.role !== RolesUtilisateur.INSTITUTION) {
      return res.status(403).json({ success: false, message: "Seule l'administration peut gérer les années e-learning." });
    }
    const libelle = String(req.body.libelle || "").trim();
    const dateDebut = String(req.body.dateDebut || "");
    const dateFin = String(req.body.dateFin || "");
    if (!libelle || !/^\d{4}-\d{2}-\d{2}$/.test(dateDebut) || !/^\d{4}-\d{2}-\d{2}$/.test(dateFin) || dateDebut >= dateFin) {
      return res.status(400).json({ success: false, message: "Libellé et dates académiques valides requis." });
    }
    try {
      const year = await AnneeElearning.create({
        libelle,
        dateDebut: new Date(`${dateDebut}T00:00:00.000Z`),
        dateFin: new Date(`${dateFin}T00:00:00.000Z`),
        active: false,
        anneeAcademiqueId: req.body.anneeAcademiqueId ? Number(req.body.anneeAcademiqueId) : null,
      });
      await ElearningFinanceService.recordAudit(current.id, current.role, "annee.cree", "annee", year.id, { libelle });
      return res.status(201).json(year);
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async activerAnnee(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (current.role !== RolesUtilisateur.ADMIN && current.role !== RolesUtilisateur.INSTITUTION) {
      return res.status(403).json({ success: false, message: "Seule l'administration peut activer une année." });
    }
    const sequelize = DatabaseConnection.getInstance().sequelize;
    try {
      const year = await sequelize.transaction(async transaction => {
        const selected = await AnneeElearning.findByPk(Number(req.params.id), { transaction, lock: transaction.LOCK.UPDATE });
        if (!selected) throw new ElearningFinanceError("Année e-learning introuvable.", 404);
        await AnneeElearning.update({ active: false }, { where: { active: true }, transaction });
        selected.active = true;
        await selected.save({ transaction });
        await ElearningFinanceService.recordAudit(current.id, current.role, "annee.activee", "annee", selected.id, { libelle: selected.libelle }, transaction);
        return selected;
      });
      return res.status(200).json(year);
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async getBudget(req: Request, res: Response): Promise<Response> {
    try {
      const current = actor(req);
      const year = await ElearningFinanceService.getActiveYear();
      const utilisateurId = current.role === RolesUtilisateur.APPRENANT
        ? current.id
        : Number(req.query.utilisateurId || 0);
      if (!utilisateurId) return res.status(400).json({ success: false, message: "Un étudiant doit être précisé." });
      if (current.role === RolesUtilisateur.APPRENANT && utilisateurId !== current.id) {
        return res.status(403).json({ success: false, message: "Accès refusé." });
      }
      if (current.role !== RolesUtilisateur.APPRENANT && !canCollect(req)) {
        return res.status(403).json({ success: false, message: "Accès réservé au recouvrement." });
      }
      const envelope = await Enveloppe.findOne({
        where: { utilisateurId, anneeAcademiqueId: year.id },
      });
      if (!envelope) {
        return res.status(200).json({
          utilisateurId,
          anneeAcademique: year.libelle,
          montantAlloue: 0,
          montantReserve: 0,
          montantConsomme: 0,
          soldeDisponible: 0,
          mouvements: [],
        });
      }
      const mouvements = await Mouvement.findAll({ where: { enveloppeId: envelope.id }, order: [["dateMouvement", "DESC"]] });
      return res.status(200).json({
        utilisateurId,
        anneeAcademique: year.libelle,
        montantAlloue: Number(envelope.montantAlloue),
        montantReserve: Number(envelope.montantReserve),
        montantConsomme: Number(envelope.montantConsomme),
        soldeDisponible: ElearningFinanceService.available(envelope),
        mouvements,
      });
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async listEncaissements(req: Request, res: Response): Promise<Response> {
    if (!canCollect(req)) return res.status(403).json({ success: false, message: "Accès réservé au recouvrement." });
    try {
      const year = await ElearningFinanceService.getActiveYear();
      const where: Record<string, unknown> = { anneeAcademiqueId: year.id };
      if (req.query.statut && ["saisi", "valide", "annule"].includes(String(req.query.statut))) {
        where.statut = String(req.query.statut);
      }
      if (req.query.utilisateurId) where.utilisateurId = Number(req.query.utilisateurId);
      const payments = await Encaissement.findAll({
        where,
        include: [{ model: Utilisateur, as: "utilisateur", attributes: ["id", "nom", "prenoms", "identifiant"] }],
        order: [["dateEncaissement", "DESC"]],
        limit: 200,
      });
      return res.status(200).json(payments);
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async saisirEncaissement(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (!canCollect(req)) return res.status(403).json({ success: false, message: "Accès réservé au recouvrement." });
    const utilisateurId = Number(req.body.utilisateurId);
    const montant = Number(req.body.montant);
    if (!Number.isInteger(utilisateurId) || utilisateurId <= 0 || !Number.isFinite(montant) || montant <= 0) {
      return res.status(400).json({ success: false, message: "L'étudiant et un montant supérieur à zéro sont requis." });
    }
    try {
      const student = await Utilisateur.findByPk(utilisateurId);
      if (!student || student.role !== RolesUtilisateur.APPRENANT) {
        return res.status(404).json({ success: false, message: "Compte étudiant introuvable." });
      }
      const year = await ElearningFinanceService.getActiveYear();
      const sequelize = DatabaseConnection.getInstance().sequelize;
      const payment = await sequelize.transaction(async transaction => {
        const envelope = await ElearningFinanceService.getOrCreateEnvelope(utilisateurId, year.id, transaction);
        if (envelope.statut !== "ouverte") throw new ElearningFinanceError("L'enveloppe e-learning de cet étudiant n'est pas ouverte.", 409);
        const entry = await Encaissement.create({
          enveloppeId: envelope.id,
          utilisateurId,
          agentId: current.id,
          anneeAcademiqueId: year.id,
          montant,
          reference: req.body.reference ? String(req.body.reference).slice(0, 191) : null,
          statut: "saisi",
          commentaire: req.body.commentaire ? String(req.body.commentaire) : null,
        }, { transaction });
        await ElearningFinanceService.recordAudit(current.id, current.role, "encaissement.saisi", "encaissement", entry.id, { utilisateurId, montant }, transaction);
        return entry;
      });
      return res.status(201).json(payment);
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async validerEncaissement(req: Request, res: Response): Promise<Response> {
    if (!canCollect(req)) return res.status(403).json({ success: false, message: "Accès réservé au recouvrement." });
    try {
      const payment = await ElearningFinanceService.creditEncaissement(Number(req.params.id), actor(req).id);
      return res.status(200).json(payment);
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async getSelections(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    const utilisateurId = current.role === RolesUtilisateur.APPRENANT
      ? current.id
      : Number(req.query.utilisateurId || 0);
    if (!utilisateurId) return res.status(400).json({ success: false, message: "Un étudiant doit être précisé." });
    if (current.role === RolesUtilisateur.APPRENANT && utilisateurId !== current.id) {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }
    if (current.role !== RolesUtilisateur.APPRENANT && !canCollect(req)) {
      return res.status(403).json({ success: false, message: "Accès réservé au recouvrement." });
    }
    try {
      const year = await ElearningFinanceService.getActiveYear();
      const selections = await SelectionCours.findAll({
        where: { utilisateurId, anneeAcademiqueId: year.id },
        include: [{ association: SelectionCours.associations.cours, attributes: ["id", "code", "titre", "nbCredits", "coutTotal"] }],
        order: [["dateProposition", "DESC"]],
      });
      return res.status(200).json(selections);
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async choisirCours(req: Request, res: Response): Promise<Response> {
    if (actor(req).role !== RolesUtilisateur.APPRENANT) {
      return res.status(403).json({ success: false, message: "Seuls les étudiants peuvent choisir un cours." });
    }
    const coursId = Number(req.body.coursId);
    if (!Number.isInteger(coursId) || coursId <= 0) {
      return res.status(400).json({ success: false, message: "Un cours valide est requis." });
    }
    try {
      const selection = await ElearningFinanceService.selectCourse(actor(req).id, coursId);
      return res.status(201).json(selection);
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async getTarif(req: Request, res: Response): Promise<Response> {
    try {
      const year = await ElearningFinanceService.getActiveYear();
      const today = new Date().toISOString().slice(0, 10);
      const tarif = await TarifCredit.findOne({
        where: { anneeAcademiqueId: year.id, actif: true, dateEffet: { [Op.lte]: today } },
        order: [["dateEffet", "DESC"], ["id", "DESC"]],
      });
      return res.status(200).json({ anneeAcademique: year.libelle, prixCredit: Number(tarif?.valeur || 0), dateEffet: tarif?.dateEffet || null });
    } catch (error) {
      return replyError(res, error);
    }
  }

  static async definirTarif(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (current.role !== RolesUtilisateur.ADMIN && current.role !== RolesUtilisateur.INSTITUTION) {
      return res.status(403).json({ success: false, message: "Seule l'administration peut définir le prix du crédit." });
    }
    const valeur = Number(req.body.valeur);
    const dateEffet = String(req.body.dateEffet || "");
    if (!Number.isFinite(valeur) || valeur <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dateEffet)) {
      return res.status(400).json({ success: false, message: "Le prix doit être positif et la date d'effet valide." });
    }
    try {
      const year = await ElearningFinanceService.getActiveYear();
      const rate = await TarifCredit.create({
        cle: `credit_cours_en_ligne_${year.id}_${dateEffet}`,
        libelle: "Tarif du crédit cours en ligne",
        valeur,
        unite: "FCFA",
        dateEffet: new Date(`${dateEffet}T00:00:00.000Z`),
        anneeAcademiqueId: year.id,
        actif: true,
      });
      await ElearningFinanceService.recordAudit(current.id, current.role, "tarif.credit.modifie", "tarif_credit", rate.id, { valeur, dateEffet });
      return res.status(201).json(rate);
    } catch (error) {
      return replyError(res, error);
    }
  }
}
