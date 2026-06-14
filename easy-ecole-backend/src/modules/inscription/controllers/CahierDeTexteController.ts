import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { CahierDeTexte } from "../models/CahierDeTexte";

export default class CahierDeTexteController {

    constructor() { }

    static async getAllCahiersDeTexte(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<CahierDeTexte>> = {
            include: [
                {
                    association: CahierDeTexte.associations.cours, include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ]
                },
                { association: CahierDeTexte.associations.enseignant, include: [Enseignant.associations.utilisateur] },
            ]
        }

        try {
            let cahiersDeTexte: CahierDeTexte[];
            cahiersDeTexte = await CahierDeTexte.findAll(options);

            return res.status(200).send(cahiersDeTexte);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCahierDeTexte(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<CahierDeTexte>> = {}
        options = {
            where: { id: req.params.id }, include: [
                {
                    association: CahierDeTexte.associations.cours,
                    include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ]
                },
                { association: CahierDeTexte.associations.blocsCahierDeTexte }
            ]
        }

        try {
            const cahierDeTexte: CahierDeTexte | null = await CahierDeTexte.findOne(options);

            if (cahierDeTexte == null)
                return res.status(404).json({ success: false, message: "CahierDeTexte non trouvé" });

            return res.status(200).send(cahierDeTexte);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createCahierDeTexte(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let cahierDeTexte: CahierDeTexte | null = await CahierDeTexte.findOne({ where: { titre: req.body.titre } });

        if (cahierDeTexte != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let cahierDeTexte: CahierDeTexte = new CahierDeTexte();
            cahierDeTexte.titre = req.body.titre
            cahierDeTexte.description = req.body.description
            cahierDeTexte.coursId = req.body.coursId
            cahierDeTexte.enseignantId = req.body.enseignantId

            await cahierDeTexte.save()
                .then((cahierDeTexte) => {
                    return res.status(201).send(cahierDeTexte);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateCahierDeTexte(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<CahierDeTexte>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let cahierDeTexte: CahierDeTexte | null = await CahierDeTexte.findOne(options);
        if (cahierDeTexte != null) {
            if (cahierDeTexte.titre != req.body.titre && await CahierDeTexte.findOne({ where: { titre: req.body.titre } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {
                await cahierDeTexte.update({
                    titre: req.body.titre,
                    description: req.body.description,
                    coursId: req.body.coursId,
                    enseignantId: req.body.enseignantId,
                })
                    .then(async (cahierDeTexte) => {
                        return res.status(200).send(cahierDeTexte);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "CahierDeTexte non trouvé" });
        }

        return null
    }

    static async deleteCahierDeTexte(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<CahierDeTexte>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let cahierDeTexte: CahierDeTexte | null = await CahierDeTexte.findOne({ where: { id: req.params.id } });
        if (cahierDeTexte) {
            await cahierDeTexte.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "CahierDeTexte supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "CahierDeTexte non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<CahierDeTexte>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await CahierDeTexte.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}