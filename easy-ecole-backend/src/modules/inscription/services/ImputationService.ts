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
 * Composante d'un bordereau de type 'mixte' : part du montant constaté
 * affectée à une nature de frais. La somme des composantes doit être égale
 * au montant constaté du bordereau.
 */
export interface CompositionImputation {
    type: 'inscription' | 'scolarite'
    montant: number
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
     * triées par priorité : inscription d'abord, puis scolarité (FIFO par dateLimite).
     */
    private static async getEcheancesImputables(
        dossierId: number,
        transaction: Transaction,
    ): Promise<Echeance[]> {
        const inscription = await Echeance.findAll({
            where: {
                dossierEtudiantId: dossierId,
                type: 'inscription',
                statut: ['impaye', 'partiel', 'en_retard'],
            },
            order: [['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        })

        const scolarite = await Echeance.findAll({
            where: {
                dossierEtudiantId: dossierId,
                type: 'scolarite',
                statut: ['impaye', 'partiel', 'en_retard'],
            },
            order: [['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        })

        return [...inscription, ...scolarite]
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
     *
     * Règle métier : le crédit ne sert qu'à solder des échéances ENTIÈRES.
     * On parcourt les échéances dans l'ordre FIFO ; tant que le solde couvre
     * le reste à payer de l'échéance courante, elle est soldée ; dès que le
     * solde devient inférieur, on S'ARRÊTE (pas de paiement partiel via le
     * portefeuille — la somme dort jusqu'à la prochaine saisie).
     */
    static async consommerPortefeuille(
        dossierId: number,
        transaction: Transaction,
    ): Promise<{ consomme: number; soldeRestant: number; lignes: LigneLettrage[] }> {
        const solde = await ImputationService.getSoldePortefeuille(dossierId, transaction)
        if (solde <= 0) {
            return { consomme: 0, soldeRestant: Math.max(solde, 0), lignes: [] }
        }

        let reste = solde
        const lignes: LigneLettrage[] = []
        const echeances = await ImputationService.getEcheancesImputables(dossierId, transaction)

        for (const echeance of echeances) {
            if (reste <= 0) break

            const du = ImputationService.resteApayer(echeance)
            if (du <= 0) continue

            // Règle « mensualités entières » : si le solde ne couvre pas
            // intégralement cette échéance, on s'arrête là.
            if (reste < du) break

            echeance.montantPaye = echeance.montant
            echeance.statut = ImputationService.recalculerStatut(echeance)
            await echeance.save({ transaction })

            lignes.push({
                echeanceId: echeance.id,
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                montantDu: du,
                montantImpute: du,
                resteApres: 0,
                statutApres: echeance.statut,
            })

            reste = Math.round((reste - du) * 100) / 100
        }

        // Mouvement de consommation
        if (lignes.length > 0) {
            const totalImpute = lignes.reduce((s, l) => s + l.montantImpute, 0)
            await ImputationService.creerMouvementPortefeuille(
                dossierId,
                'consommation',
                -totalImpute,
                reste,
                null,
                null,
                `Consommation portefeuille sur ${lignes.length} échéance(s)`,
                transaction
            )
        }

        return {
            consomme: Math.round((solde - reste) * 100) / 100,
            soldeRestant: reste,
            lignes,
        }
    }

    /**
     * Consomme le portefeuille du dossier cible d'un utilisateur
     * (dossier actif, sinon le plus récent). No-op sans dossier ni crédit.
     */
    static async consommerPortefeuilleUtilisateur(
        utilisateurId: number,
        transaction: Transaction,
    ): Promise<{ consomme: number; soldeRestant: number; lignes: LigneLettrage[] }> {
        const dossier = await ImputationService.resoudreDossierCible(utilisateurId, transaction)
        if (!dossier) {
            return { consomme: 0, soldeRestant: 0, lignes: [] }
        }
        return ImputationService.consommerPortefeuille(dossier.id, transaction)
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
     * ou plus récent). Chaque lettrage est tracée via BordereauEcheance.
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
        const inscription = await Echeance.findAll({
            where: {
                dossierEtudiantId: { [Op.in]: dossierIds },
                type: 'inscription',
                statut: ['impaye', 'partiel', 'en_retard'],
            },
            order: [['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        })

        const scolarite = await Echeance.findAll({
            where: {
                dossierEtudiantId: { [Op.in]: dossierIds },
                type: 'scolarite',
                statut: ['impaye', 'partiel', 'en_retard'],
            },
            order: [['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        })

        const echeances = [...inscription, ...scolarite]
        const { lignes, reste } = await ImputationService.calculerImputation(echeances, montantConstate)

        // Sauvegardes effectives
        for (const ligne of lignes) {
            const echeance = echeances.find(e => e.id === ligne.echeanceId)
            if (echeance) {
                echeance.montantPaye = Math.round((echeance.montantPaye || 0) + ligne.montantImpute)
                echeance.statut = ligne.statutApres
                await echeance.save({ transaction })
                await ImputationService.creerLettrage(bordereauId, echeance.id, ligne.montantImpute, transaction)
            }
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

    /**
     * Imputation par COMPOSITION (bordereau de type 'mixte').
     *
     * Chaque composante déclarée par ESA-COMPTA est imputée séparément :
     *  - FIFO dateLimite croissante, restreinte aux échéances du TYPE déclaré ;
     *  - plafonnée au montant DE la composante (pas de débordement d'une nature
     *    de frais vers l'autre) ;
     *  - une composante dont les échéances sont déjà soldées (ou inexistantes)
     *    alimente le portefeuille de crédit, comme un surplus.
     *
     * @param bordereauId - ID du bordereau mixte
     * @param utilisateurId - propriétaire des dossiers
     * @param composition - répartition [{type, montant}] (somme = montant constaté, validée en amont)
     * @param transaction - transaction active
     */
    static async imputerPourUtilisateurParComposition(
        bordereauId: number,
        utilisateurId: number,
        composition: CompositionImputation[],
        transaction: Transaction,
    ): Promise<ResultatImputation> {
        const montantTotal = Math.round(composition.reduce((s, c) => s + Number(c.montant || 0), 0) * 100) / 100
        if (!composition.length || !Number.isFinite(montantTotal) || montantTotal <= 0) {
            throw new MontantConstateInvalideError(montantTotal)
        }

        const dossiers = await DossierEtudiant.findAll({
            where: { utilisateurId },
            transaction,
        })

        const lignes: LigneLettrage[] = []
        let reste = 0
        const registre = new Map<number, Echeance>()

        for (const composante of composition) {
            if (!Number.isFinite(Number(composante.montant)) || Number(composante.montant) <= 0) continue

            if (dossiers.length === 0) {
                reste = Math.round((reste + Number(composante.montant)) * 100) / 100
                continue
            }

            const dossierIds = dossiers.map(d => d.id)
            const echeancesDuType = await Echeance.findAll({
                where: {
                    dossierEtudiantId: { [Op.in]: dossierIds },
                    type: composante.type,
                    statut: ['impaye', 'partiel', 'en_retard'],
                },
                order: [['dateLimite', 'ASC'], ['id', 'ASC']],
                transaction,
                lock: transaction.LOCK.UPDATE,
            })
            for (const e of echeancesDuType) registre.set(e.id, e)

            const { lignes: lignesComposante, reste: resteComposante } =
                await ImputationService.calculerImputation(echeancesDuType, Number(composante.montant))

            lignes.push(...lignesComposante)
            reste = Math.round((reste + resteComposante) * 100) / 100
        }

        // Sauvegardes effectives + lettrages
        for (const ligne of lignes) {
            const echeance = registre.get(ligne.echeanceId)
            if (echeance) {
                echeance.montantPaye = Math.round((echeance.montantPaye || 0) + ligne.montantImpute)
                echeance.statut = ligne.statutApres
                await echeance.save({ transaction })
                await ImputationService.creerLettrage(bordereauId, echeance.id, ligne.montantImpute, transaction)
            }
        }

        // Reste (composantes non consommables) → portefeuille de crédit
        const dossierCible = dossiers.find(d => d.statut === 'actif') ?? dossiers[0]
        let portefeuilleCreditId: number | undefined

        if (reste > 0 && dossierCible) {
            const mouvement = await ImputationService.creerMouvementPortefeuille(
                dossierCible.id,
                'credit',
                reste,
                reste,
                bordereauId,
                null,
                `Surplus composition bordereau #${bordereauId}`,
                transaction
            )
            portefeuilleCreditId = mouvement.id
        }

        return {
            bordereauId,
            montantDisponible: montantTotal,
            lignes,
            surplus: reste,
            portefeuilleCreditId,
        }
    }

    /**
     * Simulation pure (read-only) de l'imputation FIFO.
     * Ne fait aucune écriture en base : pas de save(), pas de lettrage, pas de portefeuille.
     */
    static async simulerPourUtilisateur(
        utilisateurId: number,
        montantConstate: number,
        transaction?: Transaction,
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
                bordereauId: 0,
                montantDisponible: montantConstate,
                lignes: [],
                surplus: montantConstate,
            }
        }

        const dossierIds = dossiers.map(d => d.id)
        const inscription = await Echeance.findAll({
            where: {
                dossierEtudiantId: { [Op.in]: dossierIds },
                type: 'inscription',
                statut: ['impaye', 'partiel', 'en_retard'],
            },
            order: [['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
        })

        const scolarite = await Echeance.findAll({
            where: {
                dossierEtudiantId: { [Op.in]: dossierIds },
                type: 'scolarite',
                statut: ['impaye', 'partiel', 'en_retard'],
            },
            order: [['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
        })

        const echeances = [...inscription, ...scolarite]
        const { lignes, reste } = await ImputationService.calculerImputation(echeances, montantConstate)

        return {
            bordereauId: 0,
            montantDisponible: montantConstate,
            lignes,
            surplus: reste,
        }
    }

    /**
     * Logique de calcul FIFO partagée (sans écriture base).
     */
    private static async calculerImputation(
        echeances: Echeance[],
        montantDisponible: number,
    ): Promise<{ lignes: LigneLettrage[]; reste: number }> {
        let reste = Math.round(montantDisponible * 100) / 100
        const lignes: LigneLettrage[] = []

        for (const echeance of echeances) {
            if (reste <= 0) break

            const du = ImputationService.resteApayer(echeance)
            if (du <= 0) continue

            const impute = Math.min(reste, du)
            const nouveauMontantPaye = Math.round((echeance.montantPaye || 0) + impute)
            const statutApres = ImputationService.recalculerStatutApres(nouveauMontantPaye, echeance)
            const apres = Math.round((echeance.montant - nouveauMontantPaye) * 100) / 100

            lignes.push({
                echeanceId: echeance.id,
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                montantDu: du,
                montantImpute: impute,
                resteApres: apres,
                statutApres,
            })

            reste = Math.round((reste - impute) * 100) / 100
        }

        return { lignes, reste }
    }

    private static recalculerStatutApres(montantPaye: number, echeance: Echeance): 'paye' | 'partiel' | 'en_retard' | 'impaye' {
        const reste = Math.round((echeance.montant - montantPaye) * 100) / 100
        if (reste <= 0) return 'paye'
        if (montantPaye > 0) return 'partiel'
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const limite = new Date(echeance.dateLimite)
        limite.setHours(0, 0, 0, 0)
        if (limite < today) return 'en_retard'
        return 'impaye'
    }
}
