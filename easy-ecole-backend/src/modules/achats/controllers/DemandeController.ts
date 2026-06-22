import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { Demande } from "../models/Demande";
import { LigneDemande } from "../models/LigneDemande";

export default class DemandeController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Demande>> = {
            include: [Demande.associations.soumisPar, Demande.associations.lignesDemande, Demande.associations.validations]
        }

        try {
            let items = await Demande.findAll(options);
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Demande.findOne({
                where: { id: req.params.id },
                include: [Demande.associations.soumisPar, Demande.associations.lignesDemande, Demande.associations.validations, Demande.associations.commandes]
            });

            if (item == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Demande.create({
                ...req.body,
                soumisParId: (req as any).utilisateurId,
                dateSoumission: req.body.statut === 'soumise' ? new Date() : null
            });

            if (req.body.lignesDemande) {
                const lignes = req.body.lignesDemande as any[];
                for (const ligne of lignes) {
                    await LigneDemande.create({ ...ligne, demandeId: item.id });
                }
            }

            const created = await Demande.findByPk(item.id, {
                include: [Demande.associations.soumisPar, Demande.associations.lignesDemande]
            });

            return res.status(201).send(created);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Demande.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            const updateData: any = { ...req.body };
            if (req.body.statut === 'soumise' && item.statut === 'brouillon') {
                updateData.dateSoumission = new Date();
            }

            await item.update(updateData);

            if (req.body.lignesDemande) {
                await LigneDemande.destroy({ where: { demandeId: item.id } });
                const lignes = req.body.lignesDemande as any[];
                for (const ligne of lignes) {
                    await LigneDemande.create({ ...ligne, demandeId: item.id });
                }
            }

            const updated = await Demande.findByPk(item.id, {
                include: [Demande.associations.soumisPar, Demande.associations.lignesDemande]
            });

            return res.status(200).send(updated);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Demande.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            await LigneDemande.destroy({ where: { demandeId: item.id } });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Demande supprimée" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getMesDemandes(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Demande.findAll({
                where: { soumisParId: (req as any).utilisateurId },
                include: [Demande.associations.lignesDemande, Demande.associations.validations]
            });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
