import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { MatierePrerequis } from "../models/MatierePrerequis";

export default class MatierePrerequisController {

    constructor() { }

    static async getAllMatieresPrerequis(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<MatierePrerequis>> = {}
        
        try {
            let matieresPrerequis: MatierePrerequis[];
            matieresPrerequis = await MatierePrerequis.findAll(options);

            return res.status(200).send(matieresPrerequis);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getMatierePrerequis(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<MatierePrerequis>> = {}
        options = { where: {id: req.params.id} }

        try {
            const matierePrerequis: MatierePrerequis | null = await MatierePrerequis.findOne(options);

            if (matierePrerequis == null)
                return res.status(404).json({ success: false, message: "Matière non trouvée" });

            return res.status(200).send(matierePrerequis);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createMatierePrerequis(req: Request, res: Response): Promise<Response | null> {

        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        
        let matierePrerequis: MatierePrerequis | null = await MatierePrerequis.findOne({where: {libelle: req.body.libelle}});
        
        if(matierePrerequis != null) {
            return res.status(400).json({ success: false, message: "Matière déjà existante" });
        }
        else {
            matierePrerequis = new MatierePrerequis();
            matierePrerequis.libelle = req.body.libelle

            await matierePrerequis.save()
                .then((matierePrerequis) => {
                    return res.status(201).send(matierePrerequis);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateMatierePrerequis(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<MatierePrerequis>> = {}
        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        else if((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: {id: req.params.id} }
        }

        let matierePrerequis: MatierePrerequis | null = await MatierePrerequis.findOne(options);
        if(matierePrerequis != null) {
            if(req.body.libelle) {
                if(await MatierePrerequis.findOne({where: {libelle: req.body.libelle}})) {
                    return res.status(400).json({ success: false, message: "Matière déjà existante" });
                }
            }
            
            await matierePrerequis.update({
                libelle: req.body.name,
            })
                .then(async (matierePrerequis) => {
                    return res.status(200).send(matierePrerequis);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Matière non trouvée" });
        }

        return null
    }

    static async deleteMatierePrerequis(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<MatierePrerequis>> = {}
        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        else if((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: {id: req.params.id} }
        }

        let matierePrerequis: MatierePrerequis | null = await MatierePrerequis.findOne({where: {id: req.params.id}});
        if (matierePrerequis) {
            await matierePrerequis.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Matière supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Matière non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<MatierePrerequis>> = {}

        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }

        await MatierePrerequis.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}