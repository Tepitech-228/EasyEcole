import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../models/Utilisateur";

export default class UtilisateurController {

    constructor() { }

    static async getAllUtilisateurs(req: Request, res: Response): Promise<Response> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let options: FindOptions<InferAttributes<Utilisateur>> = { attributes: ['nom', 'prenoms', 'identifiant', 'email', 'contact', 'photoDeProfil'] }

        try {
            let utilisateurs: Utilisateur[];
            utilisateurs = await Utilisateur.findAll(options);

            return res.status(200).send(utilisateurs);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getUtilisateur(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Utilisateur>> = {}
        options = { 
            where: { id: (req as any).utilisateurId },
            attributes: ['nom', 'prenoms', 'identifiant', 'email', 'contact', 'photoDeProfil'],
            include: [Utilisateur.associations.apprenant, Utilisateur.associations.institution, Utilisateur.associations.caissierBanque]
        }

        try {
            const utilisateur: Utilisateur | null = await Utilisateur.findOne(options);

            if (utilisateur == null)
                return res.status(404).json({ success: false, message: "Utilisateur non trouve" });

            return res.status(200).send(utilisateur);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async updateUtilisateur(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let options: FindOptions<InferAttributes<Utilisateur>> = { where: { id: (req as any).utilisateurId } }

        let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
        if (utilisateur != null) {
            let nomPrenomsAlreadyUsed: boolean = false
            if (utilisateur.nom != req.body.nom || utilisateur.prenoms != req.body.prenoms) {
                nomPrenomsAlreadyUsed = await Utilisateur.findOne({ where: { [Op.and]: [{ nom: req.body.nom }, { prenoms: req.body.prenoms }] } }) != null
            }

            if (nomPrenomsAlreadyUsed) {
                return res.status(400).json({ nomPrenomsAlreadyUsed: nomPrenomsAlreadyUsed });
            }

            await utilisateur.update({
                nom: req.body.nom,
                prenoms: req.body.prenoms,
                contact: req.body.contact,
            },)
                .then(async (utilisateur) => {
                    return res.status(200).json({ success: false });
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });

            return null
        }
        else {
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }
    }

    static async deleteUtilisateur(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Utilisateur>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let utilisateur: Utilisateur | null = await Utilisateur.findOne({ where: { id: req.params.id } });
        if (utilisateur) {
            await utilisateur.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Utilisateur supprime" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Utilisateur non trouve" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Utilisateur>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Utilisateur.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}