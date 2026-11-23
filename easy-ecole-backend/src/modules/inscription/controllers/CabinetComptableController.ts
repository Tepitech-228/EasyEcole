import { Request, Response } from "express";
import { Bordereau } from "../../inscription/models/Bordereau";
import { QueryTypes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export class CabinetComptableDashboardController {

    static async getDashboard(req: Request, res: Response): Promise<Response> {
        const siteId = this.getCabinetSiteId(req);
        if (siteId === null) {
            return res.status(403).json({ success: false, message: "Aucun site actif sélectionné" });
        }
        const siteWhere = siteId === undefined ? {} : { etablissementId: siteId };
        const siteClause = siteId === undefined ? "" : " WHERE etablissementId = :etablissementId";
        const replacements = siteId === undefined ? {} : { etablissementId: siteId };
        try {
            const total = await Bordereau.count({ where: siteWhere });
            const enAttente = await Bordereau.count({ where: { ...siteWhere, statut: 'en_attente' } });
            const valides = await Bordereau.count({ where: { ...siteWhere, statut: 'valide' } });
            const rejetes = await Bordereau.count({ where: { ...siteWhere, statut: 'rejete' } });
            const enSaisieComptable = await Bordereau.count({ where: { ...siteWhere, statut: 'en_saisie_comptable' } });
            const traites = await Bordereau.count({ where: { ...siteWhere, statut: 'traite' } });

            const avecReference = await Bordereau.count({
                where: { ...siteWhere, referenceBancaire: { [Op.ne]: null } as any }
            });

            // Requêtes chartes en parallèle avec try/catch individuel
            const parStatutPromise = (async () => {
                try {
                    const [rows] = await Bordereau.sequelize!.query(
                        `SELECT statut, COUNT(*) AS nombre FROM ins_bordereaux${siteClause} GROUP BY statut`,
                        { replacements, type: QueryTypes.SELECT }
                    );
                    return rows as { statut: string; nombre: number }[];
                } catch (error) {
                    console.error('[CabinetDashboard parStatut]', error);
                    return [];
                }
            })();

            const evolutionSixMoisPromise = (async () => {
                try {
                    const [rows] = await Bordereau.sequelize!.query(
                        `SELECT DATE_FORMAT(dateSoumission, '%Y-%m') AS mois, COUNT(*) AS nombre FROM ins_bordereaux${siteClause}${siteId === undefined ? " WHERE" : " AND"} dateSoumission >= DATE_FORMAT(CURDATE(), '%Y-%m-01') - INTERVAL 5 MONTH GROUP BY DATE_FORMAT(dateSoumission, '%Y-%m') ORDER BY mois ASC`,
                        { replacements, type: QueryTypes.SELECT }
                    );
                    return rows as { mois: string; nombre: number }[];
                } catch (error) {
                    console.error('[CabinetDashboard evolutionSixMois]', error);
                    return [];
                }
            })();

            const parMoyenPaiementPromise = (async () => {
                try {
                    const [rows] = await Bordereau.sequelize!.query(
                        `SELECT moyenPaiement, COUNT(*) AS nombre FROM ins_bordereaux${siteClause}${siteId === undefined ? " WHERE" : " AND"} moyenPaiement IS NOT NULL GROUP BY moyenPaiement`,
                        { replacements, type: QueryTypes.SELECT }
                    );
                    return rows as { moyenPaiement: string; nombre: number }[];
                } catch (error) {
                    console.error('[CabinetDashboard parMoyenPaiement]', error);
                    return [];
                }
            })();

            const parBanquePromise = (async () => {
                try {
                    const [rows] = await Bordereau.sequelize!.query(
                        `SELECT banque, COUNT(*) AS nombre FROM ins_bordereaux${siteClause}${siteId === undefined ? " WHERE" : " AND"} banque IS NOT NULL GROUP BY banque`,
                        { replacements, type: QueryTypes.SELECT }
                    );
                    return rows as { banque: string; nombre: number }[];
                } catch (error) {
                    console.error('[CabinetDashboard parBanque]', error);
                    return [];
                }
            })();

            const [parStatut, evolutionSixMois, parMoyenPaiement, parBanque] = await Promise.all([
                parStatutPromise,
                evolutionSixMoisPromise,
                parMoyenPaiementPromise,
                parBanquePromise
            ]);

            return res.status(200).json({
                success: true,
                data: {
                    total,
                    enAttente,
                    valides,
                    rejetes,
                    enSaisieComptable,
                    traites,
                    avecReference,
                    tauxValidation: total > 0 ? Math.round((valides / total) * 100) : 0,
                    tauxRejet: total > 0 ? Math.round((rejetes / total) * 100) : 0,
                    tauxReference: total > 0 ? Math.round((avecReference / total) * 100) : 0,
                    charts: {
                        parStatut,
                        evolutionSixMois,
                        parMoyenPaiement,
                        parBanque
                    }
                }
            });
        } catch (error) {
            console.error('[CabinetDashboard]', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getReferences(req: Request, res: Response): Promise<Response> {
        const siteId = this.getCabinetSiteId(req);
        if (siteId === null) {
            return res.status(403).json({ success: false, message: "Aucun site actif sélectionné" });
        }
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        try {
            const { rows, count: total } = await Bordereau.findAndCountAll({
                where: {
                    ...(siteId === undefined ? {} : { etablissementId: siteId }),
                    referenceBancaire: { [Op.ne]: null } as any
                },
                include: [
                    { association: Bordereau.associations.utilisateur },
                    { association: Bordereau.associations.validePar }
                ],
                order: [['dateValidation', 'DESC']],
                limit,
                offset
            });

            return res.status(200).json({
                success: true,
                data: rows,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            });
        } catch (error) {
            console.error('[CabinetReferences]', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getHistorique(req: Request, res: Response): Promise<Response> {
        const siteId = this.getCabinetSiteId(req);
        if (siteId === null) {
            return res.status(403).json({ success: false, message: "Aucun site actif sélectionné" });
        }
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        try {
            const { rows, count: total } = await Bordereau.findAndCountAll({
                where: {
                    statut: ['valide', 'rejete', 'traite'],
                    valideParId: (req as any).utilisateurId,
                    ...(siteId === undefined ? {} : { etablissementId: siteId }),
                },
                include: [
                    { association: Bordereau.associations.utilisateur }
                ],
                order: [['dateValidation', 'DESC']],
                limit,
                offset
            });

            return res.status(200).json({
                success: true,
                data: rows,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            });
        } catch (error) {
            console.error('[CabinetHistorique]', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    private static getCabinetSiteId(req: Request): number | undefined | null {
        if ((req as any).utilisateurRole !== RolesUtilisateur.CABINET_COMPTABLE) return undefined;
        const siteId = Number((req as any).etablissementId);
        return Number.isSafeInteger(siteId) && siteId > 0 ? siteId : null;
    }
}
