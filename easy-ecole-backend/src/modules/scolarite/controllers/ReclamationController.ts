import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Reclamation } from "../models/Reclamation";
import { ReponseReclamation } from "../models/ReponseReclamation";

export default class ReclamationController {

    constructor() { }

    static async getAllReclamations(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Reclamation>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { etudiantId: (req as any).utilisateurId } }
        }

        try {
            let reclamations: Reclamation[];
            reclamations = await Reclamation.findAll(options);

            return res.status(200).send(reclamations);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getReclamation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Reclamation>> = {
            where: { id: req.params.id },
            include: [{ model: ReponseReclamation, as: 'reponsesReclamation' }]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { ...options, where: { ...options.where, etudiantId: (req as any).utilisateurId } }
        }

        try {
            const reclamation: Reclamation | null = await Reclamation.findOne(options);

            if (reclamation == null)
                return res.status(404).json({ success: false, message: "Réclamation non trouvée" });

            return res.status(200).send(reclamation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createReclamation(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let reclamation: Reclamation = new Reclamation();
        reclamation.etudiantId = (req as any).utilisateurId
        reclamation.motif = req.body.motif
        reclamation.evaluationId = req.body.evaluationId

        await reclamation.save()
            .then(async (reclamation) => {
                return res.status(201).send(reclamation);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async repondreReclamation(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let reclamation: Reclamation | null = await Reclamation.findOne({ where: { id: req.body.reclamationId } });
        if (reclamation == null) {
            return res.status(404).json({ success: false, message: "Réclamation non trouvée" });
        }

        let reponse: ReponseReclamation = new ReponseReclamation();
        reponse.reponse = req.body.reponse
        reponse.reclamationId = req.body.reclamationId
        reponse.repondeurId = (req as any).utilisateurId

        await reponse.save()
            .then(async (reponse) => {
                await reclamation.update({ statut: 'traitee' })
                return res.status(201).send(reponse);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateReclamationStatut(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let reclamation: Reclamation | null = await Reclamation.findOne({ where: { id: req.params.id } });
        if (reclamation != null) {
            await reclamation.update({ statut: req.body.statut })
                .then(async (reclamation) => {
                    return res.status(200).send(reclamation);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Réclamation non trouvée" });
        }

        return null
    }

    static async deleteReclamation(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let reclamation: Reclamation | null = await Reclamation.findOne({ where: { id: req.params.id } });
        if (reclamation) {
            await reclamation.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Réclamation supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Réclamation non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Reclamation.count()
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
