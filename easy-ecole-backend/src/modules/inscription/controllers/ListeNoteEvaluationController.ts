import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { TypeNoteEvaluation } from "../models/TypeNoteEvaluation";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { CoursParticipant } from "../models/CoursParticipant";
import { CursusApprenant } from "../models/CursusApprenant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Seance } from "../models/Seance";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { EchelleNote } from "../../bulletins/models/EchelleNote";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { validateEvaluationInput, ValidationError } from "../../../core/validators/noteValidators";

const NOM_ETABLISSEMENT_DEFAUT = 'Université des Sciences et Technologies (UST)';
const PV_SHEET_NAME = 'PV Notes';
const PV_HEADER_ROW = 9; // Ligne d'en-tête du tableau — NE PAS CHANGER (utilisée par importPv)

export default class ListeNoteEvaluationController {

    constructor() { }

    static async getAllListesNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}

        if (req.utilisateurRole! == RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({ where: { utilisateurId: req.utilisateurId! } })
            if (enseignant) {
                options = {
                    include: [
                        ListeNoteEvaluation.associations.typeNoteEvaluation,
                        {
                            association: ListeNoteEvaluation.associations.cours,
                            where: { enseignantId: enseignant.id },
                            required: true,
                            include: [
                                Cours.associations.classe,
                                { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                                { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                            ]
                        },
                    ]
                }
            }
        } else {
            options = {
                include: [
                    ListeNoteEvaluation.associations.typeNoteEvaluation,
                    {
                        association: ListeNoteEvaluation.associations.cours, include: [
                            Cours.associations.classe,
                            { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                            { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                        ]
                    },
                ]
            }
        }

        try {
            let listesNoteEvaluation: ListeNoteEvaluation[];
            listesNoteEvaluation = await ListeNoteEvaluation.findAll(options);

            return res.status(200).send(listesNoteEvaluation);
        } catch (error) {
            console.error("Erreur récupération listes évaluation:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération des listes" });
        }
    }

    static async getListeNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}
        options = {
            where: { id: req.params.id }, include: [
                ListeNoteEvaluation.associations.typeNoteEvaluation,
                {
                    association: ListeNoteEvaluation.associations.cours,
                    include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ]
                },
                { association: ListeNoteEvaluation.associations.notesEvaluation, include: [NoteEvaluation.associations.coursParticipant] }
            ]
        }

        try {
            const listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne(options);

            if (listeNoteEvaluation == null)
                return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });

            return res.status(200).send(listeNoteEvaluation);
        } catch (error) {
            console.error("Erreur récupération évaluation:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'évaluation" });
        }
    }

    static async createListeNoteEvaluation(req: Request, res: Response): Promise<Response> {

        if (req.utilisateurRole! != RolesUtilisateur.INSTITUTION && req.utilisateurRole! != RolesUtilisateur.ENSEIGNANT && req.utilisateurRole! != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        // Règle métier : les examens sont programmés par l'institution.
        // Un enseignant ne peut créer que des devoirs (catégorie 'devoir').
        if (req.utilisateurRole! == RolesUtilisateur.ENSEIGNANT) {
            const type = await TypeNoteEvaluation.findByPk(req.body.typeNoteEvaluationId);
            const categorie = type?.categorie ?? null;
            if (categorie !== 'devoir') {
                return res.status(403).json({ success: false, message: "Réservé à l'institution : seuls les devoirs peuvent être créés par les enseignants" });
            }
        }

        try {
            validateEvaluationInput(req.body);
        } catch (e) {
            if (e instanceof ValidationError) {
                return res.status(400).json({ success: false, message: e.message });
            }
            throw e;
        }

        let existing: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne({ where: { typeNoteEvaluationId: req.body.typeNoteEvaluationId, coursId: req.body.coursId, anneeAcademiqueId: req.body.anneeAcademiqueId } });

        if (existing != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }

        try {
            let listeNoteEvaluation: ListeNoteEvaluation = new ListeNoteEvaluation();
            listeNoteEvaluation.date = req.body.date
            listeNoteEvaluation.heureDebut = req.body.heureDebut
            listeNoteEvaluation.heureFin = req.body.heureFin
            listeNoteEvaluation.commentaire = req.body.commentaire
            listeNoteEvaluation.typeNoteEvaluationId = req.body.typeNoteEvaluationId
            listeNoteEvaluation.poidsTypeNoteEvaluation = req.body.poidsTypeNoteEvaluation
            listeNoteEvaluation.coursId = req.body.coursId
            listeNoteEvaluation.anneeAcademiqueId = req.body.anneeAcademiqueId

            await listeNoteEvaluation.save();
            return res.status(201).send(listeNoteEvaluation);
        } catch (error) {
            console.error("Erreur création évaluation:", error);
            return res.status(400).json({ success: false, message: "Erreur lors de la création" });
        }
    }

    static async updateListeNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}
        if (req.utilisateurRole! != RolesUtilisateur.INSTITUTION && req.utilisateurRole! != RolesUtilisateur.ENSEIGNANT && req.utilisateurRole! != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne(options);
        if (listeNoteEvaluation != null) {
            try {
                await listeNoteEvaluation.update({
                    date: req.body.date,
                    heureDebut: req.body.heureDebut,
                    heureFin: req.body.heureFin,
                    commentaire: req.body.commentaire,
                    typeNoteEvaluationId: req.body.typeNoteEvaluationId,
                    poidsTypeNoteEvaluation: req.body.poidsTypeNoteEvaluation,
                    coursId: req.body.coursId,
                });
                return res.status(200).send(listeNoteEvaluation);
            } catch (error) {
                console.error("Erreur mise à jour évaluation:", error);
                return res.status(400).json({ success: false, message: "Erreur lors de la mise à jour" });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });
        }
    }

    static async deleteListeNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}
        if (req.utilisateurRole! != RolesUtilisateur.INSTITUTION && req.utilisateurRole! != RolesUtilisateur.ENSEIGNANT && req.utilisateurRole! != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne({ where: { id: req.params.id } });
        if (listeNoteEvaluation) {
            try {
                await listeNoteEvaluation.destroy();
                return res.status(200).json({ success: true, message: "ListeNoteEvaluation supprimée" });
            } catch (error) {
                console.error("Erreur suppression évaluation:", error);
                return res.status(500).json({ success: false, message: "Erreur lors de la suppression" });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response> {
        let options: CountOptions<InferAttributes<ListeNoteEvaluation>> = {}

        if (req.utilisateurRole! != RolesUtilisateur.INSTITUTION && req.utilisateurRole! != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const value = await ListeNoteEvaluation.count(options);
            return res.status(200).json({ success: true, count: value });
        } catch (error) {
            console.error("Erreur comptage évaluations:", error);
            return res.status(500).json({ success: false, message: "Erreur lors du comptage" });
        }
    }

    static async exportPv(req: Request, res: Response): Promise<Response> {
        try {
            const evaluation = await ListeNoteEvaluation.findOne({
                where: { id: req.params.id },
                include: [
                    { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
                    { association: ListeNoteEvaluation.associations.anneeAcademique },
                    {
                        association: ListeNoteEvaluation.associations.cours,
                        include: [
                            Cours.associations.classe,
                            { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                            { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                        ]
                    },
                    { association: ListeNoteEvaluation.associations.notesEvaluation }
                ]
            })

            if (!evaluation) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" })
            }

            const participants = await CoursParticipant.findAll({
                where: { coursId: evaluation.coursId },
                include: [
                    {
                        association: CoursParticipant.associations.utilisateur,
                        attributes: ['nom', 'prenoms', 'identifiant'],
                        required: true,
                    },
                    {
                        association: CoursParticipant.associations.cursusApprenant,
                        include: [{ association: CursusApprenant.associations.demandeInscription }],
                        required: true,
                    }
                ]
            })

            // ---------------------------------------------------------------
            // Infos d'entête du PV
            // ---------------------------------------------------------------
            const cours = evaluation.cours
            const enseignant = cours?.enseignant?.utilisateur
            const classe = cours?.classe
            const parcours = cours?.parcours
            const niveauEtude = (parcours as any)?.niveauEtude

            // Nom de l'établissement : Etablissement actif s'il existe, sinon libellé par défaut
            let nomEtablissement = NOM_ETABLISSEMENT_DEFAUT
            try {
                const etablissement = await Etablissement.findOne({ where: { actif: true } })
                if (etablissement?.nom) nomEtablissement = etablissement.nom
            } catch { /* fallback hardcodé */ }

            // Salle associée au cours si disponible (via une séance de ce cours)
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

            const semestreCours = (cours as any)?.semestre
                ? (cours as any).semestre.replace('semestre', 'Semestre ')
                : ''
            const anneeAcademiqueLibelle = (evaluation as any).anneeAcademique?.libelle || ''
            const dateEvaluation = evaluation.date
                ? new Date(evaluation.date).toLocaleDateString('fr-FR')
                : ''

            // Échelles de mention (si disponibles)
            let echelles: { noteMin: number; noteMax: number; mention: string }[] = []
            try {
                echelles = await EchelleNote.findAll({
                    where: { estActive: true },
                    order: [['noteMin', 'ASC']],
                    attributes: ['noteMin', 'noteMax', 'mention'],
                    raw: true
                }) as any
            } catch { /* mention non disponible */ }

            const calculerMention = (note: number): string => {
                if (!echelles.length) return ''
                for (const e of echelles) {
                    if (note >= e.noteMin && note <= e.noteMax) return e.mention
                }
                return ''
            }

            // ---------------------------------------------------------------
            // Construction du classeur Excel
            // ---------------------------------------------------------------
            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'EasyEcole'
            const sheet = workbook.addWorksheet(PV_SHEET_NAME)

            // --- En-tête (rows 1-8) : le tableau commence à la ligne PV_HEADER_ROW (9)
            sheet.mergeCells('A1:F1')
            const etabCell = sheet.getCell('A1')
            etabCell.value = nomEtablissement.toUpperCase()
            etabCell.font = { bold: true, size: 16, color: { argb: 'FF1F3C75' } }
            etabCell.alignment = { horizontal: 'center', vertical: 'middle' }
            sheet.getRow(1).height = 28

            sheet.mergeCells('A2:F2')
            const titleCell = sheet.getCell('A2')
            titleCell.value = 'PROCÈS-VERBAL DE NOTES'
            titleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } }
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
            sheet.getRow(2).height = 22

            // Mention « Année académique »
            sheet.mergeCells('A3:F3')
            sheet.getCell('A3').value = `Année académique : ${anneeAcademiqueLibelle}`
            sheet.getCell('A3').font = { bold: true, size: 11 }
            sheet.getCell('A3').alignment = { horizontal: 'center' }

            // Mentions : filière/parcours, niveau, classe, salle
            const mentionInfos = [
                `Filière / Parcours : ${parcours?.titre || '—'}`,
                `Niveau : ${niveauEtude?.libelle || '—'}`,
                `Classe : ${classe?.libelle || '—'}`,
                `Salle : ${nomSalle || '—'}`,
            ]
            mentionInfos.forEach((txt, i) => {
                const rowNum = 4 + i
                sheet.mergeCells(`A${rowNum}:C${rowNum}`)
                sheet.getCell(`A${rowNum}`).value = txt
                sheet.getCell(`A${rowNum}`).font = { bold: true, size: 11 }
                sheet.getCell(`A${rowNum}`).alignment = { vertical: 'middle' }
            })

            // Mentions : cours/ECUE, code, enseignant, semestre, date
            const mentionInfos2 = [
                `ECUE / Cours : ${cours?.intitule || '—'}`,
                `Code cours : ${cours?.code || '—'}`,
                `Enseignant : ${enseignant ? `${enseignant.nom} ${enseignant.prenoms}` : '—'}`,
                `${semestreCours}${dateEvaluation ? `   |   Date : ${dateEvaluation}` : ''}`,
            ]
            mentionInfos2.forEach((txt, i) => {
                const rowNum = 4 + i
                sheet.mergeCells(`D${rowNum}:F${rowNum}`)
                sheet.getCell(`D${rowNum}`).value = txt
                sheet.getCell(`D${rowNum}`).font = { size: 11 }
                sheet.getCell(`D${rowNum}`).alignment = { vertical: 'middle' }
            })

            // --- Tableau (header ligne PV_HEADER_ROW, données ensuite)
            const headerLabels = ['N°', 'Matricule', 'Nom & Prénoms', 'Note /20', 'Mention', 'Observations']
            headerLabels.forEach((label, i) => {
                const colLetter = String.fromCharCode(65 + i)
                const cell = sheet.getCell(`${colLetter}${PV_HEADER_ROW}`)
                cell.value = label
                cell.font = { bold: true, color: { argb: 'FF1F3C75' }, size: 11 }
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } } // gris clair bleuté
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            })
            sheet.getRow(PV_HEADER_ROW).height = 20

            const notesEval = evaluation.notesEvaluation || []

            participants.forEach((p, idx) => {
                const rowNum = PV_HEADER_ROW + 1 + idx
                const noteEval = notesEval.find(n => n.coursParticipantId == p.id)
                const participantData = p as any
                const matricule = participantData.cursusApprenant?.demandeInscription?.matricule
                    || participantData.utilisateur?.identifiant
                    || '---'
                const nom = `${participantData.utilisateur?.nom || ''}`
                const prenoms = `${participantData.utilisateur?.prenoms || ''}`
                const nomComplet = `${nom} ${prenoms}`.trim()
                const note = noteEval?.note != null ? Number(noteEval.note) : null

                sheet.getCell(`A${rowNum}`).value = idx + 1                        // N°
                sheet.getCell(`B${rowNum}`).value = matricule                       // Matricule
                sheet.getCell(`C${rowNum}`).value = nomComplet                      // Nom & Prénoms
                sheet.getCell(`D${rowNum}`).value = note !== null ? note : ''       // Note /20
                sheet.getCell(`E${rowNum}`).value = note !== null && !isNaN(note)
                    ? calculerMention(note)
                    : ''                                                            // Mention
                sheet.getCell(`F${rowNum}`).value = ''                              // Observations

                sheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
                sheet.getCell(`B${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
                sheet.getCell(`C${rowNum}`).alignment = { vertical: 'middle' }
                sheet.getCell(`D${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
                sheet.getCell(`E${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' }
                sheet.getCell(`F${rowNum}`).alignment = { vertical: 'middle' }

                for (let col = 1; col <= 6; col++) {
                    const cell = sheet.getCell(rowNum, col)
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                }
            })

            // Largeurs de colonnes
            sheet.getColumn(1).width = 6
            sheet.getColumn(2).width = 16
            sheet.getColumn(3).width = 38
            sheet.getColumn(4).width = 12
            sheet.getColumn(5).width = 24
            sheet.getColumn(6).width = 22

            // --- Pied : zones de signature + mentions légales
            const lastDataRow = PV_HEADER_ROW + participants.length
            const signatureStart = lastDataRow + 3

            const zonesSignature = [
                'Les membres du jury',
                'Le responsable pédagogique',
                'L\'enseignant'
            ]
            zonesSignature.forEach((zone, i) => {
                const rowNum = signatureStart + i * 3
                const colStart = 1 + i * 2
                const colLetter = String.fromCharCode(64 + colStart)
                const colEndLetter = String.fromCharCode(64 + colStart + 1)
                sheet.mergeCells(`${colLetter}${rowNum}:${colEndLetter}${rowNum}`)
                const cell = sheet.getCell(`${colLetter}${rowNum}`)
                cell.value = zone
                cell.font = { bold: true, size: 11 }
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
                // Ligne de signature
                const sigRow = rowNum + 1
                sheet.mergeCells(`${colLetter}${sigRow}:${colEndLetter}${sigRow + 1}`)
                const sigCell = sheet.getCell(`${colLetter}${sigRow}`)
                sigCell.value = 'Signature :'
                sigCell.font = { italic: true, size: 10, color: { argb: 'FF999999' } }
                sigCell.alignment = { horizontal: 'center', vertical: 'middle' }
            })

            const mentionRow = signatureStart + zonesSignature.length * 3 + 1
            sheet.mergeCells(`A${mentionRow}:F${mentionRow}`)
            sheet.getCell(`A${mentionRow}`).value =
                'Document généré par EasyEcole — les notes sont exprimées sur 20. Toute modification hors de la plateforme engage la responsabilité de l\'enseignant.'
            sheet.getCell(`A${mentionRow}`).font = { italic: true, size: 9, color: { argb: 'FF7F7F7F' } }
            sheet.getCell(`A${mentionRow}`).alignment = { horizontal: 'center' }

            // Pagination (page X/Y)
            sheet.headerFooter.oddFooter = '&C Page &P/&N'
            sheet.headerFooter.evenFooter = '&C Page &P/&N'
            sheet.pageSetup.printArea = `A1:F${mentionRow}`
            sheet.pageSetup.fitToPage = true
            sheet.pageSetup.fitToWidth = 1
            sheet.pageSetup.fitToHeight = 0

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="PV_${cours?.code || 'notes'}_${new Date().toISOString().split('T')[0]}.xlsx"`)

            await workbook.xlsx.write(res)
            res.end()
            return res
        } catch (error) {
            console.error("Erreur export PV:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de l'export du PV" })
        }
    }

    static async importPv(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Aucun fichier fourni" })
            }

            const evaluation = await ListeNoteEvaluation.findOne({
                where: { id: req.params.id },
                include: [{ association: ListeNoteEvaluation.associations.notesEvaluation }]
            })

            if (!evaluation) {
                return res.status(404).json({ success: false, message: "Évaluation non trouvée" })
            }

            const participants = await CoursParticipant.findAll({
                where: { coursId: evaluation.coursId },
                include: [
                    {
                        association: CoursParticipant.associations.utilisateur,
                        attributes: ['nom', 'prenoms', 'identifiant'],
                        required: true,
                    },
                    {
                        association: CoursParticipant.associations.cursusApprenant,
                        include: [{ association: CursusApprenant.associations.demandeInscription }],
                        required: true,
                    }
                ]
            })

            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(req.file.path)

            const sheet = workbook.getWorksheet('PV Notes')
            if (!sheet) {
                return res.status(400).json({ success: false, message: "Format de fichier invalide : onglet 'PV Notes' introuvable" })
            }

            const headerRow = 9
            const results: { matricule: string, nom: string, note: number | null, status: string }[] = []
            const errors: string[] = []

            const existingNotes = evaluation.notesEvaluation || []

            for (let rowNum = headerRow + 1; rowNum <= headerRow + participants.length; rowNum++) {
                const matricule = sheet.getCell(`B${rowNum}`).value?.toString().trim() || ''
                const nom = sheet.getCell(`C${rowNum}`).value?.toString().trim() || ''
                const noteValue = sheet.getCell(`D${rowNum}`).value

                if (!matricule && !nom) continue

                const participant = participants.find(p => {
                    const pd = p as any
                    const pMatricule = pd.cursusApprenant?.demandeInscription?.matricule || pd.utilisateur?.identifiant
                    const pNom = `${pd.utilisateur?.nom} ${pd.utilisateur?.prenoms}`.trim().toLowerCase()
                    return pMatricule === matricule || pNom === nom.toLowerCase()
                })

                if (!participant) {
                    errors.push(`Ligne ${rowNum}: Étudiant non trouvé (${matricule || nom})`)
                    results.push({ matricule, nom, note: null, status: 'Étudiant non trouvé' })
                    continue
                }

                if (noteValue === undefined || noteValue === null || noteValue === '') {
                    results.push({ matricule, nom, note: null, status: 'Ignoré (note vide)' })
                    continue
                }

                const note = parseFloat(noteValue as string)

                if (isNaN(note) || note < 0 || note > 20) {
                    errors.push(`Ligne ${rowNum}: Note invalide pour ${matricule || nom} (${noteValue})`)
                    results.push({ matricule, nom, note: null, status: 'Note invalide' })
                    continue
                }

                const existingNote = existingNotes.find(n => n.coursParticipantId == participant.id)
                if (existingNote) {
                    existingNote.note = note as any
                    await existingNote.save()
                } else {
                    const newNote = new NoteEvaluation()
                    newNote.listeNoteEvaluationId = evaluation.id!
                    newNote.coursParticipantId = participant.id
                    newNote.note = note as any
                    await newNote.save()
                }

                results.push({ matricule, nom, note, status: '✓ Importée' })
            }

            const importedCount = results.filter(r => r.status === '✓ Importée').length
            const errorCount = errors.length

            if (req.file?.path) {
                fs.unlink(req.file.path, () => {})
            }

            return res.status(200).json({
                success: true,
                importedCount,
                errorCount,
                details: results,
                errors: errors.length > 0 ? errors : undefined
            })
        } catch (error) {
            if (req.file?.path) {
                fs.unlink(req.file.path, () => {})
            }
            console.error("Erreur import PV:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de l'import du PV" })
        }
    }
}
