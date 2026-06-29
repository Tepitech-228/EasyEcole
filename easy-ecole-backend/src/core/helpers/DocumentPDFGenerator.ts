import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentPDFGenerator {

    static generateAutorisationProvisoire(
        demandeId: string | number,
        etudiantNom: string,
        matricule: string,
        parcoursChoisis: { titre: string }[],
        montant: number,
        outputDir: string
    ): string {
        const dir = path.resolve(outputDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filename = `autorisation_provisoire_${matricule}_${Date.now()}.pdf`;
        const filePath = path.join(dir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(22).text('ESA - École Supérieure', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).text('AUTORISATION PROVISOIRE D\'INSCRIPTION', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(10).text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown();
        doc.fontSize(10).text(`Référence: AUT_PROV_${matricule}`, { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(12).text('INFORMATIONS ÉTUDIANT', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Nom complet: ${etudiantNom}`);
        doc.fontSize(11).text(`Matricule: ${matricule}`);
        doc.moveDown(1.5);

        doc.fontSize(12).text('PARCOURS DEMANDÉ(S)', { underline: true });
        doc.moveDown(0.5);
        parcoursChoisis.forEach((p, i) => {
            doc.fontSize(11).text(`${i + 1}. ${p.titre}`);
        });
        doc.moveDown(1.5);

        doc.fontSize(12).text('FRAIS D\'INSCRIPTION', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Montant total à payer: ${montant.toLocaleString('fr-FR')} FC`);
        doc.moveDown(2);

        doc.fontSize(11).text('Cette autorisation vous permet de procéder au paiement des frais d\'inscription auprès de la banque.', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(11).text('Après paiement, veuillez téléverser votre bordereau de paiement sur la plateforme.', { align: 'center' });
        doc.moveDown(4);

        doc.fontSize(12).text('Signature et cachet du comité d\'orientation', { align: 'center' });
        doc.moveDown(4);
        doc.fontSize(10).text('Fait à Kinshasa, le ' + new Date().toLocaleDateString('fr-FR'), { align: 'right' });

        doc.end();

        return filename;
    }

    static generateFichePaiement(
        demandeId: string | number,
        etudiantNom: string,
        matricule: string,
        frais: { titre: string; montant: number; fraisDesCours: boolean }[],
        coursChoisis: { intitule: string; credit: number | null }[],
        montantPaye: number,
        outputDir: string
    ): string {
        const dir = path.resolve(outputDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filename = `fiche_paiement_${matricule}_${Date.now()}.pdf`;
        const filePath = path.join(dir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(22).text('ESA - École Supérieure', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).text('FICHE DE PAIEMENT / BORDEREAU', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(10).text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown();
        doc.fontSize(10).text(`Référence: FPAI_${matricule}`, { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(12).text('INFORMATIONS ÉTUDIANT', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Nom complet: ${etudiantNom}`);
        doc.fontSize(11).text(`Matricule: ${matricule}`);
        doc.moveDown(1.5);

        doc.fontSize(12).text('DÉTAIL DES FRAIS', { underline: true });
        doc.moveDown(0.5);

        let totalFrais = 0
        frais.forEach((f, i) => {
            if (f.fraisDesCours) {
                const totalCoursCredit = coursChoisis.reduce((sum, c) => sum + (c.credit || 0), 0)
                const montantCours = f.montant * totalCoursCredit
                totalFrais += montantCours
                doc.fontSize(11).text(`${i + 1}. ${f.titre} (${totalCoursCredit} crédits) : ${montantCours.toLocaleString('fr-FR')} FC`);
            } else {
                totalFrais += f.montant
                doc.fontSize(11).text(`${i + 1}. ${f.titre} : ${f.montant.toLocaleString('fr-FR')} FC`);
            }
        });

        if (coursChoisis.length > 0) {
            doc.moveDown(1);
            doc.fontSize(12).text('COURS CHOISIS', { underline: true });
            doc.moveDown(0.5);
            coursChoisis.forEach((c, i) => {
                doc.fontSize(11).text(`${i + 1}. ${c.intitule}${c.credit ? ` (${c.credit} crédits)` : ''}`);
            });
        }

        doc.moveDown(2);
        doc.fontSize(12).text(`TOTAL À PAYER: ${totalFrais.toLocaleString('fr-FR')} FC`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Montant déjà payé: ${montantPaye.toLocaleString('fr-FR')} FC`, { align: 'center' });
        doc.fontSize(11).text(`Reste à payer: ${(totalFrais - montantPaye).toLocaleString('fr-FR')} FC`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(11).text('Veuillez effectuer le paiement auprès de la banque agréée et conserver ce bordereau.', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).text('Après paiement, téléversez le bordereau scanné sur la plateforme.', { align: 'center' });
        doc.moveDown(4);

        doc.fontSize(12).text('Signature et cachet de l\'établissement', { align: 'center' });
        doc.moveDown(4);
        doc.fontSize(10).text('Fait à Kinshasa, le ' + new Date().toLocaleDateString('fr-FR'), { align: 'right' });

        doc.end();

        return filename;
    }

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
