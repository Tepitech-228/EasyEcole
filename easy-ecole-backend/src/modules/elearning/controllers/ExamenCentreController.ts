import { Request, Response } from "express";
import { Op } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import ElearningFinanceService from "../services/ElearningFinanceService";
import { isSaturdayDate } from "../services/EvaluationRules";
import { CentreExamen } from "../models/CentreExamen";
import { Examen } from "../models/Examen";
import { ReservationExamen } from "../models/ReservationExamen";
import { SelectionCours } from "../models/SelectionCours";
import { SessionExamen } from "../models/SessionExamen";

function actor(req: Request): { id: number; role: string } {
  return { id: Number((req as any).utilisateurId), role: String((req as any).utilisateurRole) };
}

function isAdmin(role: string): boolean {
  return role === RolesUtilisateur.ADMIN || role === RolesUtilisateur.INSTITUTION;
}

function reply(res: Response, status: number, message: string): Response {
  return res.status(status).json({ success: false, message });
}

function isFuture(value: Date): boolean {
  return value.getTime() > Date.now();
}

export default class ExamenCentreController {
  static async listMyCentres(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    const centres = await CentreExamen.findAll({
      where: { responsableId: current.id, actif: true },
      order: [["nom", "ASC"]],
    });
    return res.status(200).json(centres);
  }

  static async listCentres(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (!isAdmin(current.role)) {
      return reply(res, 403, "La gestion des centres est réservée à l'administration.");
    }
    const centres = await CentreExamen.findAll({
      include: [{ association: CentreExamen.associations.responsable, attributes: ["id", "nom", "prenoms", "email"] }],
      order: [["nom", "ASC"]],
    });
    return res.status(200).json(centres);
  }

  static async createCentre(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (!isAdmin(current.role)) return reply(res, 403, "Seule l'administration peut créer un centre.");
    const nom = String(req.body.nom || "").trim();
    const code = String(req.body.code || "").trim().toUpperCase();
    const ville = String(req.body.ville || "").trim();
    const adresse = String(req.body.adresse || "").trim() || null;
    const telephone = String(req.body.telephone || "").trim() || null;
    const capacite = Number(req.body.capacite);
    const responsableId = Number(req.body.responsableId);
    if (!nom || nom.length > 160 || !/^[A-Z0-9_-]{2,40}$/.test(code) || !ville || ville.length > 120
      || !Number.isSafeInteger(capacite) || capacite <= 0
      || !Number.isSafeInteger(responsableId) || responsableId <= 0) {
      return reply(res, 400, "Nom, code, ville, capacité et responsable valides sont requis.");
    }
    const responsable = await Utilisateur.findByPk(responsableId);
    if (!responsable) return reply(res, 404, "Le compte responsable du centre est introuvable.");
    try {
      const centre = await CentreExamen.create({ nom, code, ville, adresse, telephone, capacite, responsableId, actif: true });
      return res.status(201).json(centre);
    } catch (error: any) {
      if (error?.name === "SequelizeUniqueConstraintError") return reply(res, 409, "Ce code de centre est déjà utilisé.");
      console.error("[E-learning] Création de centre impossible:", error);
      return reply(res, 500, "Le centre n'a pas pu être créé.");
    }
  }

  static async updateCentre(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (!isAdmin(current.role)) return reply(res, 403, "Seule l'administration peut modifier un centre.");
    const centre = await CentreExamen.findByPk(Number(req.params.centreId));
    if (!centre) return reply(res, 404, "Centre introuvable.");
    const updates: Record<string, unknown> = {};
    for (const field of ["nom", "ville", "adresse", "telephone"] as const) {
      if (req.body[field] !== undefined) updates[field] = String(req.body[field]).trim() || null;
    }
    if (req.body.code !== undefined) updates.code = String(req.body.code).trim().toUpperCase();
    if (req.body.capacite !== undefined) {
      const capacite = Number(req.body.capacite);
      if (!Number.isSafeInteger(capacite) || capacite <= 0) return reply(res, 400, "La capacité doit être un entier positif.");
      updates.capacite = capacite;
    }
    if (req.body.responsableId !== undefined) {
      const responsableId = Number(req.body.responsableId);
      if (!Number.isSafeInteger(responsableId) || responsableId <= 0 || !await Utilisateur.findByPk(responsableId)) {
        return reply(res, 400, "Le responsable doit être un compte utilisateur existant.");
      }
      updates.responsableId = responsableId;
    }
    if (req.body.actif !== undefined) {
      if (typeof req.body.actif !== "boolean") return reply(res, 400, "L'état actif du centre est invalide.");
      updates.actif = req.body.actif;
    }
    try {
      await centre.update(updates);
      return res.status(200).json(centre);
    } catch (error: any) {
      if (error?.name === "SequelizeUniqueConstraintError") return reply(res, 409, "Ce code de centre est déjà utilisé.");
      console.error("[E-learning] Modification de centre impossible:", error);
      return reply(res, 500, "Le centre n'a pas pu être modifié.");
    }
  }

