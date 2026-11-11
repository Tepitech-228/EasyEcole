import PDFDocument from 'pdfkit';

interface AutorisationProvisoirePdfData {
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
    signataire1: { nomComplet: string; signatureData: string };
    signataire2: { nomComplet: string; signatureData: string };
  };
}

function decodeHtmlText(value: unknown): string {
  return String(value || '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export class AutorisationProvisoirePdfService {
  static generate(data: AutorisationProvisoirePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const navy = '#002147';
      const gold = '#D4AF37';
      const etudiant = data.etudiant;
      const nomComplet = `${decodeHtmlText(etudiant.nom)} ${decodeHtmlText(etudiant.prenom)}`.trim();

      doc.lineWidth(3).strokeColor(navy).rect(32, 32, 548, 778).stroke();
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(15)
        .text(data.etablissement.nom || 'ESA', 52, 52, { width: 330 });
      doc.fillColor('#333333').font('Helvetica').fontSize(9)
        .text("Établissement d'Enseignement Supérieur Privé", 52, 72, { width: 330 });
      doc.moveTo(52, 96).lineTo(560, 96).lineWidth(2).strokeColor(gold).stroke();

      doc.fillColor(navy).font('Helvetica-Bold').fontSize(15)
        .text("AUTORISATION PROVISOIRE D'INSCRIPTION", 52, 112, { align: 'center' });
      doc.font('Helvetica-Bold').fontSize(9)
        .text(`Référence : ${data.reference}`, 52, 136, { align: 'center' });
      doc.fillColor('#333333').font('Helvetica').fontSize(9)
        .text(`Émise le ${data.dateGeneration}`, 52, 151, { align: 'center' });

      doc.fillColor('#222222').font('Helvetica').fontSize(10)
        .text("Le Comité d'Orientation et d'Équivalence autorise provisoirement l'inscription de :", 56, 184, { width: 500 });
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12)
        .text(nomComplet || 'Étudiant', 56, 210, { width: 500 });

      doc.fillColor('#222222').font('Helvetica').fontSize(10);
      const details = [
        ['Matricule', etudiant.matricule],
        ['Date de naissance', etudiant.dateNaissance],
        ['Lieu de naissance', etudiant.lieuNaissance],
        ['Nationalité', etudiant.nationalite],
        ['Année académique', etudiant.anneeAcademique],
        ['Parcours / filière', etudiant.filiere],
        ['Niveau', etudiant.niveau],
      ];
      let y = 246;
      for (const [label, value] of details) {
        doc.fillColor('#555555').font('Helvetica').text(`${label} :`, 56, y, { width: 140 });
        doc.fillColor('#222222').font('Helvetica-Bold').text(decodeHtmlText(value) || 'Non renseigné', 198, y, { width: 350 });
        y += 24;
      }

      const autorisation = data.autorisationProvisoire;
      if (autorisation?.diplomeRecu) {
        const relevesAvecDates = autorisation.relevesSemestresRecus
          .map((semestre) => {
            const date = autorisation.relevesSemestresDates[semestre];
            return date ? `${semestre} (${date})` : semestre;
          })
          .join(', ');
        y += 6;
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
          .text('Pièces académiques reçues', 56, y);
        y += 18;
        doc.fillColor('#222222').font('Helvetica').fontSize(9)
          .text(`Diplôme reçu : ${autorisation.diplomeRecu} — Date : ${autorisation.dateDiplomeRecu}`, 56, y, { width: 500 });
        y += 16;
        doc.text(
          `Relevés de notes reçus : ${relevesAvecDates || autorisation.relevesSemestresRecusLibelle}`,
          56,
          y,
          { width: 500 },
        );
        y += 16;
        doc.fillColor(navy).font('Helvetica-Bold')
          .text(`Semestres autorisés : ${autorisation.semestresAutorises.join(', ')}`, 56, y, { width: 500 });
        y += 12;
      }

        const signataires = [data.autorisationProvisoire?.signataire1, data.autorisationProvisoire?.signataire2];
        signataires.forEach((signataire, index) => {
          const x = index === 0 ? 56 : 316;
          doc.fillColor(navy).font('Helvetica-Bold').fontSize(9)
            .text(decodeHtmlText(signataire?.nomComplet) || 'Membre signataire', x, 690, { width: 240, align: 'center' });
          if (signataire?.signatureData) {
            const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(signataire.signatureData);
            if (match) {
              doc.image(Buffer.from(match[1], 'base64'), x + 20, 704, { fit: [200, 42], align: 'center', valign: 'center' });
            }
          }
        });

        doc.roundedRect(56, y + 8, 500, 70, 5).lineWidth(1).strokeColor(navy).stroke();
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(9)
        .text('Conditions', 68, y + 20);
      doc.fillColor('#333333').font('Helvetica').fontSize(9)
        .text(
          "Cette autorisation est provisoire. L'établissement se réserve le droit de vérifier l'authenticité des pièces fournies. Toute production de faux document peut entraîner des sanctions disciplinaires et judiciaires.",
          68,
          y + 36,
          { width: 476, height: 38, align: 'justify' },
        );

      doc.fillColor('#333333').font('Helvetica').fontSize(9)
        .text("Pour le Comité d'Orientation et d'Équivalence", 56, 700, { width: 500, align: 'center' });
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
        .text(data.initialesComite || 'Comité d’orientation', 56, 725, { width: 500, align: 'center' });
      doc.fillColor('#777777').font('Helvetica').fontSize(8)
        .text(`Document généré le ${data.dateGeneration} — Réf : ${data.reference}`, 52, 780, { width: 508, align: 'center' });

      doc.end();
    });
  }
}
