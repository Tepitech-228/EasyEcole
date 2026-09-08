import path from 'path';
import fs from 'fs';
import { RecuCaisse } from '../models/RecuCaisse';
import { DemandeDocument } from '../models/DemandeDocument';
import { TypeDocument } from '../models/TypeDocument';
import { Utilisateur } from '../../auth/models/Utilisateur';
import { SecretariatService } from './SecretariatService';
import { PdfGeneratorService } from '../../docgen/services/PdfGeneratorService';

const STORAGE_DIR = 'storage/recus-caisse';

/**
 * Génère le PDF du Reçu de Caisse Unique (RCU) au format ESA.
 * - Deux exemplaires : original (étudiant) + copie (ESA-Compta)
 * - Design : bordure bleue #2b6cb0, en-tête ESA, tableau de détails, signature comptable
 */
export class RecuCaisseGeneratorService {

  /**
   * Génère les deux exemplaires du RCU (original + copie compta).
   * Retourne les chemins des fichiers PDF générés.
   */
  static async genererRecu(recu: RecuCaisse): Promise<{ originalPath: string; copiePath: string }> {
    // S'assurer que le dossier de stockage existe
    const storageAbs = path.resolve(STORAGE_DIR);
    if (!fs.existsSync(storageAbs)) {
      fs.mkdirSync(storageAbs, { recursive: true });
    }

    // Recharger le reçu avec toutes les associations nécessaires
    const recuComplet = await RecuCaisse.findByPk(recu.id, {
      include: [
        {
          model: DemandeDocument,
          as: 'demandeDocument',
          include: [
            { model: TypeDocument, as: 'typeDocument' },
            { model: Utilisateur, as: 'etudiant' }
          ]
        },
        { model: Utilisateur, as: 'caissier' }
      ]
    });

    if (!recuComplet || !recuComplet.demande) {
      throw new Error(`Reçu ${recu.id} introuvable ou associations manquantes`);
    }

    const demande = recuComplet.demande;
    const etudiant = demande.etudiant;
    const typeDocument = demande.typeDocument;
    const caissier = recuComplet.caissier;

    const montantLettres = SecretariatService.nombreEnLettres(recuComplet.montant);

    // Informations de l'étudiant
    const nomComplet = `${etudiant?.nom || ''} ${etudiant?.prenoms || ''}`.trim() || 'N/A';
    const matricule = (etudiant as any)?.matricule || 'N/A';
    const filiere = (demande as any).classeId ? `Classe #${demande.classeId}` : 'N/A';
    const anneeAcademique = (demande as any).anneeAcademiqueId ? `Année #${demande.anneeAcademiqueId}` : 'N/A';

    const datePaiement = new Date(recuComplet.datePaiement).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const modePaiementLibelle = this.modePaiementLibelle(recuComplet.modePaiement);

    // Construire le HTML du reçu
    const html = this.buildRecuHtml({
      numero: recuComplet.numero,
      datePaiement,
      matricule,
      nomComplet,
      filiere,
      anneeAcademique,
      modePaiement: modePaiementLibelle,
      referencePaiement: (demande as any).referencePaiement || '—',
      designation: typeDocument?.libelle || 'Document',
      montant: recuComplet.montant,
      montantLettres,
      caissierNom: caissier ? `${caissier.nom || ''} ${caissier.prenoms || ''}`.trim() : ''
    });

    // Générer le PDF avec Puppeteer (sans header/footer ESA car le reçu a son propre design)
    const pdfBuffer = await PdfGeneratorService.generate(html, {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
      disableHeader: true
    });

    // Sauvegarder l'original
    const originalFilename = `RCU-${recuComplet.numero}.pdf`;
    const originalPath = path.join(STORAGE_DIR, originalFilename);
    fs.writeFileSync(originalPath, pdfBuffer);

    // Sauvegarder la copie compta (même contenu, nommé différemment)
    const copieFilename = `RCU-COMPTA-${recuComplet.numero}.pdf`;
    const copiePath = path.join(STORAGE_DIR, copieFilename);
    fs.writeFileSync(copiePath, pdfBuffer);

    // Mettre à jour le fichierPDF sur le reçu
    await recuComplet.update({ fichierPDF: originalPath });

    return { originalPath, copiePath };
  }

