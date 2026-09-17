import { Request, Response } from "express";
import { Bordereau } from "../../inscription/models/Bordereau";
import { QueryTypes } from "sequelize";

export class CabinetComptableDashboardController {

    static async getDashboard(_req: Request, res: Response): Promise<Response> {
        try {
            const total = await Bordereau.count();
            const enAttente = await Bordereau.count({ where: { statut: 'en_attente' } });
            const valides = await Bordereau.count({ where: { statut: 'valide' } });
            const rejetes = await Bordereau.count({ where: { statut: 'rejete' } });
            const enSaisieComptable = await Bordereau.count({ where: { statut: 'en_saisie_comptable' } });
            const traites = await Bordereau.count({ where: { statut: 'traite' } });

            const avecReference = await Bordereau.count({
                where: { referenceBancaire: { $ne: null } as any }
            });

            // Requêtes chartes en parallèle avec try/catch individuel
            const parStatutPromise = (async () => {
                try {
                    const [rows] = await Bordereau.sequelize!.query(
                        "SELECT statut, COUNT(*) AS nombre FROM ins_bordereaux GROUP BY statut",
                        { type: QueryTypes.SELECT }
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
                        "SELECT DATE_FORMAT(dateSoumission, '%Y-%m') AS mois, COUNT(*) AS nombre FROM ins_bordereaux WHERE dateSoumission >= DATE_FORMAT(CURDATE(), '%Y-%m-01') - INTERVAL 5 MONTH GROUP BY DATE_FORMAT(dateSoumission, '%Y-%m') ORDER BY mois ASC",
                        { type: QueryTypes.SELECT }
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
                        "SELECT moyenPaiement, COUNT(*) AS nombre FROM ins_bordereaux WHERE moyenPaiement IS NOT NULL GROUP BY moyenPaiement",
                        { type: QueryTypes.SELECT }
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
                        "SELECT banque, COUNT(*) AS nombre FROM ins_bordereaux WHERE banque IS NOT NULL GROUP BY banque",
                        { type: QueryTypes.SELECT }
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
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        try {
            const { rows, count: total } = await Bordereau.findAndCountAll({
                where: { referenceBancaire: { $ne: null } as any },
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
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

        try {
            const { rows, count: total } = await Bordereau.findAndCountAll({
                where: {
                    statut: ['valide', 'rejete', 'traite'],
                    valideParId: (req as any).utilisateurId
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
}
