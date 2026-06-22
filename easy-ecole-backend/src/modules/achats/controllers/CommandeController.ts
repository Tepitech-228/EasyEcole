import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { Commande } from "../models/Commande";
import { LigneCommande } from "../models/LigneCommande";
import { Demande } from "../models/Demande";

export default class CommandeController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Commande.findAll({
                include: [Commande.associations.demande, Commande.associations.fournisseur, Commande.associations.lignesCommande]
            });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Commande.findOne({
                where: { id: req.params.id },
                include: [Commande.associations.demande, Commande.associations.fournisseur, Commande.associations.lignesCommande, Commande.associations.receptions, Commande.associations.facturesProforma]
            });

            if (item == null)
                return res.status(404).json({ success: false, message: "Commande non trouvée" });

            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        try {
            const demande = await Demande.findByPk(req.body.demandeId);
            if (!demande)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            if (demande.statut !== 'validee')
                return res.status(400).json({ success: false, message: "La demande doit être validée" });

            const item = await Commande.create({
                demandeId: req.body.demandeId,
                fournisseurId: req.body.fournisseurId
            });

            if (req.body.lignesCommande) {
                const lignes = req.body.lignesCommande as any[];
                for (const ligne of lignes) {
                    await LigneCommande.create({
                        ...ligne,
                        commandeId: item.id,
                        total: ligne.quantite * ligne.prixUnitaire
                    });
                }
            }

            await demande.update({ statut: 'commandee' });

            const created = await Commande.findByPk(item.id, {
                include: [Commande.associations.demande, Commande.associations.fournisseur, Commande.associations.lignesCommande]
            });

            return res.status(201).send(created);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Commande.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Commande non trouvée" });

            await item.update({ ...req.body });

            if (req.body.lignesCommande) {
                await LigneCommande.destroy({ where: { commandeId: item.id } });
                const lignes = req.body.lignesCommande as any[];
                for (const ligne of lignes) {
                    await LigneCommande.create({
                        ...ligne,
                        commandeId: item.id,
                        total: ligne.quantite * ligne.prixUnitaire
                    });
                }
            }

            const updated = await Commande.findByPk(item.id, {
                include: [Commande.associations.fournisseur, Commande.associations.lignesCommande]
            });

            return res.status(200).send(updated);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Commande.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Commande non trouvée" });

            await LigneCommande.destroy({ where: { commandeId: item.id } });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Commande supprimée" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
