import { Request, Response } from "express";
import { CountOptions, FindOptions, IncludeOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { CahierDeTexte } from "../models/CahierDeTexte";
import { CoursParticipant } from "../models/CoursParticipant";
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";
import CahierCohorteService from "../services/CahierCohorteService";

export default class CahierDeTexteController {

    constructor() { }

    static async getAllCahiersDeTexte(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        const utilisateurId = (req as any).utilisateurId;
        const where: any = {};

        try {
            if (role === RolesUtilisateur.APPRENANT) {
                const coursParticipants = await CoursParticipant.findAll({ where: { utilisateurId }, attributes: ['coursId'] });
                where.coursId = { [Op.in]: coursParticipants.map(cp => cp.coursId) };
            } else if (role === RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
                if (!enseignant) return res.status(200).send([]);
                const cohortes = await CahierCohorteService.trouverCohortes(undefined, Number(enseignant.id));
                where[Op.or] = [
                    { enseignantId: enseignant.id },
                    ...CahierCohorteService.conditionsPourCohortes(cohortes),
                ];
            }

            const coursInclude: any = {
                association: CahierDeTexte.associations.cours,
                include: [
                    Cours.associations.classe,
                    { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                    { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                ]
            };
            if (role === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                if (!etablissementId) {
                    return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
                }
                const coursDuSite = await Cours.findAll({
                    where: { etablissementId },
                    attributes: ["id"],
                });
                where[Op.or] = [
                    { etablissementId },
                    { coursId: { [Op.in]: coursDuSite.map(cours => cours.id) } },
                ];
            }
            const options: FindOptions<InferAttributes<CahierDeTexte>> = {
                where,
                include: [
                    coursInclude,
                    { association: CahierDeTexte.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                    { association: CahierDeTexte.associations.parcours, include: [Parcours.associations.niveauEtude] },
                    CahierDeTexte.associations.niveauEtude,
                    CahierDeTexte.associations.etablissement,
                ]
            };
            const cahiersDeTexte = await CahierDeTexte.findAll(options);

            return res.status(200).send(cahiersDeTexte);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getCahierDeTexte(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole;
            const utilisateurId = (req as any).utilisateurId;
            const enseignant = role === RolesUtilisateur.ENSEIGNANT
                ? await Enseignant.findOne({ where: { utilisateurId }, attributes: ["id"] })
                : null;
            if (role === RolesUtilisateur.ENSEIGNANT && !enseignant) {
                return res.status(403).json({ success: false, message: "Profil enseignant introuvable" });
            }

            const blocsInclude: IncludeOptions = {
                association: CahierDeTexte.associations.blocsCahierDeTexte,
                required: false,
                ...(enseignant ? { where: { auteurEnseignantId: enseignant.id } } : {}),
            };
            const cahierDeTexte: CahierDeTexte | null = await CahierDeTexte.findOne({
                where: { id: req.params.id },
                include: [
                    {
                        association: CahierDeTexte.associations.cours,
                        include: [
                            Cours.associations.classe,
                            { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                            { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                        ]
                    },
                    blocsInclude,
                    { association: CahierDeTexte.associations.parcours, include: [Parcours.associations.niveauEtude] },
                    CahierDeTexte.associations.niveauEtude,
                    CahierDeTexte.associations.etablissement,
                ],
            });

            if (cahierDeTexte == null)
                return res.status(404).json({ success: false, message: "CahierDeTexte non trouvé" });

            if (role === RolesUtilisateur.APPRENANT) {
                const coursParticipants = await CoursParticipant.findAll({ where: { utilisateurId }, attributes: ['coursId'] });
                const coursIds = coursParticipants.map(cp => cp.coursId);
                if (!cahierDeTexte.coursId || !coursIds.includes(cahierDeTexte.coursId)) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à ce cahier de texte" });
                }
            }
            else if (role === RolesUtilisateur.ENSEIGNANT) {
                if (!enseignant ||
                    !await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), cahierDeTexte)) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à ce cahier de texte" });
                }
            } else if (role === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                const siteDuCahier = Number(cahierDeTexte.etablissementId || (cahierDeTexte as any).cours?.etablissementId);
                if (!etablissementId || siteDuCahier !== etablissementId) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à ce cahier de texte" });
                }
            }

            return res.status(200).send(cahierDeTexte);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createCahierDeTexte(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
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
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
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
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }
}