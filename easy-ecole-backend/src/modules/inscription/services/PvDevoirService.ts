import { Transaction } from "sequelize";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { CoursParticipant } from "../models/CoursParticipant";
import { CursusApprenant } from "../models/CursusApprenant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Cours } from "../models/Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Apprenant } from "../../auth/models/Apprenant";
import { DocGenLogoService } from "../../docgen/services/DocGenLogoService";
import { Classe } from "../models/Classe";
import { Parcours } from "../models/Parcours";
import { NiveauEtude } from "../models/NiveauEtude";
import { Seance } from "../models/Seance";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { EchelleNote } from "../../bulletins/models/EchelleNote";
import { PdfGeneratorService } from "../../docgen/services/PdfGeneratorService";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { Op } from "sequelize";

const NOM_ETABLISSEMENT_DEFAUT = 'Université des Sciences et Technologies (UST)';

export interface PvDevoirData {
  evaluation: ListeNoteEvaluation
  participants: any[]
  notesEval: NoteEvaluation[]
  cours: Cours
  enseignant: { nom?: string; prenoms?: string } | null
  classe: { libelle?: string } | null
  parcours: { titre?: string } | null
  niveauEtude: { libelle?: string } | null
  anneeAcademique: { libelle?: string } | null
  typeNoteEvaluation: { libelle?: string; categorie?: string } | null
  nomEtablissement: string
  nomSalle: string
  dateEvaluation: string
  echelles: { noteMin: number; noteMax: number; mention: string }[]
  stats: {
    effectif: number
    presents: number
    notesSuperieur10: number
    notesInferieur10: number
    noteMax: number | null
    noteMin: number | null
    moyenneGenerale: number | null
    tauxReussite: number | null
  }
}

export class PvDevoirService {

