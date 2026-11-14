import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { BlocCahierDeTexte } from "../models/BlocCahierDeTexte";
import { CahierDeTexte } from "../models/CahierDeTexte";
import { Cours } from "../models/Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";
import CahierCohorteService from "../services/CahierCohorteService";

export default class BlocCahierDeTexteController {

    constructor() { }

    private static async enseignantPeutRenseigner(
        req: Request,
        cahier: CahierDeTexte | null,
        auteurEnseignantId?: number | null,
    ): Promise<boolean> {
        if (!cahier) return false;
        const enseignant = await Enseignant.findOne({
            where: { utilisateurId: (req as any).utilisateurId },
            attributes: ["id"],
        });
        if (!enseignant ||
            (auteurEnseignantId != null && Number(auteurEnseignantId) !== Number(enseignant.id)) ||
            (auteurEnseignantId === null)) {
            return false;
        }
        return Boolean(
            await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), cahier));
    }

    static async getAllBlocsCahierDeTextes(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<BlocCahierDeTexte>> = {}
        const role = (req as any).utilisateurRole;
        if (role === RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                attributes: ["id"],
            });
            if (!enseignant) return res.status(200).send([]);
            const [cours, cohortes] = await Promise.all([
                Cours.findAll({ where: { enseignantId: enseignant.id }, attributes: ["id"] }),
                CahierCohorteService.trouverCohortes(undefined, Number(enseignant.id)),
            ]);
            const cahiers = await CahierDeTexte.findAll({
                where: {
                    [Op.or]: [
                        { enseignantId: enseignant.id },
                        { coursId: { [Op.in]: cours.map(item => item.id) } },
                        ...CahierCohorteService.conditionsPourCohortes(cohortes),
                    ],
                },
                attributes: ["id"],
            });
            options.where = {
                auteurEnseignantId: enseignant.id,
                cahierDeTexteId: { [Op.in]: cahiers.map(cahier => cahier.id) },
            };
        } else if (role === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            if (!etablissementId) {
                return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
            }
            const coursDuSite = await Cours.findAll({ where: { etablissementId }, attributes: ["id"] });
            const cahiers = await CahierDeTexte.findAll({
                where: {
                    [Op.or]: [
                        { etablissementId },
                        { coursId: { [Op.in]: coursDuSite.map(cours => cours.id) } },
                    ],
                },
                attributes: ["id"],
            });
            options.where = { cahierDeTexteId: { [Op.in]: cahiers.map(cahier => cahier.id) } };
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
                include: [
                    CahierDeTexte.associations.cours,
                    CahierDeTexte.associations.etablissement,
                    CahierDeTexte.associations.parcours,
                    CahierDeTexte.associations.niveauEtude,
                ],
            }],
        }

        try {
            const blocCahierDeTexte: BlocCahierDeTexte | null = await BlocCahierDeTexte.findOne(options);

            if (blocCahierDeTexte == null)
                return res.status(404).json({ success: false, message: "BlocCahierDeTexte non trouvé" });
            if ((req as any).utilisateurRole === RolesUtilisateur.ENSEIGNANT &&
                !await BlocCahierDeTexteController.enseignantPeutRenseigner(
                    req,
                    (blocCahierDeTexte as any).cahierDeTexte ?? null,
                    blocCahierDeTexte.auteurEnseignantId,
                )) {
                return res.status(403).json({ success: false, message: "Vous n'avez pas accès à ce bloc" });
            }
            if ((req as any).utilisateurRole === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                const cahier = (blocCahierDeTexte as any).cahierDeTexte;
                const siteDuCahier = Number(cahier?.etablissementId || cahier?.cours?.etablissementId);
                if (!etablissementId || siteDuCahier !== etablissementId) {
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

        let auteurEnseignantId: number | null = null;
        if (role === RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                attributes: ["id"],
            });
            const cahier = await CahierDeTexte.findByPk(req.body.cahierDeTexteId);
            if (!enseignant || !cahier ||
                !await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), cahier)) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à renseigner ce cahier de texte" });
            }
            auteurEnseignantId = Number(enseignant.id);
        }

        if (role === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            const cahier = etablissementId
                ? await CahierDeTexte.findOne({
                    where: { id: req.body.cahierDeTexteId },
                    include: [CahierDeTexte.associations.cours],
                })
                : null;
            if (!cahier || (
                Number(cahier.etablissementId) !== etablissementId
                && Number((cahier as any).cours?.etablissementId) !== etablissementId
            )) {
                return res.status(403).json({ success: false, message: "Ce cahier de texte n'appartient pas à votre site" });
            }
        }

        let blocCahierDeTexte: BlocCahierDeTexte | null = await BlocCahierDeTexte.findOne({
            where: {
                cahierDeTexteId: req.body.cahierDeTexteId,
                date: req.body.date,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
            },
        });

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
            blocCahierDeTexte.auteurEnseignantId = auteurEnseignantId

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
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        const blocCahierDeTexte: BlocCahierDeTexte | null = await BlocCahierDeTexte.findOne({
            ...options,
            include: [{
                association: BlocCahierDeTexte.associations.cahierDeTexte,
                include: [CahierDeTexte.associations.cours, CahierDeTexte.associations.parcours],
            }],
        });
        if (blocCahierDeTexte != null) {
            const cahierActuel = (blocCahierDeTexte as any).cahierDeTexte as CahierDeTexte | undefined;
            if (role === RolesUtilisateur.ENSEIGNANT) {
                const cahierCibleId = req.body.cahierDeTexteId ?? blocCahierDeTexte.cahierDeTexteId;
                const cahierCible = Number(cahierCibleId) === Number(blocCahierDeTexte.cahierDeTexteId)
                    ? cahierActuel ?? null
                    : await CahierDeTexte.findByPk(cahierCibleId);
                if (!await BlocCahierDeTexteController.enseignantPeutRenseigner(
                    req,
                    cahierActuel ?? null,
                    blocCahierDeTexte.auteurEnseignantId,
                ) ||
                    !await BlocCahierDeTexteController.enseignantPeutRenseigner(req, cahierCible)) {
                    return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à modifier ce bloc" });
                }
            }
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
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        const blocCahierDeTexte: BlocCahierDeTexte | null = await BlocCahierDeTexte.findOne({
            ...options,
            include: [{
                association: BlocCahierDeTexte.associations.cahierDeTexte,
                include: [CahierDeTexte.associations.cours, CahierDeTexte.associations.parcours],
            }],
        });
        if (blocCahierDeTexte) {
            if (role === RolesUtilisateur.ENSEIGNANT &&
                !await BlocCahierDeTexteController.enseignantPeutRenseigner(
                    req,
                    (blocCahierDeTexte as any).cahierDeTexte ?? null,
                    blocCahierDeTexte.auteurEnseignantId,
                )) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à supprimer ce bloc" });
            }
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