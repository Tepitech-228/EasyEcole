import { createOcrWorker } from './OcrWorker';
import { createPdfWorker } from './PdfWorker';
import { createExcelImportWorker } from './ExcelImportWorker';

const workers = [
  createOcrWorker(),
  createPdfWorker(),
  createExcelImportWorker(),
];

for (const worker of workers) {
  worker.on('completed', (job) => console.log(`[WORKER] ${worker.name} job=${job.id} completed`));
  worker.on('failed', (job, error) => console.error(`[WORKER] ${worker.name} job=${job?.id} failed`, error));
}

const shutdown = async (signal: string): Promise<void> => {
  console.log(`[WORKER] arrêt demandé (${signal})`);
  await Promise.all(workers.map((worker) => worker.close()));
  process.exit(0);
};

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

console.log(`[WORKER] ${workers.length} workers BullMQ démarrés`);