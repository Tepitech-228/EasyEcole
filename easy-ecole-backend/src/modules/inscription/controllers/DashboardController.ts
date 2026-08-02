import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { Enseignant } from "../../auth/models/Enseignant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { CursusApprenant } from "../models/CursusApprenant";
import { DemandeInscription } from "../models/DemandeInscription";
import { PreInscription } from "../models/PreInscription";
import { Seance } from "../models/Seance";
import { Cours } from "../models/Cours";
import { Classe } from "../models/Classe";
import { CoursParticipant } from "../models/CoursParticipant";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { RhPlanningPersonnel } from "../../rh/models/RhPlanningPersonnel";
import { Notification } from "../../elearning/models/Notification";
import { Echeance } from "../models/Echeance";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Bordereau } from "../models/Bordereau";
import { Session } from "../models/Session";
import { PaiementInscription } from "../models/PaiementInscription";
import { SemestreProgressionService } from "../../../core/services/SemestreProgressionService";

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function echeanceDateStr(dateLimite: Date | string): string {
  return typeof dateLimite === 'string' ? dateLimite : toDateOnlyString(dateLimite);
}

function buildLibelleEcheance(e: Echeance): string {
  if (e.moisConcerne) return `Échéance ${e.moisConcerne}`;
  return `Échéance n°${e.numeroEcheance} (${e.type === 'scolarite' ? 'Scolarité' : 'Inscription'})`;
}

class DashboardController {

    static async getDashboard(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = req.utilisateurId!;
            const role = req.utilisateurRole as RolesUtilisateur;

            switch (role) {
                case RolesUtilisateur.ADMIN:
                    return res.json(await DashboardController.getAdminDashboard());
                case RolesUtilisateur.INSTITUTION:
                    return res.json(await DashboardController.getInstitutionDashboard());
                case RolesUtilisateur.ENSEIGNANT:
                    return res.json(await DashboardController.getEnseignantDashboard(utilisateurId));
                case RolesUtilisateur.APPRENANT:
                    return res.json(await DashboardController.getApprenantDashboard(utilisateurId));
                case RolesUtilisateur.CAISSIER_BANQUE:
                    return res.json(await DashboardController.getCaissierDashboard());
                case RolesUtilisateur.CABINET_COMPTABLE:
                    return res.json(await DashboardController.getComptableDashboard());
                case RolesUtilisateur.COMITE_ORIENTATION:
                    return res.json(await DashboardController.getOrientationDashboard());
                case RolesUtilisateur.RESSOURCES_HUMAINES:
                    return res.json(await DashboardController.getRHDashboard());
                default:
                    return res.json(await DashboardController.getDefaultDashboard(utilisateurId));
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur dashboard', error });
        }
    }

    private static async getAdminDashboard() {
        const [totalApprenants, totalEnseignants, sessions, preInscriptions, recentDemandes] = await Promise.all([
            Apprenant.count(),
            Enseignant.count(),
            DemandeInscription.findAll({ attributes: ['id', 'dateDemande', 'sessionId', 'matricule'] }),
            PreInscription.findAll({ where: { statut: 'en_attente' }, attributes: ['id'] }),
            DemandeInscription.findAll({
                order: [['dateDemande', 'DESC']],
                limit: 5,
                include: [{ association: 'preInscription', attributes: ['statut'] }],
                attributes: ['id', 'dateDemande', 'matricule'],
            }),
        ]);
        return {
            success: true,
            role: 'admin',
            data: {
                totalApprenants,
                totalEnseignants,
                totalSessions: sessions.length,
                demandesEnAttente: preInscriptions.length,
                sessionsOuvertes: sessions.length,
                recentDemandes: await Promise.all(recentDemandes.map(async (d) => {
                    const u = d.utilisateur;
                    return {
                        id: d.id,
                        dateDemande: d.dateDemande,
                        matricule: d.matricule,
                        utilisateur: u ? { nom: u.nom, prenoms: u.prenoms } : null,
                        preInscription: d.preInscription ? { statut: d.preInscription.statut } : null,
                    };
                })),
            }
        };
    }

