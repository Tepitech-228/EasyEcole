import { Request, Response } from "express";
import { Op } from "sequelize";
import { ParentEnfant } from "../models/ParentEnfant";
import { Apprenant } from "../../auth/models/Apprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Bulletin } from "../../bulletins/models/Bulletin";
import { LigneBulletin } from "../../bulletins/models/LigneBulletin";
import { Absence } from "../../inscription/models/Absence";
import { NoteEvaluation } from "../../inscription/models/NoteEvaluation";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { Seance } from "../../inscription/models/Seance";
import { Cours } from "../../inscription/models/Cours";
import { Classe } from "../../inscription/models/Classe";
import { Echeance } from "../../inscription/models/Echeance";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { SalleDeClasse } from "../../inscription/models/SalleDeClasse";

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

class ParentController {

    static async getEnfants(req: Request, res: Response): Promise<Response> {
        try {
            const parentUtilisateurId = (req as any).utilisateurId;
            const relations = await ParentEnfant.findAll({
                where: { parentUtilisateurId },
                include: [{ association: 'apprenant', include: [{ association: 'utilisateur' }] }]
            });

            const enfants = await Promise.all(relations.map(async (rel) => {
                const apprenant = (rel as any).apprenant;
                if (!apprenant) return null;

                const utilisateur = apprenant.utilisateur;
                const cursus = await CursusApprenant.findOne({
                    where: { utilisateurId: apprenant.utilisateurId },
                    include: [
                        { association: 'classe' },
                        { association: 'parcours' },
                        { association: 'anneeAcademique' },
                    ],
                    order: [['createdAt', 'DESC']],
                });

                return {
                    apprenantId: apprenant.id,
                    nom: utilisateur?.nom || '',
                    prenoms: utilisateur?.prenoms || '',
                    photo: apprenant.photo || utilisateur?.photoDeProfil || '',
                    classe: (cursus as any)?.classe?.libelle || null,
                    parcours: (cursus as any)?.parcours?.intituleParcours || null,
                    anneeAcademique: (cursus as any)?.anneeAcademique?.libelle || null,
                };
            }));

            return res.json(enfants.filter(Boolean));
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des enfants', error });
        }
    }

    private static async authorizeParent(req: Request, apprenantId: number): Promise<boolean> {
        const count = await ParentEnfant.count({
            where: { parentUtilisateurId: (req as any).utilisateurId, apprenantId }
        });
        return count > 0;
    }

