import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { Demande } from "../models/Demande";
import { Validation } from "../models/Validation";
import { Validateur } from "../models/Validateur";

export default class ValidationController {
    constructor() { }

    static async getValidationsEnAttente(req: Request, res: Response): Promise<Response> {
        try {
            const validateur = await Validateur.findOne({
                where: { utilisateurId: (req as any).utilisateurId, actif: true }
            });

            if (!validateur)
                return res.status(200).send([]);

            const demandes = await Demande.findAll({
                where: { statut: 'soumise' },
                include: [Demande.associations.soumisPar, Demande.associations.lignesDemande, Demande.associations.validations]
            });

            const filtered: Demande[] = [];
            for (const d of demandes) {
                const montantTotal = (d as any).lignesDemande?.reduce((sum: number, l: any) => sum + (l.quantite * l.prixEstime), 0) || 0;
                const maxNiveauValide = Math.max(0, ...(d.validations || []).map(v => (v as any).validateur?.niveau || 0));

                if (montantTotal <= validateur.montantMax && validateur.niveau > maxNiveauValide) {
                    const dejaValide = (d.validations || []).some(v => v.validateurId === validateur.id);
                    if (!dejaValide) filtered.push(d);
                }
            }

            return res.status(200).send(filtered);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async approuver(req: Request, res: Response): Promise<Response | null> {
        try {
            const validateur = await Validateur.findOne({
                where: { utilisateurId: (req as any).utilisateurId, actif: true }
            });

            if (!validateur)
                return res.status(403).json({ success: false, message: "Vous n'êtes pas un validateur actif" });

            const demande = await Demande.findByPk(req.params.demandeId, {
                include: [Demande.associations.lignesDemande, Demande.associations.validations]
            });

            if (!demande)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            if (demande.statut !== 'soumise')
                return res.status(400).json({ success: false, message: "La demande n'est pas en attente de validation" });

            const validation = await Validation.create({
                demandeId: demande.id,
                validateurId: validateur.id,
                statut: 'approuve',
                commentaire: req.body.commentaire || null,
                date: new Date()
            });

            const montantTotal = (demande as any).lignesDemande?.reduce((sum: number, l: any) => sum + (l.quantite * l.prixEstime), 0) || 0;
            const maxNiveauValide = Math.max(0, ...(demande.validations || []).map(v => (v as any).validateur?.niveau || 0));

            if (montantTotal <= validateur.montantMax) {
                await demande.update({ statut: 'validee' });
            }

            return res.status(200).send(validation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async rejeter(req: Request, res: Response): Promise<Response | null> {
        try {
            const validateur = await Validateur.findOne({
                where: { utilisateurId: (req as any).utilisateurId, actif: true }
            });

            if (!validateur)
                return res.status(403).json({ success: false, message: "Vous n'êtes pas un validateur actif" });

            const demande = await Demande.findByPk(req.params.demandeId);
            if (!demande)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            const validation = await Validation.create({
                demandeId: demande.id,
                validateurId: validateur.id,
                statut: 'rejete',
                commentaire: req.body.commentaire || null,
                date: new Date()
            });

            await demande.update({ statut: 'rejetee' });

            return res.status(200).send(validation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getValidateurs(req: Request, res: Response): Promise<Response> {
        try {
            const validateurs = await Validateur.findAll({
                where: { actif: true },
                include: [Validateur.associations.utilisateur]
            });
            return res.status(200).send(validateurs);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createValidateur(req: Request, res: Response): Promise<Response | null> {
        try {
            const existing = await Validateur.findOne({ where: { utilisateurId: req.body.utilisateurId } });
            if (existing)
                return res.status(400).json({ success: false, alreadyExists: true });

            const item = await Validateur.create({ ...req.body });
            return res.status(201).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async updateValidateur(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Validateur.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Validateur non trouvé" });

            await item.update({ ...req.body });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async deleteValidateur(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Validateur.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Validateur non trouvé" });

            await item.destroy();
            return res.status(200).json({ success: true, message: "Validateur supprimé" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