    private static async getEnseignantDashboard(utilisateurId: number) {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const todayName = DAYS[today.getDay()];

        const seances = await Seance.findAll({
            where: { enseignantId: utilisateurId, jourSemaine: todayName },
            include: [
                { association: 'cours', attributes: ['id', 'intitule'] },
                { association: 'salleDeClasse', attributes: ['id', 'libelle'] },
            ],
            order: [['heureDebut', 'ASC']],
        });

        const nextSeance = seances.find(s => {
            const debut = new Date(`${todayStr}T${s.heureDebut}`);
            return debut.getTime() > today.getTime();
        });

        const listeNotes: any[] = await ListeNoteEvaluation.findAll({
            include: [{ association: 'cours', attributes: ['id', 'intitule'] }],
            limit: 5,
        });

        const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
        const totalCours = enseignant ? await Cours.count({ where: { enseignantId: enseignant.id } }) : 0;
        const totalApprenants = enseignant ? await CoursParticipant.count({
            include: [{ association: 'cours', where: { enseignantId: enseignant.id } }]
        }) : 0;

        return {
            success: true,
            role: 'enseignant',
            data: {
                agenda: seances.map(s => ({
                    id: s.id,
                    titre: s.titre || s.cours?.intitule || 'Séance',
                    heureDebut: s.heureDebut,
                    heureFin: s.heureFin,
                    salle: s.salleDeClasse?.libelle || s.salle || '',
                })),
                prochainCours: nextSeance ? {
                    id: nextSeance.id,
                    titre: nextSeance.titre || nextSeance.cours?.intitule || 'Cours',
                    heureDebut: nextSeance.heureDebut,
                    salle: nextSeance.salleDeClasse?.libelle || nextSeance.salle || '',
                } : null,
                notesASaisir: listeNotes.map((l: any) => ({
                    id: l.id,
                    cours: l.cours?.intitule || 'Cours',
                })),
                totalCours,
                totalApprenants,
            }
        };
    }

    private static async getApprenantDashboard(utilisateurId: number) {
        const today = new Date();
        const todayName = DAYS[today.getDay()];

        const cursus = await CursusApprenant.findOne({
            where: { utilisateurId },
            include: [
                { association: 'demandeInscription', include: [{ association: 'cours' }] },
                { association: CursusApprenant.associations.niveauEtude },
                { association: CursusApprenant.associations.parcours }
            ],
        });

        let agenda: any[] = [];
        let coursIds: number[] = [];
        let progression = null;
        if (cursus) {
            progression = await SemestreProgressionService.getProgression(Number(cursus.id));
            const coursData = (cursus as any).demandeInscription?.cours || [];
            coursIds = coursData.map((c: any) => c.id).filter(Boolean);
            if (coursIds.length > 0) {
                const seances = await Seance.findAll({
                    where: { coursId: { [Op.in]: coursIds }, jourSemaine: todayName },
                    include: [
                        { association: 'cours', attributes: ['id', 'intitule'] },
                        { association: 'salleDeClasse', attributes: ['id', 'libelle'] },
                    ],
                    order: [['heureDebut', 'ASC']],
                });
                agenda = seances.map(s => ({
                    id: s.id,
                    titre: s.titre || s.cours?.intitule || 'Séance',
                    heureDebut: s.heureDebut,
                    heureFin: s.heureFin,
                    salle: s.salleDeClasse?.libelle || s.salle || '',
                }));
            }
        }

        const notesRecentes = await DashboardController.getNotesRecentes(utilisateurId);

        const moyenne = notesRecentes.length > 0
            ? (notesRecentes.reduce((sum: number, n: any) => sum + (n.note || 0), 0) / notesRecentes.length).toFixed(1)
            : null;

        const totalPresences = coursIds.length > 0 ? await CoursParticipant.count({
            include: [{ association: 'cours', where: { id: coursIds } }]
        }) : 0;

        const totalCours = coursIds.length;

        const echeances = await DashboardController.getEcheancesApprenant(utilisateurId);

        return { success: true, role: 'apprenant', data: { agenda, notesRecentes, moyenne, totalPresences, totalCours, progression, echeances } };
    }

