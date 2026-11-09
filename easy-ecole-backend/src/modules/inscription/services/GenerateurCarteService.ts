import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { Etablissement } from '../../etablissement/models/Etablissement';
import { QrTokenService } from '../../../core/services/QrTokenService';
import { savePdf } from '../../../core/services/PdfStorageService';

const VERT = '#006B3F';
const VERT_CLAIR = '#E8F2EC';
const NOIR = '#111111';
const BLANC = '#FFFFFF';
const JAUNE = '#FFD700';

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
  periode?: 'matin' | 'soir' | 'en_ligne' | null;
  option?: string | null;
}

function getPeriodeLabel(periode: CarteData['periode'], option?: string | null): string {
  switch ((option || periode || '').toLowerCase()) {
    case 'matin':
      return 'COURS DU MATIN';
    case 'jour':
      return 'COURS DU JOUR';
    case 'soir':
      return 'COURS DU SOIR';
    case 'en_ligne':
    case 'en ligne':
      return 'COURS EN LIGNE';
    default:
      return 'NON RENSEIGNÉ';
  }
}

function formatDateNaissance(dateNaissance: string): string {
  if (!dateNaissance) return 'Non renseignée';

  const dateIso = dateNaissance.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateIso) {
    return `${dateIso[3]}/${dateIso[2]}/${dateIso[1]}`;
  }

  const date = new Date(dateNaissance);
  return Number.isNaN(date.getTime())
    ? dateNaissance
    : date.toLocaleDateString('fr-FR', { timeZone: 'UTC' });
}

function resolveLogoPath(): string {
  const logoPaths = [
    path.resolve(__dirname, '../../../../assets/logo-esa.png'),
    path.resolve(process.cwd(), 'assets/logo-esa.png'),
    path.resolve(process.cwd(), '..', 'easy-ecole-web', 'src', 'assets', 'images', 'logo-esa.png'),
    path.resolve(process.cwd(), 'easy-ecole-web', 'src', 'assets', 'images', 'logo-esa.png'),
  ];
  const logoPath = logoPaths.find(candidate => fs.existsSync(candidate));

  if (!logoPath) {
    throw new Error(`[GenerateurCarteService] Logo ESA introuvable. Chemins vérifiés : ${logoPaths.join(', ')}`);
  }

  return logoPath;
}

function fittedFontSize(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  width: number,
  maxSize: number,
  minSize: number,
): number {
  for (let size = maxSize; size >= minSize; size -= 0.5) {
    doc.fontSize(size);
    if (doc.widthOfString(text) <= width) {
      return size;
    }
  }

  return minSize;
}

export class GenerateurCarteService {

