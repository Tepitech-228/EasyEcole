import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { CoursParticipant } from "../models/CoursParticipant";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { Enseignant } from "../../auth/models/Enseignant";
import { AuditNote } from "../../bulletins/models/AuditNote";
import { validateNoteValue, validateBulkNotesInput, ValidationError } from "../../../core/validators/noteValidators";
import { SemestreAcademiqueService } from "../services/SemestreAcademiqueService";
import { SemestreAcademique } from "../models/SemestreAcademique";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Cours } from "../models/Cours";
import { Op } from "sequelize";
import { Transaction } from "sequelize";

async function creerAudit(noteEvaluationId: number, ancienneNote: number | null, nouvelleNote: number | null, modifiePar: number, motif?: string, transaction?: Transaction) {
    if (ancienneNote === nouvelleNote) return;
    await AuditNote.create({
        noteEvaluationId,
        ancienneNote,
        nouvelleNote,
        modifiePar,
        motif: motif || null
    }, { transaction });
}

function isPositiveInteger(value: unknown): boolean {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0;
}

class PublishedNoteError extends Error {}

async function enseignantAutorise(req: Request, evaluation: ListeNoteEvaluation): Promise<boolean> {
    if (req.utilisateurRole !== RolesUtilisateur.ENSEIGNANT) return true;
    const enseignant = await Enseignant.findOne({ where: { utilisateurId: req.utilisateurId! } });
    const cours = await Cours.findByPk(evaluation.coursId);
    return !!enseignant && !!cours && String(cours.enseignantId) === String(enseignant.id);
}

export default class NoteEvaluationController {

    constructor() { }

    private static async getSemesterLockState(evaluation: any): Promise<{ allowed: boolean; reason?: string }> {
        const course = await evaluation.getCours?.();
        if (!course?.parcoursId) {
            return { allowed: true };
        }

        const semester = await SemestreAcademique.findOne({
            where: {
                parcoursId: course.parcoursId,
                anneeAcademiqueId: evaluation.anneeAcademiqueId,
                codeSemestre: course.semestre || 'semestre1'
            },
            order: [['id', 'DESC']]
        });

        return SemestreAcademiqueService.canWriteNotes((semester as any)?.statut);
    }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const { listeNoteEvaluationId, coursParticipantId } = req.query;
            const where: any = {};
            if (listeNoteEvaluationId) where.listeNoteEvaluationId = listeNoteEvaluationId;
            if (coursParticipantId) where.coursParticipantId = coursParticipantId;

            const include: any[] = [
                { association: NoteEvaluation.associations.coursParticipant }
            ];

