import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DeboucheParcours } from "../models/DeboucheParcours";

export default class DeboucheParcoursController {

    constructor() { }

    static async getAllDebouchesParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DeboucheParcours>> = {}

        try {
            let debouchesParcours: DeboucheParcours[];
            debouchesParcours = await DeboucheParcours.findAll();

            return res.status(200).send(debouchesParcours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDeboucheParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DeboucheParcours>> = {}
        options = { where: { id: req.params.id } }

        try {
            const deboucheParcours: DeboucheParcours | null = await DeboucheParcours.findOne(options);

            if (deboucheParcours == null)
                return res.status(404).json({ success: false, message: "Débouché non trouvé" });

            return res.status(200).send(deboucheParcours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createDeboucheParcours(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let deboucheParcours: DeboucheParcours = new DeboucheParcours();
        deboucheParcours.titre = req.body.titre
        deboucheParcours.description = req.body.description
        deboucheParcours.video = req.file ? req.file.filename : req.body.video
        deboucheParcours.parcoursId = req.body.parcoursId

        await deboucheParcours.save()
            .then((deboucheParcours) => {
                return res.status(201).send(deboucheParcours);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateDeboucheParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DeboucheParcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let deboucheParcours: DeboucheParcours | null = await DeboucheParcours.findOne(options);
        if (deboucheParcours != null) {
            await deboucheParcours.update({
                titre: req.body.name,
                description: req.body.description,
                video: req.body.video
            })
                .then(async (deboucheParcours) => {
                    return res.status(200).send(deboucheParcours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Débouché non trouvé" });
        }

        return null
    }

    static async deleteDeboucheParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DeboucheParcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let deboucheParcours: DeboucheParcours | null = await DeboucheParcours.findOne({ where: { id: req.params.id } });
        if (deboucheParcours) {
            await deboucheParcours.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Débouché supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Débouché non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<DeboucheParcours>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DeboucheParcours.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}