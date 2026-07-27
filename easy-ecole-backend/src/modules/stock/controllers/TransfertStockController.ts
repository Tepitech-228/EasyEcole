import { Request, Response } from "express";
import { TransfertStock } from "../models/TransfertStock";
import { MouvementStock } from "../models/MouvementStock";

export default class TransfertStockController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try { return res.status(200).send(await TransfertStock.findAll()); }
        catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await TransfertStock.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Transfert non trouve" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const item = await TransfertStock.create(req.body);
            if (item.statut === 'valide') {
                await MouvementStock.create({
                    articleId: item.articleId,
                    type: 'sortie',
                    quantite: item.quantite,
                    motif: `Transfert vers ${item.destinationStockId}`,
                    siteId: item.sourceStockId,
                    dateMouvement: new Date(),
                    utilisateurId: (req as any).utilisateurId
                });
                await MouvementStock.create({
                    articleId: item.articleId,
                    type: 'entree',
                    quantite: item.quantite,
                    motif: `Transfert depuis ${item.sourceStockId}`,
                    siteId: item.destinationStockId,
                    dateMouvement: new Date(),
                    utilisateurId: (req as any).utilisateurId
                });
            }
            return res.status(201).send(item);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async annuler(req: Request, res: Response): Promise<Response> {
        try {
            const item = await TransfertStock.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Transfert non trouve" });
            await item.update({ statut: 'annule' });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }
}
