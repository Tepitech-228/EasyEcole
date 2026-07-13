import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Categorie } from "../models/Categorie";

export default class CategorieController {

    constructor() { }

    static async getAllCategories(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Categorie>> = {}
        
        try {
            let categories: Categorie[];
            categories = await Categorie.findAll();

            return res.status(200).send(categories);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCategorie(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Categorie>> = {}
        options = { where: {id: req.params.id} }

        try {
            const categorie: Categorie | null = await Categorie.findOne(options);

            if (categorie == null)
                return res.status(404).json({ success: false, message: "Catégorie non trouvée" });

            return res.status(200).send(categorie);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createCategorie(req: Request, res: Response): Promise<Response | null> {

        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        
        let categorie: Categorie | null = await Categorie.findOne({where: {libelle: req.body.libelle}});
        
        if(categorie != null) {
            return res.status(400).json({ success: false, message: "Catégorie déjà existant" });
        }
        else {
            categorie = new Categorie();
            categorie.libelle = req.body.libelle
            categorie.description = req.body.description

            await categorie.save()
                .then((categorie) => {
                    return res.status(201).send(categorie);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateCategorie(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Categorie>> = {}
        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        else if((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: {id: req.params.id} }
        }

        let categorie: Categorie | null = await Categorie.findOne(options);
        if(categorie != null) {
            if(req.body.libelle) {
                if(await Categorie.findOne({where: {libelle: req.body.libelle}})) {
                    return res.status(400).json({ success: false, message: "Catégorie déjà existante" });
                }
            }
            
            await categorie.update({
                libelle: req.body.name,
                description: req.body.description,
            })
                .then(async (categorie) => {
                    return res.status(200).send(categorie);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Catégorie non trouvée" });
        }

        return null
    }

    static async deleteCategorie(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Categorie>> = {}
        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        else if((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: {id: req.params.id} }
        }

        let categorie: Categorie | null = await Categorie.findOne({where: {id: req.params.id}});
        if (categorie) {
            await categorie.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Catégorie supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Catégorie non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Categorie>> = {}

        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }

        await Categorie.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}