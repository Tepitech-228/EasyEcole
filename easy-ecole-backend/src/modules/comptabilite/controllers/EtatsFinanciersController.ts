import { Request, Response } from "express";
import { Op } from "sequelize";
import { Compte } from "../models/Compte";
import { EcritureComptable } from "../models/EcritureComptable";
import { ExerciceComptable } from "../models/ExerciceComptable";
import { getSoldeCompteAtDate, getSoldeCompteSurPeriode } from "../helpers/ComptabiliteHelper";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export default class EtatsFinanciersController {
  constructor() { }

  /**
   * GET /etats-financiers/bilan
   * Bilan comptable à une date d'arrêté
   * Query: ?dateArrete=2026-12-31&exerciceId=1
   */
  static async getBilan(req: Request, res: Response): Promise<Response> {
    try {
      const { dateArrete, exerciceId } = req.query;
      const date = (dateArrete as string) || new Date().toISOString().split('T')[0];

      // Récupérer les comptes de bilan (classes 1, 2, 3, 4, 5)
      const comptes = await Compte.findAll({
        where: {
          classe: ['1', '2', '3', '4', '5'],
          actif: true
        },
        order: [['numero', 'ASC']]
      });

      const actif: any[] = [];
      const passif: any[] = [];
      let totalActif = 0;
      let totalPassif = 0;

      for (const compte of comptes) {
        const solde = await getSoldeCompteAtDate(
          compte.id,
          date,
          exerciceId ? Number(exerciceId) : undefined
        );

        if (solde === 0) continue;

        const poste = {
          compte: {
            id: compte.id,
            numero: compte.numero,
            libelle: compte.libelle,
            classe: compte.classe,
            nature: compte.nature,
            categorie: compte.categorie
          },
          solde: Math.abs(solde),
          soldeSigne: solde
        };

        const classe = compte.classe;

        // Déterminer si c'est de l'actif ou du passif
        // Règle OHADA :
        // ACTIF : classe 2 (immobilisations), classe 3 (stocks),
        //         classe 4 nature 'Débit' (créances clients, etc.),
        //         classe 5 si solde débiteur (trésorerie positive)
        // PASSIF : classe 1 (capitaux propres),
        //          classe 4 nature 'Crédit' (dettes fournisseurs, etc.),
        //          classe 5 si solde créditeur (découvert bancaire)
        const isDebiteur = solde > 0;

        if (classe === '2' || classe === '3') {
          actif.push(poste);
          totalActif += Math.abs(solde);
        } else if (classe === '1') {
          passif.push(poste);
          totalPassif += Math.abs(solde);
        } else if (classe === '4') {
          if (compte.nature === 'Débit' || compte.nature === 'Débit/Crédit') {
            actif.push({ ...poste, section: 'Créances' });
            totalActif += Math.abs(solde);
          } else {
            passif.push({ ...poste, section: 'Dettes' });
            totalPassif += Math.abs(solde);
          }
        } else if (classe === '5') {
          if (isDebiteur) {
            actif.push({ ...poste, section: 'Trésorerie' });
            totalActif += Math.abs(solde);
          } else {
            passif.push({ ...poste, section: 'Trésorerie passive' });
            totalPassif += Math.abs(solde);
          }
        }
      }

      // Vérifier l'équilibre
      const equilibre = Math.abs(totalActif - totalPassif) < 1;
      const ecart = totalActif - totalPassif;

      // Récupérer l'exercice si demandé
      let exercice = null;
      if (exerciceId) {
        exercice = await ExerciceComptable.findByPk(Number(exerciceId));
      }

      return res.status(200).json({
        success: true,
        data: {
          exercice,
          dateArrete: date,
          actif: {
            total: Math.round(totalActif * 100) / 100,
            postes: actif
          },
          passif: {
            total: Math.round(totalPassif * 100) / 100,
            postes: passif
          },
          equilibre,
          ecart: Math.round(ecart * 100) / 100
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || error });
    }
  }

  /**
   * GET /etats-financiers/compte-resultat
   * Compte de résultat sur une période
   * Query: ?dateDebut=2026-01-01&dateFin=2026-12-31&exerciceId=1
   */
  static async getCompteResultat(req: Request, res: Response): Promise<Response> {
    try {
      const { dateDebut, dateFin, exerciceId } = req.query;

      // Période par défaut : l'année en cours
      const defautDateDebut = new Date().getFullYear() + '-01-01';
      const defautDateFin = new Date().toISOString().split('T')[0];

      const debut = (dateDebut as string) || defautDateDebut;
      const fin = (dateFin as string) || defautDateFin;

      // Récupérer les comptes de gestion (classes 6 et 7)
      const comptes = await Compte.findAll({
        where: {
          classe: ['6', '7'],
          actif: true
        },
        order: [['numero', 'ASC']]
      });

      const produits: any[] = [];
      const charges: any[] = [];
      let totalProduits = 0;
      let totalCharges = 0;

      for (const compte of comptes) {
        const solde = await getSoldeCompteSurPeriode(
          compte.id,
          debut,
          fin,
          exerciceId ? Number(exerciceId) : undefined
        );

        if (solde === 0) continue;

        const poste = {
          compte: {
            id: compte.id,
            numero: compte.numero,
            libelle: compte.libelle,
            classe: compte.classe,
            categorie: compte.categorie
          },
          solde: Math.abs(solde),
          soldeSigne: solde
        };

        // Classe 7 = Produits (solde créditeur normalement)
        // Classe 6 = Charges (solde débiteur normalement)
        if (compte.classe === '7') {
          produits.push(poste);
          totalProduits += Math.abs(solde);
        } else if (compte.classe === '6') {
          charges.push(poste);
          totalCharges += Math.abs(solde);
        }
      }

      const resultatNet = totalProduits - totalCharges;

      // Récupérer l'exercice si demandé
      let exercice = null;
      if (exerciceId) {
        exercice = await ExerciceComptable.findByPk(Number(exerciceId));
      }

      return res.status(200).json({
        success: true,
        data: {
          exercice,
          periode: {
            dateDebut: debut,
            dateFin: fin
          },
          produits: {
            total: Math.round(totalProduits * 100) / 100,
            postes: produits
          },
          charges: {
            total: Math.round(totalCharges * 100) / 100,
            postes: charges
          },
          resultatNet: Math.round(resultatNet * 100) / 100
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || error });
    }
  }

  /**
   * GET /etats-financiers/bilan/export
   * Export du bilan en PDF ou Excel
   * Query: ?format=pdf&dateArrete=...&exerciceId=...
   */
  static async exportBilan(req: Request, res: Response): Promise<void> {
    try {
      const { format, dateArrete, exerciceId } = req.query;
      const date = (dateArrete as string) || new Date().toISOString().split('T')[0];

      if (format === 'xlsx') {
        await EtatsFinanciersController.exportBilanExcel(req, res, date, exerciceId as string);
      } else {
        // Par défaut : PDF
        await EtatsFinanciersController.exportBilanPdf(req, res, date, exerciceId as string);
      }
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message || error });
      }
    }
  }

  /**
   * GET /etats-financiers/compte-resultat/export
   * Export du compte de résultat en PDF ou Excel
   * Query: ?format=pdf&dateDebut=...&dateFin=...&exerciceId=...
   */
  static async exportCompteResultat(req: Request, res: Response): Promise<void> {
    try {
      const { format, dateDebut, dateFin, exerciceId } = req.query;
      const defautDateDebut = new Date().getFullYear() + '-01-01';
      const defautDateFin = new Date().toISOString().split('T')[0];
      const debut = (dateDebut as string) || defautDateDebut;
      const fin = (dateFin as string) || defautDateFin;

      if (format === 'xlsx') {
        await EtatsFinanciersController.exportCompteResultatExcel(req, res, debut, fin, exerciceId as string);
      } else {
        await EtatsFinanciersController.exportCompteResultatPdf(req, res, debut, fin, exerciceId as string);
      }
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message || error });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Méthodes privées d'export
  // ---------------------------------------------------------------------------

  /**
   * Export Bilan au format PDF
   */
  private static async exportBilanPdf(req: Request, res: Response, date: string, exerciceId?: string): Promise<void> {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bilan_${date}.pdf`);
    doc.pipe(res);

    // En-tête
    doc.fontSize(18).font('Helvetica-Bold').text('BILAN COMPTABLE', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Arrêté au ${date}`, { align: 'center' });
    if (exerciceId) {
      const exercice = await ExerciceComptable.findByPk(Number(exerciceId));
      if (exercice) {
        doc.fontSize(10).text(`Exercice : ${exercice.libelle} (${exercice.code})`, { align: 'center' });
      }
    }
    doc.moveDown(0.5);

    // Ligne de séparation
    doc.moveTo(30, doc.y).lineTo(795, doc.y).stroke();
    doc.moveDown(0.5);

    // Calcul des données du bilan
    const comptes = await Compte.findAll({
      where: { classe: ['1', '2', '3', '4', '5'], actif: true },
      order: [['numero', 'ASC']]
    });

    const actifPostes: any[] = [];
    const passifPostes: any[] = [];
    let totalActif = 0;
    let totalPassif = 0;

    for (const compte of comptes) {
      const solde = await getSoldeCompteAtDate(
        compte.id,
        date,
        exerciceId ? Number(exerciceId) : undefined
      );
      if (solde === 0) continue;

      const classe = compte.classe;
      const isDebiteur = solde > 0;

      if (classe === '2' || classe === '3') {
        actifPostes.push({ compte, solde: Math.abs(solde) });
        totalActif += Math.abs(solde);
      } else if (classe === '1') {
        passifPostes.push({ compte, solde: Math.abs(solde) });
        totalPassif += Math.abs(solde);
      } else if (classe === '4') {
        if (compte.nature === 'Débit' || compte.nature === 'Débit/Crédit') {
          actifPostes.push({ compte, solde: Math.abs(solde) });
          totalActif += Math.abs(solde);
        } else {
          passifPostes.push({ compte, solde: Math.abs(solde) });
          totalPassif += Math.abs(solde);
        }
      } else if (classe === '5') {
        if (isDebiteur) {
          actifPostes.push({ compte, solde: Math.abs(solde) });
          totalActif += Math.abs(solde);
        } else {
          passifPostes.push({ compte, solde: Math.abs(solde) });
          totalPassif += Math.abs(solde);
        }
      }
    }

    const formatMontant = (val: number): string => {
      return val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' FCFA';
    };

    // --- Tableau ACTIF ---
    doc.fontSize(13).font('Helvetica-Bold').text('ACTIF', { underline: true });
    doc.moveDown(0.3);

    // En-tête colonnes
    const colNumX = 30;
    const colLibX = 100;
    const colMontantX = 550;
    const colTotalX = 680;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('N°', colNumX, doc.y, { width: 60 });
    doc.text('Libellé', colLibX, doc.y - doc.currentLineHeight(), { width: 250 });
    doc.text('Montant', colMontantX, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
    doc.moveDown(0.3);

    // Ligne
    const yStart = doc.y;
    doc.moveTo(30, yStart).lineTo(780, yStart).stroke();
    doc.moveDown(0.3);

    // Lignes Actif
    doc.fontSize(9).font('Helvetica');
    for (const p of actifPostes) {
      const y = doc.y;
      doc.text(p.compte.numero, colNumX, y, { width: 60 });
      doc.text(p.compte.libelle, colLibX, y, { width: 250 });
      doc.text(formatMontant(p.solde), colMontantX, y, { width: 100, align: 'right' });
      doc.moveDown(0.4);
    }

    // Total Actif
    doc.moveDown(0.2);
    doc.moveTo(30, doc.y).lineTo(780, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold');
    doc.text('TOTAL ACTIF', colNumX, doc.y, { width: 250 });
    doc.text(formatMontant(totalActif), colMontantX, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
    doc.moveDown(1);

    // --- Tableau PASSIF ---
    doc.fontSize(13).font('Helvetica-Bold').text('PASSIF', { underline: true });
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('N°', colNumX, doc.y, { width: 60 });
    doc.text('Libellé', colLibX, doc.y - doc.currentLineHeight(), { width: 250 });
    doc.text('Montant', colMontantX, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
    doc.moveDown(0.3);

    doc.moveTo(30, doc.y).lineTo(780, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica');
    for (const p of passifPostes) {
      const y = doc.y;
      doc.text(p.compte.numero, colNumX, y, { width: 60 });
      doc.text(p.compte.libelle, colLibX, y, { width: 250 });
      doc.text(formatMontant(p.solde), colMontantX, y, { width: 100, align: 'right' });
      doc.moveDown(0.4);
    }

    // Total Passif
    doc.moveDown(0.2);
    doc.moveTo(30, doc.y).lineTo(780, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold');
    doc.text('TOTAL PASSIF', colNumX, doc.y, { width: 250 });
    doc.text(formatMontant(totalPassif), colMontantX, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
    doc.moveDown(0.5);

    // Vérification équilibre
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold');
    const equilibre = Math.abs(totalActif - totalPassif) < 1;
    doc.text(`Total Actif : ${formatMontant(totalActif)}  |  Total Passif : ${formatMontant(totalPassif)}`, { align: 'center' });
    doc.text(`Équilibre : ${equilibre ? '✓ Équilibré' : '✗ Non équilibré (écart: ' + formatMontant(totalActif - totalPassif) + ')'}`, { align: 'center' });

    doc.end();
  }

  /**
   * Export Bilan au format Excel
   */
  private static async exportBilanExcel(req: Request, res: Response, date: string, exerciceId?: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EasyEcole';
    workbook.created = new Date();

    // Feuille ACTIF
    const sheetActif = workbook.addWorksheet('Actif');
    const sheetPassif = workbook.addWorksheet('Passif');

    // Style des en-têtes
    const headerStyle: any = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const cellStyle: any = {
      font: { size: 10 },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const totalStyle: any = {
      font: { bold: true, size: 10 },
      border: {
        top: { style: 'double' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' }
      },
      numFmt: '#,##0'
    };

    // Calcul des données du bilan
    const comptes = await Compte.findAll({
      where: { classe: ['1', '2', '3', '4', '5'], actif: true },
      order: [['numero', 'ASC']]
    });

    const actifPostes: any[] = [];
    const passifPostes: any[] = [];
    let totalActif = 0;
    let totalPassif = 0;

    for (const compte of comptes) {
      const solde = await getSoldeCompteAtDate(
        compte.id,
        date,
        exerciceId ? Number(exerciceId) : undefined
      );
      if (solde === 0) continue;

      const classe = compte.classe;
      const isDebiteur = solde > 0;

      if (classe === '2' || classe === '3') {
        actifPostes.push({ compte, solde: Math.abs(solde) });
        totalActif += Math.abs(solde);
      } else if (classe === '1') {
        passifPostes.push({ compte, solde: Math.abs(solde) });
        totalPassif += Math.abs(solde);
      } else if (classe === '4') {
        if (compte.nature === 'Débit' || compte.nature === 'Débit/Crédit') {
          actifPostes.push({ compte, solde: Math.abs(solde) });
          totalActif += Math.abs(solde);
        } else {
          passifPostes.push({ compte, solde: Math.abs(solde) });
          totalPassif += Math.abs(solde);
        }
      } else if (classe === '5') {
        if (isDebiteur) {
          actifPostes.push({ compte, solde: Math.abs(solde) });
          totalActif += Math.abs(solde);
        } else {
          passifPostes.push({ compte, solde: Math.abs(solde) });
          totalPassif += Math.abs(solde);
        }
      }
    }

    const formatMontant = (val: number): string => {
      return val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' FCFA';
    };

    // --- Remplissage feuille ACTIF ---
    sheetActif.mergeCells('A1:D1');
    const titleActif = sheetActif.getCell('A1');
    titleActif.value = `BILAN COMPTABLE - ACTIF au ${date}`;
    titleActif.font = { bold: true, size: 14 };

    sheetActif.mergeCells('A2:D2');
    sheetActif.getCell('A2').value = `Exercice: ${exerciceId || 'En cours'}`;
    sheetActif.getCell('A2').font = { size: 10, italic: true };

    // En-têtes colonnes
    sheetActif.getCell('A4').value = 'N° Compte';
    sheetActif.getCell('B4').value = 'Libellé';
    sheetActif.getCell('C4').value = 'Montant';
    sheetActif.getCell('D4').value = 'Categorie';

    ['A4', 'B4', 'C4', 'D4'].forEach(c => {
      sheetActif.getCell(c).style = headerStyle;
    });
    sheetActif.getColumn('A').width = 12;
    sheetActif.getColumn('B').width = 40;
    sheetActif.getColumn('C').width = 20;
    sheetActif.getColumn('D').width = 25;

    let row = 5;
    for (const p of actifPostes) {
      sheetActif.getCell(`A${row}`).value = p.compte.numero;
      sheetActif.getCell(`B${row}`).value = p.compte.libelle;
      sheetActif.getCell(`C${row}`).value = p.solde;
      sheetActif.getCell(`C${row}`).numFmt = '#,##0';
      sheetActif.getCell(`D${row}`).value = p.compte.categorie;
      [`A${row}`, `B${row}`, `C${row}`, `D${row}`].forEach(c => {
        sheetActif.getCell(c).style = cellStyle;
      });
      row++;
    }

    // Total
    sheetActif.getCell(`A${row}`).value = 'TOTAL ACTIF';
    sheetActif.getCell(`C${row}`).value = totalActif;
    sheetActif.getCell(`C${row}`).numFmt = '#,##0';
    [`A${row}`, `B${row}`, `C${row}`, `D${row}`].forEach(c => {
      sheetActif.getCell(c).style = totalStyle;
    });

    // --- Remplissage feuille PASSIF ---
    sheetPassif.mergeCells('A1:D1');
    const titlePassif = sheetPassif.getCell('A1');
    titlePassif.value = `BILAN COMPTABLE - PASSIF au ${date}`;
    titlePassif.font = { bold: true, size: 14 };

    sheetPassif.mergeCells('A2:D2');
    sheetPassif.getCell('A2').value = `Exercice: ${exerciceId || 'En cours'}`;
    sheetPassif.getCell('A2').font = { size: 10, italic: true };

    sheetPassif.getCell('A4').value = 'N° Compte';
    sheetPassif.getCell('B4').value = 'Libellé';
    sheetPassif.getCell('C4').value = 'Montant';
    sheetPassif.getCell('D4').value = 'Categorie';

    ['A4', 'B4', 'C4', 'D4'].forEach(c => {
      sheetPassif.getCell(c).style = headerStyle;
    });
    sheetPassif.getColumn('A').width = 12;
    sheetPassif.getColumn('B').width = 40;
    sheetPassif.getColumn('C').width = 20;
    sheetPassif.getColumn('D').width = 25;

    row = 5;
    for (const p of passifPostes) {
      sheetPassif.getCell(`A${row}`).value = p.compte.numero;
      sheetPassif.getCell(`B${row}`).value = p.compte.libelle;
      sheetPassif.getCell(`C${row}`).value = p.solde;
      sheetPassif.getCell(`C${row}`).numFmt = '#,##0';
      sheetPassif.getCell(`D${row}`).value = p.compte.categorie;
      [`A${row}`, `B${row}`, `C${row}`, `D${row}`].forEach(c => {
        sheetPassif.getCell(c).style = cellStyle;
      });
      row++;
    }

    // Total
    sheetPassif.getCell(`A${row}`).value = 'TOTAL PASSIF';
    sheetPassif.getCell(`C${row}`).value = totalPassif;
    sheetPassif.getCell(`C${row}`).numFmt = '#,##0';
    [`A${row}`, `B${row}`, `C${row}`, `D${row}`].forEach(c => {
      sheetPassif.getCell(c).style = totalStyle;
    });

    // Ajout une feuille de vérification
    const sheetVerif = workbook.addWorksheet('Vérification');
    sheetVerif.mergeCells('A1:C1');
    sheetVerif.getCell('A1').value = 'VÉRIFICATION DE L\'ÉQUILIBRE';
    sheetVerif.getCell('A1').font = { bold: true, size: 14 };

    sheetVerif.getCell('A3').value = 'Total Actif';
    sheetVerif.getCell('B3').value = totalActif;
    sheetVerif.getCell('B3').numFmt = '#,##0';
    sheetVerif.getCell('A4').value = 'Total Passif';
    sheetVerif.getCell('B4').value = totalPassif;
    sheetVerif.getCell('B4').numFmt = '#,##0';

    const equilibre = Math.abs(totalActif - totalPassif) < 1;
    sheetVerif.getCell('A6').value = 'Équilibre';
    sheetVerif.getCell('B6').value = equilibre ? 'Équilibré ✓' : `Non équilibré (écart: ${totalActif - totalPassif})`;
    sheetVerif.getCell('B6').font = { color: { argb: equilibre ? 'FF00B050' : 'FFFF0000' }, bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=bilan_${date}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Export Compte de résultat au format PDF
   */
  private static async exportCompteResultatPdf(req: Request, res: Response, dateDebut: string, dateFin: string, exerciceId?: string): Promise<void> {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=compte_resultat_${dateDebut}_${dateFin}.pdf`);
    doc.pipe(res);

    // En-tête
    doc.fontSize(18).font('Helvetica-Bold').text('COMPTE DE RÉSULTAT', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Période du ${dateDebut} au ${dateFin}`, { align: 'center' });
    if (exerciceId) {
      const exercice = await ExerciceComptable.findByPk(Number(exerciceId));
      if (exercice) {
        doc.fontSize(10).text(`Exercice : ${exercice.libelle} (${exercice.code})`, { align: 'center' });
      }
    }
    doc.moveDown(0.5);
    doc.moveTo(30, doc.y).lineTo(795, doc.y).stroke();
    doc.moveDown(0.5);

    // Calcul des données
    const comptes = await Compte.findAll({
      where: { classe: ['6', '7'], actif: true },
      order: [['numero', 'ASC']]
    });

    const produits: any[] = [];
    const charges: any[] = [];
    let totalProduits = 0;
    let totalCharges = 0;

    for (const compte of comptes) {
      const solde = await getSoldeCompteSurPeriode(
        compte.id,
        dateDebut,
        dateFin,
        exerciceId ? Number(exerciceId) : undefined
      );
      if (solde === 0) continue;

      if (compte.classe === '7') {
        produits.push({ compte, solde: Math.abs(solde) });
        totalProduits += Math.abs(solde);
      } else if (compte.classe === '6') {
        charges.push({ compte, solde: Math.abs(solde) });
        totalCharges += Math.abs(solde);
      }
    }

    const resultatNet = totalProduits - totalCharges;
    const formatMontant = (val: number): string => {
      return val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' FCFA';
    };

    const colNumX = 30;
    const colLibX = 100;
    const colMontantX = 550;
    const colTotalX = 680;

    // --- PRODUITS ---
    doc.fontSize(13).font('Helvetica-Bold').text('PRODUITS (Classe 7)', { underline: true });
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('N°', colNumX, doc.y, { width: 60 });
    doc.text('Libellé', colLibX, doc.y - doc.currentLineHeight(), { width: 250 });
    doc.text('Montant', colMontantX, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
    doc.moveDown(0.3);
    doc.moveTo(30, doc.y).lineTo(780, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica');
    for (const p of produits) {
      const y = doc.y;
      doc.text(p.compte.numero, colNumX, y, { width: 60 });
      doc.text(p.compte.libelle, colLibX, y, { width: 250 });
      doc.text(formatMontant(p.solde), colMontantX, y, { width: 100, align: 'right' });
      doc.moveDown(0.4);
    }

    doc.moveDown(0.2);
    doc.moveTo(30, doc.y).lineTo(780, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold');
    doc.text('TOTAL PRODUITS', colNumX, doc.y, { width: 250 });
    doc.text(formatMontant(totalProduits), colMontantX, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
    doc.moveDown(1);

    // --- CHARGES ---
    doc.fontSize(13).font('Helvetica-Bold').text('CHARGES (Classe 6)', { underline: true });
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('N°', colNumX, doc.y, { width: 60 });
    doc.text('Libellé', colLibX, doc.y - doc.currentLineHeight(), { width: 250 });
    doc.text('Montant', colMontantX, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
    doc.moveDown(0.3);
    doc.moveTo(30, doc.y).lineTo(780, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica');
    for (const c of charges) {
      const y = doc.y;
      doc.text(c.compte.numero, colNumX, y, { width: 60 });
      doc.text(c.compte.libelle, colLibX, y, { width: 250 });
      doc.text(formatMontant(c.solde), colMontantX, y, { width: 100, align: 'right' });
      doc.moveDown(0.4);
    }

    doc.moveDown(0.2);
    doc.moveTo(30, doc.y).lineTo(780, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold');
    doc.text('TOTAL CHARGES', colNumX, doc.y, { width: 250 });
    doc.text(formatMontant(totalCharges), colMontantX, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
    doc.moveDown(1);

    // --- RÉSULTAT NET ---
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('RÉSULTAT NET', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12);
    doc.text(`Produits : ${formatMontant(totalProduits)}`, { align: 'center' });
    doc.text(`Charges  : ${formatMontant(totalCharges)}`, { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold');
    const signe = resultatNet >= 0 ? 'BÉNÉFICE' : 'PERTE';
    doc.text(`Résultat net : ${formatMontant(Math.abs(resultatNet))} (${signe})`, { align: 'center' });

    doc.end();
  }

  /**
   * Export Compte de résultat au format Excel
   */
  private static async exportCompteResultatExcel(req: Request, res: Response, dateDebut: string, dateFin: string, exerciceId?: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EasyEcole';
    workbook.created = new Date();

    const sheetProduits = workbook.addWorksheet('Produits');
    const sheetCharges = workbook.addWorksheet('Charges');
    const sheetResultat = workbook.addWorksheet('Résultat');

    // Styles
    const headerStyle: any = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    };

    const cellStyle: any = {
      font: { size: 10 },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    };

    const totalStyle: any = {
      font: { bold: true, size: 10 },
      border: {
        top: { style: 'double' }, left: { style: 'thin' },
        bottom: { style: 'double' }, right: { style: 'thin' }
      },
      numFmt: '#,##0'
    };

    // Calcul des données
    const comptes = await Compte.findAll({
      where: { classe: ['6', '7'], actif: true },
      order: [['numero', 'ASC']]
    });

    const produits: any[] = [];
    const charges: any[] = [];
    let totalProduits = 0;
    let totalCharges = 0;

    for (const compte of comptes) {
      const solde = await getSoldeCompteSurPeriode(
        compte.id,
        dateDebut,
        dateFin,
        exerciceId ? Number(exerciceId) : undefined
      );
      if (solde === 0) continue;

      if (compte.classe === '7') {
        produits.push({ compte, solde: Math.abs(solde) });
        totalProduits += Math.abs(solde);
      } else if (compte.classe === '6') {
        charges.push({ compte, solde: Math.abs(solde) });
        totalCharges += Math.abs(solde);
      }
    }

    const resultatNet = totalProduits - totalCharges;

    // --- Feuille PRODUITS ---
    sheetProduits.mergeCells('A1:D1');
    sheetProduits.getCell('A1').value = `COMPTE DE RÉSULTAT - PRODUITS du ${dateDebut} au ${dateFin}`;
    sheetProduits.getCell('A1').font = { bold: true, size: 14 };

    sheetProduits.mergeCells('A2:D2');
    sheetProduits.getCell('A2').value = `Exercice: ${exerciceId || 'En cours'}`;
    sheetProduits.getCell('A2').font = { size: 10, italic: true };

    sheetProduits.getCell('A4').value = 'N° Compte';
    sheetProduits.getCell('B4').value = 'Libellé';
    sheetProduits.getCell('C4').value = 'Montant';
    sheetProduits.getCell('D4').value = 'Catégorie';

    ['A4', 'B4', 'C4', 'D4'].forEach(c => sheetProduits.getCell(c).style = headerStyle);
    sheetProduits.getColumn('A').width = 12;
    sheetProduits.getColumn('B').width = 40;
    sheetProduits.getColumn('C').width = 20;
    sheetProduits.getColumn('D').width = 25;

    let row = 5;
    for (const p of produits) {
      sheetProduits.getCell(`A${row}`).value = p.compte.numero;
      sheetProduits.getCell(`B${row}`).value = p.compte.libelle;
      sheetProduits.getCell(`C${row}`).value = p.solde;
      sheetProduits.getCell(`C${row}`).numFmt = '#,##0';
      sheetProduits.getCell(`D${row}`).value = p.compte.categorie;
      [`A${row}`, `B${row}`, `C${row}`, `D${row}`].forEach(c => sheetProduits.getCell(c).style = cellStyle);
      row++;
    }

    sheetProduits.getCell(`A${row}`).value = 'TOTAL PRODUITS';
    sheetProduits.getCell(`C${row}`).value = totalProduits;
    sheetProduits.getCell(`C${row}`).numFmt = '#,##0';
    [`A${row}`, `B${row}`, `C${row}`, `D${row}`].forEach(c => sheetProduits.getCell(c).style = totalStyle);

    // --- Feuille CHARGES ---
    sheetCharges.mergeCells('A1:D1');
    sheetCharges.getCell('A1').value = `COMPTE DE RÉSULTAT - CHARGES du ${dateDebut} au ${dateFin}`;
    sheetCharges.getCell('A1').font = { bold: true, size: 14 };

    sheetCharges.mergeCells('A2:D2');
    sheetCharges.getCell('A2').value = `Exercice: ${exerciceId || 'En cours'}`;
    sheetCharges.getCell('A2').font = { size: 10, italic: true };

    sheetCharges.getCell('A4').value = 'N° Compte';
    sheetCharges.getCell('B4').value = 'Libellé';
    sheetCharges.getCell('C4').value = 'Montant';
    sheetCharges.getCell('D4').value = 'Catégorie';

    ['A4', 'B4', 'C4', 'D4'].forEach(c => sheetCharges.getCell(c).style = headerStyle);
    sheetCharges.getColumn('A').width = 12;
    sheetCharges.getColumn('B').width = 40;
    sheetCharges.getColumn('C').width = 20;
    sheetCharges.getColumn('D').width = 25;

    row = 5;
    for (const c of charges) {
      sheetCharges.getCell(`A${row}`).value = c.compte.numero;
      sheetCharges.getCell(`B${row}`).value = c.compte.libelle;
      sheetCharges.getCell(`C${row}`).value = c.solde;
      sheetCharges.getCell(`C${row}`).numFmt = '#,##0';
      sheetCharges.getCell(`D${row}`).value = c.compte.categorie;
      [`A${row}`, `B${row}`, `C${row}`, `D${row}`].forEach(c => sheetCharges.getCell(c).style = cellStyle);
      row++;
    }

    sheetCharges.getCell(`A${row}`).value = 'TOTAL CHARGES';
    sheetCharges.getCell(`C${row}`).value = totalCharges;
    sheetCharges.getCell(`C${row}`).numFmt = '#,##0';
    [`A${row}`, `B${row}`, `C${row}`, `D${row}`].forEach(c => sheetCharges.getCell(c).style = totalStyle);

    // --- Feuille RÉSULTAT ---
    sheetResultat.mergeCells('A1:C1');
    sheetResultat.getCell('A1').value = `COMPTE DE RÉSULTAT - SYNTHÈSE du ${dateDebut} au ${dateFin}`;
    sheetResultat.getCell('A1').font = { bold: true, size: 14 };

    sheetResultat.getCell('A3').value = 'Total Produits';
    sheetResultat.getCell('B3').value = totalProduits;
    sheetResultat.getCell('B3').numFmt = '#,##0';
    sheetResultat.getCell('A4').value = 'Total Charges';
    sheetResultat.getCell('B4').value = totalCharges;
    sheetResultat.getCell('B4').numFmt = '#,##0';
    sheetResultat.getCell('A6').value = 'Résultat Net';
    sheetResultat.getCell('B6').value = resultatNet;
    sheetResultat.getCell('B6').numFmt = '#,##0';
    const signe = resultatNet >= 0 ? 'BÉNÉFICE' : 'PERTE';
    sheetResultat.getCell('C6').value = signe;
    sheetResultat.getCell('C6').font = { bold: true, color: { argb: resultatNet >= 0 ? 'FF00B050' : 'FFFF0000' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=compte_resultat_${dateDebut}_${dateFin}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
