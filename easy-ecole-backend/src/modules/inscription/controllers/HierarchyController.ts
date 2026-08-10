import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { NiveauEtude } from "../models/NiveauEtude";
import { Parcours } from "../models/Parcours";
import { Session } from "../models/Session";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { CoursParticipant } from "../models/CoursParticipant";
import { Cours } from "../models/Cours";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Classe } from "../models/Classe";
import { Seance } from "../models/Seance";
import { ChapitreCours } from "../models/ChapitreCours";
import { SemestreAcademique } from "../models/SemestreAcademique";
import { Enseignant } from "../../auth/models/Enseignant";

export default class HierarchyController {

  /** Retourne un filtre utilisateurId si l'utilisateur est un apprenant */
  private static getUtilisateurFilter(req: Request): { utilisateurId?: number } | undefined {
    if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
      return { utilisateurId: (req as any).utilisateurId };
    }
    return undefined;
  }

  static async getTree(req: Request, res: Response): Promise<Response> {
    try {
      const userFilter = HierarchyController.getUtilisateurFilter(req);

      const annees = await AnneeAcademique.findAll({
        order: [['libelle', 'DESC']]
      });

      const tree = await Promise.all(annees.map(async (annee) => {
        const anneeId = (annee as any).id;

        const sessions = await Session.findAll({
          where: { anneeAcademiqueId: anneeId },
          attributes: ['id', 'niveauEtudeId']
        });

        const niveauIds = Array.from(new Set(sessions.map((s: any) => s.niveauEtudeId).filter(Boolean))) as number[];
        const niveaux = niveauIds.length > 0
          ? await NiveauEtude.findAll({ where: { id: { [Op.in]: niveauIds } }, order: [['libelle', 'ASC']] })
          : [];

        const allParcours = await Parcours.findAll({
          where: niveauIds.length > 0 ? { niveauEtudeId: { [Op.in]: niveauIds } } : undefined,
          order: [['titre', 'ASC']]
        });

        const niveauxData = await Promise.all(niveaux.map(async (niveau) => {
          const parcoursNiveau = allParcours.filter(p => p.niveauEtudeId === niveau.id);

          const dCount = await DossierEtudiant.count({ where: userFilter });

          const demCount = await DemandeInscription.count({
            where: userFilter,
            include: [{
              association: DemandeInscription.associations.session,
              where: { anneeAcademiqueId: anneeId, niveauEtudeId: niveau.id },
              required: true
            }]
          });

          const bCount = await Bordereau.count({ where: userFilter });

          const parcoursData = await Promise.all(parcoursNiveau.map(async (p) => {
            const dParcoursCount = await DossierEtudiant.count({ where: userFilter });

            const demParcoursCount = await DemandeInscription.count({
              where: userFilter,
              include: [{
                association: DemandeInscription.associations.parcoursChoisis,
                where: { choixFinal: true, parcoursId: p.id },
                required: true
              }, {
                association: DemandeInscription.associations.session,
                where: { anneeAcademiqueId: anneeId },
                required: true
              }]
            });

            const bParcoursCount = await Bordereau.count({ where: userFilter });

            return {
              id: `parcours-${p.id}`,
              type: 'parcours',
              label: p.titre,
              data: {
                id: p.id,
                dossiers: dParcoursCount,
                demandes: demParcoursCount,
                bordereaux: bParcoursCount
              }
            };
          }));

          return {
            id: `niveau-${niveau.id}`,
            type: 'niveau',
            label: niveau.libelle,
            data: {
              id: niveau.id,
              dossiers: dCount,
              demandes: demCount,
              bordereaux: bCount
            },
            children: parcoursData
          };
        }));

        return {
          id: `annee-${anneeId}`,
          type: 'annee',
          label: (annee as any).libelle,
          data: {
            id: anneeId,
            dossiers: 0,
            demandes: 0,
            bordereaux: 0
          },
          children: niveauxData
        };
      }));

      return res.status(200).json(tree);
    } catch (error: any) {
      console.error('[HierarchyController.getTree]', error);
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }

  static async getDetails(req: Request, res: Response): Promise<Response> {
    try {
      const userFilter = HierarchyController.getUtilisateurFilter(req);
      const { type, id, anneeId } = req.params;
      let dossiers: any[] = [];
      let demandes: any[] = [];
      let bordereaux: any[] = [];

      if (type === 'annee') {
        dossiers = await DossierEtudiant.findAll({
          where: userFilter,
          include: [{
            association: DossierEtudiant.associations.utilisateur,
            attributes: ['id', 'nom', 'prenoms', 'email']
          }]
        });

        demandes = await DemandeInscription.findAll({
          where: userFilter,
          include: [{
            association: DemandeInscription.associations.session,
            where: { anneeAcademiqueId: Number(id) },
            required: true,
            attributes: ['id', 'anneeAcademiqueId', 'niveauEtudeId']
          }, {
            association: DemandeInscription.associations.utilisateur,
            attributes: ['id', 'nom', 'prenoms', 'email']
          }]
        });

        bordereaux = await Bordereau.findAll({
          where: userFilter,
          include: [{
            association: Bordereau.associations.echeance,
            required: true,
            attributes: ['id', 'dossierEtudiantId']
          }]
        });
      } else if (type === 'niveau') {
        dossiers = await DossierEtudiant.findAll({
          where: userFilter,
          include: [{
            association: DossierEtudiant.associations.utilisateur,
            attributes: ['id', 'nom', 'prenoms', 'email']
          }]
        });

        demandes = await DemandeInscription.findAll({
          where: userFilter,
          include: [{
            association: DemandeInscription.associations.session,
            where: { anneeAcademiqueId: Number(anneeId), niveauEtudeId: Number(id) },
            required: true,
            attributes: ['id', 'anneeAcademiqueId', 'niveauEtudeId']
          }, {
            association: DemandeInscription.associations.utilisateur,
            attributes: ['id', 'nom', 'prenoms', 'email']
          }]
        });

        bordereaux = await Bordereau.findAll({
          where: userFilter,
          include: [{
            association: Bordereau.associations.echeance,
            required: true,
            attributes: ['id', 'dossierEtudiantId']
          }]
        });

      } else if (type === 'parcours') {
        dossiers = await DossierEtudiant.findAll({
          where: userFilter,
          include: [{
            association: DossierEtudiant.associations.utilisateur,
            attributes: ['id', 'nom', 'prenoms', 'email']
          }]
        });

        demandes = await DemandeInscription.findAll({
          where: userFilter,
          include: [{
            association: DemandeInscription.associations.parcoursChoisis,
            where: { choixFinal: true, parcoursId: Number(id) },
            required: true,
            attributes: ['id', 'parcoursId', 'choixFinal']
          }, {
            association: DemandeInscription.associations.session,
            where: { anneeAcademiqueId: Number(anneeId) },
            required: true,
            attributes: ['id', 'anneeAcademiqueId', 'niveauEtudeId']
          }, {
            association: DemandeInscription.associations.utilisateur,
            attributes: ['id', 'nom', 'prenoms', 'email']
          }]
        });

        bordereaux = await Bordereau.findAll({
          where: userFilter,
          include: [{
            association: Bordereau.associations.echeance,
            required: true,
            attributes: ['id', 'dossierEtudiantId']
          }]
        });
      }

      return res.status(200).json({ dossiers, demandes, bordereaux });
    } catch (error: any) {
      console.error('[HierarchyController.getDetails]', error);
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }

  /** Lot 7 - Sous-lot A1 : Effectifs inscrits (Année -> Filière -> Classe -> Étudiant) */
  static async getEtudiantsTree(req: Request, res: Response): Promise<Response> {
    try {
      const annees = await AnneeAcademique.findAll({ order: [['libelle', 'DESC']] });
      const parcoursList = await Parcours.findAll({ order: [['titre', 'ASC']] });
      const classesList = await Classe.findAll({ order: [['libelle', 'ASC']] });

      const tree = await Promise.all(annees.map(async (annee) => {
        const parcoursNodes = await Promise.all(parcoursList.map(async (p) => {
          const classes = classesList.filter(c => c.parcoursId === p.id);
          const classeNodes = await Promise.all(classes.map(async (cl) => {
            const dossiers = await DossierEtudiant.findAll({
              include: [{
                association: DossierEtudiant.associations.coursParticipants,
                required: false,
                include: [{ association: CoursParticipant.associations.cours, where: { classeId: cl.id }, required: true }]
              }, {
                association: DossierEtudiant.associations.utilisateur,
                attributes: ['id', 'nom', 'prenoms', 'email']
              }]
            });
            return { id: `classe-${cl.id}`, type: 'classe', label: cl.libelle, count: dossiers.length, data: cl, children: dossiers.map(d => ({ id: `etudiant-${d.id}`, type: 'etudiant', label: (d as any).utilisateur ? `${(d as any).utilisateur.nom} ${(d as any).utilisateur.prenoms}` : `Étudiant #${d.id}`, data: d })) };
          }));
          const totalEtudiants = classeNodes.reduce((acc, c) => acc + c.count, 0);
          return { id: `parcours-${p.id}`, type: 'filiere', label: p.titre, count: totalEtudiants, children: classeNodes };
        }));
        const totalAnnee = parcoursNodes.reduce((acc, p) => acc + p.count, 0);
        return { id: `annee-${annee.id}`, type: 'annee', label: annee.libelle, count: totalAnnee, children: parcoursNodes };
      }));

      return res.status(200).json(tree);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }

  /** Lot 7 - Sous-lot A2 : Présences (Classe -> Cours -> Séance -> Étudiant) */
  static async getPresencesTree(req: Request, res: Response): Promise<Response> {
    try {
      const classes = await Classe.findAll({ order: [['libelle', 'ASC']] });
      const coursList = await Cours.findAll();
      const seancesList = await Seance.findAll();

      const tree = classes.map((cl) => {
        const coursDeLaClasse = coursList.filter(c => c.classeId === cl.id);
        const coursNodes = coursDeLaClasse.map((c) => {
          const seances = seancesList.filter(s => s.coursId === c.id);
          const seanceNodes = seances.map((s) => ({
            id: `seance-${s.id}`,
            type: 'seance',
            label: s.titre || `Séance du ${s.jourSemaine}`,
            jourSemaine: s.jourSemaine,
            salle: s.salle,
            data: s
          }));
          return { id: `cours-${c.id}`, type: 'cours', label: `${c.code} - ${c.intitule}`, count: seanceNodes.length, children: seanceNodes };
        });
        const totalSeances = coursNodes.reduce((acc, c) => acc + c.count, 0);
        return { id: `classe-${cl.id}`, type: 'classe', label: cl.libelle, count: totalSeances, children: coursNodes };
      });

      return res.status(200).json(tree);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }

  /** Lot 7 - Sous-lot A3 : Notes (Filière -> Semestre -> UE -> Étudiant) */
  static async getNotesTree(req: Request, res: Response): Promise<Response> {
    try {
      const parcoursList = await Parcours.findAll({ order: [['titre', 'ASC']] });
      const semestresList = await SemestreAcademique.findAll({ order: [['code', 'ASC']] });
      const coursList = await Cours.findAll();

      const tree = parcoursList.map((p) => {
        const semestresDuParcours = semestresList.filter(s => s.parcoursId === p.id);
        const semestreNodes = semestresDuParcours.map((s) => {
          const ues = coursList.filter(c => c.parcoursId === p.id && c.semestre === (s as any).semestre);
          const ueNodes = ues.map(u => ({ id: `ue-${u.id}`, type: 'ue', label: `${u.code} - ${u.intitule}`, credit: u.credit, data: u }));
          return { id: `semestre-${s.id}`, type: 'semestre', label: s.libelle || `Semestre #${s.id}`, count: ueNodes.length, children: ueNodes };
        });
        const totalUes = semestreNodes.reduce((acc, s) => acc + s.count, 0);
        return { id: `filiere-${p.id}`, type: 'filiere', label: p.titre, count: totalUes, children: semestreNodes };
      });

      return res.status(200).json(tree);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }

  /** Lot 7 - Sous-lot A4 : Cahiers de texte (Classe -> Cours -> Chapitres -> Séances) */
  static async getCahiersTexteTree(req: Request, res: Response): Promise<Response> {
    try {
      const classes = await Classe.findAll({ order: [['libelle', 'ASC']] });
      const coursList = await Cours.findAll();
      const chapitres = await ChapitreCours.findAll({ order: [['ordre', 'ASC']] });
      const seances = await Seance.findAll();

      const tree = classes.map((cl) => {
        const coursDeLaClasse = coursList.filter(c => c.classeId === cl.id);
        const coursNodes = coursDeLaClasse.map((c) => {
          const chapitresDuCours = chapitres.filter(ch => ch.coursId === c.id);
          const chapitreNodes = chapitresDuCours.map((ch) => {
            const seancesDuCours = seances.filter(s => s.coursId === c.id);
            return {
              id: `chapitre-${ch.id}`,
              type: 'chapitre',
              label: ch.titre,
              count: seancesDuCours.length,
              children: seancesDuCours.map(s => ({ id: `seance-${s.id}`, type: 'seance', label: s.titre || `Séance #${s.id}`, data: s }))
            };
          });
          return { id: `cours-${c.id}`, type: 'cours', label: `${c.code} - ${c.intitule}`, count: chapitreNodes.length, children: chapitreNodes };
        });
        const totalCours = coursNodes.reduce((acc, c) => acc + c.count, 0);
        return { id: `classe-${cl.id}`, type: 'classe', label: cl.libelle, count: totalCours, children: coursNodes };
      });

      return res.status(200).json(tree);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }

  /** Lot 7 - Sous-lot B1 : Liste des enseignants (Filière -> Cours enseignés -> Enseignant) */
  static async getEnseignantsTree(req: Request, res: Response): Promise<Response> {
    try {
      const parcoursList = await Parcours.findAll({ order: [['titre', 'ASC']] });
      const coursList = await Cours.findAll({ include: [{ association: Cours.associations.enseignant }] });

      const tree = parcoursList.map((p) => {
        const coursDuParcours = coursList.filter(c => c.parcoursId === p.id);
        const coursNodes = coursDuParcours.map((c) => {
          const ens = (c as any).enseignant;
          return {
            id: `cours-${c.id}`,
            type: 'cours',
            label: `${c.code} - ${c.intitule}`,
            enseignant: ens ? { id: ens.id, nom: ens.nom, prenoms: ens.prenoms, email: ens.email } : null
          };
        });
        return { id: `filiere-${p.id}`, type: 'filiere', label: p.titre, count: coursNodes.length, children: coursNodes };
      });

      return res.status(200).json(tree);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }

  /** Lot 7 - Sous-lot B2 : Emplois du temps (Semestre -> Semaine -> Cours) */
  static async getEmploisDuTempsTree(req: Request, res: Response): Promise<Response> {
    try {
      const semestres = await SemestreAcademique.findAll({ order: [['code', 'ASC']] });
      const seances = await Seance.findAll({ include: [{ association: Seance.associations.cours }] });

      const tree = semestres.map((s) => {
        const seancesDuSemestre = seances.filter(sec => sec.cours && (sec.cours as any).semestre === (s as any).semestre);
        const seanceNodes = seancesDuSemestre.map(sec => ({
          id: `seance-${sec.id}`,
          type: 'cours',
          label: `${sec.cours?.code || ''} - ${sec.cours?.intitule || sec.titre}`,
          jourSemaine: sec.jourSemaine,
          salle: sec.salle,
          heureDebut: sec.heureDebut,
          heureFin: sec.heureFin
        }));
        return { id: `semestre-${s.id}`, type: 'semestre', label: s.libelle || `Semestre #${s.id}`, count: seanceNodes.length, children: seanceNodes };
      });

      return res.status(200).json(tree);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }
}
