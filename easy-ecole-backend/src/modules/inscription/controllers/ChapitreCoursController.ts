import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ChapitreCours } from "../models/ChapitreCours";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { Ressource } from "../models/Ressource";

export default class ChapitreCoursController {

    constructor() { }

    static async getAllChapitresCours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ChapitreCours>> = {
            include: [ChapitreCours.associations.cours]
        }

        try {
            let chapitreCours: ChapitreCours[];
            chapitreCours = await ChapitreCours.findAll(options);

            return res.status(200).send(chapitreCours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getChapitreCours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ChapitreCours>> = {}
        options = {
            where: { id: req.params.id },
            include: [
                { association: ChapitreCours.associations.cours, include: [Cours.associations.classe,
                    {association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude]}] },
                { association: ChapitreCours.associations.ressources, include: [Ressource.associations.fichiersRessource] }
            ]
        }

        try {
            const chapitreCours: ChapitreCours | null = await ChapitreCours.findOne(options);

            if (chapitreCours == null)
                return res.status(404).json({ success: false, message: "ChapitreCours non trouvé" });

            return res.status(200).send(chapitreCours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createChapitreCours(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let chapitreCours: ChapitreCours | null = await ChapitreCours.findOne({ where: { titre: req.body.titre } });

        if (chapitreCours != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let chapitreCours: ChapitreCours = new ChapitreCours();
            chapitreCours.titre = req.body.titre
            chapitreCours.description = req.body.description
            chapitreCours.coursId = req.body.coursId

            let files: any = req.files
            if (files && files['image']) {
                let image: Express.Multer.File | undefined = (files['image'])[0] as Express.Multer.File | undefined

                if (image) {
                    chapitreCours.image = image.filename
                }
            }

            await chapitreCours.save()
                .then((chapitreCours) => {
                    return res.status(201).send(chapitreCours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateChapitreCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ChapitreCours>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let chapitreCours: ChapitreCours | null = await ChapitreCours.findOne(options);
        if (chapitreCours != null) {

            let verificationChapitreCours: ChapitreCours | null = await ChapitreCours.findOne({ where: { titre: req.body.titre } })
            if (verificationChapitreCours != null && verificationChapitreCours.titre != req.body.titre) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {
                let files: any = req.files
                if (files && files['image']) {
                    let image: Express.Multer.File | undefined = (files['image'])[0] as Express.Multer.File | undefined

                    if (image) {
                        chapitreCours.image = image.filename
                    }
                }

                await chapitreCours.update({
                    titre: req.body.titre,
                    description: req.body.description,
                    coursId: req.body.coursId,
                })
                    .then(async (chapitreCours) => {
                        return res.status(200).send(chapitreCours);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "ChapitreCours non trouvé" });
        }

        return null
    }

    static async deleteChapitreCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ChapitreCours>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let chapitreCours: ChapitreCours | null = await ChapitreCours.findOne({ where: { id: req.params.id } });
        if (chapitreCours) {
            await chapitreCours.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "ChapitreCours supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "ChapitreCours non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<ChapitreCours>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await ChapitreCours.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}