    /**
     * Agrégation des échéances d'un apprenant pour le dashboard :
     * totalImpayees (impaye + en_retard), enRetard, et la prochaine échéance
     * (la plus proche à venir, sinon la plus récente échue).
     */
    private static async getEcheancesApprenant(utilisateurId: number): Promise<{
        totalImpayees: number;
        enRetard: number;
        prochaineEcheance: { libelle: string; montant: number; dateLimite: string } | null;
    }> {
        try {
            const dossier = await DossierEtudiant.findOne({
                where: { utilisateurId },
                include: [{ association: DossierEtudiant.associations.echeances }],
            });

            const echeances = (dossier?.echeances || []) as Echeance[];
            if (echeances.length === 0) {
                return { totalImpayees: 0, enRetard: 0, prochaineEcheance: null };
            }

            const impayees = echeances.filter(e => e.statut === 'impaye' || e.statut === 'en_retard');
            const enRetard = echeances.filter(e => e.statut === 'en_retard').length;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = toDateOnlyString(today);

            let prochaineEcheance: { libelle: string; montant: number; dateLimite: string } | null = null;
            if (impayees.length > 0) {
                const triees = impayees
                    .map(e => ({ echeance: e, dateStr: echeanceDateStr(e.dateLimite) }))
                    .sort((a, b) => (a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0));

                const cible = triees.find(t => t.dateStr >= todayStr) || triees[triees.length - 1];
                prochaineEcheance = {
                    libelle: buildLibelleEcheance(cible.echeance),
                    montant: cible.echeance.montant,
                    dateLimite: cible.dateStr,
                };
            }

            return { totalImpayees: impayees.length, enRetard, prochaineEcheance };
        } catch (error) {
            console.error('[DashboardController] Erreur récupération échéances apprenant:', error);
            return { totalImpayees: 0, enRetard: 0, prochaineEcheance: null };
        }
    }

    private static async getNotesRecentes(utilisateurId: number): Promise<any[]> {
        try {
            const cursusList = await CursusApprenant.findAll({ where: { utilisateurId } });
            const cursusIds = cursusList.map(c => c.id).filter(Boolean);
            if (cursusIds.length === 0) return [];

            const participants = await CoursParticipant.findAll({
                where: { cursusApprenantId: { [Op.in]: cursusIds } },
                attributes: ['id'],
            });
            const participantIds = participants.map(p => p.id);
            if (participantIds.length === 0) return [];

            const notes = await NoteEvaluation.findAll({
                where: { coursParticipantId: { [Op.in]: participantIds }, statut: 'publie' },
                include: [
                    { association: 'listeNoteEvaluation', include: [
                        { association: 'cours', attributes: ['id', 'intitule'] },
                        { association: 'typeNoteEvaluation', attributes: ['id', 'libelle'] },
                    ]},
                ],
                order: [['createdAt', 'DESC']],
                limit: 5,
            });
            return notes.map(n => ({
                note: n.note,
                cours: (n as any).listeNoteEvaluation?.cours?.intitule || '',
                type: (n as any).listeNoteEvaluation?.typeNoteEvaluation?.libelle || '',
                date: n.createdAt,
            }));
        } catch {
            return [];
        }
    }

    private static async getInstitutionDashboard() {
        const [totalApprenants, totalEnseignants, totalClasses, totalCours, sessions, enAttente] = await Promise.all([
            Apprenant.count(),
            Enseignant.count(),
            Classe.count(),
            Cours.count(),
            Session.findAll({ attributes: ['id', 'dateDebut', 'dateFin', 'description'] }),
            PreInscription.findAll({ where: { statut: 'en_attente' }, attributes: ['id'] }),
        ]);

        return {
            success: true,
            role: 'institution',
            data: {
                totalApprenants,
                totalEnseignants,
                totalClasses,
                totalCours,
                totalSessions: sessions.length,
                sessionsOuvertes: sessions.filter((s: any) => { const now = new Date(); return new Date(s.dateDebut) <= now && new Date(s.dateFin) >= now; }).length,
                demandesEnAttente: enAttente.length,
            }
        };
    }

