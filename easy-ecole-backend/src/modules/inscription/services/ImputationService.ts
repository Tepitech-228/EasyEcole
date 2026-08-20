import { Transaction } from "sequelize";
import { Op } from "sequelize";
import { Echeance } from "../models/Echeance";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Bordereau } from "../models/Bordereau";
import { BordereauEcheance } from "../../comptabilite/models/BordereauEcheance";
import { PortefeuilleCredit } from "../../comptabilite/models/PortefeuilleCredit";

/**
 * Ligne de lettrage générée par l'imputation FIFO.
 */
export interface LigneLettrage {
    echeanceId: number
    numeroEcheance: number
    type: 'inscription' | 'scolarite'
    montantDu: number
    montantImpute: number
    resteApres: number
    statutApres: 'paye' | 'partiel' | 'en_retard' | 'impaye'
}

/**
 * Résultat de la cascade d'imputation.
 */
export interface ResultatImputation {
    bordereauId: number
    montantDisponible: number
    lignes: LigneLettrage[]
    surplus: number
    portefeuilleCreditId?: number
}

/**
 * Erreur métier : montant constaté invalide ou négatif.
 */
export class MontantConstateInvalideError extends Error {
    constructor(public readonly montant: number) {
        super(`Montant constaté invalide : ${montant}`)
        this.name = "MontantConstateInvalideError"
    }
}

/**
 * Service d'imputation en cascade FIFO des bordereaux sur les échéances.
 *
 * Règles métier :
 *  - FIFO sur dateLimite croissante (toutes années, toutes échéances impayées/partielles du dossier)
 *  - `montantPaye` cumulé → `statut` recalculé (paye / partiel / en_retard / impaye)
 *  - surplus → PortefeuilleCredit (type 'credit')
 *  - consommation du portefeuille → PortefeuilleCredit (type 'consommation')
 *  - transactionnel (toutes les écritures dans la même transaction)
 */
export class ImputationService {

    /**
     * Calcule le reste à payer d'une échéance (jamais persisté).
     */
    private static resteApayer(echeance: Echeance): number {
        return Math.round((echeance.montant - (echeance.montantPaye || 0)) * 100) / 100
    }

    /**
     * Recalcule le statut d'une échéance après imputation.
     */
    private static recalculerStatut(echeance: Echeance): 'paye' | 'partiel' | 'en_retard' | 'impaye' {
        const reste = ImputationService.resteApayer(echeance)
        if (reste <= 0) return 'paye'
        if (echeance.montantPaye > 0) return 'partiel'
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const limite = new Date(echeance.dateLimite)
        limite.setHours(0, 0, 0, 0)
        if (limite < today) return 'en_retard'
        return 'impaye'
    }

