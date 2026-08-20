import { Request, Response } from "express";
import { Transaction, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { ImputationService } from "../services/ImputationService";

export interface PeutSeReinscrireResponse {
    autorise: boolean
    soldeDette: number
    details: {
        dossierId: number
        matricule: string
        nbEcheancesImpayees: number
        nbEcheancesPartielles: number
        nbEcheancesEnRetard: number
        lignes: Array<{
            id: number
            type: string
            numero: number
            montant: number
            montantPaye: number
            reste: number
            dateLimite: string
            statut: string
        }>
    } | null
}

/**
 * Contrôleur de vérification de réinscription.
 *
 * Bloque la réinscription si l'étudiant a une dette antérieure > 0.
 * Retourne { autorise, soldeDette, details }.
 */
export default class ReinscriptionController {

    static async peutSeReinscrire(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        const userId = (req as any).utilisateurId

        if (role !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Accès réservé aux étudiants" })
        }

        const transaction = await (await import("../../../core/helpers/DatabaseConnection")).DatabaseConnection.getInstance().sequelize.transaction()

        try {
            const dossiers = await DossierEtudiant.findAll({
                where: { utilisateurId: userId },
                transaction,
            })

            if (dossiers.length === 0) {
                await transaction.commit()
                return res.status(200).json({
                    autorise: true,
                    soldeDette: 0,
                    details: null,
                } as PeutSeReinscrireResponse)
            }

            const echeances = await Echeance.findAll({
                where: {
                    dossierEtudiantId: { [Op.in]: dossiers.map(d => d.id) },
                    statut: ['impaye', 'partiel', 'en_retard'],
                },
                order: [['dateLimite', 'ASC']],
                transaction,
            })

            const soldeDette = echeances.reduce((s, e) => s + (e.montant - (e.montantPaye || 0)), 0)
            const autorise = soldeDette <= 0

            const lignes = echeances.map(e => ({
                id: e.id,
                type: e.type,
                numero: e.numeroEcheance,
                montant: e.montant,
                montantPaye: e.montantPaye || 0,
                reste: e.montant - (e.montantPaye || 0),
                dateLimite: String(e.dateLimite),
                statut: e.statut,
                dossierId: e.dossierEtudiantId,
            }))

            await transaction.commit()

            return res.status(200).json({
                autorise,
                soldeDette: Math.round(soldeDette * 100) / 100,
                details: {
                    dossierId: dossiers[0].id,
                    matricule: dossiers[0].matricule,
                    nbDossiers: dossiers.length,
                    nbEcheancesImpayees: echeances.filter(e => e.statut === 'impaye').length,
                    nbEcheancesPartielles: echeances.filter(e => e.statut === 'partiel').length,
                    nbEcheancesEnRetard: echeances.filter(e => e.statut === 'en_retard').length,
                    lignes,
                },
            } as PeutSeReinscrireResponse)
        } catch (error) {
            await transaction.rollback()
            console.error('[peutSeReinscrire]', error)
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
        }
    }
}
