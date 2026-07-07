import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { CoursParticipant } from "../models/CoursParticipant";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { Enseignant } from "../../auth/models/Enseignant";
import { AuditNote } from "../../bulletins/models/AuditNote";
import { validateNoteValue, validateBulkNotesInput, ValidationError } from "../../../core/validators/noteValidators";

async function creerAudit(noteEvaluationId: number, ancienneNote: number | null, nouvelleNote: number | null, modifiePar: number, motif?: string) {
    if (ancienneNote === nouvelleNote) return;
    try {
        await AuditNote.create({
            noteEvaluationId,
            ancienneNote,
            nouvelleNote,
            modifiePar,
            motif: motif || null
        });
    } catch (error) {
        console.error("Erreur création audit:", error);
    }
}

export default class NoteEvaluationController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const { listeNoteEvaluationId, coursParticipantId } = req.query;
            const where: any = {};
            if (listeNoteEvaluationId) where.listeNoteEvaluationId = listeNoteEvaluationId;
            if (coursParticipantId) where.coursParticipantId = coursParticipantId;

            const notes = await NoteEvaluation.findAll({
                where,
                include: [
                    { association: NoteEvaluation.associations.coursParticipant }
                ]
            });

            return res.status(200).json(notes);
        } catch (error) {
            console.error("Erreur getAll:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération des notes" });
        }
    }

    static async getOne(req: Request, res: Response): Promise<Response> {
        try {
            const note = await NoteEvaluation.findByPk(req.params.id, {
                include: [
                    { association: NoteEvaluation.associations.coursParticipant },
                    { association: NoteEvaluation.associations.listeNoteEvaluation }
                ]
            });

            if (!note) {
                return res.status(404).json({ success: false, message: "Note non trouvée" });
            }

            return res.status(200).json(note);
        } catch (error) {
            console.error("Erreur getOne:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération de la note" });
        }
    }

    static async upsert(req: Request, res: Response): Promise<Response> {
        try {
            if (req.utilisateurRole! != RolesUtilisateur.INSTITUTION &&
                req.utilisateurRole! != RolesUtilisateur.ENSEIGNANT &&
                req.utilisateurRole! != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false, message: "Accès refusé" });
            }

            const { listeNoteEvaluationId, coursParticipantId, note } = req.body;

            try {
                const noteValidee = validateNoteValue(note);
                if (note !== undefined && note !== null && noteValidee === null) {
                    return res.status(400).json({ success: false, message: "Note invalide" });
                }
            } catch (e) {
                if (e instanceof ValidationError) {
                    return res.status(400).json({ success: false, message: e.message });
                }
                throw e;
            }

            if (!listeNoteEvaluationId || !coursParticipantId) {
                return res.status(400).json({ success: false, message: "listeNoteEvaluationId et coursParticipantId requis" });
            }

            const evaluation = await ListeNoteEvaluation.findByPk(listeNoteEvaluationId);
            if (!evaluation) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" });
            }

            const participant = await CoursParticipant.findByPk(coursParticipantId);
            if (!participant) {
                return res.status(404).json({ success: false, message: "Participant non trouvé" });
            }

            if (req.utilisateurRole! == RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId: req.utilisateurId! } });
                const coursParticipant = await CoursParticipant.findByPk(coursParticipantId, {
                    include: [{ association: CoursParticipant.associations.cours }]
                });
                if (!enseignant || (coursParticipant as any)?.cours?.enseignantId !== enseignant.id) {
                    return res.status(403).json({ success: false, message: "Vous n'êtes pas l'enseignant de ce cours" });
                }
            }

            const existing = await NoteEvaluation.findOne({
                where: { listeNoteEvaluationId, coursParticipantId }
            });

            if (existing && existing.statut === 'publie') {
                return res.status(400).json({ success: false, message: "Impossible de modifier une note publiée" });
            }

            if (existing) {
                const ancienneNote = existing.note;
                existing.note = note !== undefined ? note : existing.note;
                await existing.save();
                await creerAudit(existing.id as number, ancienneNote, existing.note, req.utilisateurId!, req.body.motif);
                return res.status(200).json(existing);
            } else {
                const newNote = new NoteEvaluation();
                newNote.listeNoteEvaluationId = listeNoteEvaluationId;
                newNote.coursParticipantId = coursParticipantId;
                newNote.note = note !== undefined ? note : null;
                await newNote.save();
                return res.status(201).json(newNote);
            }
        } catch (error) {
            console.error("Erreur upsert:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la sauvegarde de la note" });
        }
    }

    static async bulkUpsert(req: Request, res: Response): Promise<Response> {
        try {
            if (req.utilisateurRole! != RolesUtilisateur.INSTITUTION &&
                req.utilisateurRole! != RolesUtilisateur.ENSEIGNANT &&
                req.utilisateurRole! != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false, message: "Accès refusé" });
            }

            const { listeNoteEvaluationId, notes } = req.body;

            if (!listeNoteEvaluationId || !Array.isArray(notes)) {
                return res.status(400).json({ success: false, message: "listeNoteEvaluationId et notes requis" });
            }

            const evaluation = await ListeNoteEvaluation.findByPk(listeNoteEvaluationId);
            if (!evaluation) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" });
            }

            // Vérifier si l'évaluation a déjà des notes publiées
            const existingPublished = await NoteEvaluation.count({
                where: { listeNoteEvaluationId, statut: 'publie' }
            });
            if (existingPublished > 0) {
                return res.status(400).json({ success: false, message: "Impossible de modifier des notes déjà publiées. Annulez la publication d'abord." });
            }

            const records = notes
                .filter((item: any) => item.coursParticipantId)
                .map((item: any) => ({
                    listeNoteEvaluationId,
                    coursParticipantId: item.coursParticipantId,
                    note: item.note !== undefined ? item.note : null
                }));

            const result = await NoteEvaluation.bulkCreate(records, {
                updateOnDuplicate: ["note", "updatedAt"]
            });

            for (const record of records) {
                const created = result.find(r => r.coursParticipantId === record.coursParticipantId);
                if (created) {
                    await creerAudit(created.id!, null, record.note, req.utilisateurId!);
                }
            }

            return res.status(200).json({ success: true, count: result.length, data: result });
        } catch (error) {
            console.error("Erreur bulkUpsert:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la sauvegarde des notes" });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            if (req.utilisateurRole! != RolesUtilisateur.INSTITUTION &&
                req.utilisateurRole! != RolesUtilisateur.ENSEIGNANT) {
                return res.status(403).json({ success: false, message: "Accès refusé" });
            }

            const note = await NoteEvaluation.findByPk(req.params.id);
            if (!note) {
                return res.status(404).json({ success: false, message: "Note non trouvée" });
            }

            await note.destroy();
            return res.status(200).json({ success: true, message: "Note supprimée" });
        } catch (error) {
            console.error("Erreur delete:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la suppression de la note" });
        }
    }
}
