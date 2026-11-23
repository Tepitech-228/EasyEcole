import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import { BORDEREAU_BANK_REFERENCES, Bordereau } from "../models/Bordereau";

type GranulariteStatistiquesBancaires = "jour" | "mois" | "annee";

const DATE_FORMATS: Record<GranulariteStatistiquesBancaires, string> = {
    jour: "%Y-%m-%d",
    mois: "%Y-%m",
    annee: "%Y",
};

function estDateValide(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export class AnalyseBancaireController {
    static async getStatistiquesBancaires(req: Request, res: Response): Promise<Response> {
        const { dateDebut, dateFin, granularite } = req.query;
        if (
            !estDateValide(dateDebut) ||
            !estDateValide(dateFin) ||
            dateDebut > dateFin ||
            typeof granularite !== "string" ||
            !Object.prototype.hasOwnProperty.call(DATE_FORMATS, granularite)
        ) {
            return res.status(400).json({
                success: false,
                message: "Période ou granularité invalide. Utilisez des dates AAAA-MM-JJ et jour, mois ou annee.",
            });
        }

        const dateFormat = DATE_FORMATS[granularite as GranulariteStatistiquesBancaires];
        const replacements = {
            dateDebut,
            dateFin,
            banques: [...BORDEREAU_BANK_REFERENCES],
        };
        const conditions = `
            statut = 'traite'
            AND datePaiement BETWEEN :dateDebut AND :dateFin
            AND referenceBancaire IN (:banques)
            AND deletedAt IS NULL
        `;

        try {
            const [parBanque, evolution, total] = await Promise.all([
                Bordereau.sequelize!.query(
                    `SELECT referenceBancaire,
                            COUNT(DISTINCT utilisateurId) AS nombreEtudiants,
                            COUNT(*) AS nombrePaiements,
                            COALESCE(SUM(montant), 0) AS montantTotal
                     FROM ins_bordereaux
                     WHERE ${conditions}
                     GROUP BY referenceBancaire
                     ORDER BY referenceBancaire`,
                    { replacements, type: QueryTypes.SELECT }
                ) as Promise<Array<Record<string, unknown>>>,
                Bordereau.sequelize!.query(
                    `SELECT DATE_FORMAT(datePaiement, '${dateFormat}') AS periode,
                            referenceBancaire,
                            COUNT(DISTINCT utilisateurId) AS nombreEtudiants,
                            COALESCE(SUM(montant), 0) AS montantTotal
                     FROM ins_bordereaux
                     WHERE ${conditions}
                     GROUP BY periode, referenceBancaire
                     ORDER BY periode, referenceBancaire`,
                    { replacements, type: QueryTypes.SELECT }
                ) as Promise<Array<Record<string, unknown>>>,
                Bordereau.sequelize!.query(
                    `SELECT COUNT(DISTINCT utilisateurId) AS nombreEtudiants,
                            COUNT(*) AS nombrePaiements,
                            COALESCE(SUM(montant), 0) AS montantTotal
                     FROM ins_bordereaux
                     WHERE ${conditions}`,
                    { replacements, type: QueryTypes.SELECT }
                ) as Promise<Array<Record<string, unknown>>>,
            ]);

            const totalRow = total[0] || {};
            return res.status(200).json({
                success: true,
                data: {
                    totalEtudiants: Number(totalRow.nombreEtudiants) || 0,
                    nombrePaiements: Number(totalRow.nombrePaiements) || 0,
                    montantTotal: Number(totalRow.montantTotal) || 0,
                    parBanque,
                    evolution,
                },
            });
        } catch (error) {
            console.error("[AnalyseBancaire]", error);
            return res.status(500).json({ success: false, message: "Erreur interne" });
        }
    }
}
