import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentPDFGenerator {

    static generateDocument(demandeId: string | number, libelle: string, outputDir: string): string {
        const dir = path.resolve(outputDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filename = `document_${demandeId}_${Date.now()}.pdf`;
        const filePath = path.join(dir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(20).text('ESA - École Supérieure', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(libelle, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(10).text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown();
        doc.fontSize(10).text(`Référence: ${libelle.toUpperCase().replace(/\s+/g, '_')}_${demandeId}`, { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(12).text(`Document délivré à l'étudiant(e)`, { align: 'left' });
        doc.moveDown();
        doc.fontSize(12).text(`Numéro de demande: ${demandeId}`, { align: 'left' });
        doc.moveDown(2);

        doc.fontSize(10).text(`Ce document est délivré par l'administration de l'ESA conformément à la réglementation en vigueur.`, { align: 'left' });
        doc.moveDown(4);

        doc.fontSize(12).text('Signature et cachet de l\'établissement', { align: 'center' });
        doc.moveDown(4);
        doc.fontSize(10).text('Fait à Kinshasa, le ' + new Date().toLocaleDateString('fr-FR'), { align: 'right' });

        doc.end();

        return filename;
    }

    static generateQuitus(paiementId: string | number, code: string, etudiantNom: string, matricule: string, montant: number, datePaiement: Date, outputDir: string): string {
        const dir = path.resolve(outputDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filename = `quitus_${code}_${Date.now()}.pdf`;
        const filePath = path.join(dir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(22).text('ESA - École Supérieure', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text('QUITUS DE PAIEMENT', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(10).text(`Code: ${code}`, { align: 'right' });
        doc.moveDown();
        doc.fontSize(10).text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(12).text('INFORMATIONS ÉTUDIANT', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Nom complet: ${etudiantNom}`);
        doc.fontSize(11).text(`Matricule: ${matricule}`);
        doc.moveDown(1.5);

        doc.fontSize(12).text('DÉTAILS DU PAIEMENT', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Numéro de paiement: ${paiementId}`);
        doc.fontSize(11).text(`Montant payé: ${montant.toLocaleString('fr-FR')} FC`);
        doc.fontSize(11).text(`Date de paiement: ${datePaiement.toLocaleDateString('fr-FR')}`);
        doc.moveDown(2);

        doc.fontSize(11).text('Statut: PAYÉ', { align: 'center' });
        doc.moveDown(4);

        doc.fontSize(12).text('Signature et cachet de l\'établissement', { align: 'center' });
        doc.moveDown(4);
        doc.fontSize(10).text('Fait à Kinshasa, le ' + new Date().toLocaleDateString('fr-FR'), { align: 'right' });

        doc.end();

        return filename;
    }
}
