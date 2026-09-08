import { Worker } from 'bullmq';
import { QUEUE_NAMES, QueueService } from '../queue/QueueService';
import { ExcelImportService } from '../../modules/inscription/services/ExcelImportService';

export interface ExcelImportJobData {
  filePath: string;
  importType: string;
  utilisateurId?: number;
}

export function createExcelImportWorker(): Worker<ExcelImportJobData> {
  return new Worker<ExcelImportJobData>(
    QUEUE_NAMES.EXCEL_IMPORT,
    async (job) => {
      if (job.data.importType === 'ue') {
        const result = await ExcelImportService.importUe(job.data.filePath);
        return result;
      }
      if (job.data.importType === 'enseignants') {
        const result = await ExcelImportService.importEnseignants(job.data.filePath);
        return result;
      }
      throw new Error(`Aucun processeur Excel enregistré pour le type ${job.data.importType}`);
    },
    { connection: QueueService.getInstance().getConnection(), concurrency: 1 },
  );
}