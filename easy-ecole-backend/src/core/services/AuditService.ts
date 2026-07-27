import DocumentAuditLog from "../../modules/ged/models/DocumentAuditLog";

export type AuditAction =
  | 'consultation' | 'telechargement' | 'creation' | 'modification'
  | 'validation' | 'archivage' | 'marquage_destruction' | 'suppression_effective'
  | 'restauration' | 'nouvelle_version' | 'verrouillage' | 'deverrouillage'
  | 'verification_integrite';

export class AuditService {
  /**
   * Log an action on a document.
   */
  static async log(
    documentId: number,
    userId: number,
    action: AuditAction,
    details?: Record<string, any>
  ): Promise<void> {
    await DocumentAuditLog.create({
      documentId,
      userId,
      action,
      details: details ? JSON.stringify(details) : undefined
    });
  }
}
