import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from 'docx';
import {
  detectUeCategory,
  getParcoursCycleMismatch,
  findFormatBRowColumnOffset,
  findFormatBColumns,
  inferParcoursCycleFromFileName,
  isFormatBUeTitleContinuation,
  lireTableauWord,
  lireTableauxWord,
  parseMatiereCell,
} from '../../../modules/inscription/controllers/ExcelController';

const makeCell = (
  text: string,
  options: { rowSpan?: number; columnSpan?: number } = {}
): TableCell =>
  new TableCell({
    children: [new Paragraph(text)],
    ...options,
  });

describe('ExcelController.lireTableauWord', () => {
  it('distributes separate paragraph values across a merged Word cell rowspan', async () => {
    const table = new Table({
      rows: [
        new TableRow({
          children: [
            makeCell("CODE DE L'UE"),
            makeCell('UE'),
            makeCell('ECUE'),
            makeCell('TYPE'),
            makeCell('VH'),
            makeCell('CREDIT'),
            makeCell('ENSEIGNANT'),
          ],
        }),
        new TableRow({
          children: [
            makeCell('DIJ11', { rowSpan: 2 }),
            makeCell('Disciplines juridiques', { rowSpan: 2 }),
            makeCell('DIJ111 : Déclaration fiscale'),
            makeCell('F'),
            makeCell('36'),
            new TableCell({
              children: [new Paragraph('3'), new Paragraph('3')],
              rowSpan: 2,
            }),
            makeCell('Enseignant 1'),
          ],
        }),
        new TableRow({
          children: [
            makeCell('DIJ112 : Droit des entreprises'),
            makeCell('F'),
            makeCell('24'),
            makeCell('Enseignant 2'),
          ],
        }),
      ],
    }, 30000);
    const doc = new Document({ sections: [{ children: [table] }] });
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'easyecole-word-'));
    const filePath = path.join(workDir, 'merged-credit.docx');
    fs.writeFileSync(filePath, await Packer.toBuffer(doc));

    try {
      const [matrix] = await lireTableauxWord(filePath);
      expect(matrix[1][5]).toBe('3');
      expect(matrix[2][5]).toBe('3');
      expect(matrix[1][4]).toBe('36');
      expect(matrix[2][4]).toBe('24');
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  });

  it('conserve les colonnes malgré les rowspans/colspans du modèle Word', async () => {
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            makeCell("CODE DE L'UE", { rowSpan: 2 }),
            makeCell('INTITULE DES ENSEIGNEMENTS', { columnSpan: 2 }),
            makeCell('TYPE', { rowSpan: 2 }),
            makeCell('CM', { rowSpan: 2 }),
            makeCell('TD/TP', { rowSpan: 2 }),
            makeCell('TPE', { rowSpan: 2 }),
            makeCell('TOTAL', { rowSpan: 2 }),
            makeCell('TOTAL PRESENTIEL', { rowSpan: 2 }),
            makeCell('CREDIT', { rowSpan: 2 }),
            makeCell('ENSEIGNANT', { rowSpan: 2 }),
          ],
        }),
        new TableRow({
          children: [
            makeCell('UE'),
            makeCell('ECUE'),
          ],
        }),
        new TableRow({
          children: [
            makeCell('UE1'),
            makeCell('Intitulé UE'),
            makeCell('1. ECUE1 : Mathématiques'),
            makeCell('F'),
            makeCell('10'),
            makeCell('5'),
            makeCell('0'),
            makeCell('15'),
            makeCell('15'),
            makeCell('6'),
            makeCell('Prof. Test'),
          ],
        }),
      ],
    }, 30000);
    const alternateTable = new Table({
      rows: [
        new TableRow({
          children: [
            makeCell("CODE DE L'UE"),
            makeCell('UNITE D’ENSEIGNEMENT'),
            makeCell(''),
            makeCell('MATIERE'),
            makeCell('TYPES'),
            makeCell('CM'),
            makeCell('TD/TP'),
            makeCell('TPE'),
            makeCell('TOTAL'),
            makeCell('TOTAL PRESENTIEL'),
            makeCell('CREDIT'),
          ],
        }),
        new TableRow({
          children: [
            makeCell('UE2'),
            makeCell('Intitulé UE 2'),
            makeCell(''),
            makeCell('Maitrise de la lecture'),
            makeCell('F'),
            makeCell('20'),
            makeCell('10'),
            makeCell('20'),
            makeCell('50'),
            makeCell('30'),
            makeCell('2'),
          ],
        }),
      ],
    });
    const doc = new Document({ sections: [{ children: [table, alternateTable] }] });
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'easyecole-word-'));
    const filePath = path.join(workDir, 'tableau.docx');
    fs.writeFileSync(filePath, await Packer.toBuffer(doc));

    try {
      const tables = await lireTableauxWord(filePath);
      const matrix = tables[0];

      expect(tables).toHaveLength(2);
      expect(matrix).toHaveLength(3);
      expect(matrix[0]).toHaveLength(11);
      expect(matrix[0][0]).toBe("CODE DE L'UE");
      expect(matrix[0][1]).toBe('INTITULE DES ENSEIGNEMENTS');
      expect(matrix[0][2]).toBe('');
      expect(matrix[0][9]).toBe('CREDIT');
      expect(matrix[0][10]).toBe('ENSEIGNANT');

      expect(matrix[1][0]).toBe("CODE DE L'UE");
      expect(matrix[1][1]).toBe('UE');
      expect(matrix[1][2]).toBe('ECUE');
      expect(matrix[1][3]).toBe('TYPE');
      expect(matrix[1][9]).toBe('CREDIT');
      expect(matrix[1][10]).toBe('ENSEIGNANT');

      expect(matrix[2]).toEqual([
        'UE1',
        'Intitulé UE',
        '1. ECUE1 : Mathématiques',
        'F',
        '10',
        '5',
        '0',
        '15',
        '15',
        '6',
        'Prof. Test',
      ]);
      expect(tables[1][1][3]).toBe('Maitrise de la lecture');
      expect(findFormatBColumns(tables[1])).toMatchObject({
        code: 0,
        intitule: 1,
        ecue: 3,
        type: 4,
        cm: 5,
        tdTp: 6,
        tpe: 7,
        total: 8,
        credit: 10,
      });
      expect(await lireTableauWord(filePath)).toHaveLength(5);
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  });
});

