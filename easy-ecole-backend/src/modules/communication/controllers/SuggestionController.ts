import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Suggestion } from "../models/Suggestion";
import { ReponseSuggestion } from "../models/ReponseSuggestion";

export default class SuggestionController {

    constructor() { }

    static async getAllSuggestions(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Suggestion>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }

        try {
            let suggestions: Suggestion[];
            suggestions = await Suggestion.findAll(options);

            return res.status(200).send(suggestions);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getSuggestion(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Suggestion>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { id: req.params.id, utilisateurId: (req as any).utilisateurId }, include: [{ model: ReponseSuggestion, as: 'reponsesSuggestion' }] }
        } else {
            options = { where: { id: req.params.id }, include: [{ model: ReponseSuggestion, as: 'reponsesSuggestion' }] }
        }

        try {
            const suggestion: Suggestion | null = await Suggestion.findOne(options);

            if (suggestion == null)
                return res.status(404).json({ success: false, message: "Suggestion non trouvée" });

            return res.status(200).send(suggestion);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createSuggestion(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let suggestion: Suggestion = new Suggestion();
        suggestion.message = req.body.message
        suggestion.type = req.body.type
        suggestion.statut = 'ouverte'
        suggestion.utilisateurId = (req as any).utilisateurId

        await suggestion.save()
            .then(async (suggestion) => {
                return res.status(201).send(suggestion);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateSuggestionStatut(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let suggestion: Suggestion | null = await Suggestion.findOne({ where: { id: req.params.id } });
        if (suggestion != null) {
            await suggestion.update({
                statut: req.body.statut
            })
                .then(async (suggestion) => {
                    return res.status(200).send(suggestion);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Suggestion non trouvée" });
        }

        return null
    }

    static async repondreSuggestion(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let suggestion: Suggestion | null = await Suggestion.findOne({ where: { id: req.body.suggestionId } });
        if (suggestion == null) {
            return res.status(404).json({ success: false, message: "Suggestion non trouvée" });
        }

        let reponse: ReponseSuggestion = new ReponseSuggestion();
        reponse.message = req.body.message
        reponse.suggestionId = req.body.suggestionId
        reponse.utilisateurId = (req as any).utilisateurId

        const suggestionNonNull = suggestion;
        await reponse.save()
            .then(async (reponse) => {
                await suggestionNonNull.update({ statut: 'traitee' })
                return res.status(201).send(reponse);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async deleteSuggestion(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let suggestion: Suggestion | null = await Suggestion.findOne({ where: { id: req.params.id } });
        if (suggestion) {
            await suggestion.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Suggestion supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Suggestion non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Suggestion>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Suggestion.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
