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
    
    // Atomic UPSERT + increment using Sequelize
    const [counter] = await ReferenceCounter.findOrCreate({
      where: { domainCode, year },
      defaults: { domainCode, year, lastSequence: 0 }
    });

    await counter.increment('lastSequence', { by: 1 });
    await counter.reload();

    const seqStr = String(counter.lastSequence).padStart(5, '0');
    return `${domainCode}-${shortCode}-${year}-${seqStr}`;
  }
}
