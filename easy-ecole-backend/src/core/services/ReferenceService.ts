import { DatabaseConnection } from "../helpers/DatabaseConnection";
import ReferenceCounter from "../../modules/ged/models/ReferenceCounter";

export class ReferenceService {
  /**
   * Generate a reference for a document.
   * Uses an atomic UPSERT + increment on ged_reference_counters.
   * 
   * @param domainCode - Domain code (e.g. 'SCOL', 'RH')
   * @param shortCode - Document type short code (e.g. 'DIPL', 'PV')
   * @param year - Academic/calendar year (e.g. 2025)
   * @returns The generated reference string (e.g. 'SCOL-DIPL-2025-00147')
   */
  static async generer(domainCode: string, shortCode: string, year: number): Promise<string> {
    const seq = DatabaseConnection.getInstance().sequelize;
    const transaction = await seq.transaction();

    try {
      await seq.query(`
        INSERT INTO ged_reference_counters
          (domainCode, year, lastSequence, createdAt, updatedAt)
        VALUES (:domainCode, :year, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          lastSequence = lastSequence + 1,
          updatedAt = NOW()
      `, {
        replacements: { domainCode, year },
        transaction,
      });

      const counter = await ReferenceCounter.findOne({
        where: { domainCode, year },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!counter) throw new Error('Compteur de référence introuvable après incrément');

      await transaction.commit();
      const seqStr = String(counter.lastSequence).padStart(5, '0');
      return `${domainCode}-${shortCode}-${year}-${seqStr}`;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
