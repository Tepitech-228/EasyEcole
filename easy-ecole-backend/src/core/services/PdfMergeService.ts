import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export class PdfMergeService {

    /**
     * Fusionne plusieurs PDFs en un seul PDF multipages
     * @param pdfPaths Liste des chemins des fichiers PDF à fusionner
     * @param outputPath Chemin du fichier de sortie
     * @returns Chemin du fichier fusionné
     */
    static async mergePdfs(pdfPaths: string[], outputPath: string): Promise<string> {
        const mergedPdf = await PDFDocument.create();

        for (const pdfPath of pdfPaths) {
            if (!fs.existsSync(pdfPath)) {
                console.warn(`[PdfMergeService] Fichier non trouvé: ${pdfPath}`);
                continue;
            }

            try {
                const pdfBytes = fs.readFileSync(pdfPath);
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            } catch (error) {
                console.error(`[PdfMergeService] Erreur lors de la lecture de ${pdfPath}:`, error);
            }
        }

        const mergedPdfBytes = await mergedPdf.save();

        // Créer le dossier de sortie si nécessaire
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, mergedPdfBytes);
        return outputPath;
    }

    /**
     * Fusionne les PDFs d'un étudiant pour le comité de validation
     * @param matricule Matricule de l'étudiant
     * @param pdfPaths Liste des chemins des fichiers PDF
     * @returns Chemin du fichier fusionné
     */
    static async mergeStudentPdfs(matricule: string, pdfPaths: string[]): Promise<string> {
        const outputDir = path.join(process.cwd(), 'storage', 'comite-pdfs');
        const outputPath = path.join(outputDir, `dossier_${matricule}_${Date.now()}.pdf`);
        return this.mergePdfs(pdfPaths, outputPath);
    }
}