  static async assemblerDonnees(evaluationId: number): Promise<PvDevoirData> {
    const evaluation = await ListeNoteEvaluation.findOne({
      where: { id: evaluationId },
      include: [
        { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
        { association: ListeNoteEvaluation.associations.anneeAcademique },
        {
          association: ListeNoteEvaluation.associations.cours,
          include: [
            Cours.associations.classe,
            { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] },
          ]
        },
        { association: ListeNoteEvaluation.associations.notesEvaluation },
      ]
    })

    if (!evaluation) {
      throw new Error('Évaluation non trouvée')
    }

    const cours = evaluation.cours as any
    const classe = cours?.classe
    const parcours = cours?.parcours
    const niveauEtude = (parcours as any)?.niveauEtude

    let nomEtablissement = NOM_ETABLISSEMENT_DEFAUT
    try {
      const etablissement = await Etablissement.findOne({ where: { actif: true } })
      if (etablissement?.nom) nomEtablissement = etablissement.nom
    } catch { /* fallback */ }

    let nomSalle = ''
    try {
      const seance = await Seance.findOne({
        where: { coursId: evaluation.coursId },
        include: [{ association: Seance.associations.salleDeClasse }],
        order: [['dateDebut', 'DESC']],
        limit: 1
      })
      const salle = (seance as any)?.salleDeClasse
      if (salle?.libelle) nomSalle = salle.libelle
    } catch { /* salle optionnelle */ }

    const participantsModels = await CoursParticipant.findAll({
      where: { coursId: evaluation.coursId },
      include: [
        {
          association: CoursParticipant.associations.utilisateur,
          attributes: ['nom', 'prenoms', 'identifiant', 'contact'],
          required: true,
        },
        {
          association: CoursParticipant.associations.cursusApprenant,
          include: [{ association: CursusApprenant.associations.demandeInscription }],
          required: true,
        }
      ]
    })

    const utilisateurIds = participantsModels.map(p => Number(p.utilisateurId)).filter(id => !isNaN(id))
    let apprenantsMap = new Map<number, any>()
    try {
      if (utilisateurIds.length) {
        const apprenants = await Apprenant.findAll({
          where: { utilisateurId: { [Op.in]: utilisateurIds } as any },
          attributes: ['id', 'utilisateurId', 'sexe', 'cni'],
          include: [{
            association: Apprenant.associations.adresse,
            attributes: ['apprenantId', 'telMobile']
          }]
        })
        apprenantsMap = new Map(apprenants.map(a => [Number((a as any).utilisateurId), a]))
      }
    } catch (e) {
      console.warn('[PvDevoir] Infos perso apprenants indisponibles:', (e as Error).message)
    }

    const participants = participantsModels.map(p => {
      const plain: any = p.get({ plain: true })
      const apprenant: any = apprenantsMap.get(Number(p.utilisateurId))
      plain.apprenant = apprenant ? {
        sexe: apprenant.sexe || '',
        cni: apprenant.cni || '',
        telMobile: apprenant.adresse?.telMobile || ''
      } : null
      return plain
    }).sort((a, b) =>
      `${a.utilisateur?.nom || ''} ${a.utilisateur?.prenoms || ''}`.trim()
        .localeCompare(`${b.utilisateur?.nom || ''} ${b.utilisateur?.prenoms || ''}`.trim(), 'fr')
    )

    const notesEval = evaluation.notesEvaluation || []

    const notesNumeriques = notesEval.map(n => Number(n.note)).filter(n => !isNaN(n) && n !== null) as number[]
    const effectif = participants.length
    const notesSuperieur10 = notesNumeriques.filter(n => n >= 10).length
    const notesInferieur10 = notesNumeriques.filter(n => n < 10).length
    const noteMax = notesNumeriques.length > 0 ? Math.max(...notesNumeriques) : null
    const noteMin = notesNumeriques.length > 0 ? Math.min(...notesNumeriques) : null
    const moyenneGenerale = notesNumeriques.length > 0 ? Math.round((notesNumeriques.reduce((a, b) => a + b, 0) / notesNumeriques.length) * 100) / 100 : null
    const tauxReussite = notesNumeriques.length > 0 ? Math.round((notesSuperieur10 / notesNumeriques.length) * 10000) / 100 : null

    let echelles: { noteMin: number; noteMax: number; mention: string }[] = []
    try {
      echelles = await EchelleNote.findAll({
        where: { estActive: true },
        order: [['noteMin', 'ASC']],
        attributes: ['noteMin', 'noteMax', 'mention'],
        raw: true
      }) as any
    } catch { /* mention non disponible */ }

    return {
      evaluation,
      participants,
      notesEval,
      cours,
      enseignant: (cours?.enseignant?.utilisateur as any) || null,
      classe: classe ? { libelle: classe.libelle } : null,
      parcours: parcours ? { titre: parcours.titre } : null,
      niveauEtude: niveauEtude ? { libelle: niveauEtude.libelle } : null,
      anneeAcademique: (evaluation as any).anneeAcademique ? { libelle: (evaluation as any).anneeAcademique.libelle } : null,
      typeNoteEvaluation: evaluation.typeNoteEvaluation ? { libelle: evaluation.typeNoteEvaluation.libelle, categorie: evaluation.typeNoteEvaluation.categorie } : null,
      nomEtablissement,
      nomSalle,
      dateEvaluation: evaluation.date ? new Date(evaluation.date).toLocaleDateString('fr-FR') : '',
      echelles,
      stats: {
        effectif,
        presents: notesNumeriques.length,
        notesSuperieur10,
        notesInferieur10,
        noteMax,
        noteMin,
        moyenneGenerale,
        tauxReussite,
      }
    }
  }

