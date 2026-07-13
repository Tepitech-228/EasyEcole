import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Actualite } from "../models/Actualite";

export default class ActualiteController {

    constructor() { }

    static async getAllActualites(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Actualite>> = {}

        try {
            let actualites: Actualite[];
            actualites = await Actualite.findAll(options);

            return res.status(200).send(actualites);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getActualite(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Actualite>> = {}
        options = { where: { id: req.params.id } }

        try {
            const actualite: Actualite | null = await Actualite.findOne(options);

            if (actualite == null)
                return res.status(404).json({ success: false, message: "Actualité non trouvée" });

            return res.status(200).send(actualite);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createActualite(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let actualite: Actualite = new Actualite();
        actualite.titre = req.body.titre
        actualite.contenu = req.body.contenu
        actualite.categorie = req.body.categorie

        if (req.file) {
            actualite.image = req.file.filename
        }

        await actualite.save()
            .then(async (actualite) => {
                return res.status(201).send(actualite);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateActualite(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let actualite: Actualite | null = await Actualite.findOne({ where: { id: req.params.id } });
        if (actualite != null) {
            let updateData: any = {
                titre: req.body.titre,
                contenu: req.body.contenu,
                categorie: req.body.categorie
            }
            if (req.file) {
                updateData.image = req.file.filename
            }

            await actualite.update(updateData)
                .then(async (actualite) => {
                    return res.status(200).send(actualite);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Actualité non trouvée" });
        }

        return null
    }

    static async deleteActualite(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let actualite: Actualite | null = await Actualite.findOne({ where: { id: req.params.id } });
        if (actualite) {
            await actualite.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Actualité supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Actualité non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Actualite.count()
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
