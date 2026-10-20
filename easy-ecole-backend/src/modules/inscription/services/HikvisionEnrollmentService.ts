import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscription } from "../models/DemandeInscription";
import { PointageTerminal } from "../models/PointageTerminal";
import { HikvisionEnrollment } from "../models/HikvisionEnrollment";
import HikvisionIsapiService from "./HikvisionIsapiService";

export default class HikvisionEnrollmentService {
  private static running = false;
  private static readonly DATABASE_RETRY_ATTEMPTS = 3;

  private static async withDatabaseRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const errorWithCauses = error as {
          parent?: { code?: string };
          original?: { code?: string };
          cause?: { code?: string };
          code?: string;
        };
        const code = errorWithCauses?.parent?.code
          || errorWithCauses?.original?.code
          || errorWithCauses?.cause?.code
          || errorWithCauses?.code;
        const retryable = [
          "PROTOCOL_CONNECTION_LOST",
          "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
          "ECONNRESET",
          "ETIMEDOUT",
          "EPIPE"
        ].includes(code || "");
        if (!retryable || attempt >= HikvisionEnrollmentService.DATABASE_RETRY_ATTEMPTS) {
          throw error;
        }
        const delayMs = 250 * attempt;
        console.warn(`[Hikvision] Connexion MySQL interrompue; nouvelle tentative SQL ${attempt + 1}/${HikvisionEnrollmentService.DATABASE_RETRY_ATTEMPTS} dans ${delayMs} ms.`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  static async enqueueStudent(
    utilisateurId: number,
    etablissementId: number,
    employeeNo: string,
    consentementAt: Date | null
  ): Promise<void> {
    if (!consentementAt) return;
    const terminals = await PointageTerminal.findAll({
      where: { etablissementId, protocol: "hikvision_isapi", actif: true }
    });
    if (terminals.length === 0) {
      console.warn(`[Hikvision] Aucun terminal actif pour l'inscription consentie de l'utilisateur ${utilisateurId}, site ${etablissementId}.`);
      return;
    }
    for (const terminal of terminals) {
      await HikvisionEnrollment.findOrCreate({
        where: { terminalId: terminal.id, utilisateurId },
        defaults: {
          terminalId: Number(terminal.id),
          utilisateurId,
          etablissementId,
          employeeNo,
          statut: "en_attente",
          tentatives: 0,
          prochaineTentativeAt: new Date(),
          derniereErreur: null
        }
      });
    }
  }

  static async enqueueEligibleStudentsForTerminal(terminal: PointageTerminal): Promise<void> {
    const dossiers = await DossierEtudiant.findAll({
      where: { etablissementId: terminal.etablissementId },
      include: [{ association: DossierEtudiant.associations.utilisateur }]
    });
    const utilisateurIds = dossiers.map(dossier => Number(dossier.utilisateurId));
    if (utilisateurIds.length === 0) return;
    const demandes = await DemandeInscription.findAll({
      where: {
        utilisateurId: { [Op.in]: utilisateurIds },
        dateValidation: { [Op.ne]: null },
        consentementHikvisionAt: { [Op.ne]: null }
      }
    });
    const consentis = new Map(demandes.map(demande => [
      Number(demande.utilisateurId),
      demande.consentementHikvisionAt ?? null
    ]));
    for (const dossier of dossiers) {
      const consentementAt = consentis.get(Number(dossier.utilisateurId));
      if (!consentementAt || !dossier.matricule) continue;
      await HikvisionEnrollment.findOrCreate({
        where: { terminalId: terminal.id, utilisateurId: dossier.utilisateurId },
        defaults: {
          terminalId: Number(terminal.id),
          utilisateurId: Number(dossier.utilisateurId),
          etablissementId: Number(terminal.etablissementId),
          employeeNo: dossier.matricule,
          statut: "en_attente",
          tentatives: 0,
          prochaineTentativeAt: new Date(),
          derniereErreur: null
        }
      });
    }
  }

  static async processPending(): Promise<void> {
    if (HikvisionEnrollmentService.running) return;
    HikvisionEnrollmentService.running = true;
    try {
      await HikvisionEnrollmentService.withDatabaseRetry(() => HikvisionEnrollment.update(
        { statut: "en_attente", prochaineTentativeAt: new Date() },
        {
          where: {
            statut: "en_cours",
            updatedAt: { [Op.lt]: new Date(Date.now() - 15 * 60 * 1000) }
          }
        }
      ));
      const pending = await HikvisionEnrollmentService.withDatabaseRetry(() => HikvisionEnrollment.findAll({
        where: {
          statut: "en_attente",
          prochaineTentativeAt: { [Op.lte]: new Date() }
        },
        order: [["id", "ASC"]],
        limit: 20
      }));
      for (const enrollment of pending) {
        const claimed = await HikvisionEnrollmentService.withDatabaseRetry(() => HikvisionEnrollment.update(
          { statut: "en_cours" },
          { where: { id: enrollment.id, statut: "en_attente" } }
        ));
        if (claimed[0] === 0) continue;
        await HikvisionEnrollmentService.processOne(enrollment);
      }
    } finally {
      HikvisionEnrollmentService.running = false;
    }
  }

  private static async processOne(enrollment: HikvisionEnrollment): Promise<void> {
    try {
      const [terminal, utilisateur] = await Promise.all([
        PointageTerminal.findOne({
          where: {
            id: enrollment.terminalId,
            etablissementId: enrollment.etablissementId,
            protocol: "hikvision_isapi",
            actif: true
          }
        }),
        Utilisateur.findByPk(enrollment.utilisateurId, { include: [Utilisateur.associations.apprenant] })
      ]);
      if (!terminal) throw new Error("Le terminal Hikvision associé est absent ou inactif.");
      if (!utilisateur || utilisateur.role !== RolesUtilisateur.APPRENANT) throw new Error("Le compte apprenant n'est plus disponible.");
      const apprenant = utilisateur.apprenant;
      if (!apprenant?.photo) throw new Error("Aucune photo apprenant n'est disponible pour l'enrôlement facial.");

      await HikvisionIsapiService.enrollStudent(terminal, {
        employeeNo: enrollment.employeeNo,
        name: `${utilisateur.prenoms} ${utilisateur.nom}`.trim(),
        photoFilename: apprenant.photo
      });
      await HikvisionEnrollmentService.withDatabaseRetry(
        () => enrollment.update({ statut: "termine", derniereErreur: null })
      );
      console.info(`[Hikvision] Enrôlement terminé pour l'utilisateur ${utilisateur.id} sur le terminal ${terminal.id}.`);
    } catch (error) {
      const tentatives = Number(enrollment.tentatives) + 1;
      const delayMinutes = Math.min(6 * 60, Math.pow(2, Math.min(tentatives, 9)));
      const message = error instanceof Error ? error.message : "Erreur inconnue pendant l'enrôlement Hikvision.";
      await HikvisionEnrollmentService.withDatabaseRetry(() => enrollment.update({
          statut: "en_attente",
          tentatives,
          prochaineTentativeAt: new Date(Date.now() + delayMinutes * 60 * 1000),
          derniereErreur: message.slice(0, 500)
        })
      );
      console.error(`[Hikvision] Échec de l'enrôlement ${enrollment.id} (tentative ${tentatives}):`, error);
    }
  }
}
