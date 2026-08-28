import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Creneau } from "../models/Creneau";

export default class CreneauController {

    constructor() { }

    private static baseIncludes() {
        return [
            { association: Creneau.associations.etablissement, required: false },
        ];
    }

    static async getAllCreneaux(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Creneau>> = {
            include: CreneauController.baseIncludes(),
            order: [['id', 'ASC']]
        };

        let where: any = {}
        if (req.query.regime) {
            where.regime = req.query.regime as string
        }
        if (req.query.statut) {
            where.statut = req.query.statut as string
        }
        if (req.query.etablissementId) {
            where.etablissementId = req.query.etablissementId as string
        }
        if (req.query.recherche) {
            const terme = (req.query.recherche as string).trim();
            if (terme !== '') {
                where[Op.or] = [
                    { code: { [Op.like]: `%${terme}%` } },
                    { libelle: { [Op.like]: `%${terme}%` } },
                ];
            }
        }
        if (Object.keys(where).length > 0) {
            options = { ...options, where };
        }

        try {
            const creneaux: Creneau[] = await Creneau.findAll(options);
            return res.status(200).send(creneaux);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getCreneau(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Creneau>> = {
            where: { id: req.params.id },
            include: CreneauController.baseIncludes()
        };

        try {
            const creneau: Creneau | null = await Creneau.findOne(options);
            if (creneau == null)
                return res.status(404).json({ success: false, message: "Créneau non trouvé" });
            return res.status(200).send(creneau);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createCreneau(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        const code = (req.body.code ?? '').trim();
        if (!req.body.code || !req.body.libelle || !req.body.heureDebut || !req.body.heureFin) {
            return res.status(400).json({ success: false, message: "code, libelle, heureDebut et heureFin requis" });
        }
        if (req.body.heureFin <= req.body.heureDebut) {
            return res.status(400).json({ success: false, message: "heureFin doit être supérieure à heureDebut" });
        }
        if (!['JOUR', 'SOIR', 'JOUR_ET_SOIR'].includes(req.body.regime)) {
            return res.status(400).json({ success: false, message: "regime invalide (JOUR, SOIR ou JOUR_ET_SOIR)" });
        }

        const existant: Creneau | null = await Creneau.findOne({
            where: { code, etablissementId: req.body.etablissementId ?? null }
        });
        if (existant != null) {
            return res.status(400).json({ success: false, alreadyExists: true, message: "Code déjà utilisé" });
        }

        let creneau: Creneau = new Creneau();
        creneau.code = code;
        creneau.libelle = req.body.libelle;
        creneau.heureDebut = req.body.heureDebut;
        creneau.heureFin = req.body.heureFin;
        creneau.regime = req.body.regime;
        creneau.statut = req.body.statut ?? 'ACTIF';
        creneau.etablissementId = req.body.etablissementId ?? null;

        try {
            await creneau.save();
            return res.status(201).send(creneau);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(400).json({ success: false, error });
        }
    }

    static async updateCreneau(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        let creneau: Creneau | null = await Creneau.findOne({ where: { id: req.params.id } });
        if (creneau == null) {
            return res.status(404).json({ success: false, message: "Créneau non trouvé" });
        }

        const code = (req.body.code ?? creneau.code).trim();
        const heureDebut = req.body.heureDebut ?? creneau.heureDebut;
        const heureFin = req.body.heureFin ?? creneau.heureFin;
        if (heureFin <= heureDebut) {
            return res.status(400).json({ success: false, message: "heureFin doit être supérieure à heureDebut" });
        }
        if (!['JOUR', 'SOIR', 'JOUR_ET_SOIR'].includes(req.body.regime ?? creneau.regime)) {
            return res.status(400).json({ success: false, message: "regime invalide (JOUR, SOIR ou JOUR_ET_SOIR)" });
        }
        const doublon = await Creneau.findOne({
            where: { code, etablissementId: req.body.etablissementId ?? creneau.etablissementId, id: { [Op.ne]: creneau.id } }
        });
        if (doublon) {
            return res.status(400).json({ success: false, alreadyExists: true, message: "Code déjà utilisé" });
        }

        try {
            await creneau.update({
                code,
                libelle: req.body.libelle ?? creneau.libelle,
                heureDebut,
                heureFin,
                regime: req.body.regime ?? creneau.regime,
                statut: req.body.statut ?? creneau.statut,
                etablissementId: req.body.etablissementId ?? creneau.etablissementId,
            });
            return res.status(200).send(creneau);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(400).json({ success: false, error });
        }
    }

    static async deleteCreneau(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        let creneau: Creneau | null = await Creneau.findOne({ where: { id: req.params.id } });
        if (creneau) {
            try {
                await creneau.destroy();
                return res.status(200).json({ success: true, message: "Créneau supprimé" });
            } catch (error) {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            }
        } else {
            return res.status(404).json({ success: false, message: "Créneau non trouvé" });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Creneau>> = {}
        try {
            const value = await Creneau.count(options);
            return res.status(200).json({ success: true, count: value });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