  static async createSession(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (!isAdmin(current.role)) return reply(res, 403, "Seule l'administration peut programmer une séance.");
    const examenId = Number(req.body.examenId);
    const centreId = Number(req.body.centreId);
    const dateExamenValue = String(req.body.dateExamen || "");
    const dateExamen = new Date(dateExamenValue);
    const capacite = Number(req.body.capacite);
    if (!Number.isSafeInteger(examenId) || examenId <= 0 || !Number.isSafeInteger(centreId) || centreId <= 0
      || !Number.isSafeInteger(capacite) || capacite <= 0 || !isSaturdayDate(dateExamenValue)
      || Number.isNaN(dateExamen.getTime()) || !isFuture(dateExamen)) {
      return reply(res, 400, "Examen, centre, capacité positive et date future un samedi sont requis.");
    }
    const [examen, centre] = await Promise.all([
      Examen.findOne({ where: { id: examenId, statut: "publie" } }),
      CentreExamen.findOne({ where: { id: centreId, actif: true } }),
    ]);
    if (!examen) return reply(res, 404, "Examen publié introuvable.");
    if (!centre) return reply(res, 404, "Centre actif introuvable.");
    if (capacite > centre.capacite) return reply(res, 400, "La capacité de séance dépasse celle du centre.");
    const session = await SessionExamen.create({
      examenId,
      centreId,
      dateExamen,
      capacite,
      statut: "ouverte",
      creePar: current.id,
    });
    await ElearningFinanceService.recordAudit(current.id, current.role, "examen.session.creee", "session_examen", session.id, { examenId, centreId, dateExamen: dateExamen.toISOString() });
    return res.status(201).json(session);
  }

  static async listSessions(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    const examenId = Number(req.query.examenId);
    if (!Number.isSafeInteger(examenId) || examenId <= 0) return reply(res, 400, "Un examen valide est requis.");
    const examen = await Examen.findOne({ where: { id: examenId, statut: "publie" } });
    if (!examen) return reply(res, 404, "Examen publié introuvable.");

    let where: Record<string, unknown> = { examenId, statut: "ouverte" };
    if (!isAdmin(current.role)) {
      if (current.role === RolesUtilisateur.APPRENANT) {
        try {
          await ElearningFinanceService.getApprovedOnlineAdmission(current.id);
        } catch (error: any) {
          return reply(res, error.statusCode || 409, error.message || "Admission e-learning requise.");
        }
        const selection = await SelectionCours.findOne({ where: {
          utilisateurId: current.id,
          coursId: examen.coursId,
          anneeAcademiqueId: examen.anneeAcademiqueId,
          statut: "acces_ouvert",
        } });
        if (!selection) return reply(res, 403, "Vous n'êtes pas inscrit à cette UE.");
      } else {
        const centres = await CentreExamen.findAll({ where: { responsableId: current.id }, attributes: ["id"] });
        const centreIds = centres.map(item => Number(item.id));
        if (!centreIds.length) return reply(res, 403, "Aucun centre d'examen ne vous est affecté.");
        where.centreId = { [Op.in]: centreIds };
      }
    }

    const sessions = await SessionExamen.findAll({
      where,
      include: [
        { association: SessionExamen.associations.centre, attributes: ["id", "nom", "ville", "adresse"] },
        { association: SessionExamen.associations.examen, attributes: ["id", "coursId", "semestre"] },
      ],
      order: [["dateExamen", "ASC"]],
    });
    const result = [];
    for (const session of sessions) {
      const count = await ReservationExamen.count({
        where: { sessionId: session.id, statut: { [Op.in]: ["reservee", "presente", "absente"] } },
      });
      if (current.role === RolesUtilisateur.APPRENANT && count >= session.capacite) continue;
      result.push({ ...session.toJSON(), placesDisponibles: Math.max(0, session.capacite - count) });
    }
    return res.status(200).json(result);
  }

