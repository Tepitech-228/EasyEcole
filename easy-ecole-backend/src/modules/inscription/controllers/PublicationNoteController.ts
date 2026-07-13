import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { PublicationNote } from "../models/PublicationNote";
import { CoursParticipant } from "../models/CoursParticipant";
import { CursusApprenant } from "../models/CursusApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { EmailSender } from "../../../core/helpers/EmailSender";

export default class PublicationNoteController {

    constructor() {}

    // POST /listesNoteEvaluation/:id/publier
    static async publier(req: Request, res: Response): Promise<Response> {
        try {
            if (req.utilisateurRole! != RolesUtilisateur.INSTITUTION &&
                req.utilisateurRole! != RolesUtilisateur.ENSEIGNANT &&
                req.utilisateurRole! != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false, message: "Accès refusé" });
            }

            const { id } = req.params;
            const { message } = req.body;

            const evaluation = await ListeNoteEvaluation.findByPk(id, {
                include: [
                    { association: ListeNoteEvaluation.associations.cours },
                    { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
                    {
                        association: ListeNoteEvaluation.associations.notesEvaluation,
                        include: [{ association: NoteEvaluation.associations.coursParticipant }]
                    }
                ]
            });

            if (!evaluation) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" });
            }

            // Vérifier que l'enseignant est bien celui du cours
            if (req.utilisateurRole! == RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId: req.utilisateurId! } });
                if (!enseignant || (evaluation as any).cours?.enseignantId !== enseignant.id) {
                    return res.status(403).json({ success: false, message: "Vous n'êtes pas l'enseignant de ce cours" });
                }
            }

            // Vérifier qu'il y a des notes
            const notes = (evaluation as any).notesEvaluation || [];
            if (notes.length === 0) {
                return res.status(400).json({ success: false, message: "Aucune note à publier" });
            }

            // Marquer toutes les notes comme publiées
            for (const note of notes) {
                if (note.statut !== 'publie') {
                    note.statut = 'publie';
                    await note.save();
                }
            }

            // Récupérer les étudiants participants pour notification
            const coursParticipantIds = notes
                .filter((n: any) => n.coursParticipantId)
                .map((n: any) => n.coursParticipantId);

            const participants = await CoursParticipant.findAll({
                where: { id: coursParticipantIds },
                include: [
                    {
                        association: CoursParticipant.associations.utilisateur,
                        attributes: ['id', 'nom', 'prenoms', 'email']
                    }
                ]
            });

            // Créer l'enregistrement de publication
            const publication = await PublicationNote.create({
                listeNoteEvaluationId: id,
                datePublication: new Date(),
                publiePar: req.utilisateurId!,
                message: message || null,
                nbEtudiantsNotifies: participants.length
            });

            // Envoyer les emails de notification (en arrière-plan, sans bloquer)
            const coursIntitule = (evaluation as any).cours?.intitule || 'Matière';
            const evaluationLibelle = (evaluation as any).typeNoteEvaluation?.libelle || 'Évaluation';

            for (const participant of participants) {
                const user = (participant as any).utilisateur;
                if (user?.email) {
                    const noteRecord = notes.find((n: any) => n.coursParticipantId === participant.id);
                    const noteValue = noteRecord?.note ?? null;

                    EmailSender.getInstance().sendMail({
                        from: `Easy Ecole <${require('../../../core/config/mail.json')[process.env.NODE_ENV || 'development'].username}>`,
                        to: user.email,
                        encoding: 'UTF-8',
                        subject: `Easy Ecole: Note disponible - ${coursIntitule}`,
                        html: `<p>Bonjour <b>${user.prenoms || ''} ${user.nom || ''},</b></p>
                        <p>Votre note pour l'évaluation <b>${evaluationLibelle}</b> dans la matière <b>${coursIntitule}</b> est désormais disponible.</p>
                        ${noteValue !== null ? `<p>Votre note : <strong>${noteValue}/20</strong></p>` : '<p>Votre note n\'a pas encore été renseignée.</p>'}
                        <p>Connectez-vous à la plateforme pour plus de détails.</p>
                        <p>Cordialement,<br>Easy Ecole</p>`
                    }).catch((err: any) => {
                        console.error(`Erreur envoi email à ${user.email}:`, err);
                    });
                }
            }

            return res.status(200).json({ success: true, publication });
        } catch (error) {
            console.error("Erreur publication notes:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la publication des notes" });
        }
    }

    // GET /publications
    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const publications = await PublicationNote.findAll({
                include: [
                    { association: PublicationNote.associations.listeNoteEvaluation },
                    { association: PublicationNote.associations.publieParUtilisateur }
                ],
                order: [['datePublication', 'DESC']]
            });
            return res.status(200).json(publications);
        } catch (error) {
            console.error("Erreur liste publications:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération des publications" });
        }
    }

    // GET /publications/etudiant/:cursusId
    static async getForStudent(req: Request, res: Response): Promise<Response> {
        try {
            const { cursusId } = req.params;
            
            const coursParticipants = await CoursParticipant.findAll({
                where: { cursusApprenantId: cursusId },
                attributes: ['id']
            });
            
            const coursParticipantIds = coursParticipants.map(cp => cp.id);
            
            const notes = await NoteEvaluation.findAll({
                where: {
                    coursParticipantId: coursParticipantIds,
                    statut: 'publie'
                },
                include: [
                    {
                        association: NoteEvaluation.associations.listeNoteEvaluation,
                        include: [
                            { association: ListeNoteEvaluation.associations.cours },
                            { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
                            {
                                association: ListeNoteEvaluation.associations.publicationsNotes,
                                limit: 1,
                                order: [['datePublication', 'DESC']]
                            }
                        ]
                    }
                ],
                order: [['updatedAt', 'DESC']]
            });
            
            return res.status(200).json(notes);
        } catch (error) {
            console.error("Erreur récupération notes étudiant:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération des notes" });
        }
    }

    // GET /mes-notes
    static async getMesNotes(req: Request, res: Response): Promise<Response> {
        try {
            const cursusApprenant = await CursusApprenant.findOne({
                where: { utilisateurId: req.utilisateurId! }
            });

            if (!cursusApprenant) {
                return res.status(404).json({ success: false, message: "Aucun cursus trouvé pour cet utilisateur" });
            }

            const coursParticipants = await CoursParticipant.findAll({
                where: { cursusApprenantId: cursusApprenant.id },
                attributes: ['id']
            });

            const coursParticipantIds = coursParticipants.map(cp => cp.id);
            if (coursParticipantIds.length === 0) {
                return res.status(200).json([]);
            }

            const notes = await NoteEvaluation.findAll({
                where: {
                    coursParticipantId: coursParticipantIds,
                    statut: 'publie'
                },
                include: [
                    {
                        association: NoteEvaluation.associations.listeNoteEvaluation,
                        include: [
                            { association: ListeNoteEvaluation.associations.cours },
                            { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
                            {
                                association: ListeNoteEvaluation.associations.publicationsNotes,
                                limit: 1,
                                order: [['datePublication', 'DESC']]
                            }
                        ]
                    },
                    { association: NoteEvaluation.associations.coursParticipant }
                ],
                order: [['updatedAt', 'DESC']]
            });

            return res.status(200).json(notes);
        } catch (error) {
            console.error("Erreur récupération mes notes:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération de vos notes" });
        }
    }
}
