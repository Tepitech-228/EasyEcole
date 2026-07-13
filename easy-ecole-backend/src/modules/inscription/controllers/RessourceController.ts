import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Ressource } from "../models/Ressource";

export default class RessourceController {

    constructor() { }

    static async getAllRessources(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Ressource>> = {
            include: [Ressource.associations.chapitreCours, Ressource.associations.fichiersRessource]
        }

        try {
            let ressource: Ressource[];
            ressource = await Ressource.findAll(options);

            return res.status(200).send(ressource);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getRessource(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Ressource>> = {}
        options = { where: { id: req.params.id }, include: [Ressource.associations.chapitreCours, Ressource.associations.fichiersRessource] }

        try {
            const ressource: Ressource | null = await Ressource.findOne(options);

            if (ressource == null)
                return res.status(404).json({ success: false, message: "Ressource non trouvée" });

            return res.status(200).send(ressource);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createRessource(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let ressource: Ressource | null = await Ressource.findOne({ where: { titre: req.body.titre } });

        if (ressource != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let ressource: Ressource = new Ressource();
            ressource.titre = req.body.titre
            ressource.description = req.body.description
            ressource.type = req.body.type
            ressource.dateDebut = req.body.dateDebut
            ressource.dateFin = req.body.dateFin
            ressource.active = req.body.active ?? false
            ressource.chapitreCoursId = req.body.chapitreCoursId

            await ressource.save()
                .then((ressource) => {
                    return res.status(201).send(ressource);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateRessource(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Ressource>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let ressource: Ressource | null = await Ressource.findOne(options);
        if (ressource != null) {

            let verificationRessource: Ressource | null = await Ressource.findOne({ where: { titre: req.body.titre } })
            if (verificationRessource != null && verificationRessource.titre != req.body.titre) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {

                await ressource.update({
                    titre: req.body.titre,
                    description: req.body.description,
                    type: req.body.type,
                    dateDebut: req.body.dateDebut,
                    dateFin: req.body.dateFin,
                    active: req.body.active,
                    chapitreCoursId: req.body.chapitreCoursId,
                })
                    .then(async (ressource) => {
                        return res.status(200).send(ressource);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Ressource non trouvée" });
        }

        return null
    }

    static async deleteRessource(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Ressource>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let ressource: Ressource | null = await Ressource.findOne({ where: { id: req.params.id } });
        if (ressource) {
            await ressource.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Ressource supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Ressource non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Ressource>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await Ressource.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}