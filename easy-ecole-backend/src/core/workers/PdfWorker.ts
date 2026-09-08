import { Worker } from 'bullmq';
import { getPuppeteerBrowser } from '../services/PuppeteerBrowserPool';
import { QUEUE_NAMES, QueueService } from '../queue/QueueService';

export interface PdfJobData {
  html: string;
  outputPath: string;
  options?: Record<string, unknown>;
}

export function createPdfWorker(): Worker<PdfJobData> {
  return new Worker<PdfJobData>(
    QUEUE_NAMES.PDF,
    async (job) => {
      const browser = await getPuppeteerBrowser();
      const page = await browser.newPage();
      try {
        await page.setContent(job.data.html, { waitUntil: 'networkidle0' });
        await page.pdf({ path: job.data.outputPath, printBackground: true, ...(job.data.options || {}) });
        return { outputPath: job.data.outputPath };
      } finally {
        await page.close();
      }
    },
    { connection: QueueService.getInstance().getConnection(), concurrency: 2 },
  );
}