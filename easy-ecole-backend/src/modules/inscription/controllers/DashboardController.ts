import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { Enseignant } from "../../auth/models/Enseignant";
import { CursusApprenant } from "../models/CursusApprenant";
import { DemandeInscription } from "../models/DemandeInscription";
import { PreInscription } from "../models/PreInscription";
import { Seance } from "../models/Seance";
import { Cours } from "../models/Cours";
import { CoursParticipant } from "../models/CoursParticipant";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { RhPlanningPersonnel } from "../../rh/models/RhPlanningPersonnel";
import { Notification } from "../../elearning/models/Notification";

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

class DashboardController {

    static async getDashboard(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = req.utilisateurId!;
            const role = req.utilisateurRole as RolesUtilisateur;

            switch (role) {
                case RolesUtilisateur.ADMIN:
                    return res.json(await DashboardController.getAdminDashboard());
                case RolesUtilisateur.ENSEIGNANT:
                    return res.json(await DashboardController.getEnseignantDashboard(utilisateurId));
                case RolesUtilisateur.APPRENANT:
                    return res.json(await DashboardController.getApprenantDashboard(utilisateurId));
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
        const [totalApprenants, totalEnseignants, sessions, preInscriptions] = await Promise.all([
            Apprenant.count(),
            Enseignant.count(),
            DemandeInscription.findAll({ attributes: ['id', 'dateDemande', 'sessionId', 'matricule'] }),
            PreInscription.findAll({ where: { statut: 'en_attente' }, attributes: ['id'] }),
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
            }
        };
    }

    private static async getApprenantDashboard(utilisateurId: number) {
        const today = new Date();
        const todayName = DAYS[today.getDay()];

        const cursus = await CursusApprenant.findOne({
            where: { utilisateurId },
            include: [{ association: 'demandeInscription', include: [{ association: 'cours' }] }],
        });

        let agenda: any[] = [];
        if (cursus) {
            const coursData = (cursus as any).demandeInscription?.cours || [];
            const coursIds = coursData.map((c: any) => c.id).filter(Boolean);
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

        return { success: true, role: 'apprenant', data: { agenda, notesRecentes } };
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

    private static async getRHDashboard() {
        const todayName = DAYS[new Date().getDay()];

        const plannings = await RhPlanningPersonnel.findAll({
            where: { jourSemaine: todayName },
            include: [{ association: 'employe', attributes: ['id', 'nom', 'prenoms'] }],
            order: [['heureDebut', 'ASC']],
            limit: 10,
        });

        return {
            success: true,
            role: 'rh',
            data: {
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