  static async generer(data: CarteData): Promise<string> {
    const etab = await Etablissement.findOne();
    const ecoleNom = (etab as any)?.nomCommercial || (etab as any)?.raisonSociale || 'ESA';
    const logoPath = resolveLogoPath();

    const qrData = QrTokenService.signer(data.utilisateurId);
    const qrBuffer = await QRCode.toBuffer(qrData, { width: 240, margin: 1, errorCorrectionLevel: 'M' });
    const publicRoot = path.resolve('public');
    const photoFileName = data.photo ? path.basename(data.photo) : '';
    const photoCandidates = photoFileName
      ? [
          data.photo || photoFileName,
          path.join('auth', 'apprenants', 'photos', photoFileName),
          path.join('auth', 'enseignants', 'photos', photoFileName),
          path.join('auth', 'profiles', photoFileName),
        ]
      : [];
    const resolvedPhoto = photoCandidates
      .map(candidate => path.resolve(publicRoot, candidate))
      .find(candidate => candidate.startsWith(publicRoot + path.sep) && fs.existsSync(candidate));

    const filename = `carte_${data.matricule}_${Date.now()}.pdf`;
    const pointsPerMm = 72 / 25.4;
    const width = 85.6 * pointsPerMm;
    const height = 54 * pointsPerMm;
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: [width, height], margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(0, 0, width, height).fill(BLANC);
      doc.rect(0, 0, width, 33).fill(VERT);
      doc.roundedRect(9, 5, 54, 23, 3).fill(BLANC);
      doc.image(logoPath, 11, 6, { fit: [50, 21], align: 'center', valign: 'center' });

      const brandX = 71;
      const brandWidth = width - brandX - 10;
      const nomEcole = ecoleNom.toUpperCase();
      doc.fillColor(BLANC).font('Helvetica-Bold');
      doc.fontSize(fittedFontSize(doc, nomEcole, brandWidth, 8.5, 5.5))
        .text(nomEcole, brandX, 8, { width: brandWidth, lineBreak: false });
      doc.font('Helvetica').fontSize(6.5)
        .text("CARTE UNIVERSITAIRE  •  ÉTUDIANT", brandX, 20, { width: brandWidth });

      const photoX = 12;
      const photoY = 42;
      const photoWidth = 48;
      const photoHeight = 63;
      doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 3).fill(VERT_CLAIR);
      if (resolvedPhoto) {
        doc.save();
        doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 3).clip();
        try {
          doc.image(resolvedPhoto, photoX, photoY, { fit: [photoWidth, photoHeight], align: 'center', valign: 'center' });
        } catch (error) {
          console.warn(`[GenerateurCarteService] Photo illisible, carte générée sans photo: ${resolvedPhoto}`, error);
          doc.fillColor(VERT_CLAIR).roundedRect(photoX, photoY, photoWidth, photoHeight, 3).fill();
        }
        doc.restore();
      } else {
        const initials = `${data.prenom.charAt(0)}${data.nom.charAt(0)}`.toUpperCase();
        doc.fillColor(VERT).font('Helvetica-Bold').fontSize(16)
          .text(initials, photoX, photoY + 23, { width: photoWidth, align: 'center' });
      }

      doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 3)
        .lineWidth(1).strokeColor(VERT).stroke();

      const contentX = 70;
      const contentWidth = 119;
      const drawField = (
        label: string,
        value: string,
        y: number,
        x = contentX,
        fieldWidth = contentWidth,
      ): void => {
        const displayValue = value.trim() || '—';
        doc.fillColor(VERT).font('Helvetica-Bold').fontSize(4.8)
          .text(label.toUpperCase(), x, y, { width: fieldWidth });
        doc.fillColor(NOIR).font('Helvetica-Bold');
        doc.fontSize(fittedFontSize(doc, displayValue, fieldWidth, 7.5, 4))
          .text(displayValue, x, y + 7, { width: fieldWidth, height: 9, lineBreak: false });
      };

      drawField('Nom et prénoms', `${data.prenom} ${data.nom}`, 40);
      doc.moveTo(contentX, 61).lineTo(contentX + contentWidth, 61).lineWidth(0.5).strokeColor(VERT_CLAIR).stroke();
      drawField('Matricule', data.matricule, 64);
      drawField('Filière', data.filiere, 85);
      drawField('Classe', data.classe, 101);
      doc.fillColor(VERT).font('Helvetica-Bold').fontSize(4.5)
        .text('NÉ(E)', contentX, 120);
      doc.fillColor(NOIR).font('Helvetica').fontSize(5)
        .text(formatDateNaissance(data.dateNaissance), contentX, 127, { width: 49, lineBreak: false });
      doc.fillColor(VERT).font('Helvetica-Bold').fontSize(4.5)
        .text('OPTION', contentX + 55, 120);
      doc.fillColor(NOIR).font('Helvetica-Bold').fontSize(5)
        .text(getPeriodeLabel(data.periode, data.option), contentX + 55, 127, { width: contentWidth - 55, lineBreak: false });

      const qrSize = 42;
      const qrX = width - qrSize - 10;
      doc.image(qrBuffer, qrX, 42, { width: qrSize, height: qrSize });
      doc.fillColor(VERT).font('Helvetica-Bold').fontSize(4.5)
        .text('VÉRIFICATION', qrX - 3, 87, { width: qrSize + 6, align: 'center' });

      doc.rect(0, 139, width, height - 139).fill(VERT);
      doc.fillColor(BLANC).font('Helvetica-Bold').fontSize(5.5)
        .text(`ANNÉE ACADÉMIQUE  ${data.anneeAcademique}`, 10, 144, { width: 135, lineBreak: false });
      doc.fillColor(JAUNE).font('Helvetica-Bold').fontSize(5.5)
        .text('IN GOD WE TRUST', width - 105, 144, { width: 95, align: 'right', lineBreak: false });
      doc.rect(0.6, 0.6, width - 1.2, height - 1.2)
        .lineWidth(1.2).strokeColor(VERT).stroke();
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
