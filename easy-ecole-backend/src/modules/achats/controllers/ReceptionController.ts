import { Request, Response } from "express";
import { Commande } from "../models/Commande";
import { Reception } from "../models/Reception";
import { LigneReception } from "../models/LigneReception";
import { LigneCommande } from "../models/LigneCommande";
import { MouvementStock } from "../../stock/models/MouvementStock";
import { Immobilisation } from "../../immobilisation/models/Immobilisation";
import { Sequelize } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

export default class ReceptionController {
    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const items = await Reception.findAll({
                include: [
                    Reception.associations.commande,
                    { association: Reception.associations.lignesReception, include: [LigneReception.associations.ligneCommande] }
                ]
            });
            return res.status(200).send(items);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Reception.findOne({
                where: { id: req.params.id },
                include: [
                    Reception.associations.commande,
                    { association: Reception.associations.lignesReception, include: [LigneReception.associations.ligneCommande] }
                ]
            });

            if (item == null)
                return res.status(404).json({ success: false, message: "Réception non trouvée" });

            return res.status(200).send(item);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        const sequelize = DatabaseConnection.getInstance().sequelize;
        const transaction = await sequelize.transaction();

        try {
            const commande = await Commande.findByPk(req.body.commandeId, {
                include: [Commande.associations.lignesCommande]
            });

            if (!commande) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: "Commande non trouvée" });
            }

            const reception = await Reception.create({
                commandeId: req.body.commandeId,
                statut: req.body.statut || 'totale',
                notes: req.body.notes || null
            }, { transaction });

            if (req.body.lignesReception) {
                const lignes = req.body.lignesReception as any[];

                for (const ligne of lignes) {
                    await LigneReception.create({
                        receptionId: reception.id,
                        ligneCommandeId: ligne.ligneCommandeId,
                        quantiteRecue: ligne.quantiteRecue
                    }, { transaction });

                    const ligneCommande = await LigneCommande.findByPk(ligne.ligneCommandeId);
                    if (ligneCommande) {
                        // Lien Stock
                        if (ligneCommande.gereEnStock) {
                            await MouvementStock.create({
                                articleId: ligne.articleId || null,
                                type: 'entree',
                                quantite: ligne.quantiteRecue,
                                motif: 'Réception commande #' + commande.id,
                                prixUnitaire: ligneCommande.prixUnitaire,
                                dateMouvement: new Date(),
                                utilisateurId: (req as any).utilisateurId
                            }, { transaction });
                        }

                        // Lien Immobilisation
                        if (ligneCommande.actifImmobilise) {
                            await Immobilisation.create({
                                nom: ligneCommande.designation,
                                reference: 'IMM-' + Date.now() + '-' + ligneCommande.id,
                                valeurAcquisition: ligneCommande.prixUnitaire * ligne.quantiteRecue,
                                dateMiseEnService: new Date().toISOString().split('T')[0],
                                etat: 'neuf',
                                description: 'Créé depuis réception commande #' + commande.id
                            }, { transaction });
                        }
                    }
                }
            }

            if (req.body.statut === 'totale') {
                await commande.update({ statut: 'livree' }, { transaction });
            }

            await transaction.commit();

            const created = await Reception.findByPk(reception.id, {
                include: [
                    Reception.associations.commande,
                    { association: Reception.associations.lignesReception, include: [LigneReception.associations.ligneCommande] }
                ]
            });

            return res.status(201).send(created);
        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        try {
            const item = await Reception.findOne({ where: { id: req.params.id } });
            if (item == null)
                return res.status(404).json({ success: false, message: "Réception non trouvée" });

            await LigneReception.destroy({ where: { receptionId: item.id } });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Réception supprimée" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
