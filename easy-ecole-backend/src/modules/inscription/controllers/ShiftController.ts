import { Request, Response } from "express";
import { Shift, JOURS_SHIFT_VALIDES } from "../models/Shift";

const HEURE_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function validerShift(body: any): string | null {
    const nom = typeof body?.nom === 'string' ? body.nom.trim() : '';
    if (!nom) return 'Le nom du shift est requis';
    if (nom.length > 100) return 'Le nom du shift ne doit pas dépasser 100 caractères';
    if (!body?.heureDebut || !HEURE_REGEX.test(String(body.heureDebut))) return "L'heure de début est requise (format HH:MM)";
    if (!body?.heureFin || !HEURE_REGEX.test(String(body.heureFin))) return "L'heure de fin est requise (format HH:MM)";
    const jours = body?.jours;
    if (!Array.isArray(jours) || jours.length === 0) return 'Sélectionnez au moins un jour';
    const invalides = jours.filter((j: any) => !(JOURS_SHIFT_VALIDES as readonly string[]).includes(j));
    if (invalides.length > 0) return `Jour(s) invalide(s) : ${invalides.join(', ')}`;
    if (body?.actif !== undefined && typeof body.actif !== 'boolean') return 'Le statut actif doit être un booléen';
    return null;
}

function normaliserHeure(h: string): string {
    const v = String(h).trim();
    return v.length === 5 ? v + ':00' : v;
}

export default class ShiftController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const where: any = {};
            if (req.query.actif !== undefined) {
                where.actif = String(req.query.actif) === 'true';
            }
            const shifts = await Shift.findAll({ where, order: [['nom', 'ASC']] });
            return res.status(200).send(shifts);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const shift = await Shift.findByPk(req.params.id);
            if (!shift) return res.status(404).json({ success: false, message: 'Shift non trouvé' });
            return res.status(200).send(shift);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        const erreur = validerShift(req.body);
        if (erreur) return res.status(400).json({ success: false, message: erreur });
        try {
            const shift = await Shift.create({
                nom: String(req.body.nom).trim(),
                heureDebut: normaliserHeure(req.body.heureDebut),
                heureFin: normaliserHeure(req.body.heureFin),
                jours: [...new Set(req.body.jours as string[])],
                actif: req.body.actif ?? true,
            });
            return res.status(201).send(shift);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const shift = await Shift.findByPk(req.params.id);
            if (!shift) return res.status(404).json({ success: false, message: 'Shift non trouvé' });
            const fusion = {
                nom: req.body.nom ?? shift.nom,
                heureDebut: req.body.heureDebut ?? shift.heureDebut,
                heureFin: req.body.heureFin ?? shift.heureFin,
                jours: req.body.jours ?? shift.jours,
                actif: req.body.actif ?? shift.actif,
            };
            const erreur = validerShift(fusion);
            if (erreur) return res.status(400).json({ success: false, message: erreur });
            await shift.update({
                nom: String(fusion.nom).trim(),
                heureDebut: normaliserHeure(fusion.heureDebut),
                heureFin: normaliserHeure(fusion.heureFin),
                jours: [...new Set(fusion.jours as string[])],
                actif: fusion.actif,
            });
            return res.status(200).send(shift);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async remove(req: Request, res: Response): Promise<Response> {
        try {
            const shift = await Shift.findByPk(req.params.id);
            if (!shift) return res.status(404).json({ success: false, message: 'Shift non trouvé' });
            await shift.destroy();
            return res.status(200).json({ success: true, message: 'Shift supprimé' });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
