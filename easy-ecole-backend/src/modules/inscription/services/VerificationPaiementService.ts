import { DossierEtudiant } from "../models/DossierEtudiant"
import { Echeance } from "../models/Echeance"

export interface VerificationPaiementResult {
    statut: 'vert' | 'rouge'
    echeancesEnRetard: number
    echeancesRestantes: Echeance[]
    message: string
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
        const dossier = await DossierEtudiant.findOne({
            where: { utilisateurId: utilisateurId as any },
            include: [{
                association: DossierEtudiant.associations.echeances
            }]
        })

        if (!dossier) {
            return {
                statut: 'rouge',
                echeancesEnRetard: 0,
                echeancesRestantes: [],
                message: 'Dossier étudiant introuvable'
            }
        }

        return VerificationPaiementService.verifierDossier(dossier)
    }
}
