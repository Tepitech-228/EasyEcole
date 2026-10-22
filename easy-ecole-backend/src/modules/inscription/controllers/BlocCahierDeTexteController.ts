import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { BlocCahierDeTexte } from "../models/BlocCahierDeTexte";
import { CahierDeTexte } from "../models/CahierDeTexte";
import { Cours } from "../models/Cours";
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";

export default class BlocCahierDeTexteController {

    constructor() { }

    static async getAllBlocsCahierDeTextes(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<BlocCahierDeTexte>> = {}
        if ((req as any).utilisateurRole === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            if (!etablissementId) {
                return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
            }
            options.include = [{
                association: BlocCahierDeTexte.associations.cahierDeTexte,
                required: true,
                include: [{
                    association: CahierDeTexte.associations.cours,
                    where: { etablissementId },
                    required: true,
                }],
            }];
        }

        try {
            let blocsCahierDeTexte: BlocCahierDeTexte[];
            blocsCahierDeTexte = await BlocCahierDeTexte.findAll(options);

            return res.status(200).send(blocsCahierDeTexte);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getBlocCahierDeTexte(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<BlocCahierDeTexte>> = {}
        options = {
            where: { id: req.params.id },
            include: [{
                association: BlocCahierDeTexte.associations.cahierDeTexte,
                include: [CahierDeTexte.associations.cours],
            }],
        }

        try {
            const blocCahierDeTexte: BlocCahierDeTexte | null = await BlocCahierDeTexte.findOne(options);

            if (blocCahierDeTexte == null)
                return res.status(404).json({ success: false, message: "BlocCahierDeTexte non trouvé" });
            if ((req as any).utilisateurRole === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                const cahier = (blocCahierDeTexte as any).cahierDeTexte;
                if (!etablissementId || Number(cahier?.cours?.etablissementId) !== etablissementId) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à ce bloc" });
                }
            }

            return res.status(200).send(blocCahierDeTexte);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createBlocCahierDeTexte(req: Request, res: Response): Promise<Response | null> {

        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.ENSEIGNANT && role !== RolesUtilisateur.SURVEILLANT) {
            return res.status(403).json({ success: false })
        }

        if (role === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            const cahier = etablissementId
                ? await CahierDeTexte.findOne({
                    where: { id: req.body.cahierDeTexteId },
                    include: [{
                        association: CahierDeTexte.associations.cours,
                        where: { etablissementId },
                        required: true,
                    }],
                })
                : null;
            if (!cahier) {
                return res.status(403).json({ success: false, message: "Ce cahier de texte n'appartient pas à votre site" });
            }
        }

        let blocCahierDeTexte: BlocCahierDeTexte | null = await BlocCahierDeTexte.findOne({ where: { date: req.body.date, heureDebut: req.body.heureDebut, heureFin: req.body.heureFin, } });

        if (blocCahierDeTexte != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let blocCahierDeTexte: BlocCahierDeTexte = new BlocCahierDeTexte();
            blocCahierDeTexte.date = req.body.date
            blocCahierDeTexte.heureDebut = req.body.heureDebut
            blocCahierDeTexte.heureFin = req.body.heureFin
            blocCahierDeTexte.contenu = req.body.contenu
            blocCahierDeTexte.cahierDeTexteId = req.body.cahierDeTexteId

            await blocCahierDeTexte.save()
                .then((blocCahierDeTexte) => {
                    return res.status(201).send(blocCahierDeTexte);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateBlocCahierDeTexte(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<BlocCahierDeTexte>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let blocCahierDeTexte: BlocCahierDeTexte | null = await BlocCahierDeTexte.findOne(options);
        if (blocCahierDeTexte != null) {
            // if (blocCahierDeTexte.titre != req.body.titre && await BlocCahierDeTexte.findOne({ where: { titre: req.body.titre } }) != null) {
            //     return res.status(400).json({ success: false, alreadyExists: true });
            // }
            // else {
            await blocCahierDeTexte.update({
                date: req.body.date,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
                contenu: req.body.contenu,
                cahierDeTexteId: req.body.cahierDeTexteId,
            })
                .then(async (blocCahierDeTexte) => {
                    return res.status(200).send(blocCahierDeTexte);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
            // }
        }
        else {
            return res.status(404).json({ success: false, message: "BlocCahierDeTexte non trouvé" });
        }

        return null
    }

    static async deleteBlocCahierDeTexte(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<BlocCahierDeTexte>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let blocCahierDeTexte: BlocCahierDeTexte | null = await BlocCahierDeTexte.findOne({ where: { id: req.params.id } });
        if (blocCahierDeTexte) {
            await blocCahierDeTexte.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "BlocCahierDeTexte supprimé" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "BlocCahierDeTexte non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<BlocCahierDeTexte>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await BlocCahierDeTexte.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }
}