            // Un étudiant ne voit que ses propres notes
            if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
                const coursParticipants = await CoursParticipant.findAll({
                    where: { utilisateurId: (req as any).utilisateurId },
                    attributes: ['id']
                });
                where.coursParticipantId = { [require('sequelize').Op.in]: coursParticipants.map(cp => cp.id) };
            }
            // Un enseignant ne voit que les notes de ses propres cours
            else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId: (req as any).utilisateurId } });
                if (enseignant) {
                    include.push({
                        association: NoteEvaluation.associations.listeNoteEvaluation,
                        required: true,
                        include: [{
                            association: ListeNoteEvaluation.associations.cours,
                            where: { enseignantId: enseignant.id },
                            required: true
                        }]
                    });
                }
            }

            const notes = await NoteEvaluation.findAll({
                where,
                include
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
                    { association: NoteEvaluation.associations.listeNoteEvaluation, include: [{ association: ListeNoteEvaluation.associations.cours }] }
                ]
            });

            if (!note) {
                return res.status(404).json({ success: false, message: "Note non trouvée" });
            }

            // Un étudiant ne peut voir que ses propres notes
            if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
                const coursParticipant = (note as any).coursParticipant;
                if (!coursParticipant || coursParticipant.utilisateurId !== (req as any).utilisateurId) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette note" });
                }
            }
            // Un enseignant ne peut voir que les notes de ses propres cours
            else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId: (req as any).utilisateurId } });
                const cours = (note as any).listeNoteEvaluation?.cours;
                if (!enseignant || !cours || cours.enseignantId !== enseignant.id) {
                    return res.status(403).json({ success: false, message: "Vous n'êtes pas l'enseignant de ce cours" });
                }
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

            const { listeNoteEvaluationId, coursParticipantId, note, motif } = req.body;
            const noteProvided = Object.prototype.hasOwnProperty.call(req.body || {}, 'note');

            let noteValidee: number | null;
            try {
                noteValidee = validateNoteValue(note);
            } catch (error) {
                if (error instanceof ValidationError) return res.status(400).json({ success: false, message: error.message });
                throw error;
            }

            if (!isPositiveInteger(listeNoteEvaluationId) || !isPositiveInteger(coursParticipantId)) {
                return res.status(400).json({ success: false, message: "listeNoteEvaluationId et coursParticipantId requis" });
            }

            const evaluation = await ListeNoteEvaluation.findByPk(listeNoteEvaluationId);
            if (!evaluation) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" });
            }

            const semesterCheck = await NoteEvaluationController.getSemesterLockState(evaluation as any);
            if (!semesterCheck.allowed) {
                return res.status(409).json({ success: false, message: semesterCheck.reason });
            }

            const participant = await CoursParticipant.findByPk(coursParticipantId);
            if (!participant) {
                return res.status(404).json({ success: false, message: "Participant non trouvé" });
            }
            if (Number(participant.coursId) !== Number(evaluation.coursId)) {
                return res.status(400).json({ success: false, message: "Le participant n’appartient pas au cours de cette évaluation." });
            }

            if (!(await enseignantAutorise(req, evaluation))) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas l'enseignant de ce cours" });
            }

            const result = await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                const existing = await NoteEvaluation.findOne({
                    where: { listeNoteEvaluationId, coursParticipantId },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (existing?.statut === 'publie') throw new PublishedNoteError();

                if (existing) {
                    const ancienneNote = existing.note;
                    existing.note = noteProvided ? noteValidee : existing.note;
                    await existing.save({ transaction });
                    await creerAudit(existing.id as number, ancienneNote, existing.note, req.utilisateurId!, motif, transaction);
                    return { note: existing, created: false };
                }

                const newNote = await NoteEvaluation.create({
                    listeNoteEvaluationId: Number(listeNoteEvaluationId),
                    coursParticipantId: Number(coursParticipantId),
                    note: noteValidee
                }, { transaction });
                await creerAudit(newNote.id as number, null, newNote.note, req.utilisateurId!, motif, transaction);
                return { note: newNote, created: true };
            });
            return res.status(result.created ? 201 : 200).json(result.note);
        } catch (error) {
            if (error instanceof PublishedNoteError) {
                return res.status(409).json({ success: false, message: "Impossible de modifier une note publiée" });
            }
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
            try {
                validateBulkNotesInput(req.body);
            } catch (error) {
                if (error instanceof ValidationError) return res.status(400).json({ success: false, message: error.message });
                throw error;
            }
            if (!isPositiveInteger(listeNoteEvaluationId)) return res.status(400).json({ success: false, message: "listeNoteEvaluationId invalide" });
            const ids: number[] = [];
            const noteValues = new Map<number, number | null>();
            try {
                for (const item of notes) {
                    const id = (item as any).coursParticipantId;
                    if (!isPositiveInteger(id)) return res.status(400).json({ success: false, message: "coursParticipantId invalide" });
                    const participantId = Number(id);
                    if (noteValues.has(participantId)) return res.status(400).json({ success: false, message: "Un participant ne peut apparaître qu’une fois." });
                    ids.push(participantId);
                    noteValues.set(participantId, validateNoteValue((item as any).note));
                }
            } catch (error) {
                if (error instanceof ValidationError) return res.status(400).json({ success: false, message: error.message });
                throw error;
            }

            const evaluation = await ListeNoteEvaluation.findByPk(listeNoteEvaluationId);
            if (!evaluation) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" });
            }
            if (!(await enseignantAutorise(req, evaluation))) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas l'enseignant de ce cours" });
            }

            const semesterCheck = await NoteEvaluationController.getSemesterLockState(evaluation as any);
            if (!semesterCheck.allowed) {
                return res.status(409).json({ success: false, message: semesterCheck.reason });
            }

            // Vérifier si l'évaluation a déjà des notes publiées
            const participants = ids.length ? await CoursParticipant.findAll({
                where: { id: { [Op.in]: ids }, coursId: evaluation.coursId },
                attributes: ['id']
            }) : [];
            if (participants.length !== ids.length) {
                return res.status(400).json({ success: false, message: "Un participant n’existe pas ou n’appartient pas au cours de cette évaluation." });
            }

            const result = await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                const existing = await NoteEvaluation.findAll({
                    where: { listeNoteEvaluationId, coursParticipantId: { [Op.in]: ids } },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (existing.some(note => note.statut === 'publie')) throw new PublishedNoteError();
                const existingByParticipant = new Map(existing.map(note => [Number(note.coursParticipantId), note]));
                const saved: NoteEvaluation[] = [];

                for (const participantId of ids) {
                    const noteValue = noteValues.get(participantId) ?? null;
                    const current = existingByParticipant.get(participantId);
                    if (current) {
                        const oldValue = current.note;
                        current.note = noteValue;
                        await current.save({ transaction });
                        await creerAudit(current.id!, oldValue, current.note, req.utilisateurId!, undefined, transaction);
                        saved.push(current);
                    } else {
                        const created = await NoteEvaluation.create({
                            listeNoteEvaluationId: Number(listeNoteEvaluationId),
                            coursParticipantId: participantId,
                            note: noteValue
                        }, { transaction });
                        await creerAudit(created.id!, null, created.note, req.utilisateurId!, undefined, transaction);
                        saved.push(created);
                    }
                }

                return saved;
            });

            return res.status(200).json({ success: true, count: result.length, data: result });
        } catch (error) {
            if (error instanceof PublishedNoteError) {
                return res.status(409).json({ success: false, message: "Impossible de modifier des notes déjà publiées. Annulez la publication d'abord." });
            }
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

            if (!isPositiveInteger(req.params.id)) {
                return res.status(400).json({ success: false, message: "Identifiant de note invalide" });
            }
            const note = await NoteEvaluation.findByPk(req.params.id);
            if (!note) {
                return res.status(404).json({ success: false, message: "Note non trouvée" });
            }

            if (note.statut === 'publie') {
                return res.status(409).json({ success: false, message: "Impossible de supprimer une note publiée." });
            }

            const [evaluation, participant] = await Promise.all([
                ListeNoteEvaluation.findByPk(note.listeNoteEvaluationId),
                CoursParticipant.findByPk(note.coursParticipantId)
            ]);
            if (!evaluation || !participant) {
                return res.status(409).json({ success: false, message: "La note est liée à une évaluation ou un participant introuvable." });
            }
            if (Number(participant.coursId) !== Number(evaluation.coursId)) {
                return res.status(409).json({ success: false, message: "La note ne correspond pas au cours de son évaluation." });
            }
            if (!(await enseignantAutorise(req, evaluation))) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas l'enseignant de ce cours" });
            }
            const semesterCheck = await NoteEvaluationController.getSemesterLockState(evaluation as any);
            if (!semesterCheck.allowed) {
                return res.status(409).json({ success: false, message: semesterCheck.reason });
            }

            await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                const current = await NoteEvaluation.findByPk(req.params.id, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!current) return;
                if (current.statut === 'publie') throw new PublishedNoteError();
                await current.destroy({ transaction });
                await creerAudit(current.id as number, current.note, null, req.utilisateurId!, req.body?.motif, transaction);
            });
            return res.status(200).json({ success: true, message: "Note supprimée" });
        } catch (error) {
            if (error instanceof PublishedNoteError) {
                return res.status(409).json({ success: false, message: "Impossible de supprimer une note publiée." });
            }
            console.error("Erreur delete:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la suppression de la note" });
        }
    }
}
