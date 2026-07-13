import { Request, Response } from "express";
import { ComiteOrientation } from "../models/ComiteOrientation";

export default class ComiteOrientationController {

    constructor() { }

    static async getProfile(req: Request, res: Response): Promise<Response> {
        try {
            const membre = await ComiteOrientation.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                include: [ComiteOrientation.associations.utilisateur]
            })

            if (!membre) {
                return res.status(404).json({ success: false, message: "Membre du comité non trouvé" })
            }

            return res.status(200).send(membre)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async updateProfile(req: Request, res: Response): Promise<Response | null> {
        try {
            let membre = await ComiteOrientation.findOne({
                where: { utilisateurId: (req as any).utilisateurId }
            })

            if (membre) {
                await membre.update({ fonction: req.body.fonction })
            } else {
                membre = await ComiteOrientation.create({
                    utilisateurId: (req as any).utilisateurId,
                    fonction: req.body.fonction
                })
            }

            return res.status(200).send(membre)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }
}
