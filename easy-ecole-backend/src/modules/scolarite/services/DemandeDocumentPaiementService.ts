import { Request } from "express";
import { Bordereau } from "../../inscription/models/Bordereau";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";
import { DemandeDocument } from "../models/DemandeDocument";

/**
 * Préfixe utilisé comme référence (referenceBancaire) sur les bordereaux de paiement
 * générés pour une demande de document payante.
 */
export const REFERENCE_BORDEREAU_PREFIX: string = 'demande-document-'

export default class DemandeDocumentPaiementService {

    constructor() { }

    /**
     * Récupère le bordereau de paiement lié à une demande de document (via la référence).
     */
    static async trouverBordereauDemande(demande: DemandeDocument): Promise<Bordereau | null> {
        return Bordereau.findOne({
            where: { referenceBancaire: `${REFERENCE_BORDEREAU_PREFIX}${demande.id}` }
        })
    }

    /**
     * Crée un bordereau de paiement pour une demande de document payante.
     * Reprend le pattern de BordereauController.createBordereau : le bordereau est
     * lié à l'étudiant demandeur, avec un montant égal au frais paramétré sur le
     * TypeDocument, en statut 'en_attente' (en attente d'encaissement/validation).
     */
    static async creerBordereauPourDemande(demande: DemandeDocument, utilisateurId: number | undefined): Promise<Bordereau> {
        let bordereau: Bordereau = new Bordereau();
        bordereau.type = 'scolarite'
        bordereau.utilisateurId = demande.etudiantId
        bordereau.fichier = `demande-document-${demande.id}.pdf`
        bordereau.montant = Number(demande.montant) || 0
        bordereau.referenceBancaire = `${REFERENCE_BORDEREAU_PREFIX}${demande.id}`
        bordereau.statut = 'en_attente'
        bordereau.dateSoumission = new Date()

        await bordereau.save()
        return bordereau
    }

    /**
     * Confirme le paiement d'une demande de document (encaissement physique par un
     * caissier / l'institution). Marque la demande comme payée et renseigne le
     * paiementId (référence vers le paiement / le bordereau).
     */
    static async confirmerPaiement(demande: DemandeDocument, opts: { paiementId?: number | string | null }): Promise<DemandeDocument> {
        let paiementId: number | null = null

        if (opts.paiementId) {
            const parsed = Number(opts.paiementId)
            if (Number.isFinite(parsed) && parsed > 0) {
                paiementId = parsed
            }
        }

        if (paiementId == null) {
            const bordereau = await this.trouverBordereauDemande(demande)
            paiementId = bordereau ? bordereau.id : null
        }

        await demande.update({ fraisPayes: true, paiementId })
        return demande
    }

    /**
     * Confirme un paiement en ligne : valide (ou crée) le bordereau de référence,
     * génère automatiquement l'écriture comptable via le service d'écritures de
     * BordereauController, puis marque la demande comme payée.
     */
    static async confirmerPaiementAuto(demande: DemandeDocument, req: Request): Promise<DemandeDocument> {
        let bordereau = await this.trouverBordereauDemande(demande)
        if (!bordereau) {
            bordereau = await this.creerBordereauPourDemande(demande, (req as any).utilisateurId)
        }

        // Le paiement en ligne vaut validation du bordereau (plus de contrôle manuel)
        bordereau.statut = 'valide'
        bordereau.dateValidation = new Date()
        bordereau.valideParId = (req as any).utilisateurId
        await bordereau.save()

        // Écriture comptable automatique (non bloquante, comme dans BordereauController)
        try {
            await creerEcritureComptable({
                req,
                journalCode: 'VEN',
                compteDebitNumero: '512',
                compteCreditNumero: demande.compteProduit || '704',
                montant: bordereau.montant ?? 0,
                libelle: `Paiement en ligne demande de document #${demande.id}`,
                reference: bordereau.referenceBancaire ?? `bordereau-${bordereau.id}`,
                moduleSource: 'scolarite',
                referenceModuleId: String(demande.id)
            })
        } catch (comptaError) {
            console.error("Erreur écriture comptable (non bloquante):", comptaError)
        }

        await demande.update({ fraisPayes: true, paiementId: bordereau.id })
        return demande
    }
}
