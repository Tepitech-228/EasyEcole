import { Op, Transaction } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { AnneeElearning } from "../models/AnneeElearning";
import { Audit } from "../models/Audit";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { Encaissement } from "../models/Encaissement";
import { Enveloppe } from "../models/Enveloppe";
import { Mouvement } from "../models/Mouvement";
import { SelectionCours } from "../models/SelectionCours";
import { TarifCredit } from "../models/TarifCredit";
import { DemandeInscription } from "../../inscription/models/DemandeInscription";

export class ElearningFinanceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

export default class ElearningFinanceService {
  static async getActiveYear(transaction?: Transaction): Promise<AnneeElearning> {
    const year = await AnneeElearning.findOne({ where: { active: true }, transaction });
    if (!year) throw new ElearningFinanceError("Aucune année académique e-learning active n'est configurée.", 409);
    return year;
  }

  /**
   * `elearning_annees.id` est un identifiant LOCAL au module e-learning.
   * Toutes les clés étrangères métier (`elearning_cours.anneeAcademiqueId`,
   * enveloppes, encaissements, sélections, devoirs, examens) pointent vers
   * `ins_annees_academiques.id`. Ce garde-fou refuse d'écrire avec l'id local
   * (bug historique : les contenus étaient rattachés à l'année académique 1).
   */
  static requireAcademicYearId(year: AnneeElearning): number {
    const academicYearId = Number(year.anneeAcademiqueId);
    if (!Number.isSafeInteger(academicYearId) || academicYearId <= 0) {
      throw new ElearningFinanceError(
        `L'année e-learning « ${year.libelle} » n'est rattachée à aucune année académique. Corrigez son rattachement avant de continuer.`,
        409
      );
    }
    return academicYearId;
  }

  static async getActiveAcademicYearId(transaction?: Transaction): Promise<number> {
    return this.requireAcademicYearId(await this.getActiveYear(transaction));
  }

  static async getCurrentRate(yearId: number, transaction?: Transaction): Promise<number> {
    const now = new Date().toISOString().slice(0, 10);
    const rate = await TarifCredit.findOne({
      where: { actif: true, anneeAcademiqueId: yearId, dateEffet: { [Op.lte]: now } },
      order: [["dateEffet", "DESC"], ["id", "DESC"]],
      transaction,
    });
    const value = Number(rate?.valeur ?? 0);
    if (!Number.isFinite(value) || value <= 0) {
      throw new ElearningFinanceError("Le prix du crédit e-learning n'est pas encore configuré.", 409);
    }
    return value;
  }

  static async getApprovedOnlineAdmission(utilisateurId: number, transaction?: Transaction): Promise<DemandeInscription> {
    const sessionAssociation = DemandeInscription.associations?.session;
    const admission = await DemandeInscription.findOne({
      where: { utilisateurId, modeFormation: "en_ligne", statutPipeline: "valide" },
      include: sessionAssociation ? [{
        association: sessionAssociation,
        attributes: ["id", "niveauEtudeId", "anneeAcademiqueId"],
      }] : [],
      order: [["createdAt", "DESC"]],
      transaction,
    });
    if (!admission) {
      throw new ElearningFinanceError("L'accès au catalogue e-learning est disponible après validation du dossier par le comité.", 409);
    }
    return admission;
  }

  static async getOrCreateEnvelope(utilisateurId: number, anneeAcademiqueId: number, transaction: Transaction): Promise<Enveloppe> {
    const [envelope] = await Enveloppe.findOrCreate({
      where: { utilisateurId, anneeAcademiqueId },
      defaults: { utilisateurId, anneeAcademiqueId, montantAlloue: 0, montantReserve: 0, montantConsomme: 0, statut: "ouverte" },
      transaction,
    });
    await envelope.reload({ transaction, lock: transaction.LOCK.UPDATE });
    return envelope;
  }

  static available(envelope: Enveloppe): number {
    return Number(envelope.montantAlloue) - Number(envelope.montantReserve) - Number(envelope.montantConsomme);
  }

  static async recordAudit(
    acteurId: number,
    acteurRole: string,
    action: string,
    entite: string,
    entiteId: number | string | null,
    payload: object | null,
    transaction?: Transaction
  ): Promise<void> {
    await Audit.create({
      acteurId,
      acteurRole,
      action,
      entite,
      entiteId: entiteId === null ? null : String(entiteId),
      payload,
    }, { transaction });
  }

