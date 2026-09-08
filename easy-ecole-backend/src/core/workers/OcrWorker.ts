import { Worker } from 'bullmq';
import fs from 'fs/promises';
import { OcrService } from '../services/OcrService';
import { QUEUE_NAMES, QueueService } from '../queue/QueueService';

export interface OcrJobData {
  filePath: string;
}

export function createOcrWorker(): Worker<OcrJobData> {
  return new Worker<OcrJobData>(
    QUEUE_NAMES.OCR,
    async (job) => {
      const result = await OcrService.extraireMetadonnees(job.data.filePath);
      await fs.unlink(job.data.filePath).catch(() => undefined);
      return result;
    },
    { connection: QueueService.getInstance().getConnection(), concurrency: 2 },
  );
}