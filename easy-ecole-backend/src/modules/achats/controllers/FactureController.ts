import { Request, Response } from "express";
import { FactureProforma } from "../models/FactureProforma";
import { LigneFacture } from "../models/LigneFacture";
import { Commande } from "../models/Commande";
import { LigneCommande } from "../models/LigneCommande";

export default class FactureController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await FactureProforma.findAll({
                include: [FactureProforma.associations.commande, FactureProforma.associations.lignesFacture]
            });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await FactureProforma.findOne({
                where: { id: req.params.id },
                include: [
                    FactureProforma.associations.commande,
                    { association: FactureProforma.associations.lignesFacture, include: [LigneFacture.associations.ligneCommande] }
                ]
            });

            if (item == null)
                return res.status(404).json({ success: false, message: "Facture non trouvée" });

            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        try {
            const commande = await Commande.findByPk(req.body.commandeId);
            if (!commande)
                return res.status(404).json({ success: false, message: "Commande non trouvée" });

            const item = await FactureProforma.create({
                commandeId: req.body.commandeId,
                montantTotal: req.body.montantTotal || 0,
                statut: 'emise'
            });

            if (req.body.lignesFacture) {
                const lignes = req.body.lignesFacture as any[];
                for (const ligne of lignes) {
                    await LigneFacture.create({
                        ...ligne,
                        factureId: item.id,
                        total: ligne.quantite * ligne.prixUnitaire
                    });
                }
            }

            const created = await FactureProforma.findByPk(item.id, {
                include: [FactureProforma.associations.commande, FactureProforma.associations.lignesFacture]
            });

            return res.status(201).send(created);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await FactureProforma.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Facture non trouvée" });

            await item.update({ ...req.body });

            if (req.body.lignesFacture) {
                await LigneFacture.destroy({ where: { factureId: item.id } });
                const lignes = req.body.lignesFacture as any[];
                for (const ligne of lignes) {
                    await LigneFacture.create({
                        ...ligne,
                        factureId: item.id,
                        total: ligne.quantite * ligne.prixUnitaire
                    });
                }
            }

            const updated = await FactureProforma.findByPk(item.id, {
                include: [FactureProforma.associations.lignesFacture]
            });

            return res.status(200).send(updated);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await FactureProforma.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Facture non trouvée" });

            await LigneFacture.destroy({ where: { factureId: item.id } });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Facture supprimée" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
