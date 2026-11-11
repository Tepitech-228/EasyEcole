import path from 'path';
import fs from 'fs';
import { DocGenCachet } from '../models/DocGenCachet';
import { DocGenLogoService } from './DocGenLogoService';
import { AutorisationProvisoirePdfService } from './AutorisationProvisoirePdfService';
import { getPuppeteerBrowser } from '../../../core/services/PuppeteerBrowserPool';
import { resolveStoredDocumentPath } from '../../../core/services/DocumentStorageService';

// Hauteur (et marge) à réserver pour l'en-tête institutionnel répété sur chaque page.
const HEADER_HEIGHT_MM = 48;

export function getDocGenPdfOptions(typeCode: string): {
  disableHeader?: boolean;
  margins?: { top: string; right: string; bottom: string; left: string };
} {
  if (typeCode === 'NOT003' || typeCode === 'NOT004') {
    return {
      disableHeader: true,
      margins: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
    };
  }
  return {};
}

export interface PdfGeneratorOptions {
  format?: 'A4' | 'Letter' | string;
  orientation?: 'portrait' | 'landscape';
  margins?: { top?: string; right?: string; bottom?: string; left?: string };
  ecoleNom?: string;
  /** Surcharge la hauteur de l'en-tête institutionnel (défaut : 36mm). */
  headerHeightMm?: number;
  /** Désactive le header institutionnel global (ex. documents qui gèrent leur propre en-tête). */
  disableHeader?: boolean;
  /** Désactive les en-têtes et pieds de page globaux pour les documents issus des modèles DocGen. */
  disableHeaderFooter?: boolean;
}

export interface DocGenPdfParams {
  typeCode: string;
  html: string;
  etablissement: Record<string, any>;
  etudiant: Record<string, any>;
  reference: string;
  dateGeneration: string;
  initialesComite?: string;
  autorisationProvisoire?: {
    diplomeRecu: string;
    dateDiplomeRecu: string;
    relevesSemestresRecus: string[];
    relevesSemestresDates: Record<string, string>;
    relevesSemestresRecusLibelle: string;
    semestresAutorises: string[];
  };
  options?: PdfGeneratorOptions;
}

export class PdfGeneratorService {
  /**
   * Génère le PDF d'un document docgen. L'autorisation provisoire d'inscription
   * (API001) privilégie Chromium pour conserver le design du template ; si le
   * navigateur est indisponible (conteneur sans Crashpad), on bascule sur le
   * rendu pdfkit afin que la validation du comité ne soit jamais bloquée.
   */
  static async generateDocGen(params: DocGenPdfParams): Promise<Buffer> {
    const options: PdfGeneratorOptions = {
      ...params.options,
      disableHeaderFooter: true,
      margins: {
        top: params.options?.margins?.top || '15mm',
        right: params.options?.margins?.right || '15mm',
        bottom: params.options?.margins?.bottom || '15mm',
        left: params.options?.margins?.left || '15mm',
      },
    };

    if (params.typeCode === 'API001') {
      try {
        return await this.generate(params.html, options);
      } catch (error) {
        console.warn(
          '[DOCGEN][API001] Chromium indisponible, repli sur pdfkit:',
          error instanceof Error ? error.message : error,
        );
        return AutorisationProvisoirePdfService.generate({
          etablissement: params.etablissement,
          etudiant: params.etudiant,
          reference: params.reference,
          dateGeneration: params.dateGeneration,
          initialesComite: params.initialesComite,
          autorisationProvisoire: params.autorisationProvisoire,
        });
      }
    }
    return this.generate(params.html, options);
  }

