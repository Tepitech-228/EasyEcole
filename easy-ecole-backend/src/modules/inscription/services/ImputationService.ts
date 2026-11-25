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
    moisConcerne?: string | null
    /** Montant total de l'échéance (montant dû au barème, jamais le montant imputé). */
    montantEcheance: number
    /** Reste à payer de l'échéance AVANT cette imputation. */
    montantDu: number
    /** Montant imputé par ce paiement sur cette échéance. */
    montantImpute: number
    /** Cumul payé sur l'échéance APRÈS cette imputation (payé antérieur + imputé). */
    montantPayeApres: number
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
    montantPayeCumul?: number
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
 *  - numéro d'échéance croissant, puis date limite et identifiant
 *  - `montantPaye` cumulé → `statut` recalculé (paye / partiel / en_retard / impaye)
 *  - surplus → PortefeuilleCredit (type 'credit')
 *  - consommation du portefeuille → PortefeuilleCredit (type 'consommation')
 *  - transactionnel (toutes les écritures dans la même transaction)
 */
export class ImputationService {

    private static arrondirFcfa(montant: number): number {
        return Math.round(Number(montant) || 0)
    }

    /**
     * Calcule le reste à payer d'une échéance (jamais persisté).
     */
    private static resteApayer(echeance: Echeance): number {
        return Math.max(0, ImputationService.arrondirFcfa(
            Number(echeance.montant) - Number(echeance.montantPaye || 0)
        ))
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
     * triées par priorité : inscription d'abord, puis scolarité, chaque nature par numéro.
     */
    private static async getEcheancesImputables(
        dossierId: number,
        transaction: Transaction,
    ): Promise<Echeance[]> {
        const inscription = await Echeance.findAll({
            where: {
                dossierEtudiantId: dossierId,
                type: 'inscription',
                statut: ['impaye', 'partiel', 'en_retard', 'paye'],
            },
            order: [['numeroEcheance', 'ASC'], ['dateLimite', 'ASC'], ['id', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
        })

        const scolarite = await Echeance.findAll({
            where: {
                dossierEtudiantId: dossierId,
                type: 'scolarite',
                statut: ['impaye', 'partiel', 'en_retard', 'paye'],
            },
            order: [['numeroEcheance', 'ASC'], ['dateLimite', 'ASC'], ['id', 'ASC']],
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

        let reste = ImputationService.arrondirFcfa(montantConstate)
        const lignes: LigneLettrage[] = []
        const echeances = await ImputationService.getEcheancesImputables(dossierId, transaction)

        for (const echeance of echeances) {
            if (reste <= 0) break

            const du = ImputationService.resteApayer(echeance)
            if (du <= 0) continue

            const impute = Math.min(reste, du)
            echeance.montantPaye = ImputationService.arrondirFcfa(Number(echeance.montantPaye || 0) + impute)
            echeance.statut = ImputationService.recalculerStatut(echeance)
            await echeance.save({ transaction })

            await ImputationService.creerLettrage(bordereauId, echeance.id, impute, transaction)

            const apres = ImputationService.resteApayer(echeance)
            lignes.push({
                echeanceId: echeance.id,
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                moisConcerne: echeance.moisConcerne,
                montantEcheance: ImputationService.arrondirFcfa(Number(echeance.montant)),
                montantDu: du,
                montantImpute: impute,
                montantPayeApres: Number(echeance.montantPaye),
                resteApres: apres,
                statutApres: echeance.statut,
            })

            reste = ImputationService.arrondirFcfa(reste - impute)
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
     * Règle métier : le crédit soldera autant d'échéances ENTIÈRES que possible,
     * dans l'ordre FIFO ; le reliquat éventuel paie PARTIELLEMENT l'échéance
     * suivante (statut 'partiel') — le portefeuille est alors soldé à zéro.
     */
    static async consommerPortefeuille(
        dossierId: number,
        transaction: Transaction,
    ): Promise<{ consomme: number; soldeRestant: number; lignes: LigneLettrage[] }> {
        const solde = ImputationService.arrondirFcfa(await ImputationService.getSoldePortefeuille(dossierId, transaction))
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

            // Soldage intégral si possible, sinon paiement partiel final (reliquat)
            const impute = Math.min(reste, du)

            echeance.montantPaye = ImputationService.arrondirFcfa(Number(echeance.montantPaye || 0) + impute)
            echeance.statut = ImputationService.recalculerStatut(echeance)
            await echeance.save({ transaction })

            const apres = ImputationService.resteApayer(echeance)
            lignes.push({
                echeanceId: echeance.id,
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                moisConcerne: echeance.moisConcerne,
                montantEcheance: ImputationService.arrondirFcfa(Number(echeance.montant)),
                montantDu: du,
                montantImpute: impute,
                montantPayeApres: Number(echeance.montantPaye),
                resteApres: apres,
                statutApres: echeance.statut,
            })

            reste = ImputationService.arrondirFcfa(reste - impute)
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
            consomme: ImputationService.arrondirFcfa(solde - reste),
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
        etablissementId?: number,
    ): Promise<{ consomme: number; soldeRestant: number; lignes: LigneLettrage[] }> {
        const dossier = await ImputationService.resoudreDossierCible(utilisateurId, transaction, etablissementId)
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
        return dernier ? ImputationService.arrondirFcfa(dernier.soldeCourant) : 0
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
        etablissementId?: number,
    ): Promise<DossierEtudiant | null> {
        let dossier = await DossierEtudiant.findOne({
            where: { utilisateurId, statut: 'actif', ...(etablissementId ? { etablissementId } : {}) },
            transaction,
        })
        if (!dossier) {
            dossier = await DossierEtudiant.findOne({
                where: { utilisateurId, ...(etablissementId ? { etablissementId } : {}) },
                order: [['id', 'DESC']],
                transaction,
            })
        }
        return dossier
    }

    /**
     * Impute FIFO sur TOUTES les échéances impayées/partielles/en_retard
     * de TOUS les dossiers d'un utilisateur, triées par date limite ↑.
     *
     * Le surplus est crédité sur le portefeuille du dossier cible (dossier actif
     * ou plus récent). Chaque lettrage est tracée via BordereauEcheance.
     */
    /**
     * Impute FIFO sur les échéances impayées/partielles/en_retard des dossiers
     * d'un utilisateur, triées par date limite ↑.
     *
     * @param bordereauId - ID du bordereau validé
     * @param utilisateurId - propriétaire des dossiers
     * @param montantConstate - montant constaté par le comptable
     * @param transaction - transaction active
     * @param type - Restriction à une nature de frais (bordereau de type simple).
     *               Si fourni, seules les échéances de ce type sont imputées (FIFO).
     *               L'excédent qui ne trouve pas d'échéance de ce type part au
     *               portefeuille de crédit (consommé ensuite sur les autres natures).
     */
    static async imputerPourUtilisateur(
        bordereauId: number,
        utilisateurId: number,
        montantConstate: number,
        transaction: Transaction,
        type?: 'inscription' | 'scolarite',
        etablissementId?: number,
        dossierId?: number,
    ): Promise<ResultatImputation> {
        if (!Number.isFinite(montantConstate) || montantConstate <= 0) {
            throw new MontantConstateInvalideError(montantConstate)
        }

        const dossiers = await DossierEtudiant.findAll({
            where: {
                utilisateurId,
                ...(etablissementId ? { etablissementId } : {}),
                ...(dossierId ? { id: dossierId } : {})
            },
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

        // Bordereau de type SIMPLE → restriction à une seule nature de frais.
        // On ne charge que les échéances de ce type. Sans restriction, on charge
        // inscription PUIS scolarité (FIFO trans-natures historique).
        const statutFilter = ['impaye', 'partiel', 'en_retard', 'paye'] as const
        const typeBases: ('inscription' | 'scolarite')[] = type ? [type] : ['inscription', 'scolarite']

        const echeances: Echeance[] = []
        for (const t of typeBases) {
            const echeancesDuType = await Echeance.findAll({
                where: {
                    dossierEtudiantId: { [Op.in]: dossierIds },
                    type: t,
                    statut: statutFilter as any,
                },
                order: [['numeroEcheance', 'ASC'], ['dateLimite', 'ASC'], ['id', 'ASC']],
                transaction,
                lock: transaction.LOCK.UPDATE,
            })
            echeances.push(...echeancesDuType)
        }

        const { lignes, reste } = await ImputationService.calculerImputation(echeances, montantConstate)

        // Sauvegardes effectives
        for (const ligne of lignes) {
            const echeance = echeances.find(e => e.id === ligne.echeanceId)
            if (echeance) {
                echeance.montantPaye = ImputationService.arrondirFcfa(
                    Number(echeance.montantPaye || 0) + ligne.montantImpute
                )
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
     *  - date limite croissante, restreint aux échéances du TYPE déclaré ;
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
        etablissementId?: number,
        dossierId?: number,
    ): Promise<ResultatImputation> {
        const montantTotal = ImputationService.arrondirFcfa(
            composition.reduce((s, c) => s + Number(c.montant || 0), 0)
        )
        if (!composition.length || !Number.isFinite(montantTotal) || montantTotal <= 0) {
            throw new MontantConstateInvalideError(montantTotal)
        }

        const dossiers = await DossierEtudiant.findAll({
            where: {
                utilisateurId,
                ...(etablissementId ? { etablissementId } : {}),
                ...(dossierId ? { id: dossierId } : {})
            },
            transaction,
        })

        const lignes: LigneLettrage[] = []
        let reste = 0
        const registre = new Map<number, Echeance>()

        for (const composante of composition) {
            if (!Number.isFinite(Number(composante.montant)) || Number(composante.montant) <= 0) continue

            if (dossiers.length === 0) {
                reste = ImputationService.arrondirFcfa(reste + Number(composante.montant))
                continue
            }

            const dossierIds = dossiers.map(d => d.id)
            const echeancesDuType = await Echeance.findAll({
                where: {
                    dossierEtudiantId: { [Op.in]: dossierIds },
                    type: composante.type,
                    statut: ['impaye', 'partiel', 'en_retard', 'paye'],
                },
                order: [['numeroEcheance', 'ASC'], ['dateLimite', 'ASC'], ['id', 'ASC']],
                transaction,
                lock: transaction.LOCK.UPDATE,
            })
            for (const e of echeancesDuType) registre.set(e.id, e)

            const { lignes: lignesComposante, reste: resteComposante } =
                await ImputationService.calculerImputation(
                    echeancesDuType,
                    ImputationService.arrondirFcfa(Number(composante.montant))
                )

            lignes.push(...lignesComposante)
            reste = ImputationService.arrondirFcfa(reste + resteComposante)
        }

        // Sauvegardes effectives + lettrages
        for (const ligne of lignes) {
            const echeance = registre.get(ligne.echeanceId)
            if (echeance) {
                echeance.montantPaye = ImputationService.arrondirFcfa(
                    Number(echeance.montantPaye || 0) + ligne.montantImpute
                )
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
     * Impute un paiement DIRECT (paiement d'inscription en espèces / en ligne,
     * saisi au guichet ou via le parcours en ligne) sur les échéances
     * impayées / partielles / en retard des dossiers d'un utilisateur, en FIFO
     * par `dateLimite` croissante.
     *
     * Différence avec `imputerPourUtilisateur` : ce flux est déclenché par un
     * `PaiementInscription` et NON par un bordereau — il n'existe donc aucun
     * `bordereauId`. On n'écrit AUCUNE ligne de lettrage `cpt_bordereau_echeance`
     * (le reste du flux bordereau/ESA-COMPTA n'est pas impacté) : la traçabilité
     * de l'imputation est portée par le `PaiementInscription` appelant (id +
     * montant). Le surplus éventuel est versé au portefeuille de crédit du
     * dossier cible, comme pour le flux bordereau ; il sera consommé ensuite par
     * `consommerPortefeuille` lors du prochain bordereau.
     *
     * @param utilisateurId - propriétaire des dossiers
     * @param montant - montant du paiement direct
     * @param transaction - transaction active
     * @param type - restriction éventuelle à une nature de frais (bordereau simple)
     * @returns ResultatImputation (bordereauId = 0 : aucun bordereau associé)
     */
    static async imputerPaiementDirect(
        utilisateurId: number,
        montant: number,
        transaction: Transaction,
        type?: 'inscription' | 'scolarite',
    ): Promise<ResultatImputation> {
        if (!Number.isFinite(montant) || montant <= 0) {
            throw new MontantConstateInvalideError(montant)
        }

        const dossiers = await DossierEtudiant.findAll({
            where: { utilisateurId },
            transaction,
        })

        if (dossiers.length === 0) {
            return {
                bordereauId: 0,
                montantDisponible: montant,
                lignes: [],
                surplus: montant,
            }
        }

        const dossierIds = dossiers.map(d => d.id)
        const statutFilter = ['impaye', 'partiel', 'en_retard', 'paye'] as const
        const typeBases: ('inscription' | 'scolarite')[] = type ? [type] : ['inscription', 'scolarite']

        const echeances: Echeance[] = []
        for (const t of typeBases) {
            const echeancesDuType = await Echeance.findAll({
                where: {
                    dossierEtudiantId: { [Op.in]: dossierIds },
                    type: t,
                    statut: statutFilter as any,
                },
                order: [['numeroEcheance', 'ASC'], ['dateLimite', 'ASC'], ['id', 'ASC']],
                transaction,
                lock: transaction.LOCK.UPDATE,
            })
            echeances.push(...echeancesDuType)
        }

        const { lignes, reste } = await ImputationService.calculerImputation(echeances, montant)

        // Sauvegardes effectives — SANS lettrage : paiement direct, pas de bordereau.
        for (const ligne of lignes) {
            const echeance = echeances.find(e => e.id === ligne.echeanceId)
            if (echeance) {
                echeance.montantPaye = ImputationService.arrondirFcfa(
                    Number(echeance.montantPaye || 0) + ligne.montantImpute
                )
                echeance.statut = ligne.statutApres
                await echeance.save({ transaction })
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
                null,
                null,
                `Surplus paiement direct utilisateur #${utilisateurId}`,
                transaction
            )
            portefeuilleCreditId = mouvement.id
        }

        return {
            bordereauId: 0,
            montantDisponible: montant,
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
        type?: 'inscription' | 'scolarite',
        etablissementId?: number,
        dossierId?: number,
    ): Promise<ResultatImputation> {
        if (!Number.isFinite(montantConstate) || montantConstate <= 0) {
            throw new MontantConstateInvalideError(montantConstate)
        }

        const dossiers = await DossierEtudiant.findAll({
            where: {
                utilisateurId,
                ...(etablissementId ? { etablissementId } : {}),
                ...(dossierId ? { id: dossierId } : {})
            },
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
        const statutFilter = ['impaye', 'partiel', 'en_retard', 'paye'] as const
        const typeBases: ('inscription' | 'scolarite')[] = type ? [type] : ['inscription', 'scolarite']

        const echeances: Echeance[] = []
        for (const t of typeBases) {
            const echeancesDuType = await Echeance.findAll({
                where: {
                    dossierEtudiantId: { [Op.in]: dossierIds },
                    type: t,
                    statut: statutFilter as any,
                },
                order: [['numeroEcheance', 'ASC'], ['dateLimite', 'ASC'], ['id', 'ASC']],
                transaction,
            })
            echeances.push(...echeancesDuType)
        }

        const { lignes, reste } = await ImputationService.calculerImputation(echeances, montantConstate, true)

        return {
            bordereauId: 0,
            montantDisponible: montantConstate,
            lignes,
            surplus: reste,
        }
    }

    /**
     * Lit le résultat déjà enregistré d'un bordereau traité sans le réimputer.
     */
    static async lireImputationBordereauTraite(
        bordereauId: number,
        dossierId: number | undefined,
        montantConstate: number,
    ): Promise<ResultatImputation> {
        if (!dossierId) {
            return {
                bordereauId,
                montantDisponible: montantConstate,
                lignes: [],
                surplus: montantConstate,
                montantPayeCumul: 0,
            }
        }

        const echeances: Echeance[] = []
        for (const type of ['inscription', 'scolarite'] as const) {
            const echeancesDuType = await Echeance.findAll({
                where: {
                    dossierEtudiantId: dossierId,
                    type,
                    statut: ['impaye', 'partiel', 'en_retard', 'paye'],
                },
                order: [['numeroEcheance', 'ASC'], ['dateLimite', 'ASC'], ['id', 'ASC']],
            })
            echeances.push(...echeancesDuType)
        }

        const lettrages = await BordereauEcheance.findAll({
            where: { bordereauId },
            attributes: ['echeanceId', 'montantImpute'],
        })
        const imputationsParEcheance = new Map<number, number>()
        for (const lettrage of lettrages) {
            const echeanceId = Number(lettrage.echeanceId)
            imputationsParEcheance.set(
                echeanceId,
                ImputationService.arrondirFcfa(
                    (imputationsParEcheance.get(echeanceId) || 0) + Number(lettrage.montantImpute || 0)
                )
            )
        }

        const dernierIndexImpute = echeances.reduce(
            (dernier, echeance, index) => imputationsParEcheance.has(Number(echeance.id)) ? index : dernier,
            -1,
        )
        const lignes = echeances.slice(0, dernierIndexImpute + 1).map(echeance => {
            const montantEcheance = ImputationService.arrondirFcfa(Number(echeance.montant))
            const montantImpute = imputationsParEcheance.get(Number(echeance.id)) || 0
            const montantPayeApres = ImputationService.arrondirFcfa(Number(echeance.montantPaye || 0))
            const resteApres = Math.max(0, montantEcheance - montantPayeApres)

            return {
                echeanceId: Number(echeance.id),
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                moisConcerne: echeance.moisConcerne,
                montantEcheance,
                montantDu: Math.max(0, montantEcheance - Math.max(0, montantPayeApres - montantImpute)),
                montantImpute,
                montantPayeApres,
                resteApres,
                statutApres: ImputationService.recalculerStatutApres(montantPayeApres, echeance),
            }
        })
        const montantImputeTotal = [...imputationsParEcheance.values()]
            .reduce((total, montant) => ImputationService.arrondirFcfa(total + montant), 0)
        const montantPayeCumul = echeances
            .reduce((total, echeance) => ImputationService.arrondirFcfa(total + Number(echeance.montantPaye || 0)), 0)

        return {
            bordereauId,
            montantDisponible: montantConstate,
            lignes,
            surplus: Math.max(0, ImputationService.arrondirFcfa(montantConstate - montantImputeTotal)),
            montantPayeCumul,
        }
    }

    /**
     * Logique de calcul FIFO partagée (sans écriture base).
     */
    private static async calculerImputation(
        echeances: Echeance[],
        montantDisponible: number,
        inclureEcheancesSoldees = false,
    ): Promise<{ lignes: LigneLettrage[]; reste: number }> {
        let reste = ImputationService.arrondirFcfa(montantDisponible)
        const lignes: LigneLettrage[] = []

        for (const echeance of echeances) {
            if (reste <= 0) break

            const du = ImputationService.resteApayer(echeance)
            if (du <= 0) {
                if (inclureEcheancesSoldees) {
                    lignes.push({
                        echeanceId: echeance.id,
                        numeroEcheance: echeance.numeroEcheance,
                        type: echeance.type,
                        moisConcerne: echeance.moisConcerne,
                        montantEcheance: ImputationService.arrondirFcfa(Number(echeance.montant)),
                        montantDu: 0,
                        montantImpute: 0,
                        montantPayeApres: ImputationService.arrondirFcfa(Number(echeance.montantPaye || 0)),
                        resteApres: 0,
                        statutApres: 'paye',
                    })
                }
                continue
            }

            const impute = Math.min(reste, du)
            const nouveauMontantPaye = ImputationService.arrondirFcfa(
                Number(echeance.montantPaye || 0) + impute
            )
            const statutApres = ImputationService.recalculerStatutApres(nouveauMontantPaye, echeance)
            const apres = Math.max(0, ImputationService.arrondirFcfa(Number(echeance.montant) - nouveauMontantPaye))

            lignes.push({
                echeanceId: echeance.id,
                numeroEcheance: echeance.numeroEcheance,
                type: echeance.type,
                moisConcerne: echeance.moisConcerne,
                montantEcheance: ImputationService.arrondirFcfa(Number(echeance.montant)),
                montantDu: du,
                montantImpute: impute,
                montantPayeApres: nouveauMontantPaye,
                resteApres: apres,
                statutApres,
            })

            reste = ImputationService.arrondirFcfa(reste - impute)
        }

        return { lignes, reste }
    }

    private static recalculerStatutApres(montantPaye: number, echeance: Echeance): 'paye' | 'partiel' | 'en_retard' | 'impaye' {
        const reste = ImputationService.arrondirFcfa(Number(echeance.montant) - montantPaye)
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
