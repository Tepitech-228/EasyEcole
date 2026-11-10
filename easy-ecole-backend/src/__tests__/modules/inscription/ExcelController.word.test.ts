import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from 'docx';
import { lireTableauWord } from '../../../modules/inscription/controllers/ExcelController';

const makeCell = (
  text: string,
  options: { rowSpan?: number; columnSpan?: number } = {}
): TableCell =>
  new TableCell({
    children: [new Paragraph(text)],
    ...options,
  });

describe('ExcelController.lireTableauWord', () => {
  it('conserve les colonnes malgré les rowspans/colspans du modèle Word', async () => {
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            makeCell("CODE DE L'UE", { rowSpan: 2, columnSpan: 2 }),
            makeCell('CONTENUS DES ENSEIGNEMENTS', { columnSpan: 2 }),
            makeCell('TYPE'),
            makeCell('CM'),
            makeCell('TD/TP'),
            makeCell('TPE'),
            makeCell('VH'),
            makeCell('CREDIT'),
          ],
        }),
        new TableRow({
          children: [
            makeCell('UE'),
            makeCell('ECUE'),
            makeCell('T'),
            makeCell('10'),
            makeCell('5'),
            makeCell('0'),
            makeCell('15'),
            makeCell('6'),
          ],
        }),
        new TableRow({
          children: [
            makeCell('UE1'),
            makeCell('Intitulé'),
            makeCell('1. ECUE1 : Mathématiques'),
            makeCell('F'),
            makeCell('10'),
            makeCell('5'),
            makeCell('0'),
            makeCell('15'),
            makeCell('6'),
            makeCell('Prof. Test'),
            makeCell('action'),
          ],
        }),
      ],
    });
    const doc = new Document({ sections: [{ children: [table] }] });
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'easyecole-word-'));
    const filePath = path.join(workDir, 'tableau.docx');
    fs.writeFileSync(filePath, await Packer.toBuffer(doc));

    try {
      const matrix = await lireTableauWord(filePath);

      expect(matrix).toHaveLength(3);
      expect(matrix[0]).toHaveLength(11);
      expect(matrix[0][0]).toBe("CODE DE L'UE");
      expect(matrix[0][1]).toBe('');
      expect(matrix[0][2]).toBe('CONTENUS DES ENSEIGNEMENTS');
      expect(matrix[0][9]).toBe('CREDIT');
      expect(matrix[0][10]).toBe('');

      expect(matrix[1][0]).toBe("CODE DE L'UE");
      expect(matrix[1][1]).toBe("CODE DE L'UE");
      expect(matrix[1][2]).toBe('UE');
      expect(matrix[1][3]).toBe('ECUE');
      expect(matrix[1][9]).toBe('6');
      expect(matrix[1][10]).toBe('');

      expect(matrix[2]).toEqual([
        'UE1',
        'Intitulé',
        '1. ECUE1 : Mathématiques',
        'F',
        '10',
        '5',
        '0',
        '15',
        '6',
        'Prof. Test',
        'action',
      ]);
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  });
});