  static async creditEncaissement(encaissementId: number, agentId: number): Promise<Encaissement> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    return sequelize.transaction(async transaction => {
      const payment = await Encaissement.findByPk(encaissementId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!payment) throw new ElearningFinanceError("Encaissement e-learning introuvable.", 404);
      if (payment.statut !== "saisi") throw new ElearningFinanceError("Cet encaissement n'est pas en attente de validation.", 409);

      const envelope = await Enveloppe.findByPk(payment.enveloppeId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!envelope || envelope.statut !== "ouverte") throw new ElearningFinanceError("L'enveloppe e-learning n'est pas ouverte.", 409);
      const amount = Number(payment.montant);
      if (!Number.isFinite(amount) || amount <= 0) throw new ElearningFinanceError("Le montant doit être supérieur à zéro.", 400);

      envelope.montantAlloue = Number(envelope.montantAlloue) + amount;
      await envelope.save({ transaction });
      const movement = await Mouvement.create({
        enveloppeId: envelope.id,
        type: "credit",
        montant: amount,
        soldeCourant: this.available(envelope),
        commentaire: payment.commentaire || "Encaissement e-learning validé",
        referenceType: "encaissement",
        referenceId: payment.id,
      }, { transaction });
      payment.statut = "valide";
      payment.agentId = agentId;
      payment.mouvementId = movement.id;
      await payment.save({ transaction });
      await this.recordAudit(agentId, "recouvrement", "encaissement.valide", "encaissement", payment.id, { montant: amount }, transaction);
      return payment;
    });
  }

  static async selectCourse(utilisateurId: number, coursId: number): Promise<SelectionCours> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    return sequelize.transaction(async transaction => {
      const year = await this.getActiveYear(transaction);
      const academicYearId = this.requireAcademicYearId(year);
      const admission = await this.getApprovedOnlineAdmission(utilisateurId, transaction);
      if (!admission) {
        throw new ElearningFinanceError("L'accès au catalogue e-learning est disponible après validation du dossier par le comité.", 409);
      }

      const envelope = await this.getOrCreateEnvelope(utilisateurId, academicYearId, transaction);
      if (envelope.statut !== "ouverte") throw new ElearningFinanceError("Votre budget e-learning n'est pas ouvert.", 409);

      const course = await CoursEnLigne.findOne({
        where: { id: coursId, statut: "publie", anneeAcademiqueId: year.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!course) throw new ElearningFinanceError("Ce cours n'est pas proposé pour l'année académique en cours.", 404);
      const session = admission?.session as any;
      if (course.niveauEtudeId && session?.niveauEtudeId && Number(course.niveauEtudeId) !== Number(session.niveauEtudeId)) {
        throw new ElearningFinanceError("Cette UE ne correspond pas au niveau d'étude de votre demande.", 403);
      }
      if (academicYearId && session?.anneeAcademiqueId && Number(academicYearId) !== Number(session.anneeAcademiqueId)) {
        throw new ElearningFinanceError("Cette demande ne correspond pas à l'année e-learning active.", 409);
      }
      const cost = Number(course.coutTotal);
      if (!Number.isFinite(cost) || cost <= 0) throw new ElearningFinanceError("Le tarif de ce cours n'est pas valide.", 409);

      const existing = await SelectionCours.findOne({
        where: { utilisateurId, coursId, anneeAcademiqueId: academicYearId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (existing) throw new ElearningFinanceError("Ce cours figure déjà dans vos sélections.", 409);

      const available = this.available(envelope);
      if (cost > available) {
        throw new ElearningFinanceError(
          `Budget insuffisant : il manque ${Math.ceil(cost - available).toLocaleString("fr-FR")} FCFA.`,
          409
        );
      }

      const selection = await SelectionCours.create({
        enveloppeId: envelope.id,
        utilisateurId,
        coursId: course.id,
        ueId: course.ueId ?? null,
        anneeAcademiqueId: academicYearId,
        credits: Number(course.nbCredits),
        coutFige: cost,
        statut: "acces_ouvert",
        dateValidation: new Date(),
      }, { transaction });

      envelope.montantConsomme = Number(envelope.montantConsomme) + cost;
      await envelope.save({ transaction });
      const movement = await Mouvement.create({
        enveloppeId: envelope.id,
        type: "consommation",
        montant: -cost,
        soldeCourant: this.available(envelope),
        commentaire: `Cours e-learning choisi : ${course.code || course.titre}`,
        referenceType: "selection",
        referenceId: selection.id,
      }, { transaction });
      selection.mouvementId = movement.id;
      await selection.save({ transaction });
      await this.recordAudit(utilisateurId, "apprenant", "selection.cours", "selection", selection.id, {
        coursId: course.id,
        coutFige: cost,
      }, transaction);
      return selection;
    });
  }

  static async hasCourseAccess(utilisateurId: number, coursId: number): Promise<boolean> {
    return (await SelectionCours.count({
      where: { utilisateurId, coursId, statut: "acces_ouvert" },
    })) > 0;
  }
}