  /**
   * Construit le HTML du reçu de caisse au format ESA.
   * Reprend fidèlement le design de RECU de caisse.html.
   */
  private static buildRecuHtml(data: {
    numero: string;
    datePaiement: string;
    matricule: string;
    nomComplet: string;
    filiere: string;
    anneeAcademique: string;
    modePaiement: string;
    referencePaiement: string;
    designation: string;
    montant: number;
    montantLettres: string;
    caissierNom: string;
  }): string {
    const montantFormate = data.montant.toLocaleString('fr-FR');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu de Caisse Unique (RCU) - ${data.numero}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm;
        }

        *, *::before, *::after {
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10pt;
            color: #1a202c;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
        }

        .rcu-container {
            border: 2px solid #2b6cb0;
            border-radius: 6px;
            padding: 16px;
            background-color: #ffffff;
            position: relative;
        }

        .rcu-header {
            width: 100%;
            border-bottom: 2px solid #2b6cb0;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: top;
        }

        .institution-info {
            width: 60%;
        }

        .institution-name {
            font-size: 12pt;
            font-weight: bold;
            color: #1a365d;
            text-transform: uppercase;
            margin: 0;
        }

        .institution-details {
            font-size: 8pt;
            color: #4a5568;
            margin-top: 3px;
            line-height: 1.3;
        }

        .receipt-title-box {
            width: 40%;
            text-align: right;
        }

        .receipt-title {
            font-size: 14pt;
            font-weight: bold;
            color: #2b6cb0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }

        .receipt-meta {
            font-size: 9pt;
            margin-top: 5px;
            color: #2d3748;
        }

        .meta-highlight {
            font-weight: bold;
            color: #c53030;
        }

        .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            background-color: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
        }

        .info-grid td {
            padding: 6px 10px;
            font-size: 9.5pt;
            border-bottom: 1px solid #edf2f7;
        }

        .info-grid td.label {
            font-weight: bold;
            color: #4a5568;
            width: 22%;
            background-color: #edf2f7;
        }

        .info-grid td.value {
            color: #1a202c;
            width: 28%;
            font-weight: 500;
        }

        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .details-table th {
            background-color: #2b6cb0;
            color: #ffffff;
            font-size: 9pt;
            text-transform: uppercase;
            padding: 6px 10px;
            text-align: left;
            border: 1px solid #2b6cb0;
        }

        .details-table td {
            padding: 6px 10px;
            font-size: 9pt;
            border: 1px solid #cbd5e0;
        }

        .details-table td.amount {
            text-align: right;
            font-weight: bold;
            font-family: 'Courier New', Courier, monospace;
        }

        .total-row {
            background-color: #ebf8ff;
            font-weight: bold;
        }

        .total-row td {
            border-top: 2px solid #2b6cb0;
            font-size: 10pt;
            color: #2b6cb0;
        }

        .amount-in-words {
            background-color: #f7fafc;
            border: 1px dashed #cbd5e0;
            padding: 8px 10px;
            font-size: 9pt;
            margin-bottom: 15px;
            border-radius: 4px;
        }

        .amount-in-words .label {
            font-weight: bold;
            color: #4a5568;
        }

        .amount-in-words .text {
            font-style: italic;
            font-weight: bold;
            color: #2d3748;
        }

        .signatures-area {
            width: 100%;
            margin-top: 15px;
        }

        .signatures-table {
            width: 100%;
            border-collapse: collapse;
        }

        .signatures-table td {
            vertical-align: top;
            padding: 0;
        }

        .signature-box-single {
            width: 45%;
            margin-left: auto;
            text-align: center;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            padding: 8px;
            background-color: #faf5ff;
        }

        .signature-title {
            font-size: 9pt;
            font-weight: bold;
            color: #2b6cb0;
            text-transform: uppercase;
            margin-bottom: 40px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
        }

        .signature-sub {
            font-size: 8pt;
            color: #a0aec0;
            font-style: italic;
        }

