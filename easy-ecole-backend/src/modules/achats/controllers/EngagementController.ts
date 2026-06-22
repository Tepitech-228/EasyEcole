import { Request, Response } from "express";
import { Engagement } from "../models/Engagement";
import { Budget } from "../models/Budget";

export default class EngagementController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Engagement.findAll({
                include: [Engagement.associations.budget, Engagement.associations.demande]
            });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        try {
            const budget = await Budget.findByPk(req.body.budgetId);
            if (!budget)
                return res.status(404).json({ success: false, message: "Budget non trouvé" });

            const nouveauSolde = Number(budget.montantUtilise) + Number(req.body.montant);
            if (nouveauSolde > Number(budget.montantAlloue))
                return res.status(400).json({ success: false, message: "Budget insuffisant" });

            const item = await Engagement.create({ ...req.body, date: new Date(), statut: 'actif' });
            await budget.update({ montantUtilise: nouveauSolde });

            const created = await Engagement.findByPk(item.id, {
                include: [Engagement.associations.budget, Engagement.associations.demande]
            });

            return res.status(201).send(created);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async liberer(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Engagement.findByPk(req.params.id);
            if (!item)
                return res.status(404).json({ success: false, message: "Engagement non trouvé" });

            if (item.statut !== 'actif')
                return res.status(400).json({ success: false, message: "Engagement déjà libéré" });

            const budget = await Budget.findByPk(item.budgetId);
            if (budget) {
                const nouveauSolde = Number(budget.montantUtilise) - Number(item.montant);
                await budget.update({ montantUtilise: Math.max(0, nouveauSolde) });
            }

            await item.update({ statut: 'liberee' });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
