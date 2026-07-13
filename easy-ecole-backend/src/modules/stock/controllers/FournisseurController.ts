import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Fournisseur } from "../models/Fournisseur";

export default class FournisseurController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Fournisseur>> = {}

        try {
            let items: Fournisseur[];
            items = await Fournisseur.findAll(options);

            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Fournisseur>> = { where: { id: req.params.id } }

        try {
            const item: Fournisseur | null = await Fournisseur.findOne(options);

            if (item == null)
                return res.status(404).json({ success: false, message: "Fournisseur non trouvé" });

            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }

        try {
            const item = await Fournisseur.create({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }

        let item: Fournisseur | null = await Fournisseur.findOne({ where: { id: req.params.id } });
        if (item != null) {
            try {
                await item.update({ ...req.body });
                return res.status(200).send(item);
            } catch (error: any) {
                return res.status(500).json({ success: false, error: error });
            }
        } else {
            return res.status(404).json({ success: false, message: "Fournisseur non trouvé" });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }

        let item: Fournisseur | null = await Fournisseur.findOne({ where: { id: req.params.id } });
        if (item) {
            await item.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Fournisseur supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Fournisseur non trouvé" });
        }

        return null
    }
}
