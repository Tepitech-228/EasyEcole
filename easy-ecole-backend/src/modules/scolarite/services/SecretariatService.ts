import { Request } from "express";
import { DemandeDocument } from "../models/DemandeDocument";
import { JournalSecretariat } from "../models/JournalSecretariat";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

const UNITES = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf'];
const DIX = ['','dix','vingt','trente','quarante','cinquante','soixante','soixante-dix','quatre-vingt','quatre-vingt-dix'];

export class SecretariatService {

  static nombreEnLettres(n: number): string {
    if (n === 0) return 'zéro'
    if (n < 0) return 'moins ' + SecretariatService.nombreEnLettres(-n)
    if (n >= 1000000) return SecretariatService.nombreEnLettres(Math.floor(n/1000000)) + ' million ' + SecretariatService.nombreEnLettres(n % 1000000)
    if (n >= 1000) return SecretariatService.nombreEnLettres(Math.floor(n/1000)) + ' mille ' + SecretariatService.nombreEnLettres(n % 1000)
    if (n >= 100) return SecretariatService.nombreEnLettres(Math.floor(n/100)) + ' cent ' + SecretariatService.nombreEnLettres(n % 100)
    if (n >= 80) return 'quatre-vingt' + (n > 80 ? ' ' + SecretariatService.nombreEnLettres(n-80) : 's')
    if (n >= 70) return 'soixante-dix' + (n > 70 ? ' ' + SecretariatService.nombreEnLettres(n-70) : '')
    if (n >= 60) return 'soixante' + (n > 60 ? ' ' + SecretariatService.nombreEnLettres(n-60) : '')
    if (n >= 50) return 'cinquante' + (n > 50 ? ' ' + SecretariatService.nombreEnLettres(n-50) : '')
    if (n >= 40) return 'quarante' + (n > 40 ? ' ' + SecretariatService.nombreEnLettres(n-40) : '')
    if (n >= 30) return 'trente' + (n > 30 ? ' ' + SecretariatService.nombreEnLettres(n-30) : '')
    if (n >= 20) return 'vingt' + (n > 20 ? ' ' + SecretariatService.nombreEnLettres(n-20) : '')
    if (n >= 10) return DIX[n-10] || ''
    return UNITES[n]
  }

  static async logAction(
    action: string,
    utilisateurId: number | null,
    demandeDocumentId: number | null,
    details?: string
  ): Promise<void> {
    try {
      await JournalSecretariat.create({
        action,
        utilisateurId,
        demandeDocumentId,
        details: details || null,
      })
    } catch (e) {
      console.error("Erreur log secretariat:", e);
    }
  }

  static async getDashboardStats(): Promise<any> {
    const sequelize = DatabaseConnection.getInstance().sequelize;

    const [demandesCount]: any[] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM scol_demandes_document WHERE deletedAt IS NULL`
    );
    const [enAttentePaiement]: any[] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM scol_demandes_document WHERE statut = 'en_attente_paiement' AND deletedAt IS NULL`
    );
    const [payesCount]: any[] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM scol_demandes_document WHERE statut = 'paye' AND deletedAt IS NULL`
    );
    const [aPreparerCount]: any[] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM scol_demandes_document WHERE statut IN ('paye','en_preparation') AND deletedAt IS NULL`
    );
    const [pretsCount]: any[] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM scol_demandes_document WHERE statut = 'document_pret' AND deletedAt IS NULL`
    );
    const [remisCount]: any[] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM scol_demandes_document WHERE statut = 'remise' AND deletedAt IS NULL`
    );
    const [recusCount]: any[] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM scol_recus_caisse WHERE deletedAt IS NULL`
    );
    const [recusMontant]: any[] = await sequelize.query(
      `SELECT COALESCE(SUM(montant),0) AS total FROM scol_recus_caisse WHERE deletedAt IS NULL`
    );

    return {
      demandes: Number(demandesCount[0]?.total || 0),
      enAttentePaiement: Number(enAttentePaiement[0]?.total || 0),
      payes: Number(payesCount[0]?.total || 0),
      aPreparer: Number(aPreparerCount[0]?.total || 0),
      prets: Number(pretsCount[0]?.total || 0),
      remis: Number(remisCount[0]?.total || 0),
      recus: Number(recusCount[0]?.total || 0),
      montantEncaisse: Number(recusMontant[0]?.total || 0),
    };
  }

  static async getRecentActivity(limit: number = 20): Promise<any[]> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    const [rows]: any[] = await sequelize.query(
      `SELECT j.id, j.action, j.details, j.createdAt, u.nom, u.prenoms, u.email
       FROM scol_journal_secretariat j
       LEFT JOIN aut_utilisateurs u ON u.id = j.utilisateurId
       ORDER BY j.createdAt DESC
       LIMIT :limit`,
      { replacements: { limit } }
    );
    return rows;
  }
}
