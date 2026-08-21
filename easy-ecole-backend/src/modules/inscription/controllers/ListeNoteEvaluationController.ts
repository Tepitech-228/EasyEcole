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
import { PvDevoirService } from "../services/PvDevoirService";

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
            if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
                return res.status(403).json({ success: false, message: "Vous n'avez pas le droit d'exporter un procès-verbal de notes" })
            }

            const evaluationId = Number(req.params.id)
            const format = (req.query.format as string || 'excel').toLowerCase()

            if (format === 'pdf') {
                const pdfBuffer = await PvDevoirService.exportPdf(evaluationId)
                res.setHeader('Content-Type', 'application/pdf')
                res.setHeader('Content-Disposition', `attachment; filename="PV_Devoir_${evaluationId}_${new Date().toISOString().split('T')[0]}.pdf"`)
                res.send(pdfBuffer)
                return res
            }

            const excelBuffer = await PvDevoirService.exportExcel(evaluationId)
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="PV_Devoir_${evaluationId}_${new Date().toISOString().split('T')[0]}.xlsx"`)
            res.send(excelBuffer)
            return res
        } catch (error) {
            console.error("Erreur export PV:", error);
            return res.status(500).json({ success: false, message: "Erreur lors de l'export du PV" })
        }
    }

    static async importPv(req: Request, res: Response): Promise<Response> {
        try {
            if ((req as any).utilisateurRole === RolesUtilisateur.APPRENANT) {
                return res.status(403).json({ success: false, message: "Vous n'avez pas le droit d'importer un procès-verbal de notes" })
            }

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

            const results: { matricule: string, nom: string, note: number | null, status: string }[] = []
            const errors: string[] = []

            const existingNotes = evaluation.notesEvaluation || []

            const enregistrerNote = async (participant: any, note: number) => {
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
            }

            const estPdf = (req.file!.path || '').toLowerCase().endsWith('.pdf')

            if (estPdf) {
                let notesExtraites: Map<number, number>
                try {
                    notesExtraites = await PvDevoirService.extraireNotesPdf(req.file!.path, participants)
                } catch (e) {
                    if (req.file?.path) fs.unlink(req.file.path, () => {})
                    console.error("Erreur lecture PDF:", e);
                    return res.status(400).json({ success: false, message: "Impossible de lire le fichier PDF : " + ((e as Error).message || 'format invalide') })
                }

                for (const p of participants) {
                    const pd = p as any
                    const nom = `${pd.utilisateur?.nom} ${pd.utilisateur?.prenoms}`.trim()
                    const ref = (pd.cursusApprenant?.demandeInscription?.matricule || pd.utilisateur?.identifiant || '').toString().trim()
                    const note = notesExtraites.get(Number(p.id))

                    if (note === undefined) {
                        results.push({ matricule: ref, nom, note: null, status: 'Ignoré (note non trouvée dans le PDF)' })
                        continue
                    }

                    await enregistrerNote(p, note)
                    results.push({ matricule: ref, nom, note, status: '✓ Importée' })
                }
            } else {
                const workbook = new ExcelJS.Workbook()
                await workbook.xlsx.readFile(req.file.path)

                const sheet = workbook.getWorksheet('PV Notes') || workbook.getWorksheet('PV Devoir')
                if (!sheet) {
                    return res.status(400).json({ success: false, message: "Format de fichier invalide : onglet 'PV Notes' ou 'PV Devoir' introuvable" })
                }

                const headerRow = 9

                // Détecter le format via l'en-tête ligne 9 : ancien (B='Matricule', note en D) vs nouveau (B='Nom...', note en G)
                const headerColB = (sheet.getCell(`B${headerRow}`).value?.toString() || '').toLowerCase()
                const isNewFormat = headerColB.includes('nom')

                for (let rowNum = headerRow + 1; rowNum <= headerRow + participants.length; rowNum++) {
                    let identifiantRef = ''
                    let nom = ''
                    let noteValue: any = null

                    if (isNewFormat) {
                        nom = sheet.getCell(`B${rowNum}`).value?.toString().trim() || ''
                        identifiantRef = sheet.getCell(`E${rowNum}`).value?.toString().trim() || ''
                        noteValue = sheet.getCell(`G${rowNum}`).value
                    } else {
                        identifiantRef = sheet.getCell(`B${rowNum}`).value?.toString().trim() || ''
                        nom = sheet.getCell(`C${rowNum}`).value?.toString().trim() || ''
                        noteValue = sheet.getCell(`D${rowNum}`).value
                    }

                    if (!identifiantRef && !nom) continue

                    const participant = participants.find(p => {
                        const pd = p as any
                        const pRef = (pd.cursusApprenant?.demandeInscription?.matricule || pd.utilisateur?.identifiant || '').toString().trim().toLowerCase()
                        const pNom = `${pd.utilisateur?.nom} ${pd.utilisateur?.prenoms}`.trim().toLowerCase()
                        return (!!identifiantRef && pRef === identifiantRef.toLowerCase()) || (!!nom && pNom === nom.toLowerCase())
                    })

                    if (!participant) {
                        errors.push(`Ligne ${rowNum}: Étudiant non trouvé (${identifiantRef || nom})`)
                        results.push({ matricule: identifiantRef, nom, note: null, status: 'Étudiant non trouvé' })
                        continue
                    }

                    if (noteValue === undefined || noteValue === null || noteValue === '') {
                        results.push({ matricule: identifiantRef, nom, note: null, status: 'Ignoré (note vide)' })
                        continue
                    }

                    const note = parseFloat(noteValue as string)

                    if (isNaN(note) || note < 0 || note > 20) {
                        errors.push(`Ligne ${rowNum}: Note invalide pour ${identifiantRef || nom} (${noteValue})`)
                        results.push({ matricule: identifiantRef, nom, note: null, status: 'Note invalide' })
                        continue
                    }

                    await enregistrerNote(participant, note)

                    results.push({ matricule: identifiantRef, nom, note, status: '✓ Importée' })
                }
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
