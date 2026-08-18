import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Dispense } from "../models/Dispense";

export default class DispenseController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Dispense>> = {
            include: [
                Dispense.associations.cursusApprenant,
                Dispense.associations.cours,
                Dispense.associations.valideParUtilisateur
            ]
        }
        try {
            let data = await Dispense.findAll(options);
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Dispense.findByPk(req.params.id, {
                include: [
                    Dispense.associations.cursusApprenant,
                    Dispense.associations.cours,
                    Dispense.associations.valideParUtilisateur
                ]
            });
            if (!data) return res.status(404).json({ success: false, message: "Dispense non trouvée" });
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
            const data = await Dispense.create(req.body);
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
            const data = await Dispense.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Dispense non trouvée" });
            await data.update(req.body);
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
            const data = await Dispense.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Dispense non trouvée" });
            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
