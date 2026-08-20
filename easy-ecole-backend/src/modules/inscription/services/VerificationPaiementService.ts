import { DossierEtudiant } from "../models/DossierEtudiant"
import { Echeance } from "../models/Echeance"

export interface VerificationPaiementResult {
    statut: 'vert' | 'rouge'
    echeancesEnRetard: number
    echeancesRestantes: Echeance[]
    message: string
}

/**
 * Résultat enrichi renvoyé par GET /inscription/paiement/statut :
 * ajoute le montant total restant dû et la prochaine échéance à régler.
 */
export interface StatutPaiementDetail extends VerificationPaiementResult {
    montantRestant: number
    prochaineEcheance: { dateLimite: string | Date, montant: number } | null
}

/**
 * Vérification de paiement partagée entre le scan de présence
 * (PresenceController.scanPresence) et le scan de pointage
 * (PointageController.verifierStatutByQR).
 * Règle de référence : une échéance est considérée en retard si son statut
 * est 'impaye' | 'en_retard' ET que sa dateLimite est passée (dateLimite <= now).
 */
export class VerificationPaiementService {

    /**
     * Vérifie le statut de paiement d'un dossier étudiant déjà chargé (avec ses échéances).
     */
    static verifierDossier(dossier: DossierEtudiant): VerificationPaiementResult {
        if (dossier.statut == 'suspendu' || dossier.statut == 'archive') {
            return {
                statut: 'rouge',
                echeancesEnRetard: 0,
                echeancesRestantes: [],
                message: `Dossier ${dossier.statut}`
            }
        }

        const now = new Date()
        const echeancesImpayees = (dossier.echeances || []).filter(
            e => (e.statut == 'impaye' || e.statut == 'en_retard') && new Date(e.dateLimite) <= now
        )

        if (echeancesImpayees.length > 0) {
            const premiereImpayee = echeancesImpayees[0]
            return {
                statut: 'rouge',
                echeancesEnRetard: echeancesImpayees.length,
                echeancesRestantes: echeancesImpayees,
                message: `Échéance mois ${premiereImpayee.numeroEcheance} ${premiereImpayee.statut == 'en_retard' ? 'en retard' : 'impayée'}`
            }
        }

        return {
            statut: 'vert',
            echeancesEnRetard: 0,
            echeancesRestantes: [],
            message: 'Accès autorisé'
        }
    }

    /**
     * Charge le dossier de l'étudiant par utilisateurId puis applique la vérification.
     */
    static async verifierPaiement(utilisateurId: string | number): Promise<VerificationPaiementResult> {
        const include = DossierEtudiant.associations?.echeances
            ? [{ association: DossierEtudiant.associations.echeances }]
            : undefined

        const dossier = await DossierEtudiant.findOne({
            where: { utilisateurId: utilisateurId as any },
            include
        })

        if (!dossier) {
            return {
                statut: 'vert',
                echeancesEnRetard: 0,
                echeancesRestantes: [],
                message: 'Aucun dossier étudiant à vérifier — accès standard autorisé'
            }
        }

        return VerificationPaiementService.verifierDossier(dossier)
    }

    /**
     * Variante pour l'endpoint public étudiant/parent GET /inscription/paiement/statut :
     * retourne le résultat de verification enrichi de `montantRestant`
     * (somme de TOUTES les échéances impayées, passées ou à venir) et de
     * `prochaineEcheance` (échéance impayée dont la date limite est la plus proche).
     */
    static async verifierEtEnrichir(utilisateurId: string | number): Promise<StatutPaiementDetail> {
        const include = DossierEtudiant.associations?.echeances
            ? [{ association: DossierEtudiant.associations.echeances }]
            : undefined

        const dossier = await DossierEtudiant.findOne({
            where: { utilisateurId: utilisateurId as any },
            include
        })

        if (!dossier) {
            return {
                statut: 'vert',
                echeancesEnRetard: 0,
                echeancesRestantes: [],
                message: 'Aucun dossier étudiant à vérifier — accès standard autorisé',
                montantRestant: 0,
                prochaineEcheance: null,
            }
        }

        const resultat = VerificationPaiementService.verifierDossier(dossier)

        const impayees = (dossier.echeances || []).filter(
            e => e.statut == 'impaye' || e.statut == 'en_retard'
        )
        const montantRestant = impayees.reduce((somme, e) => somme + (e.montant || 0), 0)

        let prochaineEcheance: { dateLimite: string | Date, montant: number } | null = null
        if (impayees.length > 0) {
            const [laPlusProche] = [...impayees].sort(
                (a, b) => new Date(a.dateLimite).getTime() - new Date(b.dateLimite).getTime()
            )
            prochaineEcheance = { dateLimite: laPlusProche.dateLimite, montant: laPlusProche.montant }
        }

        return { ...resultat, montantRestant, prochaineEcheance }
    }
}
