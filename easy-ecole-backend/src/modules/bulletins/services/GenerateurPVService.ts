import * as path from "path";
import * as fs from "fs";
import PDFDocument from "pdfkit";
import { Deliberation } from "../models/Deliberation";
import { ResultatDeliberation } from "../models/ResultatDeliberation";
import { Classe } from "../../inscription/models/Classe";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { JuryMembre } from "../models/JuryMembre";
import { DECISION_LABELS, DecisionType } from "../enums/DecisionType";

export class GenerateurPVService {

  static async generer(deliberationId: number): Promise<string> {
    const deliberation = await Deliberation.findByPk(deliberationId, {
      include: [
        { association: Deliberation.associations.classe },
        { association: Deliberation.associations.anneeAcademique },
        {
          association: Deliberation.associations.resultats,
          order: [['rang', 'ASC']]
        }
      ]
    });

    if (!deliberation) throw new Error('Délibération non trouvée');

    const juryMembres = await JuryMembre.findAll({
      where: { deliberationId },
      include: [{ association: 'utilisateur' }]
    });

    const uploadDir = path.join(process.cwd(), 'uploads', 'pv');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `pv_deliberation_${deliberationId}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, filename);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const classe = deliberation.classe as any;
    const anneeAcademique = deliberation.anneeAcademique as any;

    const pageWidth = doc.page.width - 80;
    const centerX = doc.page.width / 2;

    doc.fontSize(14).font('Helvetica-Bold').text('PROCÈS-VERBAL DE DÉLIBÉRATION', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Année académique : ${anneeAcademique?.libelle || '-'}`, { align: 'center' });
    doc.text(`Classe : ${classe?.libelle || '-'}`, { align: 'center' });
    doc.text(`Période : ${deliberation.periode === 'semestre1' ? 'Semestre 1' : 'Semestre 2'}`, { align: 'center' });
    doc.text(`Date : ${new Date(deliberation.date).toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.text(`Session : ${deliberation.sessionType === 'rattrapage' ? 'Rattrapage' : 'Initiale'}`, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Membres du jury');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    if (juryMembres.length > 0) {
      juryMembres.forEach((jm: any) => {
        const user = jm.utilisateur;
        doc.text(`- ${user?.prenoms || ''} ${user?.nom || ''} (${jm.role || 'Membre'})`);
      });
    } else {
      doc.text('(Aucun membre enregistré)');
    }

    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('Résultats');
    doc.moveDown(0.3);

    const resultats = deliberation.resultats || [];
    const decisionsCount: Record<string, number> = {};
    const tableTop = doc.y;
    const colX = [40, 110, 220, 300, 360, 440];
    const colW = [70, 110, 80, 60, 80, 80];
    const headers = ['N°', 'Nom & Prénoms', 'Matricule', 'Moyenne', 'Décision', 'Mention'];

    doc.fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, colX[i], tableTop, { width: colW[i], align: 'left' });
    });
    doc.moveDown(0.5);

    let y = doc.y;
    doc.fontSize(8).font('Helvetica');
    for (const r of resultats) {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = doc.y;
      }
      const row = [
        String(r.rang || ''),
        `${r.nom || ''} ${r.prenoms || ''}`,
        r.matricule || '',
        r.moyenne != null ? r.moyenne.toFixed(2) : '-',
        DECISION_LABELS[r.decision as DecisionType] || r.decision,
        r.mention || ''
      ];
      row.forEach((val, i) => {
        doc.text(val, colX[i], y, { width: colW[i], align: 'left' });
      });
      decisionsCount[r.decision] = (decisionsCount[r.decision] || 0) + 1;
      y += 14;
    }

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').text('Récapitulatif');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text(`Effectif total : ${resultats.length}`);
    for (const [dec, count] of Object.entries(decisionsCount)) {
      doc.text(`${DECISION_LABELS[dec as DecisionType] || dec} : ${count}`);
    }
    const nbAdmis = (decisionsCount['admis'] || 0) + (decisionsCount['admis_avec_dette'] || 0);
    const taux = resultats.length > 0 ? ((nbAdmis / resultats.length) * 100).toFixed(1) : '0.0';
    doc.text(`Taux de réussite : ${taux}%`);

    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica');
    doc.text('Fait à __________________________, le __________________________', { align: 'center' });
    doc.moveDown(1);
    doc.text('Le Président du jury', { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filename));
      stream.on('error', reject);
    });
  }
}
