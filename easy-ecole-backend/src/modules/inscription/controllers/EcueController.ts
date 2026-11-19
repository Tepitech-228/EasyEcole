import { Request, Response } from "express";
import { Ecue } from "../models/Ecue";
import { Enseignant } from "../../auth/models/Enseignant";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";

export default class EcueController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Ecue.findAll({
                include: [
                    Ecue.associations.cours,
                    { association: Ecue.associations.enseignant, include: [Enseignant.associations.utilisateur] }
                ]
            });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Ecue.findByPk(req.params.id, {
                include: [Ecue.associations.cours]
            });
            if (!data) return res.status(404).json({ success: false, message: "ECUE non trouvé" });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        try {
            const data = await Ecue.create(req.body);
            return res.status(201).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        try {
            const data = await Ecue.findByPk(req.params.id, {
                include: [Ecue.associations.cours]
            });
            if (!data) return res.status(404).json({ success: false, message: "ECUE non trouvé" });

            // Verrouillage inter-établissements : l'ADMIN voit toutes les données
            if (req.utilisateurRole !== RolesUtilisateur.ADMIN) {
                // `Etablissement.id` est une chaîne en base alors que le jeton peut
                // porter un nombre : on compare sur forme texte pour être robuste.
                const etablissementIdEcue = data.cours?.etablissementId != null ? String(data.cours.etablissementId) : null;
                const etablissementIdUtilisateur = req.etablissementId != null ? String(req.etablissementId) : null;
                if (!etablissementIdUtilisateur || etablissementIdEcue !== etablissementIdUtilisateur) {
                    return res.status(403).json({ success: false, message: "Accès interdit : cet ECUE n'appartient pas à votre établissement" });
                }
            }

            await data.update(req.body);
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            const data = await Ecue.findByPk(req.params.id, {
                include: [Ecue.associations.cours]
            });
            if (!data) return res.status(404).json({ success: false, message: "ECUE non trouvé" });

            // Verrouillage inter-établissements : l'ADMIN voit toutes les données
            if (req.utilisateurRole !== RolesUtilisateur.ADMIN) {
                // `Etablissement.id` est une chaîne en base alors que le jeton peut
                // porter un nombre : on compare sur forme texte pour être robuste.
                const etablissementIdEcue = data.cours?.etablissementId != null ? String(data.cours.etablissementId) : null;
                const etablissementIdUtilisateur = req.etablissementId != null ? String(req.etablissementId) : null;
                if (!etablissementIdUtilisateur || etablissementIdEcue !== etablissementIdUtilisateur) {
                    return res.status(403).json({ success: false, message: "Accès interdit : cet ECUE n'appartient pas à votre établissement" });
                }
            }

            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getByUe(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Ecue.findAll({
                where: { coursId: req.params.ueId },
                include: [
                    Ecue.associations.cours,
                    { association: Ecue.associations.enseignant, include: [Enseignant.associations.utilisateur] }
                ]
            });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    /**
     * Liste les ECUE du site actif avec leur UE (cours), parcours, niveau,
     * classe et enseignant affecté. Sert à l'écran « Affectations UE/ECUE ».
     */
    static async getForTeacherAssignments(req: Request, res: Response): Promise<Response> {
        const etablissementId = Number((req as any).etablissementId);
        const estAdmin = (req as any).utilisateurRole === RolesUtilisateur.ADMIN;

        if (!estAdmin && (!Number.isSafeInteger(etablissementId) || etablissementId <= 0)) {
            return res.status(400).json({ success: false, message: "Sélectionnez un site avant de gérer les affectations." });
        }

        try {
            const coursInclude: any = {
                association: Ecue.associations.cours,
                required: true,
                include: [
                    {
                        association: Cours.associations.parcours,
                        include: [Parcours.associations.niveauEtude],
                    },
                    Cours.associations.classe,
                ],
            };
            if (Number.isSafeInteger(etablissementId) && etablissementId > 0) {
                coursInclude.where = { etablissementId };
            }

            const data = await Ecue.findAll({
                include: [
                    coursInclude,
                    {
                        association: Ecue.associations.enseignant,
                        required: false,
                        include: [Enseignant.associations.utilisateur],
                    },
                ],
                order: [['coursId', 'ASC'], ['code', 'ASC']],
            });
            return res.status(200).send(data);
        } catch (error) {
            console.error('[EcueController.getForTeacherAssignments]', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    /**
     * Affecte (ou retire, avec `enseignantId: null`) un enseignant à un ECUE.
     * Contrôle que l'ECUE et l'enseignant appartiennent bien au site actif.
     */
    static async assignerEnseignant(req: Request, res: Response): Promise<Response> {
        try {
            const data = await Ecue.findByPk(req.params.id, {
                include: [Ecue.associations.cours],
            });
            if (!data) return res.status(404).json({ success: false, message: "ECUE non trouvé" });

            const role = (req as any).utilisateurRole;
            const etablissementId = (req as any).etablissementId != null ? String((req as any).etablissementId) : null;

            if (role !== RolesUtilisateur.ADMIN) {
                const etablissementIdEcue = data.cours?.etablissementId != null ? String(data.cours.etablissementId) : null;
                if (!etablissementId || etablissementIdEcue !== etablissementId) {
                    return res.status(403).json({ success: false, message: "Accès interdit : cet ECUE n'appartient pas à votre établissement" });
                }
            }

            const enseignantId = req.body?.enseignantId ?? null;

            if (enseignantId != null) {
                const enseignant = await Enseignant.findByPk(enseignantId);
                if (!enseignant) {
                    return res.status(404).json({ success: false, message: "Enseignant introuvable" });
                }

                if (role !== RolesUtilisateur.ADMIN && etablissementId) {
                    const affectation = await SiteUtilisateur.findOne({
                        where: { utilisateurId: enseignant.utilisateurId, etablissementId },
                        attributes: ['id'],
                    });
                    if (!affectation) {
                        return res.status(403).json({ success: false, message: "Cet enseignant n'est pas affecté au site actif" });
                    }
                }
            }

            await data.update({ enseignantId });

            const updated = await Ecue.findByPk(data.id, {
                include: [
                    {
                        association: Ecue.associations.enseignant,
                        required: false,
                        include: [Enseignant.associations.utilisateur],
                    },
                ],
            });
            return res.status(200).send(updated);
        } catch (error) {
            console.error('[EcueController.assignerEnseignant]', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
