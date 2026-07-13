import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Article } from "../models/Article";

export default class ArticleController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Article>> = { include: [Article.associations.categorie, Article.associations.site] }

        try {
            let items: Article[];
            items = await Article.findAll(options);

            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Article>> = { where: { id: req.params.id }, include: [Article.associations.categorie, Article.associations.site] }

        try {
            const item: Article | null = await Article.findOne(options);

            if (item == null)
                return res.status(404).json({ success: false, message: "Article non trouvé" });

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
            const item = await Article.create({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }

        let item: Article | null = await Article.findOne({ where: { id: req.params.id } });
        if (item != null) {
            try {
                await item.update({ ...req.body });
                return res.status(200).send(item);
            } catch (error: any) {
                if (error.name === 'SequelizeUniqueConstraintError') {
                    return res.status(400).json({ success: false, alreadyExists: true });
                }
                return res.status(500).json({ success: false, error: error });
            }
        } else {
            return res.status(404).json({ success: false, message: "Article non trouvé" });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }

        let item: Article | null = await Article.findOne({ where: { id: req.params.id } });
        if (item) {
            await item.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Article supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Article non trouvé" });
        }

        return null
    }
}