    /**
     * Récupère toutes les échéances imputables d'un dossier (impayées ou partielles),
     * triées par dateLimite croissante (FIFO), toutes années confondues.
     */
    private static async getEcheancesImputables(
        dossierId: number,
        transaction: Transaction,
    ): Promise<Echeance[]> {
        return Echeance.findAll({
            where: {
                dossierEtudiantId: dossierId,
                statut: ['impaye', 'partiel', 'en_retard'],
            },
            order: [['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        })
    }

    /**
     * Crée une ligne de lettrage BordereauEcheance.
     */
    private static async creerLettrage(
        bordereauId: number,
        echeanceId: number,
        montantImpute: number,
        transaction: Transaction,
    ): Promise<void> {
        await BordereauEcheance.findOrCreate({
            where: { bordereauId, echeanceId },
            defaults: { bordereauId, echeanceId, montantImpute },
            transaction,
        })
    }

    /**
     * Crée un mouvement PortefeuilleCredit.
     */
    private static async creerMouvementPortefeuille(
        dossierEtudiantId: number,
        type: 'credit' | 'consommation' | 'ajustement',
        montant: number,
        soldeCourant: number,
        bordereauId: number | null,
        echeanceId: number | null,
        commentaire: string | null,
        transaction: Transaction,
    ): Promise<PortefeuilleCredit> {
        return PortefeuilleCredit.create({
            dossierEtudiantId,
            type,
            montant,
            soldeCourant,
            bordereauId,
            echeanceId,
            commentaire,
        }, { transaction })
    }

    /**
     * Effectue l'imputation FIFO d'un montant constaté sur les échéances d'un dossier.
     *
     * @param bordereauId - ID du bordereau validé
     * @param dossierId - ID du dossier étudiant
     * @param montantConstate - montant constaté par le comptable
     * @param transaction - transaction active
     * @returns ResultatImputation
     */
    static async imputer(
        bordereauId: number,
        dossierId: number,
        montantConstate: number,
        transaction: Transaction,
    ): Promise<ResultatImputation> {
        if (!Number.isFinite(montantConstate) || montantConstate <= 0) {
            throw new MontantConstateInvalideError(montantConstate)
        }

        let reste = Math.round(montantConstate * 100) / 100
        const lignes: LigneLettrage[] = []
        const echeances = await ImputationService.getEcheancesImputables(dossierId, transaction)

        for (const echeance of echeances) {
            if (reste <= 0) break

            const du = ImputationService.resteApayer(echeance)
            if (du <= 0) continue

            const impute = Math.min(reste, du)
            echeance.montantPaye = Math.round((echeance.montantPaye || 0) + impute)
            echeance.statut = ImputationService.recalculerStatut(echeance)
            await echeance.save({ transaction })

            await ImputationService.creerLettrage(bordereauId, echeance.id, impute, transaction)

            const apres = ImputationService.resteApayer(echeance)
            lignes.push({
                echeanceId: echeance.id,
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                montantDu: du,
                montantImpute: impute,
                resteApres: apres,
                statutApres: echeance.statut,
            })

            reste = Math.round((reste - impute) * 100) / 100
        }

        // Surplus → portefeuille de crédit
        let portefeuilleCreditId: number | undefined
        if (reste > 0) {
            const mouvement = await ImputationService.creerMouvementPortefeuille(
                dossierId,
                'credit',
                reste,
                reste,
                bordereauId,
                null,
                `Surplus bordereau #${bordereauId}`,
                transaction
            )
            portefeuilleCreditId = mouvement.id
        }

        return {
            bordereauId,
            montantDisponible: montantConstate,
            lignes,
            surplus: reste,
            portefeuilleCreditId,
        }
    }

    /**
     * Consomme le portefeuille de crédit sur les échéances impayées (FIFO).
     * Appelé lors de la validation d'un bordereau quand le portefeuille a un solde.
     */
    static async consommerPortefeuille(
        dossierId: number,
        transaction: Transaction,
    ): Promise<{ consomme: number; lignes: LigneLettrage[] }> {
        const solde = await ImputationService.getSoldePortefeuille(dossierId, transaction)
        if (solde <= 0) {
            return { consomme: 0, lignes: [] }
        }

        let reste = solde
        const lignes: LigneLettrage[] = []
        const echeances = await ImputationService.getEcheancesImputables(dossierId, transaction)

        for (const echeance of echeances) {
            if (reste <= 0) break

            const du = ImputationService.resteApayer(echeance)
            if (du <= 0) continue

            const impute = Math.min(reste, du)
            echeance.montantPaye = Math.round((echeance.montantPaye || 0) + impute)
            echeance.statut = ImputationService.recalculerStatut(echeance)
            await echeance.save({ transaction })

            const apres = ImputationService.resteApayer(echeance)
            lignes.push({
                echeanceId: echeance.id,
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                montantDu: du,
                montantImpute: impute,
                resteApres: apres,
                statutApres: echeance.statut,
            })

            reste = Math.round((reste - impute) * 100) / 100
        }

        // Mouvement de consommation
        if (lignes.length > 0) {
            const totalImpute = lignes.reduce((s, l) => s + l.montantImpute, 0)
            const nouveauSolde = Math.round((solde - totalImpute) * 100) / 100
            await ImputationService.creerMouvementPortefeuille(
                dossierId,
                'consommation',
                -totalImpute,
                nouveauSolde,
                null,
                null,
                'Consommation portefeuille sur échéances',
                transaction
            )
        }

        return {
            consomme: solde - reste,
            lignes,
        }
    }

    /**
     * Calcule le solde actuel du portefeuille de crédit d'un dossier.
     */
    static async getSoldePortefeuille(
        dossierId: number,
        transaction?: Transaction,
    ): Promise<number> {
        const dernier = await PortefeuilleCredit.findOne({
            where: { dossierEtudiantId: dossierId },
            order: [['createdAt', 'DESC']],
            transaction,
        })
        return dernier ? Math.round(dernier.soldeCourant * 100) / 100 : 0
    }

    /**
     * Résout le dossier "cible" pour un utilisateur :
     * - d'abord le dossier actif ;
     * - sinon le plus récent (id décroissant).
     * Retourne null si aucun dossier.
     */
    private static async resoudreDossierCible(
        utilisateurId: number,
        transaction: Transaction,
    ): Promise<DossierEtudiant | null> {
        let dossier = await DossierEtudiant.findOne({
            where: { utilisateurId, statut: 'actif' },
            transaction,
        })
        if (!dossier) {
            dossier = await DossierEtudiant.findOne({
                where: { utilisateurId },
                order: [['id', 'DESC']],
                transaction,
            })
        }
        return dossier
    }

    /**
     * Impute FIFO sur TOUTES les échéances impayées/partielles/en_retard
     * de TOUS les dossiers d'un utilisateur, triées par dateLimite ↑ (trans-années).
     *
     * Le surplus est crédité sur le portefeuille du dossier cible (dossier actif
     * ou plus récent). Chaque lettrage est tracé via BordereauEcheance.
     */
    static async imputerPourUtilisateur(
        bordereauId: number,
        utilisateurId: number,
        montantConstate: number,
        transaction: Transaction,
    ): Promise<ResultatImputation> {
        if (!Number.isFinite(montantConstate) || montantConstate <= 0) {
            throw new MontantConstateInvalideError(montantConstate)
        }

        const dossiers = await DossierEtudiant.findAll({
            where: { utilisateurId },
            transaction,
        })

        if (dossiers.length === 0) {
            return {
                bordereauId,
                montantDisponible: montantConstate,
                lignes: [],
                surplus: montantConstate,
            }
        }

        const dossierIds = dossiers.map(d => d.id)
        const echeances = await Echeance.findAll({
            where: {
                dossierEtudiantId: { [Op.in]: dossierIds },
                statut: ['impaye', 'partiel', 'en_retard'],
            },
            order: [['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        })

        let reste = Math.round(montantConstate * 100) / 100
        const lignes: LigneLettrage[] = []

        for (const echeance of echeances) {
            if (reste <= 0) break

            const du = ImputationService.resteApayer(echeance)
            if (du <= 0) continue

            const impute = Math.min(reste, du)
            echeance.montantPaye = Math.round((echeance.montantPaye || 0) + impute)
            echeance.statut = ImputationService.recalculerStatut(echeance)
            await echeance.save({ transaction })

            await ImputationService.creerLettrage(bordereauId, echeance.id, impute, transaction)

            const apres = ImputationService.resteApayer(echeance)
            lignes.push({
                echeanceId: echeance.id,
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                montantDu: du,
                montantImpute: impute,
                resteApres: apres,
                statutApres: echeance.statut,
            })

            reste = Math.round((reste - impute) * 100) / 100
        }

        const dossierCible = dossiers.find(d => d.statut === 'actif') ?? dossiers[0]
        let portefeuilleCreditId: number | undefined

        if (reste > 0) {
            const mouvement = await ImputationService.creerMouvementPortefeuille(
                dossierCible.id,
                'credit',
                reste,
                reste,
                bordereauId,
                null,
                `Surplus bordereau #${bordereauId}`,
                transaction
            )
            portefeuilleCreditId = mouvement.id
        }

        return {
            bordereauId,
            montantDisponible: montantConstate,
            lignes,
            surplus: reste,
            portefeuilleCreditId,
        }
    }
}
