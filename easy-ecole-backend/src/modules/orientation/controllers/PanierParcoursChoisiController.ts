import { Request, Response } from "express";
import { CountOptions, DestroyOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PanierParcoursChoisi } from "../models/PanierParcoursChoisi";
import { Parcours } from "../models/Parcours";
import { ParcoursChoisi } from "../models/ParcoursChoisi";

export default class PanierParcoursChoisiController {

    constructor() { }

    static async getAllPanierParcoursChoisi(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<any>> = {}
        options = { where: { [Op.and]: [{ utilisateurId: (req as any).utilisateurId }, { parcoursChoisiId: { [Op.not]: null } }] }, include: [{ model: ParcoursChoisi, as: 'parcoursChoisi', include: [{ model: Parcours, as: 'parcours', include: [Parcours.associations.categorie, Parcours.associations.niveauEtude] }] }] }

        try {
            let panierParcoursChoisi: PanierParcoursChoisi[];
            panierParcoursChoisi = await PanierParcoursChoisi.findAll(options);

            return res.status(200).send(panierParcoursChoisi);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getPanierParcoursChoisi(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PanierParcoursChoisi>> = {}
        options = { where: { id: req.params.id } }

        try {
            const panierParcoursChoisi: PanierParcoursChoisi | null = await PanierParcoursChoisi.findOne(options);

            if (panierParcoursChoisi == null)
                return res.status(404).json({ success: false, message: "Panier non trouvé" });

            return res.status(200).send(panierParcoursChoisi);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createPanierParcoursChoisi(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let panierParcoursChoisi: PanierParcoursChoisi = new PanierParcoursChoisi();
        panierParcoursChoisi.utilisateurId = (req as any).utilisateurId
        panierParcoursChoisi.parcoursChoisiId = req.body.parcoursChoisiId

        await panierParcoursChoisi.save()
            .then((panierParcoursChoisi) => {
                return res.status(201).send(panierParcoursChoisi);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updatePanierParcoursChoisi(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PanierParcoursChoisi>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let panierParcoursChoisi: PanierParcoursChoisi | null = await PanierParcoursChoisi.findOne(options);
        if (panierParcoursChoisi != null) {

            await panierParcoursChoisi.update({
                utilisateurId: req.body.utilisateurId,
                parcoursChoisiId: req.body.parcoursChoisiId,
            })
                .then(async (panierParcoursChoisi) => {
                    return res.status(200).send(panierParcoursChoisi);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Panier non trouvé" });
        }

        return null
    }

    static async deletePanierParcoursChoisi(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PanierParcoursChoisi>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { id: req.params.id } }
        }

        let panierParcoursChoisi: PanierParcoursChoisi | null = await PanierParcoursChoisi.findOne({ where: { id: req.params.id } });
        if (panierParcoursChoisi) {
            await panierParcoursChoisi.destroy({ force: true })
                .then(() => {
                    return res.status(200).json({ success: true, message: "Panier supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Panier non trouvé" });
        }

        return null
    }

    static async deleteAllPanierParcoursChoisi(req: Request, res: Response): Promise<Response | null> {
        let options: DestroyOptions<InferAttributes<PanierParcoursChoisi>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, force: true }
        }

            await PanierParcoursChoisi.destroy(options)
                .then(() => {
                    return res.status(200).json({ success: true, message: "Panier supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<PanierParcoursChoisi>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }

        await PanierParcoursChoisi.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}