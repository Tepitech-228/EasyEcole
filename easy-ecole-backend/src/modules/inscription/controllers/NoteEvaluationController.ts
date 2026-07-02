import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { CoursParticipant } from "../models/CoursParticipant";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { Enseignant } from "../../auth/models/Enseignant";
import { AuditNote } from "../../bulletins/models/AuditNote";

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
            return res.status(500).json({ success: false, error: error });
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
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async upsert(req: Request, res: Response): Promise<Response | null> {
        try {
            if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION &&
                (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT &&
                (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false, message: "Accès refusé" });
            }

            const { listeNoteEvaluationId, coursParticipantId, note } = req.body;

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

            if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId: (req as any).utilisateurId } });
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

            if (existing) {
                const ancienneNote = existing.note;
                existing.note = note !== undefined ? note as any : existing.note;
                await existing.save();
                await creerAudit(existing.id, ancienneNote, existing.note, (req as any).utilisateurId, req.body.motif);
                return res.status(200).json(existing);
            } else {
                const newNote = new NoteEvaluation();
                newNote.listeNoteEvaluationId = listeNoteEvaluationId;
                newNote.coursParticipantId = coursParticipantId;
                newNote.note = note !== undefined ? note as any : null;
                await newNote.save();
                return res.status(201).json(newNote);
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async bulkUpsert(req: Request, res: Response): Promise<Response | null> {
        try {
            if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION &&
                (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT &&
                (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
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

            const results: any[] = [];

            for (const item of notes) {
                const { coursParticipantId, note } = item;
                if (!coursParticipantId) continue;

                const existing = await NoteEvaluation.findOne({
                    where: { listeNoteEvaluationId, coursParticipantId }
                });

                if (existing) {
                    const ancienneNote = existing.note;
                    existing.note = note !== undefined ? note as any : existing.note;
                    await existing.save();
                    await creerAudit(existing.id, ancienneNote, existing.note, (req as any).utilisateurId);
                    results.push(existing);
                } else {
                    const newNote = new NoteEvaluation();
                    newNote.listeNoteEvaluationId = listeNoteEvaluationId;
                    newNote.coursParticipantId = coursParticipantId;
                    newNote.note = note !== undefined ? note as any : null;
                    await newNote.save();
                    results.push(newNote);
                }
            }

            return res.status(200).json({ success: true, count: results.length, data: results });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION &&
                (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
                return res.status(403).json({ success: false, message: "Accès refusé" });
            }

            const note = await NoteEvaluation.findByPk(req.params.id);
            if (!note) {
                return res.status(404).json({ success: false, message: "Note non trouvée" });
            }

            await note.destroy();
            return res.status(200).json({ success: true, message: "Note supprimée" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
