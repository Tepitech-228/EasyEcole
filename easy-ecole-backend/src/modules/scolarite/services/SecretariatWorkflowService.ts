import { Transaction } from "sequelize";
import { DemandeDocument } from "../models/DemandeDocument";
import { JournalSecretariat } from "../models/JournalSecretariat";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { EmailSender } from "../../../core/helpers/EmailSender";

/**
 * Erreur métier du workflow secrétariat.
 * - code        : identifiant stable exploitable par le frontend
 * - httpStatus  : statut HTTP à renvoyer (400 par défaut)
 */
export class ErreurWorkflow extends Error {
    constructor(public code: string, message: string, public httpStatus: number = 400) {
        super(message);
        this.name = 'ErreurWorkflow';
    }
}

export class SecretariatWorkflowService {

    /**
     * Journal de traçabilité — fait partie intégrante de la transaction métier :
     * si l'écriture du journal échoue, l'action entière est annulée (et inversement).
     */
    private static async journaliser(action: string, utilisateurId: number | null, demandeDocumentId: number | null, details: string | null, transaction?: Transaction): Promise<void> {
        await JournalSecretariat.create({ action, utilisateurId, demandeDocumentId, details }, { transaction });
    }

    static async passerEnPreparation(demande: DemandeDocument, utilisateurId: number | null): Promise<DemandeDocument> {
        if (demande.statut !== 'paye') {
            throw new ErreurWorkflow('STATUT_INVALIDE', "La demande doit être payée avant préparation");
        }
        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            const updated = await demande.update({
                statut: 'en_preparation',
                datePreparation: new Date()
            }, { transaction });
            await this.journaliser('EN_PREPARATION', utilisateurId, demande.id,
                `Document ${demande.typeDocument?.libelle || demande.id} mis en préparation`, transaction);
            await transaction.commit();
            return updated;
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    }

    static async genererDocument(demande: DemandeDocument, utilisateurId: number | null): Promise<DemandeDocument> {
        if (demande.statut !== 'en_preparation') {
            throw new ErreurWorkflow('STATUT_INVALIDE', "La demande doit être en préparation avant génération");
        }
        if (!demande.fraisPayes && Number(demande.montant) > 0) {
            throw new ErreurWorkflow('PAIEMENT_REQUIS', "Paiement requis avant génération du document");
        }

        // Génération PDF — le succès n'est acquis qu'après vérification du fichier sur disque.
        // En cas d'échec : aucun changement de statut (pas de faux « document prêt »).
        const typeDocument = demande.typeDocument;
        let filename: string;
        try {
            filename = await DocumentPDFGenerator.generateDocumentVerifie(
                demande.id,
                typeDocument?.libelle || 'Document',
                "public/scolarite/documents/"
            );
        } catch (e: any) {
            console.error('[WORKFLOW][GENERATION_PDF] demande:', demande.id, 'erreur:', e?.message || e);
            throw new ErreurWorkflow('PDF_GENERATION_FAILED', "La génération du fichier PDF a échoué", 500);
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            const updated = await demande.update({
                statut: 'document_pret',
                dateGeneration: new Date(),
                fichierPDF: filename
            }, { transaction });

            await this.journaliser('DOCUMENT_GENERE', utilisateurId, demande.id, `Document généré: ${filename}`, transaction);

            // Notification email secondaire : ne bloque PAS l'opération métier,
            // mais tout échec est tracé dans le journal (identifiable + retentable).
            if (demande.etudiant?.email) {
                try {
                    await EmailSender.getInstance().sendMail({
                        to: demande.etudiant.email,
                        subject: "Document prêt",
                        text: `Votre document ${typeDocument?.libelle || ''} est prêt. Vous pouvez venir le retirer au secrétariat.`
                    });
                } catch (emailErr) {
                    console.error('[WORKFLOW][EMAIL] envoi impossible à', demande.etudiant.email, ':', emailErr);
                    await this.journaliser('EMAIL_ECHEC', utilisateurId, demande.id,
                        `Notification non envoyée à ${demande.etudiant.email}`, transaction);
                }
            }

            await transaction.commit();
            return updated;
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    }

    static async confirmerImpression(demande: DemandeDocument, utilisateurId: number | null): Promise<DemandeDocument> {
        if (demande.statut !== 'document_pret') {
            throw new ErreurWorkflow('STATUT_INVALIDE', "Le document doit être prêt avant impression");
        }
        if (!demande.fichierPDF) {
            throw new ErreurWorkflow('FICHIER_ABSENT', "Aucun fichier généré pour cette demande");
        }

        const nbImpressions = (demande.nbImpressions || 0) + 1;
        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            const updated = await demande.update({
                dateImpression: new Date(),
                nbImpressions
            }, { transaction });
            await this.journaliser('DOCUMENT_IMPRIME', utilisateurId, demande.id, `Impression #${nbImpressions}`, transaction);
            await transaction.commit();
            return updated;
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    }

    static async confirmerRemise(demande: DemandeDocument, utilisateurId: number | null): Promise<DemandeDocument> {
        const statutsAutorises = ['document_pret', 'paye', 'en_preparation'];
        if (!statutsAutorises.includes(demande.statut)) {
            throw new ErreurWorkflow('STATUT_INVALIDE', "Le document ne peut pas être remis dans son état actuel");
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            const updated = await demande.update({
                statut: 'remise',
                dateRemise: new Date(),
                remisParId: utilisateurId
            }, { transaction });
            await this.journaliser('DOCUMENT_REMIS', utilisateurId, demande.id,
                `Document remis à l'étudiant ${demande.etudiant?.nom || ''} ${demande.etudiant?.prenoms || ''}`.trim(), transaction);
            await transaction.commit();
            return updated;
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    }

    static async rejeterDemande(demande: DemandeDocument, motif: string, utilisateurId: number | null): Promise<DemandeDocument> {
        if (['remise', 'rejetee', 'annulee'].includes(demande.statut)) {
            throw new ErreurWorkflow('STATUT_INVALIDE', `Une demande ${demande.statut} ne peut plus être rejetée`);
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            const updated = await demande.update({
                statut: 'rejetee',
                motifRejet: motif
            }, { transaction });
            await this.journaliser('DEMANDE_REJETEE', utilisateurId, demande.id, motif, transaction);
            await transaction.commit();
            return updated;
        } catch (e) {
            await transaction.rollback();
            throw e;
        }
    }
}
