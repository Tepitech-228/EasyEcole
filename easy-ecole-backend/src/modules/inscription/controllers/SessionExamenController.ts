import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { SessionExamen } from "../models/SessionExamen";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { Classe } from "../models/Classe";
import { SessionCorrecteur } from "../models/SessionCorrecteur";
import { Enseignant } from "../../auth/models/Enseignant";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Cours } from "../models/Cours";
import { Op } from "sequelize";

const TYPES_SESSION = ['normale', 'rattrapage'];
const SEMESTRES = ['semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'];
const STATUTS_SESSION = ['planifiee', 'en_cours', 'terminee', 'cloturee'];

function isPositiveInteger(value: unknown): boolean {
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric > 0;
}

function parseDate(value: unknown): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? undefined : date;
}

interface SessionExamenPayload {
    libelle: string;
    type: string;
    classeId: number;
    anneeAcademiqueId: number;
    semestre: string;
    dateDebut?: Date | null;
    dateFin?: Date | null;
    statut?: string;
    observations?: string | null;
}

function validateSessionPayload(body: any): { data?: SessionExamenPayload; message?: string };
function validateSessionPayload(body: any, partial: true): { data?: Partial<SessionExamenPayload>; message?: string };
function validateSessionPayload(body: any, partial = false): { data?: any; message?: string } {
    const data: Record<string, any> = {};
    const fields = ['libelle', 'type', 'classeId', 'anneeAcademiqueId', 'semestre', 'dateDebut', 'dateFin', 'statut', 'observations'];

    for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(body || {}, field)) data[field] = body[field];
    }

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'libelle')) {
        if (typeof data.libelle !== 'string' || !data.libelle.trim()) {
            return { message: 'Le libellé est requis.' };
        }
        data.libelle = data.libelle.trim();
    }
    if (!partial || Object.prototype.hasOwnProperty.call(data, 'type')) {
        if (!TYPES_SESSION.includes(data.type)) return { message: 'Le type de session est invalide.' };
    }
    if (!partial || Object.prototype.hasOwnProperty.call(data, 'classeId')) {
        if (!isPositiveInteger(data.classeId)) return { message: 'La classe est invalide.' };
        data.classeId = Number(data.classeId);
    }
    if (!partial || Object.prototype.hasOwnProperty.call(data, 'anneeAcademiqueId')) {
        if (!isPositiveInteger(data.anneeAcademiqueId)) return { message: 'L’année académique est invalide.' };
        data.anneeAcademiqueId = Number(data.anneeAcademiqueId);
    }
    if (!partial || Object.prototype.hasOwnProperty.call(data, 'semestre')) {
        if (!SEMESTRES.includes(data.semestre)) return { message: 'Le semestre est invalide.' };
    }
    if (Object.prototype.hasOwnProperty.call(data, 'statut')) {
        if (!STATUTS_SESSION.includes(data.statut)) return { message: 'Le statut de session est invalide.' };
    }
    for (const field of ['dateDebut', 'dateFin']) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            const date = parseDate(data[field]);
            if (date === undefined) return { message: `La date ${field === 'dateDebut' ? 'de début' : 'de fin'} est invalide.` };
            data[field] = date;
        }
    }
    if (data.dateDebut && data.dateFin && data.dateDebut > data.dateFin) {
        return { message: 'La date de début doit précéder la date de fin.' };
    }
    if (Object.prototype.hasOwnProperty.call(data, 'observations') && data.observations !== null && typeof data.observations !== 'string') {
        return { message: 'Les observations doivent être du texte.' };
    }

    return { data };
}

