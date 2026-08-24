import path from 'path';
import fs from 'fs';
import { DocGenCachet } from '../models/DocGenCachet';

export class PdfGeneratorService {
  static async generate(html: string, options?: {
    format?: 'A4' | 'Letter' | string;
    orientation?: 'portrait' | 'landscape';
    margins?: { top?: string; right?: string; bottom?: string; left?: string };
    ecoleNom?: string;
  }): Promise<Buffer> {
    const puppeteer = await this.getPuppeteer();
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();

      const finalHtml = await this.applyOverlays(html, options?.ecoleNom || 'ESA');
      await page.setContent(finalHtml, { waitUntil: 'networkidle0' as any });

      const pdf = await page.pdf({
        format: (options?.format as any) || 'A4',
        landscape: options?.orientation === 'landscape',
        printBackground: true,
        margin: {
          top: options?.margins?.top || '15mm',
          right: options?.margins?.right || '15mm',
          bottom: options?.margins?.bottom || '25mm',
          left: options?.margins?.left || '15mm',
        },
        displayHeaderFooter: false,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private static async getPuppeteer(): Promise<any> {
    try {
      const mod = await import('puppeteer');
      return (mod as any).default ?? mod;
    } catch (error) {
      throw new Error('Puppeteer is not available in this environment: ' + (error as Error).message);
    }
  }

  private static async applyOverlays(html: string, ecoleNom: string): Promise<string> {
    const cachet = await this.getCachetHtml();

    return `
      <html><head>
        <style>
          @page { margin: 0; }
          body { margin: 0; padding: 0; position: relative; font-family: Arial, Helvetica, sans-serif; }
          .filigrane {
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 200px;
            font-weight: bold;
            color: rgba(0,0,0,0.03);
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
            letter-spacing: 20px;
          }
          .cachet-overlay {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 120px;
            height: 120px;
            z-index: 10;
            pointer-events: none;
          }
          .cachet-overlay img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 0.85;
          }
          .content { position: relative; z-index: 1; }
        </style>
      </head><body>
        <div class="filigrane">${ecoleNom}</div>
        <div class="cachet-overlay">${cachet}</div>
        <div class="content">${html}</div>
      </body></html>`;
  }

  private static async getCachetHtml(): Promise<string> {
    try {
      const cachet = await DocGenCachet.findOne({ where: { isActive: true } });
      if (cachet?.imagePath) {
        const absPath = path.resolve(process.cwd(), cachet.imagePath);
        if (fs.existsSync(absPath)) {
          const ext = path.extname(absPath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
          const base64 = fs.readFileSync(absPath).toString('base64');
          return `<img src="data:${mime};base64,${base64}" alt="Cachet" />`;
        }
        console.warn(`[DOCGEN][cachet] image introuvable: ${absPath} — document généré sans cachet`);
      }
    } catch (err) {
      // Le cachet est décoratif : le PDF reste valide sans lui, MAIS un problème
      // de configuration/lecture doit rester visible pour être corrigé.
      console.error('[DOCGEN][cachet] échec du chargement — document généré sans cachet:', err instanceof Error ? err.message : err);
    }
    return '';
  }

}
