import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { Presence } from "../models/Presence";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { CoursParticipant } from "../models/CoursParticipant";
import { CursusApprenant } from "../models/CursusApprenant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";
import * as ExcelJS from "exceljs";
import * as fs from "fs";

export default class ListeNoteEvaluationController {

    constructor() { }

    static async getAllListesNoteEvaluation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({ where: { utilisateurId: (req as any).utilisateurId } })
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
            return res.status(500).json({ success: false, error: error });
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
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createListeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT && (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let existing: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne({ where: { typeNoteEvaluationId: req.body.typeNoteEvaluationId, coursId: req.body.coursId, anneeAcademiqueId: req.body.anneeAcademiqueId } });

        if (existing != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let listeNoteEvaluation: ListeNoteEvaluation = new ListeNoteEvaluation();
            listeNoteEvaluation.date = req.body.date
            listeNoteEvaluation.heureDebut = req.body.heureDebut
            listeNoteEvaluation.heureFin = req.body.heureFin
            listeNoteEvaluation.commentaire = req.body.commentaire
            listeNoteEvaluation.typeNoteEvaluationId = req.body.typeNoteEvaluationId
            listeNoteEvaluation.poidsTypeNoteEvaluation = req.body.poidsTypeNoteEvaluation
            listeNoteEvaluation.coursId = req.body.coursId

            await listeNoteEvaluation.save()
                .then((listeNoteEvaluation) => {
                    return res.status(201).send(listeNoteEvaluation);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateListeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT && (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne(options);
        if (listeNoteEvaluation != null) {
            await listeNoteEvaluation.update({
                date: req.body.date,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
                commentaire: req.body.commentaire,
                typeNoteEvaluationId: req.body.typeNoteEvaluationId,
                poidsTypeNoteEvaluation: req.body.poidsTypeNoteEvaluation,
                coursId: req.body.coursId,
            })
                .then(async (listeNoteEvaluation) => {
                    return res.status(200).send(listeNoteEvaluation);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });
        }

        return null
    }

    static async deleteListeNoteEvaluation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<ListeNoteEvaluation>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT && (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let listeNoteEvaluation: ListeNoteEvaluation | null = await ListeNoteEvaluation.findOne({ where: { id: req.params.id } });
        if (listeNoteEvaluation) {
            await listeNoteEvaluation.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "ListeNoteEvaluation supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "ListeNoteEvaluation non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<ListeNoteEvaluation>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await ListeNoteEvaluation.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }

    static async exportPv(req: Request, res: Response): Promise<Response | null> {
        try {
            const evaluation = await ListeNoteEvaluation.findOne({
                where: { id: req.params.id },
                include: [
                    { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
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

            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'EasyEcole'
            const sheet = workbook.addWorksheet('PV Notes')

            const cours = evaluation.cours
            const enseignant = cours?.enseignant?.utilisateur
            const classe = cours?.classe
            const parcours = cours?.parcours

            sheet.mergeCells('A1:E1')
            const titleCell = sheet.getCell('A1')
            titleCell.value = 'EASYECOLE — PROCÈS-VERBAL DE NOTES'
            titleCell.font = { bold: true, size: 14, color: { argb: 'FF1F3C75' } }
            titleCell.alignment = { horizontal: 'center' }

            sheet.mergeCells('A2:E2')
            sheet.getCell('A2').value = `Cours: ${cours?.code || ''} — ${cours?.intitule || ''}`
            sheet.getCell('A2').font = { bold: true, size: 11 }

            const infoData = [
                ['Type', evaluation.typeNoteEvaluation?.libelle || ''],
                ['Date', evaluation.date ? new Date(evaluation.date).toLocaleDateString('fr-FR') : ''],
                ['Classe', classe?.libelle || ''],
                ['Parcours', parcours?.titre || ''],
                ['Enseignant', enseignant ? `${enseignant.nom} ${enseignant.prenoms}` : ''],
            ]

            infoData.forEach((row, idx) => {
                const rowNum = 3 + idx
                sheet.getCell(`A${rowNum}`).value = row[0]
                sheet.getCell(`A${rowNum}`).font = { bold: true }
                sheet.mergeCells(`B${rowNum}:E${rowNum}`)
                sheet.getCell(`B${rowNum}`).value = row[1]
            })

            const headerRow = 9
            sheet.getCell(`A${headerRow}`).value = 'N°'
            sheet.getCell(`B${headerRow}`).value = 'Matricule'
            sheet.getCell(`C${headerRow}`).value = 'Nom & Prénoms'
            sheet.getCell(`D${headerRow}`).value = 'Note /20'
            sheet.getCell(`E${headerRow}`).value = 'Observations'

            const headerCells = [sheet.getCell(`A${headerRow}`), sheet.getCell(`B${headerRow}`), sheet.getCell(`C${headerRow}`), sheet.getCell(`D${headerRow}`), sheet.getCell(`E${headerRow}`)]
            headerCells.forEach(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3C75' } }
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            })

            const notesEval = evaluation.notesEvaluation || []

            participants.forEach((p, idx) => {
                const rowNum = headerRow + 1 + idx
                const noteEval = notesEval.find(n => n.coursParticipantId == p.id)
                const participantData = p as any
                const matricule = participantData.cursusApprenant?.demandeInscription?.matricule || participantData.utilisateur?.identifiant || '---'
                const nom = `${participantData.utilisateur?.nom || ''} ${participantData.utilisateur?.prenoms || ''}`

                sheet.getCell(`A${rowNum}`).value = idx + 1
                sheet.getCell(`B${rowNum}`).value = matricule
                sheet.getCell(`C${rowNum}`).value = nom
                sheet.getCell(`D${rowNum}`).value = noteEval?.note != null ? Number(noteEval.note) : ''
                sheet.getCell(`E${rowNum}`).value = ''

                for (let col = 1; col <= 5; col++) {
                    const cell = sheet.getCell(rowNum, col)
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                    if (col === 2 || col === 3) {
                        cell.alignment = { vertical: 'middle' }
                    }
                    if (col === 1 || col === 4) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' }
                    }
                }
            })

            // Signature de l'enseignant dans le PV
            const enseignantPv = cours?.enseignant as any
            const signatureRow = headerRow + participants.length + 2
            sheet.mergeCells(`A${signatureRow}:E${signatureRow}`)
            const sigCell = sheet.getCell(`A${signatureRow}`)
            sigCell.value = 'Signature de l\'enseignant :'
            sigCell.font = { bold: true, size: 11 }

            const ensNameRow = signatureRow + 1
            sheet.mergeCells(`A${ensNameRow}:E${ensNameRow}`)
            if (enseignantPv?.utilisateur) {
                sheet.getCell(`A${ensNameRow}`).value = `${enseignantPv.utilisateur.nom} ${enseignantPv.utilisateur.prenoms}`
                sheet.getCell(`A${ensNameRow}`).font = { italic: true, size: 10 }
            } else {
                sheet.getCell(`A${ensNameRow}`).value = 'Non signé'
                sheet.getCell(`A${ensNameRow}`).font = { italic: true, color: { argb: 'FF999999' }, size: 10 }
            }

            sheet.getColumn(1).width = 6
            sheet.getColumn(2).width = 16
            sheet.getColumn(3).width = 35
            sheet.getColumn(4).width = 12
            sheet.getColumn(5).width = 20

            const instructionsSheet = workbook.addWorksheet('Instructions')
            instructionsSheet.getCell('A1').value = 'Comment utiliser ce PV :'
            instructionsSheet.getCell('A1').font = { bold: true, size: 12 }
            instructionsSheet.getCell('A3').value = '1. Remplissez la colonne "Note /20" pour chaque étudiant'
            instructionsSheet.getCell('A4').value = '2. Les notes doivent être comprises entre 0 et 20'
            instructionsSheet.getCell('A5').value = '3. Si besoin, ajoutez des observations dans la colonne "Observations"'
            instructionsSheet.getCell('A6').value = '4. Sauvegardez le fichier'
            instructionsSheet.getCell('A7').value = '5. Revenez sur l\'application et importez le fichier rempli'
            instructionsSheet.getColumn(1).width = 60

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="PV_${cours?.code || 'notes'}_${new Date().toISOString().split('T')[0]}.xlsx"`)

            await workbook.xlsx.write(res)
            res.end()
            return null
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async importPv(req: Request, res: Response): Promise<Response | null> {
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
            return res.status(500).json({ success: false, error: error })
        }
    }
}