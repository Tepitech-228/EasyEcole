import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { InventaireStock } from "../models/InventaireStock";
import { LigneInventaireStock } from "../models/LigneInventaireStock";
import { CorrectionStock } from "../models/CorrectionStock";
import { Article } from "../models/Article";

export default class InventaireStockController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await InventaireStock.findAll();
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await InventaireStock.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await InventaireStock.create({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await InventaireStock.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Non trouvé" });
            await item.update({ ...req.body });
            return res.status(200).send(item);
        } catch (error: any) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await InventaireStock.findOne({ where: { id: req.params.id } });
            if (item) {
                await item.destroy();
                return res.status(200).json({ success: true, message: "Supprimé" });
            } else {
                return res.status(404).json({ success: false, message: "Non trouvé" });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async cloture(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false });
        }
        try {
            const inventaire = await InventaireStock.findOne({ where: { id: req.params.id } });
            if (inventaire == null)
                return res.status(404).json({ success: false, message: "Non trouvé" });

            await inventaire.update({ statut: 'cloture', dateFin: new Date().toISOString().split('T')[0] });

            const lignes = await LigneInventaireStock.findAll({ where: { inventaireId: inventaire.id } });

            for (const ligne of lignes) {
                if (ligne.ecart !== 0) {
                    const article = await Article.findOne({ where: { id: ligne.articleId } });
                    if (article) {
                        await CorrectionStock.create({
                            articleId: ligne.articleId,
                            quantiteAvant: article.stockActuel,
                            quantiteApres: ligne.quantiteReelle,
                            motif: `Correction suite inventaire ${inventaire.reference}`,
                            dateCorrection: new Date().toISOString().split('T')[0],
                        });
                        await article.update({ stockActuel: ligne.quantiteReelle });
                    }
                }
            }

            return res.status(200).send(inventaire);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getWithLignes(req: Request, res: Response): Promise<Response> {
        try {
            const item = await InventaireStock.findByPk(req.params.id, {
                include: [{
                    association: 'lignes',
                    include: [{ association: 'article' }]
                }]
            });
            if (item == null)
                return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}