        .cut-line {
            border-top: 1px dashed #a0aec0;
            margin: 20px 0;
            text-align: center;
            position: relative;
        }

        .cut-line span {
            background: #fff;
            padding: 0 10px;
            font-size: 8pt;
            color: #718096;
            position: relative;
            top: -9px;
        }
    </style>
</head>
<body>
    <div class="rcu-container">
        <div class="rcu-header">
            <table class="header-table">
                <tr>
                    <td class="institution-info">
                        <div class="institution-name">ÉCOLE SUPÉRIEURE DES AFFAIRES</div>
                        <div class="institution-details">
                            Établissement d'Enseignement Supérieur Privé<br>
                            Agrée par l'État - N° Arrêté / Enseignement Supérieur<br>
                            Tél : (+228) 22 25 50 50 / Contact : caisse@esa.tg
                        </div>
                    </td>
                    <td class="receipt-title-box">
                        <div class="receipt-title">REÇU DE CAISSE</div>
                        <div class="receipt-meta">
                            N° Reçu : <span class="meta-highlight">${data.numero}</span><br>
                            Date : <strong>${data.datePaiement}</strong>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <table class="info-grid">
            <tr>
                <td class="label">Matricule :</td>
                <td class="value">${data.matricule}</td>
                <td class="label">Étudiant(e) :</td>
                <td class="value">${data.nomComplet}</td>
            </tr>
            <tr>
                <td class="label">Filière / Niveau :</td>
                <td class="value">${data.filiere}</td>
                <td class="label">Année Acad. :</td>
                <td class="value">${data.anneeAcademique}</td>
            </tr>
            <tr>
                <td class="label">Mode de Paiement :</td>
                <td class="value">${data.modePaiement}</td>
                <td class="label">N° Pièce / Réf :</td>
                <td class="value">${data.referencePaiement}</td>
            </tr>
        </table>

        <table class="details-table">
            <thead>
                <tr>
                    <th style="width: 10%;">Code</th>
                    <th style="width: 60%;">Désignation / Motif du règlement</th>
                    <th style="width: 30%; text-align: right;">Montant (FCFA)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>DOC-01</td>
                    <td>${data.designation}</td>
                    <td class="amount">${montantFormate}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="2" style="text-align: right; font-weight: bold;">TOTAL ENCAISSÉ :</td>
                    <td class="amount">${montantFormate} FCFA</td>
                </tr>
            </tbody>
        </table>

        <div class="amount-in-words">
            <span class="label">Arrêté la présente somme à la hauteur de :</span>
            <span class="text">${data.montantLettres} Francs CFA.</span>
        </div>

        <div class="signatures-area">
            <table class="signatures-table">
                <tr>
                    <td style="width: 55%;"></td>
                    <td>
                        <div class="signature-box-single">
                            <div class="signature-title">Le Comptable / La Caisse</div>
                            <div class="signature-sub">${data.caissierNom || '(Nom, Cachet et Signature)'}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Télécharge le fichier PDF du reçu.
   */
  static telechargerRecu(recu: RecuCaisse): string | null {
    if (!recu.fichierPDF) return null;
    const absPath = path.resolve(recu.fichierPDF);
    if (!fs.existsSync(absPath)) return null;
    return absPath;
  }

  /**
   * Récupère le chemin du fichier PDF original (pour l'étudiant).
   */
  static getOriginalPath(numero: string): string | null {
    const absPath = path.resolve(STORAGE_DIR, `RCU-${numero}.pdf`);
    return fs.existsSync(absPath) ? absPath : null;
  }

  /**
   * Récupère le chemin du fichier PDF copie compta.
   */
  static getCopieComptaPath(numero: string): string | null {
    const absPath = path.resolve(STORAGE_DIR, `RCU-COMPTA-${numero}.pdf`);
    return fs.existsSync(absPath) ? absPath : null;
  }

  private static modePaiementLibelle(mode: string): string {
    switch (mode) {
      case 'especes': return 'Espèces / Caisse';
      case 'mobile_money': return 'Mobile Money';
      case 'autre': return 'Autre';
      default: return mode;
    }
  }
}