describe('ExcelController UE maquette extraction', () => {
  it('resolves columns from each two-level header instead of reusing the first table layout', () => {
    const columns = findFormatBColumns([
      ["CODE DE L'UE", 'CONTENUS DES ENSEIGNEMENTS', '', '', 'TYPES', 'CM', 'TD/TP', 'TPE', 'TOTAL', 'TOTAL PRESENTIEL', 'CREDIT', 'ENSEIGNANT'],
      ["CODE DE L'UE", "UNITES D'ENSEIGNEMENT MAJEURES", '', '', '', '', '', '', '', '', 'CREDIT', 'ENSEIGNANT'],
      ['', 'UE', '', 'ECUE'],
    ]);

    expect(columns).toEqual({
      code: 0,
      intitule: 1,
      ecue: 3,
      type: 4,
      cm: 5,
      tdTp: 6,
      tpe: 7,
      vh: -1,
      total: 8,
      credit: 10,
    });
  });

  it('recognizes ECUE labels with or without a printed code and ignores numeric-only cells', () => {
    expect(parseMatiereCell('1. EEC1102 : Economie et organisation', 'UE1-1')).toEqual({
      ecueCode: 'EEC1102',
      ecueLibelle: 'Economie et organisation',
      codeGenerated: false,
    });
    expect(parseMatiereCell('2. EEC1103 Economie générale', 'UE1-2')).toEqual({
      ecueCode: 'EEC1103',
      ecueLibelle: 'Economie générale',
      codeGenerated: false,
    });
    expect(parseMatiereCell('Maitrise de la lecture', 'CEF1101-1')).toEqual({
      ecueCode: 'CEF1101-1',
      ecueLibelle: 'Maitrise de la lecture',
      codeGenerated: true,
    });
    expect(parseMatiereCell('15', 'CEF1101-2')).toBeNull();
  });

  it('recognizes the ECUE spellings used in the Master maquettes', () => {
    expect(parseMatiereCell('2.GRH2201: Gestion des conflits et négociations collectives')).toMatchObject({
      ecueCode: 'GRH2201',
      ecueLibelle: 'Gestion des conflits et négociations collectives',
    });
    expect(parseMatiereCell('3.COM2103 Psychosociologie')).toMatchObject({
      ecueCode: 'COM2103',
      ecueLibelle: 'Psychosociologie',
    });
    expect(parseMatiereCell('2.COM12202 Publicité et promotion des ventes')).toMatchObject({
      ecueCode: 'COM12202',
      ecueLibelle: 'Publicité et promotion des ventes',
    });
  });

  it('shifts data columns when Word merged cells move the ECUE past its header column', () => {
    expect(findFormatBRowColumnOffset([
      'GRH2201',
      'GRH 2',
      'GRH 2',
      'GRH 2',
      '2.GRH2201: Gestion des conflits',
      'F',
      '25',
      '15',
      '60',
      '100',
      '40',
      '3',
    ], 2)).toBe(2);
    expect(findFormatBRowColumnOffset([
      'COM 2103',
      'Communication',
      '3.COM2103 Psychosociologie',
      'F',
      '25',
      '15',
      '60',
      '100',
      '40',
      '4',
    ], 2)).toBe(0);
    expect(findFormatBRowColumnOffset([
      'MAN2203',
      '',
      'Mandarin-chinois',
      'L',
      '10',
      '0',
      '15',
      '25',
      '10',
      '1',
    ], 2)).toBe(0);
  });

  it('recognizes category rows despite the spelling used in the DPRP maquette', () => {
    expect(detectUeCategory(["UNITES D'ENSEISEIGNEMENT MAJEURES"])).toBe('MAJEURE');
    expect(detectUeCategory(["UNITES D'ENSEIGNEMENTS MINEURES"])).toBe('MINEURE');
    expect(detectUeCategory(['UNITES D’ENSEIGNEMENT LIBRES'])).toBe('LIBRE');
  });

  it('identifies and rejects parcours cycles that do not match the source filename', () => {
    expect(inferParcoursCycleFromFileName('Offre Master Pro ACG ESA-2025.docx')).toBe('MASTER');
    expect(inferParcoursCycleFromFileName('LICENCE PRO ACT-ESA-2025.docx')).toBe('LICENCE');
    expect(inferParcoursCycleFromFileName('maquette.docx')).toBeNull();
    expect(getParcoursCycleMismatch('Offre Master Pro ACG ESA-2025.docx', 'LICENCE')).toContain('cycle MASTER');
    expect(getParcoursCycleMismatch('Offre Master Pro ACG ESA-2025.docx', 'MASTER')).toBeNull();
  });

  it('recognizes a repeated UE title row without treating it as an ECUE', () => {
    const columns = findFormatBColumns([
      ["CODE DE L'UE", 'CONTENUS DES ENSEIGNEMENTS', '', 'TYPE', 'VH', 'CREDIT'],
      ["CODE DE L'UE", 'UE', 'ECUE', 'TYPE', 'VH', 'CREDIT'],
    ]);

    expect(isFormatBUeTitleContinuation([
      '',
      'Outils de Développement Personnel',
      '',
      '',
      '',
      '',
    ], columns)).toBe(true);
    expect(isFormatBUeTitleContinuation([
      'ODP11',
      'Outils de Développement Personnel',
      '',
      '',
      '',
      '',
    ], columns)).toBe(false);
    expect(isFormatBUeTitleContinuation([
      '',
      '',
      'ODP111 : Anglais des affaires',
      'F',
      '36',
      '3',
    ], columns)).toBe(false);
  });
});