  static async genererHtml(data: PvDevoirData): Promise<string> {
    const { evaluation, participants, notesEval, cours, enseignant, classe, parcours, anneeAcademique, nomEtablissement, nomSalle, dateEvaluation, stats } = data

    const semestreCours = (cours as any)?.semestre
      ? (cours as any).semestre.replace('semestre', 'Semestre ')
      : ''

    const dureeMinutes = (() => {
      const debut = evaluation.heureDebut ? new Date(`1970-01-01T${evaluation.heureDebut}`) : null
      const fin = evaluation.heureFin ? new Date(`1970-01-01T${evaluation.heureFin}`) : null
      if (debut && fin) {
        const diff = Math.round((fin.getTime() - debut.getTime()) / 60000)
        const h = Math.floor(diff / 60)
        const m = diff % 60
        return `${h.toString().padStart(2, '0')} H ${m.toString().padStart(2, '0')} mn`
      }
      return '...'
    })()

    const formatHeure = (v: any): string => {
      const m = String(v || '').match(/(\d{1,2}):(\d{2})/)
      return m ? `${m[1].padStart(2, '0')}h${m[2]}min` : String(v || '')
    }

    const ligneCellules = (p: any, idx: number): string => {
      const noteEval = notesEval.find((n: any) => n.coursParticipantId === p.id)
      const note = noteEval?.note != null ? Number(noteEval.note) : null
      const nom = `${p.utilisateur?.nom || ''} ${p.utilisateur?.prenoms || ''}`.trim()
      const sexe = p.apprenant?.sexe || ''
      const contact = p.apprenant?.telMobile || p.utilisateur?.contact || ''
      const refCni = p.apprenant?.cni || ''

      return `<tr>
        <td class="center">${idx + 1}</td>
        <td>${nom}</td>
        <td class="center">${sexe}</td>
        <td class="center">${contact || ''}</td>
        <td class="center">${refCni || ''}</td>
        <td class="center"></td>
        <td class="handwritten center">${note !== null && !isNaN(note) ? note : ''}</td>
      </tr>`
    }

    // Nombre de lignes (réelles + vides) que le PV classique affiche.
    const minLignes = Math.max(participants.length + 2, 15)
    const nbLignesVides = Math.max(minLignes - participants.length, 0)

    // En-tête de tableau répété (une fois par bloc de page).
    const theadInner = `<tr>
        <th style="width: 5%;">N°</th>
        <th style="width: 30%;">NOM ET PRENOMS</th>
        <th style="width: 8%;">SEXE</th>
        <th style="width: 12%;">CONTACT</th>
        <th style="width: 15%;">REF CNI/CE/PASS</th>
        <th style="width: 10%;">SIGN</th>
        <th style="width: 10%;">NOTE</th>
      </tr>`

    // Nombre de lignes par bloc : choisi pour tenir sur une page A4 portrait.
    // Chaque bloc devient une table SÉPARÉE avec son propre <thead> et un saut
    // de page avant lui. L'en-tête est ainsi reproduit en haut de chaque page.
    const LIGNES_PAR_PAGE = 22
    const lignesReelles: string[] = participants.map((p: any, idx: number) => ligneCellules(p, idx))
    const lignesVidesArr: string[] = Array.from({ length: nbLignesVides }, (_, i) =>
      `<tr><td class="center">${participants.length + i + 1}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
    )
    const toutesLignes: string[] = [...lignesReelles, ...lignesVidesArr]
    const blocsTable: string[] = []
    for (let start = 0; start < toutesLignes.length; start += LIGNES_PAR_PAGE) {
      const groupe = toutesLignes.slice(start, start + LIGNES_PAR_PAGE).join('')
      const sautPage = start > 0 ? ' style="break-before: page; page-break-before: always;"' : ''
      blocsTable.push(`<table${sautPage} class="pv-table"><thead>${theadInner}</thead><tbody>${groupe}</tbody></table>`)
    }

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Procès-Verbal du Devoir - ESA</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #000; margin: 20px; background-color: #f9f9f9; }
    .container { width: 800px; margin: 0 auto; background: #fff; padding: 25px; border: 1px solid #ccc; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header-logo { width: 150px; height: auto; }
    .header-text { text-align: center; flex: 1; }
    .header-text h1 { margin: 2px 0; font-size: 20px; font-weight: bold; }
    .header-text p { margin: 2px 0; font-size: 11px; }
    .doc-title { text-align: center; font-size: 22px; font-weight: bold; margin: 15px 0; text-decoration: underline; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
    .info-item { line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    /* Répète l'en-tête du tableau sur chaque page (rendu PDF Chromium/Puppeteer).
       IMPORTANT : pas de break-inside: avoid sur les lignes tr - il empêche
       Chromium de répéter le thead quand le tableau déborde (bug documenté). */
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th, td { border: 1px solid #000; padding: 6px; text-align: left; }
    th { background-color: #f2f2f2; text-align: center; }
    .center { text-align: center; }
    .section-box { border: 1px solid #000; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
    .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 8px; }
    .two-column { display: flex; justify-content: space-between; gap: 15px; }
    .col { flex: 1; }
    .footer-stamp { margin-top: 20px; text-align: right; font-size: 11px; font-weight: bold; }
    .handwritten { font-family: 'Courier New', Courier, monospace; font-weight: bold; color: #000080; }
  </style>
</head>
<body>
  <div class="container">
    <!-- L'en-tête institutionnel (logo + UST + agréments + CAMES) est désormais
         répété automatiquement sur chaque page par PdfGeneratorService
         (displayHeaderFooter / headerTemplate). Il n'est donc plus injecté
         manuellement ici, pour éviter une double entête sur la page 1. -->
    <div style="margin-top: 8px;"></div>

    <div class="doc-title">PROCES-VERBAL DU DEVOIR</div>
    <div class="center" style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">${parcours?.titre || ''} — ${classe?.libelle || ''}</div>

    <div class="info-grid">
      <div class="info-item">
        <strong>REF :</strong> PVE ${evaluation.id}<br>
        <strong>MATIERE :</strong> <span class="handwritten">${cours?.intitule || ''}</span><br>
        <strong>NOM DE L'ENSEIGNANT :</strong> <span class="handwritten">${enseignant ? `${enseignant.nom} ${enseignant.prenoms}` : ''}</span><br>
        <strong>SIGNATURE DE L'ENSEIGNANT :</strong> ..................
      </div>
      <div class="info-item">
        <strong>PROMO :</strong> ${anneeAcademique?.libelle || ''}<br>
        <strong>SITE :</strong> ${nomSalle || '—'}<br>
        <strong>DATE D'EVALUATION :</strong> <span class="handwritten">${dateEvaluation}</span>
      </div>
    </div>

    ${blocsTable.join('')}

    <div class="section-box">
      <div class="section-title">DEVOIR</div>
      <div class="two-column">
        <div class="col" style="line-height: 1.8;">
          <strong>Epreuve de :</strong> <span class="handwritten">${cours?.intitule || ''}</span><br>
          <strong>Horaire :</strong> <span class="handwritten">${formatHeure(evaluation.heureDebut)}</span> | <strong>Durée :</strong> <span class="handwritten">${dureeMinutes}</span><br>
          <strong>Filière et année académique :</strong> ${parcours?.titre || '—'} — ${anneeAcademique?.libelle || ''}<br>
          <strong>Option :</strong> ${semestreCours || 'Cours du soir'}<br>
          <strong>Date de Composition :</strong> <span class="handwritten">${dateEvaluation}</span>
        </div>
        <div class="col" style="line-height: 1.8;">
          <strong>Effectif de la classe :</strong> <span class="handwritten">${stats.effectif}</span><br>
          <strong>Nombre de présence :</strong> <span class="handwritten">${stats.presents}</span><br>
          <strong>Nombre d'absence :</strong> <span class="handwritten">${stats.effectif - stats.presents}</span><br>
          <strong>Nombre de copies :</strong> <span class="handwritten">${stats.presents}</span>
        </div>
      </div>
    </div>

    <div class="section-box">
      <div class="section-title">SURVEILLANCE</div>
      <p><strong>NOM ET PRENOMS :</strong></p>
      <p>1) ........................................................................ <strong>SIGNATURE :</strong> .................... <strong>CONTACT :</strong> ....................</p>
      <p>2) ........................................................................ <strong>SIGNATURE :</strong> .................... <strong>CONTACT :</strong> ....................</p>
    </div>

    <div class="two-column">
      <div class="col">
        <table>
          <thead>
            <tr><th colspan="2">Rapport d'évaluation :</th></tr>
          </thead>
          <tbody>
            <tr><td>Nbre de Notes ≥ 10</td><td class="handwritten center" style="width: 30%;">${stats.notesSuperieur10}</td></tr>
            <tr><td>Nbre de Notes < 10</td><td class="handwritten center">${stats.notesInferieur10}</td></tr>
            <tr><td>Note la plus forte</td><td class="handwritten center">${stats.noteMax ?? '—'}</td></tr>
            <tr><td>Note la plus faible</td><td class="handwritten center">${stats.noteMin ?? '—'}</td></tr>
            <tr><td>Moy. Générale de la Classe</td><td class="handwritten center">${stats.moyenneGenerale ?? '—'}</td></tr>
            <tr><td>Pourcentage de réussite par rapport au nombre d'étudiants ayant composé</td><td class="handwritten center">${stats.tauxReussite ?? '—'}%</td></tr>
          </tbody>
        </table>
      </div>
      <div class="section-box col">
        <div class="section-title">Justification de l'enseignant sur la non atteinte des 100% :</div>
        <p><strong>Cause :</strong> ....................................................................................................................</p>
        <p><strong>Solution :</strong> ....................................................................................................................</p>
        <br>
        <div class="section-title">Observations :</div>
        <p>........................................................................................................................................</p>
      </div>
    </div>

    <div class="center" style="font-weight: bold; font-size: 12px; margin-top: 10px;">
      ESA LE LABEL DES DIPLOMES DE QUALITE
    </div>

    <div class="footer-stamp">
      [Cachet Secrétariat / Direction - ESA LOMÉ-TOGO]
    </div>
  </div>
</body>
</html>`
  }

  static async genererExcel(data: PvDevoirData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'EasyEcole'
    const sheet = workbook.addWorksheet('PV Devoir')

    const { evaluation, participants, notesEval, cours, enseignant, classe, parcours, niveauEtude, anneeAcademique, nomEtablissement, nomSalle, dateEvaluation, stats } = data

    const notesMap = new Map(notesEval.map((n: any) => [n.coursParticipantId, Number(n.note)]))

    // En-tête (rows 1-8)
    sheet.mergeCells('A1:H1')
    const etabCell = sheet.getCell('A1')
    etabCell.value = nomEtablissement.toUpperCase()
    etabCell.font = { bold: true, size: 16, color: { argb: 'FF1F3C75' } }
    etabCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(1).height = 28

    sheet.mergeCells('A2:H2')
    const titleCell = sheet.getCell('A2')
    titleCell.value = 'PROCÈS-VERBAL DU DEVOIR'
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(2).height = 22

    sheet.mergeCells('A3:H3')
    sheet.getCell('A3').value = `Année académique : ${anneeAcademique?.libelle || ''}`
    sheet.getCell('A3').font = { bold: true, size: 11 }
    sheet.getCell('A3').alignment = { horizontal: 'center' }

    const mentionInfos = [
      `Filière / Parcours : ${parcours?.titre || '—'}`,
      `Niveau : ${niveauEtude?.libelle || '—'}`,
      `Classe : ${classe?.libelle || '—'}`,
      `Salle : ${nomSalle || '—'}`,
    ]
    mentionInfos.forEach((txt, i) => {
      const rowNum = 4 + i
      sheet.mergeCells(`A${rowNum}:D${rowNum}`)
      sheet.getCell(`A${rowNum}`).value = txt
      sheet.getCell(`A${rowNum}`).font = { bold: true, size: 11 }
      sheet.getCell(`A${rowNum}`).alignment = { vertical: 'middle' }
    })

    const mentionInfos2 = [
      `ECUE / Cours : ${cours?.intitule || '—'}`,
      `Code cours : ${cours?.code || '—'}`,
      `Enseignant : ${enseignant ? `${enseignant.nom} ${enseignant.prenoms}` : '—'}`,
      `Date : ${dateEvaluation || '—'}`,
    ]
    mentionInfos2.forEach((txt, i) => {
      const rowNum = 4 + i
      sheet.mergeCells(`E${rowNum}:H${rowNum}`)
      sheet.getCell(`E${rowNum}`).value = txt
      sheet.getCell(`E${rowNum}`).font = { size: 11 }
      sheet.getCell(`E${rowNum}`).alignment = { vertical: 'middle' }
    })

    // Header row 9
    const PV_HEADER_ROW = 9
    const headerLabels = ['N°', 'Nom & Prénoms', 'Sexe', 'Contact', 'Ref CNI/CE/PASS', 'Sign', 'Note /20', 'Mention']
    headerLabels.forEach((label, i) => {
      const colLetter = String.fromCharCode(65 + i)
      const cell = sheet.getCell(`${colLetter}${PV_HEADER_ROW}`)
      cell.value = label
      cell.font = { bold: true, color: { argb: 'FF1F3C75' }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
    sheet.getRow(PV_HEADER_ROW).height = 20

    // Data rows
    participants.forEach((p: any, idx: number) => {
      const rowNum = PV_HEADER_ROW + 1 + idx
      const note = notesMap.get(p.id) ?? ''
      const nom = `${p.utilisateur?.nom || ''} ${p.utilisateur?.prenoms || ''}`.trim()
      const sexe = p.apprenant?.sexe || ''
      const contact = p.apprenant?.telMobile || p.utilisateur?.contact || ''
      const refCni = p.apprenant?.cni || ''
      const mention = typeof note === 'number' && !isNaN(note) ? (() => { for (const e of data.echelles) { if (note >= e.noteMin && note <= e.noteMax) return e.mention } return '' })() : ''

      sheet.getCell(`A${rowNum}`).value = idx + 1
      sheet.getCell(`B${rowNum}`).value = nom
      sheet.getCell(`C${rowNum}`).value = sexe
      sheet.getCell(`D${rowNum}`).value = contact
      sheet.getCell(`E${rowNum}`).value = refCni
      sheet.getCell(`F${rowNum}`).value = ''
      sheet.getCell(`G${rowNum}`).value = note !== '' ? note : ''
      sheet.getCell(`H${rowNum}`).value = mention

      for (let col = 1; col <= 8; col++) {
        const cell = sheet.getCell(rowNum, col)
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        cell.alignment = { vertical: 'middle' }
      }
      sheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getCell(`C${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getCell(`D${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getCell(`E${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getCell(`F${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getCell(`G${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getCell(`H${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // Column widths
    sheet.getColumn(1).width = 6
    sheet.getColumn(2).width = 30
    sheet.getColumn(3).width = 10
    sheet.getColumn(4).width = 14
    sheet.getColumn(5).width = 16
    sheet.getColumn(6).width = 10
    sheet.getColumn(7).width = 12
    sheet.getColumn(8).width = 18

    // Footer signatures
    const lastDataRow = PV_HEADER_ROW + participants.length
    const signatureStart = lastDataRow + 3
    const zonesSignature = ['Les membres du jury', 'Le responsable pédagogique', "L'enseignant"]
    zonesSignature.forEach((zone, i) => {
      const rowNum = signatureStart + i * 3
      const colStart = 1 + i * 3
      const colEnd = colStart + 2
      sheet.mergeCells(`A${rowNum}:${String.fromCharCode(64 + colEnd)}${rowNum}`)
      const cell = sheet.getCell(`A${rowNum}`)
      cell.value = zone
      cell.font = { bold: true, size: 11 }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      const sigRow = rowNum + 1
      sheet.mergeCells(`A${sigRow}:${String.fromCharCode(64 + colEnd)}${sigRow + 1}`)
      const sigCell = sheet.getCell(`A${sigRow}`)
      sigCell.value = 'Signature :'
      sigCell.font = { italic: true, size: 10, color: { argb: 'FF999999' } }
      sigCell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    const mentionRow = signatureStart + zonesSignature.length * 3 + 1
    sheet.mergeCells(`A${mentionRow}:H${mentionRow}`)
    sheet.getCell(`A${mentionRow}`).value = "Document généré par EasyEcole — les notes sont exprimées sur 20."
    sheet.getCell(`A${mentionRow}`).font = { italic: true, size: 9, color: { argb: 'FF7F7F7F' } }
    sheet.getCell(`A${mentionRow}`).alignment = { horizontal: 'center' }

    sheet.headerFooter.oddFooter = '&C Page &P/&N'
    sheet.headerFooter.evenFooter = '&C Page &P/&N'

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  static async exportPdf(evaluationId: number): Promise<Buffer> {
    const data = await PvDevoirService.assemblerDonnees(evaluationId)
    const html = await PvDevoirService.genererHtml(data)
    const pdf = await PdfGeneratorService.generate(html, {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
      ecoleNom: 'ESA',
    })
    return pdf
  }

  static async exportExcel(evaluationId: number): Promise<Buffer> {
    const data = await PvDevoirService.assemblerDonnees(evaluationId)
    return PvDevoirService.genererExcel(data)
  }

  static async extraireNotesPdf(filePath: string, participants: any[]): Promise<Map<number, number>> {
    const pdfModule = await import("pdf-parse")
    const PDFParseCtor = (pdfModule as any).PDFParse ?? (pdfModule as any).default ?? (pdfModule as any)
    if (typeof PDFParseCtor !== "function") {
      throw new Error("Lecteur PDF indisponible sur le serveur")
    }

    const buffer = fs.readFileSync(filePath)
    const parser = new PDFParseCtor({ data: buffer })
    try {
      const textResult = await parser.getText()
      const lignes = String(textResult?.text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)

      const normaliser = (s: string) => s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()

      const notesMap = new Map<number, number>()
      const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      for (const p of participants) {
        const pd: any = p
        const nomComplet = `${pd.utilisateur?.nom || ''} ${pd.utilisateur?.prenoms || ''}`.trim()
        if (!nomComplet) continue
        const cible = normaliser(nomComplet)
        const nomRegex = new RegExp(echapper(nomComplet).replace(/\s+/g, '\\s+'), 'i')

        let ligneTrouvee: string | null = null

        for (const ligne of lignes) {
          if (normaliser(ligne).includes(cible)) {
            ligneTrouvee = ligne
            break
          }
        }

        if (!ligneTrouvee) {
          for (let i = 0; i < lignes.length - 1; i++) {
            const joint = `${lignes[i]} ${lignes[i + 1]}`
            if (normaliser(joint).includes(cible)) {
              ligneTrouvee = joint
              break
            }
          }
        }

        if (!ligneTrouvee) continue

        const matchNom = nomRegex.exec(ligneTrouvee)
        const apresNom = matchNom ? ligneTrouvee.substring(matchNom.index + matchNom[0].length) : ligneTrouvee

        const nombres = [...apresNom.matchAll(/(\d{1,2})(?:[.,](\d{1,2}))?(?!\d)/g)]
          .map(m => parseFloat(`${m[1]}.${m[2] || '0'}`))
          .filter(n => !isNaN(n) && n >= 0 && n <= 20)

        if (nombres.length > 0) {
          notesMap.set(Number(pd.id), nombres[nombres.length - 1])
        }
      }

      return notesMap
    } finally {
      try { parser.destroy() } catch { /* noop */ }
    }
  }
}