  static async generate(html: string, options?: PdfGeneratorOptions): Promise<Buffer> {
    const browser = await getPuppeteerBrowser();

    let page: any;
    try {
      page = await browser.newPage();

      const finalHtml = await this.applyOverlays(html, options?.ecoleNom || 'ESA');
      await page.setContent(finalHtml, { waitUntil: 'networkidle0' as any });

      const headerHeight = options?.headerHeightMm != null ? options.headerHeightMm : HEADER_HEIGHT_MM;

      const googleFontsUrl = 'https://fonts.googleapis.com'; // non utilisé, gardé pour compat

      const headerTemplate = options?.disableHeader || options?.disableHeaderFooter
        ? '<span></span>'
        : this.buildHeaderTemplate(options?.ecoleNom || 'ESA');

      const footerTemplate = options?.disableHeaderFooter
        ? '<span></span>'
        : this.buildFooterTemplate();

      // La marge haute doit TOUJOURS être au moins aussi grande que l'en-tête,
      // sinon le contenu passerait derrière lui. On retient donc la valeur la
      // plus grande entre la marge demandée et la hauteur de l'en-tête.
      const parseMm = (v: string | undefined, def: number): number => {
        if (!v) return def;
        const m = String(v).match(/([\d.]+)\s*mm/i);
        return m ? parseFloat(m[1]) : def;
      };
      const margeTopDemandee = parseMm(options?.margins?.top, options?.disableHeaderFooter ? 15 : 0);
      const margeTopFinale = options?.disableHeader || options?.disableHeaderFooter
        ? margeTopDemandee
        : Math.max(margeTopDemandee, headerHeight + 2);

      const pdf = await page.pdf({
        format: (options?.format as any) || 'A4',
        landscape: options?.orientation === 'landscape',
        printBackground: true,
        displayHeaderFooter: !options?.disableHeaderFooter,
        headerTemplate,
        footerTemplate,
        margin: {
          top: `${margeTopFinale}mm`,
          right: options?.margins?.right || '15mm',
          bottom: options?.margins?.bottom || '22mm',
          left: options?.margins?.left || '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await page?.close();
    }
  }

  /**
   * En-tête institutionnel ESA, répété automatiquement en haut de CHAQUE page
   * par le moteur (displayHeaderFooter de Puppeteer). Reprend le design existant :
   * logo / sigle ESA, UNIVERSITÉ DES SCIENCES ET TECHNOLOGIES, agréments,
   * mention du ministère et ACCREDITATION CAMES.
   */
  private static buildHeaderTemplate(ecoleNom: string): string {
    const logo = DocGenLogoService.getLogoDataUri();
    // NOTE : dans un headerTemplate, Puppeteer interprète les dimensions en px
    // (96 px/inch) et non en mm. On garde donc toutes les tailles en px, et on
    // limite la hauteur totale pour rester dans la marge top réservée (36mm)
    // sans débordement ni chevauchement du contenu.
    return `
      <div style="
        width:100%; box-sizing:border-box;
        border-bottom:2.5px solid #000;
        padding:0 0 4px 0;
        font-family:Arial,Helvetica,sans-serif;
        color:#000;">
        <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <tr style="vertical-align:middle;">
            <td style="width:120px; padding:0 12px 0 0; vertical-align:middle;">
              ${logo ? `<img src="${logo}" style="display:block; max-height:150px; max-width:118px; height:auto; margin:0 auto;" />` : ''}
            </td>
            <td style="vertical-align:middle; text-align:center; padding:0 4px;">
              <div style="font-size:15px; line-height:1.2; font-weight:bold; white-space:nowrap; letter-spacing:0.5px;">
                ${(ecoleNom || 'UNIVERSITÉ DES SCIENCES ET TECHNOLOGIES').toUpperCase()}
              </div>
              <div style="font-size:9px; line-height:1.35; margin-top:3px; white-space:nowrap;">
                Agréments officiels : N°2010/022/METFP/CAB/SG/SE-CPO &amp; N°2011/013/METFP/CAB/SG/SE-CPO
              </div>
              <div style="font-size:9px; line-height:1.35; white-space:nowrap;">
                Agréé par le ministère de l'Enseignement Supérieur et de la Recherche par l'Arrêté N°040/MESR/SG/DES
              </div>
              <div style="font-size:10px; line-height:1.35; font-weight:bold; margin-top:3px; letter-spacing:0.5px;">
                ACCREDITATION CAMES
              </div>
            </td>
          </tr>
        </table>
      </div>`;
  }

  private static buildFooterTemplate(): string {
    return `
      <div style="width:100%; font-family:Arial,Helvetica,sans-serif; font-size:9px; color:#333; text-align:center; padding:4px 0 0 0; border-top:1px solid #ccc;">
        ESA — LE LABEL DES DIPLOMES DE QUALITE &nbsp;·&nbsp; <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>`;
  }

  private static async applyOverlays(html: string, ecoleNom: string): Promise<string> {
    const cachet = await this.getCachetHtml();

    return `
      <html><head>
        <style>
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
        const absPath = resolveStoredDocumentPath(cachet.imagePath, [
          path.resolve(process.cwd(), 'public', 'docgen', 'cachets'),
        ]);
        if (absPath && fs.existsSync(absPath)) {
          const ext = path.extname(absPath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
          const base64 = fs.readFileSync(absPath).toString('base64');
          return `<img src="data:${mime};base64,${base64}" alt="Cachet" />`;
        }
        console.warn(`[DOCGEN][cachet] image introuvable: ${absPath} — document généré sans cachet`);
      }
    } catch (err) {
      console.error('[DOCGEN][cachet] échec du chargement:', err instanceof Error ? err.message : err);
    }
    return '';
  }

}
