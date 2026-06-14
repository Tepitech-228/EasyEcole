import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { LigneBonCommande } from "../models/LigneBonCommande";

export default class LigneBonCommandeController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<LigneBonCommande>> = { include: [LigneBonCommande.associations.bonCommande, LigneBonCommande.associations.article] }

        try {
            let items: LigneBonCommande[];
            items = await LigneBonCommande.findAll(options);

            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<LigneBonCommande>> = { where: { id: req.params.id }, include: [LigneBonCommande.associations.bonCommande, LigneBonCommande.associations.article] }

        try {
            const item: LigneBonCommande | null = await LigneBonCommande.findOne(options);

            if (item == null)
                return res.status(404).json({ success: false, message: "Ligne de commande non trouvée" });

            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }

        try {
            const item = await LigneBonCommande.create({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }

        let item: LigneBonCommande | null = await LigneBonCommande.findOne({ where: { id: req.params.id } });
        if (item != null) {
            try {
                await item.update({ ...req.body });
                return res.status(200).send(item);
            } catch (error: any) {
                return res.status(500).json({ success: false, error: error });
            }
        } else {
            return res.status(404).json({ success: false, message: "Ligne de commande non trouvée" });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }

        let item: LigneBonCommande | null = await LigneBonCommande.findOne({ where: { id: req.params.id } });
        if (item) {
            await item.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Ligne de commande supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Ligne de commande non trouvée" });
        }

        return null
    }
}
