import fs from "fs";
import path from "path";

export interface MetadataExtraite {
  nbPages: number
  auteur: string | null
  dateDocument: string | null
  motsCles: string[]
  contenuTexte: string | null
}

export class OcrService {

  static async extraireMetadonnees(filePath: string): Promise<MetadataExtraite> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      return this._extrairePdf(filePath);
    }

    return {
      nbPages: 0,
      auteur: null,
      dateDocument: null,
      motsCles: [],
      contenuTexte: null
    };
  }

  private static async _extrairePdf(filePath: string): Promise<MetadataExtraite> {
    try {
      const pdfModule = await import("pdf-parse");
      const PDFParseCtor = (pdfModule as any).default ?? (pdfModule as any).PDFParse ?? (pdfModule as any);
      const buffer = fs.readFileSync(filePath);

      if (typeof PDFParseCtor !== "function") {
        return this._metadataFallback(filePath);
      }

      const PDFParse = PDFParseCtor;
      const parser = new PDFParse({ data: buffer });
      const [info, textResult] = await Promise.all([parser.getInfo(), parser.getText()]);

      const motsCles = this._extraireMotsCles(textResult.text);
      parser.destroy();

      return {
        nbPages: info.total || 0,
        auteur: info.info?.Author || null,
        dateDocument: info.info?.CreationDate
          ? this._normalizeDate(info.info.CreationDate)
          : null,
        motsCles,
        contenuTexte: textResult.text?.substring(0, 10000) || null
      };
    } catch (error) {
      console.warn("OCR PDF skipped due to runtime incompatibility:", (error as Error).message);
      return this._metadataFallback(filePath);
    }
  }

  private static _metadataFallback(filePath: string): MetadataExtraite {
    return {
      nbPages: 0,
      auteur: null,
      dateDocument: null,
      motsCles: [],
      contenuTexte: null
    };
  }

  private static _extraireMotsCles(texte: string): string[] {
    if (!texte) return [];
    const mots = texte
      .toLowerCase()
      .replace(/[^a-zàâäéèêëîïôöùûüÿç\s-]/g, '')
      .split(/\s+/)
      .filter(m => m.length > 3);
    const freq: Record<string, number> = {};
    for (const m of mots) {
      freq[m] = (freq[m] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([mot]) => mot);
  }

  private static _normalizeDate(dateStr: string): string | null {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    } catch {
      // Justifié : date illisible extraite par OCR → null (champ optionnel).
      // L'OCR produit des textes imprévisibles ; ce n'est pas une erreur système.
      return null;
    }
  }
}