  static async listAssignedSessions(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    const centres = await CentreExamen.findAll({ where: { responsableId: current.id }, attributes: ["id"] });
    const centreIds = centres.map(item => Number(item.id));
    if (!centreIds.length) return reply(res, 403, "Aucun centre d'examen ne vous est affecté.");
    const sessions = await SessionExamen.findAll({
      where: { centreId: { [Op.in]: centreIds } },
      include: [
        { association: SessionExamen.associations.centre, attributes: ["id", "nom", "ville"] },
        { association: SessionExamen.associations.examen, attributes: ["id", "coursId", "semestre", "statut"], include: [{ association: Examen.associations.cours, attributes: ["id", "code", "titre"] }] },
        { association: SessionExamen.associations.reservations, include: [{ association: ReservationExamen.associations.utilisateur, attributes: ["id", "nom", "prenoms"] }] },
      ],
      order: [["dateExamen", "ASC"]],
    });
    return res.status(200).json(sessions);
  }

  static async listStudentExams(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (current.role !== RolesUtilisateur.APPRENANT) return reply(res, 403, "Réservé aux apprenants.");
    try {
      const admission = await ElearningFinanceService.getApprovedOnlineAdmission(current.id);
      const year = await ElearningFinanceService.getActiveYear();
      const academicYearId = ElearningFinanceService.requireAcademicYearId(year);
      const session = admission.session as any;
      if (session?.anneeAcademiqueId && academicYearId !== Number(session.anneeAcademiqueId)) {
        return reply(res, 409, "L'année e-learning active ne correspond pas à votre demande.");
      }
      const selections = await SelectionCours.findAll({
        where: { utilisateurId: current.id, anneeAcademiqueId: academicYearId, statut: "acces_ouvert" },
        attributes: ["coursId"],
      });
      const coursIds = selections.map(item => Number(item.coursId));
      if (!coursIds.length) return res.status(200).json([]);
      const examens = await Examen.findAll({
        where: { anneeAcademiqueId: academicYearId, statut: "publie", coursId: { [Op.in]: coursIds } },
        include: [{ association: Examen.associations.cours, attributes: ["id", "code", "titre"] }],
        order: [["dateExamen", "ASC"]],
      });
      const result = [];
      for (const examen of examens) {
        const reservation = await ReservationExamen.findOne({
          where: { examenId: examen.id, utilisateurId: current.id, statut: { [Op.ne]: "annulee" } },
          include: [{ association: ReservationExamen.associations.session, include: [{ association: SessionExamen.associations.centre, attributes: ["id", "nom", "ville", "adresse"] }] }],
        });
        const sessions = await SessionExamen.findAll({
          where: { examenId: examen.id, statut: "ouverte", dateExamen: { [Op.gt]: new Date() } },
          include: [{ association: SessionExamen.associations.centre, attributes: ["id", "nom", "ville", "adresse"] }],
          order: [["dateExamen", "ASC"]],
        });
        const available = [];
        for (const examSession of sessions) {
          const reserved = await ReservationExamen.count({
            where: { sessionId: examSession.id, statut: { [Op.in]: ["reservee", "presente", "absente"] } },
          });
          if (reserved < examSession.capacite) available.push({ ...examSession.toJSON(), placesDisponibles: examSession.capacite - reserved });
        }
        result.push({ ...examen.toJSON(), reservation, sessionsDisponibles: available });
      }
      return res.status(200).json(result);
    } catch (error: any) {
      const status = Number(error?.statusCode) || 500;
      if (status !== 500) return reply(res, status, error.message || "Accès e-learning indisponible.");
      console.error("[E-learning] Examens apprenant indisponibles:", error);
      return reply(res, 500, "Impossible de charger vos examens.");
    }
  }

