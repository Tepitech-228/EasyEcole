import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { Etablissement } from '../../etablissement/models/Etablissement';
import { QrTokenService } from '../../../core/services/QrTokenService';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    const ecoleLogo = (etab as any)?.logo || '';

    const qrData = QrTokenService.signer(data.utilisateurId);
    const qrBase64 = await QRCode.toDataURL(qrData, { width: 200, margin: 4, errorCorrectionLevel: 'Q' });

    const ecoleNomEsc = escapeHtml(ecoleNom);
    const matriculeEsc = escapeHtml(data.matricule);
    const nomEsc = escapeHtml(data.nom);
    const prenomEsc = escapeHtml(data.prenom);
    const dateNaissanceEsc = escapeHtml(data.dateNaissance || 'N/R');
    const classeEsc = escapeHtml(data.classe);
    const filiereEsc = escapeHtml(data.filiere);
    const anneeEsc = escapeHtml(data.anneeAcademique);
    const photoEsc = escapeHtml(data.photo || '');

    const photoStyle = data.photo && fs.existsSync(path.resolve('public', data.photo))
      ? `<img src="file:///${path.resolve('public', data.photo).replace(/\\/g, '/')}" alt="Photo" class="photo" />`
      : `<div class="photo-placeholder">${nomEsc.charAt(0)}${prenomEsc.charAt(0)}</div>`;

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
  @page { size: 85.6mm 54mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { width: 85.6mm; height: 54mm; display: flex; }
  .card { width: 100%; height: 100%; display: flex; position: relative; overflow: hidden; }
  .sidebar { width: 38%; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 4mm 3mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .sidebar .ecole { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 2mm; }
  .sidebar .photo, .sidebar .photo-placeholder { width: 22mm; height: 22mm; border-radius: 50%; object-fit: cover; border: 1.5mm solid rgba(255,255,255,0.3); margin: 1mm 0; }
  .sidebar .photo-placeholder { background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 16pt; font-weight: bold; color: white; }
  .sidebar .matricule { font-size: 6pt; background: rgba(255,255,255,0.15); padding: 0.8mm 2mm; border-radius: 2mm; margin-top: 1mm; font-family: monospace; letter-spacing: 0.5pt; }
  .main { width: 62%; padding: 3mm 3mm 3mm 2.5mm; display: flex; flex-direction: column; justify-content: center; }
  .main .nom { font-size: 9pt; font-weight: bold; color: #1e3a5f; line-height: 1.2; }
  .main .info { font-size: 6.5pt; color: #475569; margin-top: 0.8mm; }
  .main .info span { color: #94a3b8; }
  .main .filiere { font-size: 6pt; color: #2563eb; font-weight: 600; margin-top: 1mm; background: #eff6ff; padding: 0.5mm 1.5mm; border-radius: 1mm; display: inline-block; }
  .main .validite { font-size: 5.5pt; color: #94a3b8; margin-top: 1.5mm; }
  .qr { position: absolute; bottom: 2mm; right: 2.5mm; }
  .qr img { width: 10mm; height: 10mm; }
  .watermark { position: absolute; top: 1mm; right: 2.5mm; font-size: 4pt; color: rgba(0,0,0,0.06); transform: rotate(-30deg); font-weight: bold; letter-spacing: 1pt; }
</style>
</head><body>
<div class="card">
  <div class="sidebar">
     <div class="ecole">${ecoleNomEsc}</div>
     ${photoStyle}
     <div class="matricule">${matriculeEsc}</div>
   </div>
   <div class="main">
     <div class="nom">${nomEsc}<br/>${prenomEsc}</div>
     <div class="info"><span>Né(e)</span> ${dateNaissanceEsc}</div>
     <div class="info"><span>Classe</span> ${classeEsc}</div>
     <div class="filiere">${filiereEsc}</div>
     <div class="validite">Année academique ${anneeEsc}</div>
   </div>
   <div class="qr"><img src="${qrBase64}" /></div>
   <div class="watermark">${ecoleNomEsc}</div>
</div>
</body></html>`;

    const filename = `carte_${data.matricule}_${Date.now()}.pdf`;
    const outputDir = path.resolve('storage', 'cartes');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, filename);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' as any });
      await page.pdf({
        path: outputPath,
        width: '85.6mm',
        height: '54mm',
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
      });
    } finally {
      await browser.close();
    }

    return `storage/cartes/${filename}`;
  }
}
