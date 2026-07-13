import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { Budget } from "../models/Budget";
import { LigneBudget } from "../models/LigneBudget";
import { Engagement } from "../models/Engagement";
import { Demande } from "../models/Demande";

export default class BudgetController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Budget.findAll({
                include: [Budget.associations.departement, Budget.associations.lignesBudget, Budget.associations.engagements]
            });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Budget.findOne({
                where: { id: req.params.id },
                include: [Budget.associations.departement, Budget.associations.lignesBudget, Budget.associations.engagements]
            });

            if (item == null)
                return res.status(404).json({ success: false, message: "Budget non trouvé" });

            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Budget.create({ ...req.body });

            if (req.body.lignesBudget) {
                const lignes = req.body.lignesBudget as any[];
                for (const ligne of lignes) {
                    await LigneBudget.create({ ...ligne, budgetId: item.id });
                }
            }

            const created = await Budget.findByPk(item.id, {
                include: [Budget.associations.lignesBudget]
            });

            return res.status(201).send(created);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Budget.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Budget non trouvé" });

            await item.update({ ...req.body });

            if (req.body.lignesBudget) {
                await LigneBudget.destroy({ where: { budgetId: item.id } });
                const lignes = req.body.lignesBudget as any[];
                for (const ligne of lignes) {
                    await LigneBudget.create({ ...ligne, budgetId: item.id });
                }
            }

            const updated = await Budget.findByPk(item.id, {
                include: [Budget.associations.lignesBudget]
            });

            return res.status(200).send(updated);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Budget.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Budget non trouvé" });

            await LigneBudget.destroy({ where: { budgetId: item.id } });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Budget supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
