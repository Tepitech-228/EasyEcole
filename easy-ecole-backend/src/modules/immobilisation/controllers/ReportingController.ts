import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { Immobilisation } from "../models/Immobilisation";
import { CategorieImmobilisation } from "../models/CategorieImmobilisation";
import { Acquisition } from "../models/Acquisition";
import { Amortissement } from "../models/Amortissement";
import { Cession } from "../models/Cession";
import { Maintenance } from "../models/Maintenance";
import { Assurance } from "../models/Assurance";
import { SortieProvisoire } from "../models/SortieProvisoire";
import { Site } from "../models/Site";
import { Departement } from "../models/Departement";
import { Localisation } from "../models/Localisation";
import { Affectation } from "../models/Affectation";

export default class ReportingController {
    static async getStats(req: Request, res: Response): Promise<Response> {
        try {
            const totalImmos = await Immobilisation.count();
            const valeurGlobale = await Immobilisation.sum('valeurAcquisition') || 0;
            const totalAmorti = await Amortissement.sum('montantAmorti') || 0;
            const parEtat = await Immobilisation.findAll({
                attributes: ['etat', [fn('COUNT', col('id')), 'count']],
                group: ['etat']
            });
            const parCategorie = await Immobilisation.findAll({
                attributes: ['categorieId', [fn('COUNT', col('id')), 'count']],
                include: [{ model: CategorieImmobilisation, as: 'categorie', attributes: ['nom'] }],
                group: ['categorieId']
            });
            const recentAcquisitions = await Acquisition.count({
                where: { dateAcquisition: { [Op.gte]: new Date(new Date().getFullYear(), 0, 1) } }
            });
            return res.status(200).json({
                totalImmobilisations: totalImmos,
                valeurGlobale,
                totalAmorti,
                valeurNetComptable: valeurGlobale - totalAmorti,
                repartitionParEtat: parEtat,
                repartitionParCategorie: parCategorie,
                acquisitionsAnneeEnCours: recentAcquisitions
            });
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async getFicheImmobilisation(req: Request, res: Response): Promise<Response> {
        try {
            const item = await Immobilisation.findByPk(req.params.id, {
                include: [
                    { model: CategorieImmobilisation, as: 'categorie' },
                    { model: Site, as: 'site' },
                    { model: Localisation, as: 'localisation' },
                    { model: Departement, as: 'departement' },
                    { model: Acquisition, as: 'acquisition' },
                    { model: Amortissement, as: 'amortissements', order: [['annee', 'DESC']] },
                    { model: Cession, as: 'cession' },
                    { model: Maintenance, as: 'maintenances' },
                    { model: Assurance, as: 'assurance' },
                    { model: SortieProvisoire, as: 'sortiesProvisoires' },
                    { model: Affectation, as: 'affectations' }
                ]
            });
            if (item == null) return res.status(404).json({ success: false, message: "Non trouvé" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async getAmortissementsPrevisionnels(req: Request, res: Response): Promise<Response> {
        try {
            const currentYear = new Date().getFullYear();
            const immobilisations = await Immobilisation.findAll({
                include: [{
                    model: CategorieImmobilisation,
                    as: 'categorie',
                    required: true,
                    where: {
                        [Op.or]: [
                            { dureeVie: { [Op.ne]: null } },
                            { tauxAmortissement: { [Op.ne]: null } }
                        ]
                    }
                }]
            });
            let totalPrevisionnel = 0;
            const details: any[] = [];
            for (const immo of immobilisations) {
                const categorie = (immo as any).categorie;
                if (!categorie) continue;
                let montantAnnuel = 0;
                if (categorie.modeAmortissement === 'lineaire' && categorie.dureeVie) {
                    montantAnnuel = Number(immo.valeurAcquisition) / Number(categorie.dureeVie);
                } else if (categorie.tauxAmortissement) {
                    montantAnnuel = Number(immo.valeurAcquisition) * (Number(categorie.tauxAmortissement) / 100);
                }
                totalPrevisionnel += montantAnnuel;
                details.push({
                    immobilisationId: immo.id,
                    nom: immo.nom,
                    reference: immo.reference,
                    valeurAcquisition: immo.valeurAcquisition,
                    montantAnnuelPrevisionnel: montantAnnuel
                });
            }
            return res.status(200).json({
                annee: currentYear,
                totalPrevisionnel,
                details
            });
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async getEcheancesAssurances(req: Request, res: Response): Promise<Response> {
        try {
            const trenteJours = new Date();
            trenteJours.setDate(trenteJours.getDate() + 30);
            const items = await Assurance.findAll({
                where: {
                    statut: 'active',
                    dateFin: { [Op.lte]: trenteJours }
                },
                include: [{
                    model: Immobilisation,
                    as: 'immobilisation',
                    attributes: ['nom', 'reference']
                }]
            });
            return res.status(200).send(items);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }

    static async getSortiesEnCours(req: Request, res: Response): Promise<Response> {
        try {
            const items = await SortieProvisoire.findAll({
                where: { statut: 'en_cours' },
                include: [{ model: Immobilisation, as: 'immobilisation' }]
            });
            return res.status(200).send(items);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }
}