  static async reserve(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (current.role !== RolesUtilisateur.APPRENANT) return reply(res, 403, "Seul l'apprenant peut réserver une séance.");
    const sessionId = Number(req.params.sessionId);
    const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
    try {
      await ElearningFinanceService.getApprovedOnlineAdmission(current.id, transaction);
      const session = await SessionExamen.findByPk(sessionId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!session || session.statut !== "ouverte" || !isFuture(session.dateExamen)) {
        await transaction.rollback();
        return reply(res, 404, "Séance introuvable, fermée ou passée.");
      }
      const examen = await Examen.findOne({ where: { id: session.examenId, statut: "publie" }, transaction });
      const reservationExistante = await ReservationExamen.findOne({
        where: { examenId: session.examenId, utilisateurId: current.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!examen) {
        await transaction.rollback();
        return reply(res, 404, "Examen publié introuvable.");
      }
      const selection = await SelectionCours.findOne({
        where: { utilisateurId: current.id, coursId: examen.coursId, anneeAcademiqueId: examen.anneeAcademiqueId, statut: "acces_ouvert" },
        transaction,
      });
      if (!selection) {
        await transaction.rollback();
        return reply(res, 403, "Vous n'êtes pas inscrit à cette UE.");
      }
      if (reservationExistante && reservationExistante.statut !== "annulee") {
        await transaction.rollback();
        return reply(res, 409, "Vous avez déjà réservé une séance pour cet examen.");
      }
      const count = await ReservationExamen.count({
        where: { sessionId, statut: { [Op.in]: ["reservee", "presente", "absente"] } },
        transaction,
      });
      if (count >= session.capacite) {
        await transaction.rollback();
        return reply(res, 409, "Cette séance est complète.");
      }
      const reservation = reservationExistante
        ? await reservationExistante.update({ sessionId, statut: "reservee", marquePar: null }, { transaction })
        : await ReservationExamen.create({ examenId: examen.id, sessionId, utilisateurId: current.id, statut: "reservee", marquePar: null }, { transaction });
      await transaction.commit();
      return res.status(201).json(reservation);
    } catch (error) {
      await transaction.rollback();
      console.error("[E-learning] Réservation d'examen impossible:", error);
      return reply(res, 500, "La réservation de l'examen n'a pas pu être enregistrée.");
    }
  }

  static async cancelReservation(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (current.role !== RolesUtilisateur.APPRENANT) return reply(res, 403, "Seul l'apprenant peut annuler sa réservation.");
    const reservation = await ReservationExamen.findOne({ where: { examenId: Number(req.params.examenId), utilisateurId: current.id, statut: "reservee" } });
    if (!reservation) return reply(res, 404, "Réservation active introuvable.");
    const session = await SessionExamen.findByPk(reservation.sessionId);
    if (!session || !isFuture(session.dateExamen)) return reply(res, 409, "Une réservation passée ne peut pas être annulée.");
    await reservation.update({ statut: "annulee" });
    return res.status(200).json({ success: true });
  }

  static async markAttendance(req: Request, res: Response): Promise<Response> {
    const current = actor(req);
    if (current.role !== RolesUtilisateur.ADMIN && current.role !== RolesUtilisateur.INSTITUTION) {
      const centre = await CentreExamen.findOne({ where: { responsableId: current.id } });
      if (!centre) return reply(res, 403, "Aucun centre d'examen ne vous est affecté.");
      const reservationForCentre = await ReservationExamen.findByPk(Number(req.params.reservationId), {
        include: [{ association: ReservationExamen.associations.session, attributes: ["centreId"] }],
      });
      if (!reservationForCentre || Number((reservationForCentre.session as any)?.centreId) !== Number(centre.id)) {
        return reply(res, 403, "Cette réservation ne dépend pas de votre centre.");
      }
    }
    const reservation = await ReservationExamen.findByPk(Number(req.params.reservationId));
    if (!reservation) return reply(res, 404, "Réservation introuvable.");
    const statut = req.body.statut;
    if (statut !== "presente" && statut !== "absente") return reply(res, 400, "Le statut doit être présente ou absente.");
    await reservation.update({ statut, marquePar: current.id });
    await ElearningFinanceService.recordAudit(current.id, current.role, "examen.presence.marquee", "reservation_examen", reservation.id, { statut });
    return res.status(200).json(reservation);
  }
}
