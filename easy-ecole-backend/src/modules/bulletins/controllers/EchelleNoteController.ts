import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { EchelleNote } from "../models/EchelleNote";

interface EchelleNotePayload {
    libelle: string;
    noteMin: number;
    noteMax: number;
    mention: string;
    estActive?: boolean;
    ordre?: number;
}

function validatePayload(body: any, partial = false): { data?: Partial<EchelleNotePayload>; message?: string } {
    const data: Partial<EchelleNotePayload> = {};
    const source = body || {};
    const has = (field: string) => Object.prototype.hasOwnProperty.call(source, field);

    if (!partial || has('libelle')) {
        if (typeof source.libelle !== 'string' || !source.libelle.trim()) return { message: 'Le libellé est requis.' };
        data.libelle = source.libelle.trim();
    }
    if (!partial || has('mention')) {
        if (typeof source.mention !== 'string' || !source.mention.trim()) return { message: 'La mention est requise.' };
        data.mention = source.mention.trim();
    }
    for (const field of ['noteMin', 'noteMax'] as const) {
        if (!partial || has(field)) {
            const value = source[field];
            if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) {
                return { message: `La valeur ${field} doit être un nombre entre 0 et 20.` };
            }
            const numeric = Number(value);
            if (numeric < 0 || numeric > 20) return { message: `La valeur ${field} doit être comprise entre 0 et 20.` };
            data[field] = numeric;
        }
    }
    if (has('estActive')) {
        if (typeof source.estActive !== 'boolean') return { message: 'Le statut actif doit être booléen.' };
        data.estActive = source.estActive;
    }
    if (has('ordre')) {
        const ordre = Number(source.ordre);
        if (!Number.isInteger(ordre) || ordre < 0) return { message: 'L’ordre doit être un entier positif ou nul.' };
        data.ordre = ordre;
    }

    return { data };
}

export default class EchelleNoteController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<EchelleNote>> = { order: [['ordre', 'ASC']] }
        try {
            let data = await EchelleNote.findAll(options);
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await EchelleNote.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Échelle non trouvée" });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const parsed = validatePayload(req.body);
            if (!parsed.data) return res.status(400).json({ success: false, message: parsed.message });
            if (parsed.data.noteMin! > parsed.data.noteMax!) {
                return res.status(400).json({ success: false, message: 'La note minimale doit être inférieure ou égale à la note maximale.' });
            }
            const data = await EchelleNote.create({
                libelle: parsed.data.libelle!,
                noteMin: parsed.data.noteMin!,
                noteMax: parsed.data.noteMax!,
                mention: parsed.data.mention!,
                estActive: parsed.data.estActive ?? true,
                ordre: parsed.data.ordre ?? 0
            });
            return res.status(201).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await EchelleNote.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Échelle non trouvée" });
            const parsed = validatePayload(req.body, true);
            if (!parsed.data) return res.status(400).json({ success: false, message: parsed.message });
            if (Object.keys(parsed.data).length === 0) {
                return res.status(400).json({ success: false, message: 'Aucune donnée valide à mettre à jour.' });
            }
            const noteMin = parsed.data.noteMin ?? data.noteMin;
            const noteMax = parsed.data.noteMax ?? data.noteMax;
            if (noteMin > noteMax) {
                return res.status(400).json({ success: false, message: 'La note minimale doit être inférieure ou égale à la note maximale.' });
            }
            await data.update(parsed.data);
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await EchelleNote.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Échelle non trouvée" });
            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
