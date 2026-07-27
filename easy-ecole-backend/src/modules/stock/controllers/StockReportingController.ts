import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { Article } from "../models/Article";
import { CategorieArticle } from "../models/CategorieArticle";
import { MouvementStock } from "../models/MouvementStock";
import { Fournisseur } from "../models/Fournisseur";
import { Besoin } from "../models/Besoin";
import { Rebut } from "../models/Rebut";
import { InventaireStock } from "../models/InventaireStock";
import { CorrectionStock } from "../models/CorrectionStock";

class StockReportingController {
    static async getStats(req: Request, res: Response): Promise<Response> {
        try {
            const totalArticles = await Article.count();
            const valeurStock = await Article.sum(literal('stockActuel * prixUnitaire') as any) || 0;
            const alerteStock = await Article.count({ where: { stockActuel: { [Op.lte]: col('stockMinimum') } } });
            const mouvementsAnnee = await MouvementStock.count({
                where: { dateMouvement: { [Op.gte]: new Date(new Date().getFullYear(), 0, 1) } }
            });
            const besoinsEnAttente = await Besoin.count({ where: { statut: 'soumis' } });
            const rebutsAnnee = await Rebut.sum('quantite', {
                where: { dateRebut: { [Op.gte]: new Date(new Date().getFullYear(), 0, 1) } }
            }) || 0;
            const parCategorie = await Article.findAll({
                attributes: ['categorieId', [fn('COUNT', col('id')), 'count'], [fn('SUM', literal('stockActuel * prixUnitaire')), 'valeur']],
                include: [{ model: CategorieArticle, as: 'categorie', attributes: ['nom'] }],
                group: ['categorieId']
            });
            return res.status(200).json({
                totalArticles, valeurStock, alerteStock,
                mouvementsAnnee, besoinsEnAttente, rebutsAnnee,
                valeurParCategorie: parCategorie
            });
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async getMouvementsRecents(req: Request, res: Response): Promise<Response> {
        try {
            const mouvements = await MouvementStock.findAll({
                limit: 20,
                order: [['dateMouvement', 'DESC']],
                include: [
                    { model: Article, as: 'article' },
                    { model: Fournisseur, as: 'fournisseur' }
                ]
            });
            return res.status(200).json(mouvements);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async getArticlesAlerte(req: Request, res: Response): Promise<Response> {
        try {
            const articles = await Article.findAll({
                where: { stockActuel: { [Op.lte]: col('stockMinimum') } },
                include: [{ model: CategorieArticle, as: 'categorie' }]
            });
            return res.status(200).json(articles);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async getValeurStock(req: Request, res: Response): Promise<Response> {
        try {
            const articles = await Article.findAll({
                attributes: [
                    'id', 'nom', 'reference', 'stockActuel', 'prixUnitaire',
                    [literal('stockActuel * prixUnitaire'), 'valeurTotal']
                ],
                include: [{ model: CategorieArticle, as: 'categorie' }],
                order: [[literal('valeurTotal'), 'DESC']]
            });
            return res.status(200).json(articles);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async getSyntheseMensuelle(req: Request, res: Response): Promise<Response> {
        try {
            const entries = await MouvementStock.findAll({
                attributes: [
                    [fn('MONTH', col('dateMouvement')), 'mois'],
                    [fn('SUM', literal("CASE WHEN type = 'entree' THEN quantite ELSE 0 END")), 'entrees'],
                    [fn('SUM', literal("CASE WHEN type = 'sortie' THEN quantite ELSE 0 END")), 'sorties']
                ],
                where: { dateMouvement: { [Op.gte]: new Date(new Date().getFullYear(), 0, 1) } },
                group: [fn('MONTH', col('dateMouvement'))],
                order: [[fn('MONTH', col('dateMouvement')), 'ASC']]
            });
            return res.status(200).send(entries);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }
}

export default StockReportingController;
