import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { NiveauEtude } from "../models/NiveauEtude";

export default class NiveauEtudeController {

    constructor() { }

    static async getAllNiveauxEtude(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<NiveauEtude>> = {}
        
        try {
            let niveauxEtude: NiveauEtude[];
            niveauxEtude = await NiveauEtude.findAll(options);

            return res.status(200).send(niveauxEtude);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getNiveauEtude(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<NiveauEtude>> = {}
        options = { where: {id: req.params.id} }

        try {
            const niveauEtude: NiveauEtude | null = await NiveauEtude.findOne(options);

            if (niveauEtude == null)
                return res.status(404).json({ success: false, message: "Niveau d'étude non trouvé" });

            return res.status(200).send(niveauEtude);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createNiveauEtude(req: Request, res: Response): Promise<Response | null> {

        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        
        let niveauEtude: NiveauEtude | null = await NiveauEtude.findOne({where: {libelle: req.body.libelle}});
        
        if(niveauEtude != null) {
            return res.status(400).json({ success: false, message: "Niveau d'étude déjà existant" });
        }
        else {
            niveauEtude = new NiveauEtude();
            niveauEtude.libelle = req.body.libelle

            await niveauEtude.save()
                .then((niveauEtude) => {
                    return res.status(201).send(niveauEtude);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateNiveauEtude(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<NiveauEtude>> = {}
        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        else if((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: {id: req.params.id} }
        }

        let niveauEtude: NiveauEtude | null = await NiveauEtude.findOne(options);
        if(niveauEtude != null) {
            if(req.body.libelle) {
                if(await NiveauEtude.findOne({where: {libelle: req.body.libelle}})) {
                    return res.status(400).json({ success: false, message: "Niveau d'étude déjà existant" });
                }
            }
            
            await niveauEtude.update({
                libelle: req.body.name,
            })
                .then(async (niveauEtude) => {
                    return res.status(200).send(niveauEtude);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Niveau d'étude non trouvé" });
        }

        return null
    }

    static async deleteNiveauEtude(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<NiveauEtude>> = {}
        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }
        else if((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: {id: req.params.id} }
        }

        let niveauEtude: NiveauEtude | null = await NiveauEtude.findOne({where: {id: req.params.id}});
        if (niveauEtude) {
            await niveauEtude.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Niveau d'étude supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Niveau d'étude non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<NiveauEtude>> = {}

        if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({success: false})
        }

        await NiveauEtude.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}