    private static async getCaissierDashboard() {
        const [totalPaiements, totalBordereaux, echeancesImpayees, paiementsRecents] = await Promise.all([
            PaiementInscription.count(),
            Bordereau.count(),
            Echeance.count({ where: { statut: 'impaye' } }),
            PaiementInscription.findAll({
                order: [['createdAt', 'DESC']],
                limit: 10,
                attributes: ['id', 'montant', 'type', 'datePaiement', 'numero'],
            }),
        ]);

        return {
            success: true,
            role: 'caissier',
            data: {
                totalPaiements,
                totalBordereaux,
                echeancesImpayees,
                paiementsRecents: paiementsRecents.map(p => ({
                    id: p.id,
                    montant: p.montant,
                    mode: p.type,
                    numero: p.numero,
                    date: p.datePaiement,
                })),
            }
        };
    }

    private static async getComptableDashboard() {
        const [totalPaiements, totalBordereaux, totalEcheances, echeancesImpayees, montantTotal] = await Promise.all([
            PaiementInscription.count(),
            Bordereau.count(),
            Echeance.count(),
            Echeance.count({ where: { statut: 'impaye' } }),
            PaiementInscription.sum('montant'),
        ]);

        return {
            success: true,
            role: 'comptable',
            data: {
                totalPaiements,
                totalBordereaux,
                totalEcheances,
                echeancesImpayees,
                montantTotal: montantTotal || 0,
            }
        };
    }

    private static async getOrientationDashboard() {
        const [totalDemandes, enAttente, validees, rejetees, demandesRecentes] = await Promise.all([
            DemandeInscription.count(),
            PreInscription.count({ where: { statut: 'en_attente' } }),
            PreInscription.count({ where: { statut: 'valide' } }),
            PreInscription.count({ where: { statut: 'rejete' } }),
            DemandeInscription.findAll({
                order: [['dateDemande', 'DESC']],
                limit: 10,
                attributes: ['id', 'dateDemande', 'matricule'],
            }),
        ]);

        return {
            success: true,
            role: 'orientation',
            data: {
                totalDemandes,
                enAttente,
                validees,
                rejetees,
                demandesRecentes: demandesRecentes.map(d => ({
                    id: d.id,
                    date: d.dateDemande,
                    matricule: d.matricule,
                })),
            }
        };
    }

    private static async getRHDashboard() {
        const todayName = DAYS[new Date().getDay()];

        const [plannings, totalEmployes] = await Promise.all([
            RhPlanningPersonnel.findAll({
                where: { jourSemaine: todayName },
                include: [{ association: 'employe', attributes: ['id', 'nom', 'prenoms'] }],
                order: [['heureDebut', 'ASC']],
                limit: 10,
            }),
            Utilisateur.count(),
        ]);

        return {
            success: true,
            role: 'rh',
            data: {
                totalEmployes,
                planning: plannings.map(p => ({
                    id: p.id,
                    tache: p.tache,
                    heureDebut: p.heureDebut,
                    heureFin: p.heureFin,
                })),
            }
        };
    }

    private static async getDefaultDashboard(utilisateurId: number) {
        const todayName = DAYS[new Date().getDay()];

        const seances = await Seance.findAll({
            where: { jourSemaine: todayName },
            include: [
                { association: 'cours', attributes: ['id', 'intitule'] },
                { association: 'salleDeClasse', attributes: ['id', 'libelle'] },
            ],
            order: [['heureDebut', 'ASC']],
            limit: 5,
        });

        const notifications = await Notification.findAll({
            where: { utilisateurId },
            order: [['date', 'DESC']],
            limit: 5,
        });

        return {
            success: true,
            role: 'default',
            data: {
                agenda: seances.map(s => ({
                    id: s.id,
                    titre: s.titre || s.cours?.intitule || 'Séance',
                    heureDebut: s.heureDebut,
                    heureFin: s.heureFin,
                    salle: s.salleDeClasse?.libelle || s.salle || '',
                })),
                notifications: notifications.map(n => ({
                    id: n.id,
                    message: n.message,
                    type: n.type,
                    lu: n.lu,
                    date: n.date,
                })),
            }
        };
    }
}

export default DashboardController;
