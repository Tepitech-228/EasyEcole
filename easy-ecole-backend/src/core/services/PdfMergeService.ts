import { PDFDocument, PageSizes } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Résultat détaillé d'une fusion, utile pour tracer les pièces écartées.
 */
export interface MergeResult {
    outputPath: string;
    /** Nombre de pages réellement produites dans le PDF final. */
    nbPages: number;
    /** Fichiers retenus (PDF ou image convertible). */
    nbFichiers: number;
    /** Fichiers ignorés : introuvables, illisibles ou format non pris en charge. */
    ignores: string[];
}

export class PdfMergeService {

    /** Formats d'image que pdf-lib sait embarquer directement. */
    private static readonly FORMATS_IMAGE = ['.jpg', '.jpeg', '.png'];
    private static readonly MARGE = 40;

    /**
     * Fusionne plusieurs fichiers (PDF, JPEG, PNG) en un seul PDF multipages.
     *
     * Les images sont recalées sur une page A4 et centrées : les pièces
     * justificatives déposées par les étudiants sont très souvent des
     * photos ou des scans, pas des PDF.
     *
     * Un fichier en échec n'interrompt pas la fusion : il est ignoré et
     * listé dans `ignores` afin que l'appelant puisse tracer l'écart entre
     * les pièces attendues et les pièces réellement présentes.
     */
    static async mergeDocuments(filePaths: string[], outputPath: string): Promise<MergeResult> {
        const mergedPdf = await PDFDocument.create();
        const ignores: string[] = [];
        let nbFichiers = 0;

        for (const filePath of filePaths) {
            if (!fs.existsSync(filePath)) {
                console.warn(`[PdfMergeService] Fichier non trouvé: ${filePath}`);
                ignores.push(`${path.basename(filePath)} (introuvable)`);
                continue;
            }

            try {
                const bytes = fs.readFileSync(filePath);
                const ext = path.extname(filePath).toLowerCase();

                if (ext === '.pdf') {
                    const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
                    const pages = await mergedPdf.copyPages(source, source.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                } else if (PdfMergeService.FORMATS_IMAGE.includes(ext)) {
                    await PdfMergeService.ajouterPageImage(mergedPdf, bytes, ext);
                } else {
                    console.warn(`[PdfMergeService] Format non pris en charge: ${filePath}`);
                    ignores.push(`${path.basename(filePath)} (format ${ext || 'inconnu'})`);
                    continue;
                }

                nbFichiers++;
            } catch (error) {
                console.error(`[PdfMergeService] Erreur lors de la lecture de ${filePath}:`, error);
                ignores.push(`${path.basename(filePath)} (illisible)`);
            }
        }

        const mergedPdfBytes = await mergedPdf.save();

        // Créer le dossier de sortie si nécessaire
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, mergedPdfBytes);

        return {
            outputPath,
            nbPages: mergedPdf.getPageCount(),
            nbFichiers,
            ignores,
        };
    }

    /** Ajoute une page A4 contenant l'image, centrée et ajustée à la marge. */
    private static async ajouterPageImage(pdf: PDFDocument, bytes: Buffer | Uint8Array, ext: string): Promise<void> {
        const image = ext === '.png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);

        const [largeurPage, hauteurPage] = PageSizes.A4;
        const page = pdf.addPage([largeurPage, hauteurPage]);

        const dispoLargeur = largeurPage - 2 * PdfMergeService.MARGE;
        const dispoHauteur = hauteurPage - 2 * PdfMergeService.MARGE;
        const ratio = Math.min(dispoLargeur / image.width, dispoHauteur / image.height);
        const largeur = image.width * ratio;
        const hauteur = image.height * ratio;

        page.drawImage(image, {
            x: (largeurPage - largeur) / 2,
            y: (hauteurPage - hauteur) / 2,
            width: largeur,
            height: hauteur,
        });
    }

    /**
     * Fusionne uniquement des PDF. Conservé pour les appelants existants.
     */
    static async mergePdfs(pdfPaths: string[], outputPath: string): Promise<string> {
        const resultat = await this.mergeDocuments(pdfPaths, outputPath);
        return resultat.outputPath;
    }

    /**
     * Fusionne les pièces d'un étudiant pour le comité de validation.
     * @param matricule Matricule de l'étudiant
     * @param filePaths Liste des chemins de fichiers (PDF, JPEG, PNG)
     */
    static async mergeStudentPdfs(matricule: string, filePaths: string[]): Promise<MergeResult> {
        const outputDir = path.join(process.cwd(), 'storage', 'comite-pdfs');
        const outputPath = path.join(outputDir, `dossier_${matricule}_${Date.now()}.pdf`);
        return this.mergeDocuments(filePaths, outputPath);
    }
}