    static async getDashboard(req: Request, res: Response): Promise<Response> {
        try {
            const apprenantId = parseInt(req.params.id);
            if (!await ParentController.authorizeParent(req, apprenantId)) {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            const apprenant = await Apprenant.findByPk(apprenantId, {
                include: [{ association: 'utilisateur' }]
            });
            if (!apprenant) {
                return res.status(404).json({ success: false, message: 'Apprenant non trouvé' });
            }

            const utilisateurId = apprenant.utilisateurId;

            const cursus = await CursusApprenant.findOne({
                where: { utilisateurId },
                include: [
                    { association: 'classe' },
                    { association: 'parcours' },
                    { association: 'anneeAcademique' },
                ],
                order: [['createdAt', 'DESC']],
            });

            let moyenne = null;
            let bulletinRecents: any[] = [];
            if (cursus) {
                const bulletins = await Bulletin.findAll({
                    where: { utilisateurId, statut: 'publie', cursusApprenantId: cursus.id },
                    include: [{ association: 'lignesBulletins' }],
                    order: [['createdAt', 'DESC']],
                    limit: 1,
                });
                if (bulletins.length > 0) {
                    const bulletin = bulletins[0];
                    moyenne = bulletin.moyenneGenerale;
                    bulletinRecents = (bulletin as any).lignesBulletins?.map((l: any) => ({
                        coursId: l.coursId,
                        moyenne: l.moyenne,
                        coefficient: l.coefficient,
                    })) || [];
                }
            }

            let totalAbsences = 0;
            try {
                const participantIds = await ParentController.getParticipantIds(utilisateurId);
                if (participantIds.length > 0) {
                    const noteIds = await NoteEvaluation.findAll({
                        where: { coursParticipantId: { [Op.in]: participantIds } },
                        attributes: ['id'],
                    });
                    totalAbsences = await Absence.count({
                        where: { noteEvaluationId: { [Op.in]: noteIds.map(n => n.id) }, type: { [Op.ne]: 'present' } }
                    });
                }
            } catch (error) {
                console.error('ParentController: getDashboard (totalAbsences)', error);
            }

            let nextSeance = null;
            if (cursus && (cursus as any).classe) {
                try {
                    const today = new Date();
                    const todayStr = today.toISOString().slice(0, 10);
                    const todayName = DAYS[today.getDay()];

                    const coursList = await Cours.findAll({
                        where: { classeId: (cursus as any).classe.id },
                        attributes: ['id'],
                    });
                    const coursIds = coursList.map(c => c.id);

                    if (coursIds.length > 0) {
                        const seances = await Seance.findAll({
                            where: { coursId: { [Op.in]: coursIds }, jourSemaine: todayName },
                            include: [
                                { association: 'cours', attributes: ['id', 'intitule'] },
                                { association: 'salleDeClasse', attributes: ['id', 'libelle'] },
                            ],
                            order: [['heureDebut', 'ASC']],
                        });

                        const upcoming = seances.find(s => {
                            const debut = new Date(`${todayStr}T${s.heureDebut}`);
                            return debut.getTime() > today.getTime();
                        });

                        if (upcoming) {
                            nextSeance = {
                                id: upcoming.id,
                                titre: upcoming.titre || (upcoming as any).cours?.intitule || 'Séance',
                                heureDebut: upcoming.heureDebut,
                                heureFin: upcoming.heureFin,
                                salle: (upcoming as any).salleDeClasse?.libelle || upcoming.salle || '',
                            };
                        }
                    }
                } catch (error) {
                    console.error('ParentController: getDashboard (nextSeance)', error);
                }
            }

            return res.json({
                apprenant: {
                    id: apprenant.id,
                    photo: apprenant.photo,
                    nom: (apprenant as any).utilisateur?.nom || '',
                    prenoms: (apprenant as any).utilisateur?.prenoms || '',
                },
                cursus: cursus ? {
                    classe: (cursus as any).classe?.libelle || null,
                    parcours: (cursus as any).parcours?.intituleParcours || null,
                    anneeAcademique: (cursus as any).anneeAcademique?.libelle || null,
                } : null,
                moyenne,
                bulletinRecents,
                totalAbsences,
                prochainCours: nextSeance,
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur dashboard', error });
        }
    }

    static async getNotes(req: Request, res: Response): Promise<Response> {
        try {
            const apprenantId = parseInt(req.params.id);
            if (!await ParentController.authorizeParent(req, apprenantId)) {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            const apprenant = await Apprenant.findByPk(apprenantId, { attributes: ['id', 'utilisateurId'] });
            if (!apprenant) {
                return res.status(404).json({ success: false, message: 'Apprenant non trouvé' });
            }

            const bulletins = await Bulletin.findAll({
                where: { utilisateurId: apprenant.utilisateurId, statut: 'publie' },
                include: [
                    {
                        association: 'lignesBulletins',
                        include: [
                            { association: 'cours', attributes: ['id', 'intitule', 'code', 'coefficient'] }
                        ]
                    },
                    { association: 'anneeAcademique' },
                    { association: 'classe' },
                    { association: 'semestre' as any }
                ],
                order: [['createdAt', 'DESC']],
            });

            const notes = bulletins.flatMap(bulletin => {
                const lignes = (bulletin as any).lignesBulletins || [];
                return lignes.map((ligne: any) => ({
                    bulletinId: bulletin.id,
                    semestre: bulletin.semestre,
                    anneeAcademique: (bulletin as any).anneeAcademique?.libelle || '',
                    classe: (bulletin as any).classe?.libelle || '',
                    coursId: ligne.coursId,
                    cours: ligne.cours?.intitule || '',
                    code: ligne.cours?.code || '',
                    moyenne: ligne.moyenne,
                    coefficient: ligne.coefficient || ligne.cours?.coefficient || null,
                    appreciation: ligne.appreciation,
                }));
            });

            return res.json(notes);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notes', error });
        }
    }

    static async getAbsences(req: Request, res: Response): Promise<Response> {
        try {
            const apprenantId = parseInt(req.params.id);
            if (!await ParentController.authorizeParent(req, apprenantId)) {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            const apprenant = await Apprenant.findByPk(apprenantId, { attributes: ['id', 'utilisateurId'] });
            if (!apprenant) {
                return res.status(404).json({ success: false, message: 'Apprenant non trouvé' });
            }

            const participantIds = await ParentController.getParticipantIds(apprenant.utilisateurId);
            if (participantIds.length === 0) {
                return res.json([]);
            }

            const notes = await NoteEvaluation.findAll({
                where: { coursParticipantId: { [Op.in]: participantIds } },
                attributes: ['id'],
            });
            const noteIds = notes.map(n => n.id);
            if (noteIds.length === 0) {
                return res.json([]);
            }

            const absences = await Absence.findAll({
                where: { noteEvaluationId: { [Op.in]: noteIds } },
                include: [
                    {
                        association: 'noteEvaluation',
                        include: [
                            {
                                association: 'coursParticipant',
                                include: [
                                    { association: 'cours', attributes: ['id', 'intitule', 'code'] }
                                ]
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']],
            });

            const result = absences.map(a => ({
                id: a.id,
                type: a.type,
                motif: a.motif,
                justificatif: a.justificatif,
                declareLe: a.declareLe,
                date: a.createdAt,
                cours: (a as any).noteEvaluation?.coursParticipant?.cours?.intitule || '',
                codeCours: (a as any).noteEvaluation?.coursParticipant?.cours?.code || '',
            }));

            return res.json(result);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des absences', error });
        }
    }

    static async getEmploiDuTemps(req: Request, res: Response): Promise<Response> {
        try {
            const apprenantId = parseInt(req.params.id);
            if (!await ParentController.authorizeParent(req, apprenantId)) {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            const apprenant = await Apprenant.findByPk(apprenantId, { attributes: ['id', 'utilisateurId'] });
            if (!apprenant) {
                return res.status(404).json({ success: false, message: 'Apprenant non trouvé' });
            }

            const cursus = await CursusApprenant.findOne({
                where: { utilisateurId: apprenant.utilisateurId },
                include: [{ association: 'classe' }],
                order: [['createdAt', 'DESC']],
            });

            if (!cursus || !(cursus as any).classe) {
                return res.json([]);
            }

            const classeId = (cursus as any).classe.id;
            const coursList = await Cours.findAll({
                where: { classeId },
                attributes: ['id'],
            });
            const coursIds = coursList.map(c => c.id);

            if (coursIds.length === 0) {
                return res.json([]);
            }

            const seances = await Seance.findAll({
                where: { coursId: { [Op.in]: coursIds } },
                include: [
                    { association: 'cours', attributes: ['id', 'intitule', 'code'] },
                    { association: 'salleDeClasse', attributes: ['id', 'libelle'] },
                ],
                order: [['jourSemaine', 'ASC'], ['heureDebut', 'ASC']],
            });

            const emploiDuTemps = seances.map(s => ({
                id: s.id,
                titre: s.titre || (s as any).cours?.intitule || '',
                codeCours: (s as any).cours?.code || '',
                jourSemaine: s.jourSemaine,
                heureDebut: s.heureDebut,
                heureFin: s.heureFin,
                salle: (s as any).salleDeClasse?.libelle || s.salle || '',
                description: s.description,
            }));

            return res.json(emploiDuTemps);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur emploi du temps', error });
        }
    }

    static async getPaiements(req: Request, res: Response): Promise<Response> {
        try {
            const apprenantId = parseInt(req.params.id);
            if (!await ParentController.authorizeParent(req, apprenantId)) {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            const apprenant = await Apprenant.findByPk(apprenantId, { attributes: ['id', 'utilisateurId'] });
            if (!apprenant) {
                return res.status(404).json({ success: false, message: 'Apprenant non trouvé' });
            }

            const dossier = await DossierEtudiant.findOne({
                where: { utilisateurId: apprenant.utilisateurId },
                include: [
                    {
                        association: 'echeances',
                    }
                ],
                order: [['createdAt', 'DESC']],
            });

            if (!dossier) {
                return res.json([]);
            }

            const echeances = (dossier as any).echeances || [];
            const result = echeances.map((e: any) => ({
                id: e.id,
                type: e.type,
                numeroEcheance: e.numeroEcheance,
                montant: e.montant,
                devise: e.devise,
                dateLimite: e.dateLimite,
                datePaiement: e.datePaiement,
                statut: e.statut,
                moisConcerne: e.moisConcerne,
            }));

            return res.json(result);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paiements', error });
        }
    }

    static async getDocuments(req: Request, res: Response): Promise<Response> {
        try {
            const apprenantId = parseInt(req.params.id);
            if (!await ParentController.authorizeParent(req, apprenantId)) {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }

            const apprenant = await Apprenant.findByPk(apprenantId, { attributes: ['id', 'utilisateurId'] });
            if (!apprenant) {
                return res.status(404).json({ success: false, message: 'Apprenant non trouvé' });
            }

            const bulletins = await Bulletin.findAll({
                where: { utilisateurId: apprenant.utilisateurId, statut: 'publie' },
                include: [
                    { association: 'anneeAcademique' },
                    { association: 'classe' },
                    { association: 'cursusApprenant' },
                ],
                order: [['createdAt', 'DESC']],
            });

            const documents = bulletins.map(b => ({
                id: b.id,
                type: 'bulletin',
                titre: `Bulletin ${b.semestre} - ${(b as any).anneeAcademique?.libelle || ''}`,
                semestre: b.semestre,
                anneeAcademique: (b as any).anneeAcademique?.libelle || '',
                classe: (b as any).classe?.libelle || '',
                moyenneGenerale: b.moyenneGenerale,
                mention: b.mention,
                appreciation: b.appreciation,
                datePublication: b.datePublication,
                statut: b.statut,
            }));

            return res.json(documents);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des documents', error });
        }
    }

    private static async getParticipantIds(utilisateurId: number): Promise<number[]> {
        const participants = await CoursParticipant.findAll({
            where: { utilisateurId },
            attributes: ['id'],
        });
        return participants.map(p => p.id);
    }
}

export default ParentController;