export default class SessionExamenController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<SessionExamen>> = {
            include: [
                SessionExamen.associations.classe,
                SessionExamen.associations.anneeAcademique
            ]
        }
        try {
            let data = await SessionExamen.findAll(options);
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await SessionExamen.findByPk(req.params.id, {
                include: [
                    SessionExamen.associations.classe,
                    SessionExamen.associations.anneeAcademique
                ]
            });
            if (!data) return res.status(404).json({ success: false, message: "Session non trouvée" });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const parsed = validateSessionPayload(req.body);
            if (!parsed.data) return res.status(400).json({ success: false, message: parsed.message });
            const [classe, annee] = await Promise.all([
                Classe.findByPk(parsed.data.classeId),
                AnneeAcademique.findByPk(parsed.data.anneeAcademiqueId)
            ]);
            if (!classe || !annee) return res.status(400).json({ success: false, message: 'La classe ou l’année académique n’existe pas.' });
            const data = await SessionExamen.create(parsed.data);
            return res.status(201).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await SessionExamen.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Session non trouvée" });
            const parsed = validateSessionPayload(req.body, true);
            if (!parsed.data) return res.status(400).json({ success: false, message: parsed.message });
            if (Object.keys(parsed.data).length === 0) {
                return res.status(400).json({ success: false, message: 'Aucune donnée valide à mettre à jour.' });
            }
            const classeId = parsed.data.classeId ?? data.classeId;
            const anneeAcademiqueId = parsed.data.anneeAcademiqueId ?? data.anneeAcademiqueId;
            const [classe, annee] = await Promise.all([
                Classe.findByPk(classeId),
                AnneeAcademique.findByPk(anneeAcademiqueId)
            ]);
            if (!classe || !annee) return res.status(400).json({ success: false, message: 'La classe ou l’année académique n’existe pas.' });
            await data.update(parsed.data);
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const data = await SessionExamen.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Session non trouvée" });
            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getByClasse(req: Request, res: Response): Promise<Response> {
        try {
            const data = await SessionExamen.findAll({
                where: { classeId: req.params.classeId },
                include: [
                    SessionExamen.associations.classe,
                    SessionExamen.associations.anneeAcademique
                ]
            });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async creerPaire(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const { classeId, anneeAcademiqueId, semestre, dateDebutNormale, dateFinNormale, dateDebutRattrapage, dateFinRattrapage } = req.body;

            if (!isPositiveInteger(classeId) || !isPositiveInteger(anneeAcademiqueId) || !SEMESTRES.includes(semestre)) {
                return res.status(400).json({ success: false, message: "classeId, anneeAcademiqueId et semestre sont requis" });
            }

            const annee = await AnneeAcademique.findByPk(anneeAcademiqueId);
            const classe = await Classe.findByPk(classeId);
            if (!annee || !classe) {
                return res.status(400).json({ success: false, message: "La classe ou l’année académique n’existe pas." });
            }
            const dates = [dateDebutNormale, dateFinNormale, dateDebutRattrapage, dateFinRattrapage]
                .map(value => value === undefined ? null : parseDate(value));
            if (dates.some(date => date === undefined)) {
                return res.status(400).json({ success: false, message: "Une ou plusieurs dates sont invalides." });
            }
            if ((dates[0] && dates[1] && dates[0] > dates[1]) || (dates[2] && dates[3] && dates[2] > dates[3])) {
                return res.status(400).json({ success: false, message: "La date de début doit précéder la date de fin." });
            }
            const suffixe = annee ? annee.libelle : `AA${anneeAcademiqueId}`;
            const classeLabel = classe ? classe.libelle : `C${classeId}`;

            const data = await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                const common = {
                    classeId: Number(classeId),
                    anneeAcademiqueId: Number(anneeAcademiqueId),
                    semestre,
                    statut: 'planifiee'
                };
                const sessionNormale = await SessionExamen.create({
                    ...common,
                    libelle: `Session normale - ${suffixe} - ${classeLabel} - ${semestre}`,
                    type: 'normale',
                    dateDebut: dates[0] || null,
                    dateFin: dates[1] || null
                }, { transaction });
                const sessionRattrapage = await SessionExamen.create({
                    ...common,
                    libelle: `Session rattrapage - ${suffixe} - ${classeLabel} - ${semestre}`,
                    type: 'rattrapage',
                    dateDebut: dates[2] || null,
                    dateFin: dates[3] || null
                }, { transaction });
                return { normale: sessionNormale, rattrapage: sessionRattrapage };
            });

            return res.status(201).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    // Désignation des correcteurs par cours (session de rattrapage)
    static async saveCorrecteurs(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        try {
            const { correcteurs } = req.body;
            if (!Array.isArray(correcteurs)) {
                return res.status(400).json({ success: false, message: "correcteurs doit être un tableau [{coursId, enseignantId}]" });
            }

            const session = await SessionExamen.findByPk(req.params.id);
            if (!session) return res.status(404).json({ success: false, message: "Session examen non trouvée" });

            const rows: Array<{ sessionExamenId: number; coursId: number; enseignantId: string }> = [];
            const assignedCourses = new Set<number>();
            for (const item of correcteurs) {
                if (!item || !isPositiveInteger(item.coursId) || !isPositiveInteger(item.enseignantId)) {
                    return res.status(400).json({ success: false, message: "Chaque correcteur doit avoir un coursId et un enseignantId valides." });
                }
                const coursId = Number(item.coursId);
                if (assignedCourses.has(coursId)) {
                    return res.status(400).json({ success: false, message: "Un seul correcteur peut être désigné par cours." });
                }
                assignedCourses.add(coursId);
                rows.push({ sessionExamenId: session.id, coursId, enseignantId: String(Number(item.enseignantId)) });
            }

            const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
            let created: SessionCorrecteur[];
            try {
                const [cours, enseignants] = await Promise.all([
                    rows.length ? Cours.findAll({
                        where: { id: { [Op.in]: rows.map(row => row.coursId) }, classeId: session.classeId },
                        transaction
                    }) : Promise.resolve([]),
                    rows.length ? Enseignant.findAll({
                        where: { id: { [Op.in]: rows.map(row => Number(row.enseignantId)) } },
                        transaction
                    }) : Promise.resolve([])
                ]);
                if (cours.length !== assignedCourses.size || new Set(enseignants.map(enseignant => Number(enseignant.id))).size !== new Set(rows.map(row => Number(row.enseignantId))).size) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, message: "Un cours ou un enseignant n’existe pas ou n’appartient pas à cette classe." });
                }
                await SessionCorrecteur.destroy({ where: { sessionExamenId: session.id }, transaction });
                created = rows.length ? await SessionCorrecteur.bulkCreate(rows, { transaction, validate: true }) : [];
                await transaction.commit();
            } catch (error) {
                await transaction.rollback();
                throw error;
            }

            return res.status(201).json({ success: true, count: created.length });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getCorrecteurs(req: Request, res: Response): Promise<Response | null> {
        try {
            const correcteurs = await SessionCorrecteur.findAll({
                where: { sessionExamenId: req.params.id },
                include: [
                    { association: SessionCorrecteur.associations.cours },
                    { association: SessionCorrecteur.associations.enseignant, include: [{ association: Enseignant.associations.utilisateur }] }
                ]
            });
            return res.status(200).send(correcteurs);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
