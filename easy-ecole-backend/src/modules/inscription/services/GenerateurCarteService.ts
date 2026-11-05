import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { Etablissement } from '../../etablissement/models/Etablissement';
import { QrTokenService } from '../../../core/services/QrTokenService';
import { savePdf } from '../../../core/services/PdfStorageService';

export interface CarteData {
  nom: string;
  prenom: string;
  matricule: string;
  dateNaissance: string;
  photo?: string;
  classe: string;
  filiere: string;
  anneeAcademique: string;
  email: string;
  utilisateurId: number;
}

export class GenerateurCarteService {

  static async generer(data: CarteData): Promise<string> {
    const etab = await Etablissement.findOne();
    const ecoleNom = (etab as any)?.nomCommercial || (etab as any)?.raisonSociale || 'ESA';

    const qrData = QrTokenService.signer(data.utilisateurId);
    const qrBuffer = await QRCode.toBuffer(qrData, { width: 240, margin: 1, errorCorrectionLevel: 'M' });
    const publicRoot = path.resolve('public');
    const photoCandidates = data.photo
      ? [
          data.photo,
          path.join('auth', 'apprenants', 'photos', data.photo),
          path.join('auth', 'enseignants', 'photos', data.photo),
          path.join('auth', 'profiles', data.photo),
        ]
      : [];
    const resolvedPhoto = photoCandidates
      .map(candidate => path.resolve(publicRoot, candidate))
      .find(candidate => candidate.startsWith(publicRoot + path.sep) && fs.existsSync(candidate));

    const filename = `carte_${data.matricule}_${Date.now()}.pdf`;
    const pointsPerMm = 72 / 25.4;
    const width = 85.6 * pointsPerMm;
    const height = 54 * pointsPerMm;
    const sidebarWidth = width * 0.38;
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: [width, height], margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(0, 0, sidebarWidth, height).fill('#1e3a5f');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7)
        .text(ecoleNom.toUpperCase(), 7, 9, { width: sidebarWidth - 14, align: 'center' });

      const photoX = 21;
      const photoY = 37;
      const photoSize = 50;
      doc.save();
      doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2).clip();
      if (resolvedPhoto) {
        try {
          doc.image(resolvedPhoto, photoX, photoY, { fit: [photoSize, photoSize] });
        } catch (error) {
          console.warn(`[GenerateurCarteService] Photo illisible, carte générée sans photo: ${resolvedPhoto}`, error);
          doc.fillColor('#526985').circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2).fill();
        }
      } else {
        doc.fillColor('#526985').circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2).fill();
      }
      doc.restore();

      if (!resolvedPhoto) {
        const initials = `${data.nom.charAt(0)}${data.prenom.charAt(0)}`.toUpperCase();
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16)
          .text(initials, photoX, photoY + 16, { width: photoSize, align: 'center' });
      }
      doc.fillColor('#ffffff').font('Helvetica').fontSize(6)
        .text(data.matricule, 6, 95, { width: sidebarWidth - 12, align: 'center' });

      const contentX = sidebarWidth + 9;
      const contentWidth = width - contentX - 7;
      doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(9)
        .text(`${data.nom}\n${data.prenom}`, contentX, 20, { width: contentWidth - 34, height: 28 });
      doc.fillColor('#475569').font('Helvetica').fontSize(6.5)
        .text(`Né(e) : ${data.dateNaissance || 'N/R'}`, contentX, 56, { width: contentWidth });
      doc.text(`Classe : ${data.classe}`, contentX, 69, { width: contentWidth });
      doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(6)
        .text(data.filiere, contentX, 82, { width: contentWidth - 35, height: 16 });
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(5.5)
        .text(`Année académique ${data.anneeAcademique}`, contentX, 103, { width: contentWidth });
      doc.image(qrBuffer, width - 41, height - 39, { width: 32, height: 32 });
      doc.end();
    });

    const saved = savePdf(pdfBuffer, {
      type: 'inscription',
      subcategory: 'cartes',
      fileName: filename,
      academicYear: data.anneeAcademique,
    });

    return saved.relativePath;
  }
}
