/**
 * Génère le guide PDF à partir des captures + manifest.
 * Usage: node scripts/guide/generer-pdf.cjs
 * Sortie: export-deploiement/Guide-EasyEcole.pdf
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const DIR = path.join(__dirname, 'captures');
const SORTIE = 'D:/EASYECOLE/export-deploiement/Guide-EasyEcole-v2.pdf';
const BLEU = '#1F3C75';

(async () => {
  const resultats = JSON.parse(fs.readFileSync(path.join(DIR, 'resultat.json'), 'utf8'));
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 50, bottom: 50, left: 50, right: 50 }, bufferPages: true });
  doc.pipe(fs.createWriteStream(SORTIE));
  const W = doc.page.width - 100;

  // ---- Couverture ----
  doc.moveDown(4);
  doc.fontSize(34).fillColor(BLEU).font('Helvetica-Bold').text("Guide d'utilisation", { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(40).text('EasyEcole', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor('#555555').font('Helvetica')
    .text('Visite guidée de l\u2019application : écrans, descriptions et workflows par profil.', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#888888')
    .text(`Généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} — ${resultats.filter(r => r.ok).length} écrans documentés.`, { align: 'center' });

  // ---- Sommaire ----
  doc.addPage();
  doc.fontSize(22).fillColor(BLEU).font('Helvetica-Bold').text('Sommaire', { underline: true });
  doc.moveDown(0.8);
  doc.fontSize(11).fillColor('#222222').font('Helvetica');
  resultats.forEach((r, i) => {
    doc.text(`${i + 1}. ${r.titre}`, { continued: false })
      .fontSize(9).fillColor('#666666')
      .text(`     ${r.route} — ${r.profil}${r.ok ? '' : '  (capture indisponible)'}`, { continued: false });
    doc.fontSize(11).fillColor('#222222');
    doc.moveDown(0.25);
  });

  // ---- Sections ----
  for (let i = 0; i < resultats.length; i++) {
    const r = resultats[i];
    doc.addPage();
    doc.fontSize(20).fillColor(BLEU).font('Helvetica-Bold').text(`${i + 1}. ${r.titre}`);
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
      .text(`Route : ${r.route}    |    Profil : ${r.profil}`);
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor('#222222').text(r.description, { align: 'justify' });
    doc.moveDown(0.4);
    doc.fontSize(12).fillColor(BLEU).font('Helvetica-Bold').text('Workflow');
    doc.fontSize(11).fillColor('#222222').font('Helvetica');
    (r.workflow || []).forEach((etape, j) => {
      doc.text(`${j + 1}) ${etape}`, { indent: 18 });
    });
    if (r.ok && r.fichier) {
      const img = path.join(DIR, r.fichier);
      doc.moveDown(0.5);
      const y = doc.y;
      const maxH = doc.page.height - y - 60;
      const maxW = W;
      doc.image(img, 50, y, { fit: [maxW, maxH], align: 'center' });
    } else {
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#aa0000').text(`Capture indisponible : ${r.erreur || ''}`);
    }
  }

  // ---- Pied de page ----
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#999999')
      .text(`Guide EasyEcole — page ${i + 1}/${pages.count}`, 50, doc.page.height - 35, { align: 'center', width: W });
  }
  doc.end();
  await new Promise(res => doc.on('end', res));
  const taille = (fs.statSync(SORTIE).size / 1024 / 1024).toFixed(2);
  console.log(`PDF OK : ${SORTIE} (${taille} Mo, ${pages.count} pages)`);
})();
