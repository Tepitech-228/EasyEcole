import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { PersonnelAdministratif } from "../../auth/models/PersonnelAdministratif";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
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

  /**
   * Met en file l'enrôlement facial d'un apprenant à l'inscription.
   * Envoi systématique : indépendant de tout consentement facultatif.
   * Le paramètre `_consentementAt` est conservé pour compatibilité d'appel
   * mais n'agit plus comme verrou.
   */
  static async enqueueStudent(
    utilisateurId: number,
    etablissementId: number,
    employeeNo: string,
    _consentementAt: Date | null = null
  ): Promise<void> {
    const terminals = await PointageTerminal.findAll({
      where: { etablissementId, protocol: "hikvision_isapi", actif: true }
    });
    if (terminals.length === 0) {
      console.warn(`[Hikvision] Aucun terminal actif pour l'inscription de l'utilisateur ${utilisateurId}, site ${etablissementId}.`);
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

  static async enqueueEligibleProfilesForTerminal(terminal: PointageTerminal): Promise<void> {
    const dossiers = await DossierEtudiant.findAll({
      where: { etablissementId: terminal.etablissementId },
      include: [{ association: DossierEtudiant.associations.utilisateur }]
    });
    const utilisateurIds = dossiers.map(dossier => Number(dossier.utilisateurId));
    // Envoi systématique : on ne filtre plus sur le consentement facultatif.
    // Seuls les dossiers effectivement validés d'un utilisateur réel sont éligibles.
    const demandes = await DemandeInscription.findAll({
      where: {
        utilisateurId: { [Op.in]: utilisateurIds },
        dateValidation: { [Op.ne]: null }
      }
    });
    const utilisateursValides = new Set(demandes.map(demande => Number(demande.utilisateurId)));
    for (const dossier of dossiers) {
      if (!utilisateursValides.has(Number(dossier.utilisateurId)) || !dossier.matricule) continue;
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

    const siteUsers = await SiteUtilisateur.findAll({
      where: { etablissementId: terminal.etablissementId },
      attributes: ["utilisateurId"]
    });
    const siteUserIds = siteUsers.map(siteUser => Number(siteUser.utilisateurId));

    const [enseignants, personnels] = await Promise.all([
      Enseignant.findAll({
        where: { utilisateurId: { [Op.in]: siteUserIds } },
        include: [{ association: Enseignant.associations.utilisateur }]
      }),
      PersonnelAdministratif.findAll({
        where: { utilisateurId: { [Op.in]: siteUserIds } },
        include: [{ association: PersonnelAdministratif.associations.utilisateur }]
      })
    ]);

    for (const enseignant of enseignants) {
      if (
        !enseignant.utilisateur ||
        enseignant.utilisateur.role !== RolesUtilisateur.ENSEIGNANT ||
        !enseignant.matricule ||
        !enseignant.photo
      ) continue;
      await HikvisionEnrollmentService.enqueueForTerminal(
        terminal,
        Number(enseignant.utilisateurId),
        String(enseignant.matricule)
      );
    }

    for (const personnel of personnels) {
      if (
        !personnel.utilisateur ||
        !HikvisionEnrollmentService.isPersonnelRole(personnel.utilisateur.role) ||
        !personnel.matricule ||
        !personnel.utilisateur.photoDeProfil
      ) continue;
      await HikvisionEnrollmentService.enqueueForTerminal(
        terminal,
        Number(personnel.utilisateurId),
        String(personnel.matricule)
      );
    }
  }

  static async enqueueStaffProfile(utilisateurId: number): Promise<number> {
    const utilisateur = await Utilisateur.findByPk(utilisateurId);
    if (!utilisateur) throw new Error(`Le compte ${utilisateurId} est introuvable pour l’enrôlement Hikvision.`);

    const sites: number[] = [];
    let employeeNo: string | null = null;
    let hasPhoto = false;

    if (utilisateur.role === RolesUtilisateur.ENSEIGNANT) {
      const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
      if (!enseignant) throw new Error(`Le profil enseignant ${utilisateurId} est introuvable.`);
      employeeNo = enseignant.matricule || null;
      hasPhoto = Boolean(enseignant.photo);
      const affectations = await SiteUtilisateur.findAll({
        where: { utilisateurId },
        attributes: ["etablissementId"]
      });
      sites.push(...affectations.map(affectation => Number(affectation.etablissementId)));
    } else if (HikvisionEnrollmentService.isPersonnelRole(utilisateur.role)) {
      const personnel = await PersonnelAdministratif.findOne({ where: { utilisateurId } });
      if (!personnel) throw new Error(`Le profil du personnel ${utilisateurId} est introuvable.`);
      employeeNo = personnel.matricule || null;
      hasPhoto = Boolean(utilisateur.photoDeProfil);
      const affectations = await SiteUtilisateur.findAll({
        where: { utilisateurId },
        attributes: ["etablissementId"]
      });
      sites.push(...affectations.map(affectation => Number(affectation.etablissementId)));
      if (sites.length === 0 && personnel.etablissementId) sites.push(Number(personnel.etablissementId));
    } else {
      return 0;
    }

    if (!hasPhoto) {
      console.warn(`[Hikvision] Enrôlement différé pour le compte ${utilisateurId}: aucune photo de profil n’est enregistrée.`);
      return 0;
    }
    if (!employeeNo || !/^[A-Za-z0-9._-]{1,64}$/.test(employeeNo)) {
      console.warn(`[Hikvision] Enrôlement différé pour le compte ${utilisateurId}: matricule absent ou invalide.`);
      return 0;
    }

    const uniqueSites = [...new Set(sites.filter(siteId => Number.isSafeInteger(siteId) && siteId > 0))];
    let queued = 0;
    for (const etablissementId of uniqueSites) {
      const terminals = await PointageTerminal.findAll({
        where: { etablissementId, protocol: "hikvision_isapi", actif: true }
      });
      for (const terminal of terminals) {
        await HikvisionEnrollmentService.enqueueForTerminal(terminal, utilisateurId, employeeNo);
        queued++;
      }
    }
    return queued;
  }

  private static isPersonnelRole(role: RolesUtilisateur): boolean {
    return [
      RolesUtilisateur.PERSONNEL_ADMINISTRATIF,
      RolesUtilisateur.SURVEILLANT,
      RolesUtilisateur.SECRETAIRE,
      RolesUtilisateur.RESSOURCES_HUMAINES,
      RolesUtilisateur.CABINET_COMPTABLE,
      RolesUtilisateur.CAISSIER_BANQUE,
      RolesUtilisateur.ESA_COMPTA,
      RolesUtilisateur.COMITE_ORIENTATION,
      RolesUtilisateur.SUPERVISEUR_GENERAL
    ].includes(role);
  }

  private static async enqueueForTerminal(
    terminal: PointageTerminal,
    utilisateurId: number,
    employeeNo: string
  ): Promise<void> {
    const [enrollment, created] = await HikvisionEnrollment.findOrCreate({
      where: { terminalId: terminal.id, utilisateurId },
      defaults: {
        terminalId: Number(terminal.id),
        utilisateurId,
        etablissementId: Number(terminal.etablissementId),
        employeeNo,
        statut: "en_attente",
        tentatives: 0,
        prochaineTentativeAt: new Date(),
        derniereErreur: null
      }
    });
    if (!created && (enrollment.statut === "termine" || enrollment.employeeNo !== employeeNo)) {
      await enrollment.update({
        employeeNo,
        statut: "en_attente",
        tentatives: 0,
        prochaineTentativeAt: new Date(),
        derniereErreur: null
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
      if (!utilisateur) throw new Error("Le compte associé à l'enrôlement n'est plus disponible.");

      let photoFilename: string | null = null;
      let photoCategory: "apprenant" | "enseignant" | "personnel" = "apprenant";
      if (utilisateur.role === RolesUtilisateur.APPRENANT) {
        photoFilename = utilisateur.apprenant?.photo || null;
      } else if (utilisateur.role === RolesUtilisateur.ENSEIGNANT) {
        const enseignant = await Enseignant.findOne({ where: { utilisateurId: utilisateur.id } });
        const affectation = await SiteUtilisateur.findOne({
          where: { utilisateurId: utilisateur.id, etablissementId: enrollment.etablissementId }
        });
        if (!enseignant || !affectation || enseignant.matricule !== enrollment.employeeNo) {
          throw new Error("Le profil enseignant n'est plus rattaché à ce site ou son matricule a changé.");
        }
        photoFilename = enseignant.photo || null;
        photoCategory = "enseignant";
      } else if (HikvisionEnrollmentService.isPersonnelRole(utilisateur.role)) {
        const [personnel, affectation] = await Promise.all([
          PersonnelAdministratif.findOne({ where: { utilisateurId: utilisateur.id } }),
          SiteUtilisateur.findOne({
            where: { utilisateurId: utilisateur.id, etablissementId: enrollment.etablissementId }
          })
        ]);
        if (
          !personnel ||
          (!affectation && Number(personnel.etablissementId) !== Number(enrollment.etablissementId)) ||
          personnel.matricule !== enrollment.employeeNo
        ) {
          throw new Error("Le profil du personnel n'est plus rattaché à ce site ou son matricule a changé.");
        }
        photoFilename = utilisateur.photoDeProfil || null;
        photoCategory = "personnel";
      } else {
        throw new Error("Le profil associé à l'enrôlement n'est pas pris en charge.");
      }
      if (!photoFilename) throw new Error("Aucune photo de profil n'est disponible pour l'enrôlement facial.");

      await HikvisionIsapiService.enrollPerson(terminal, {
        employeeNo: enrollment.employeeNo,
        name: `${utilisateur.prenoms} ${utilisateur.nom}`.trim(),
        photoFilename,
        photoCategory
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
