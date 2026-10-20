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
import { CursusApprenant } from "../models/CursusApprenant";
import { SessionExamenClasse } from "../models/SessionExamenClasse";

const TYPES_SESSION = ['normale', 'rattrapage'];
const SEMESTRES = ['semestre1', 'semestre2', 'semestre3', 'semestre4', 'semestre5', 'semestre6'];
function estAdministrateur(req: Request): boolean {
    return req.utilisateurRole === RolesUtilisateur.ADMIN;
}

async function classesVisibles(req: Request): Promise<number[] | null> {
    if (
        !req.etablissementId
        && [RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION, RolesUtilisateur.SUPERVISEUR_GENERAL, RolesUtilisateur.COMITE_ORIENTATION].includes(req.utilisateurRole!)
    ) return null;
    if (!req.etablissementId) return [];
    if (req.utilisateurRole === RolesUtilisateur.ENSEIGNANT) {
        const enseignant = await Enseignant.findOne({ where: { utilisateurId: req.utilisateurId! } });
        if (!enseignant) return [];
        const cours = await Cours.findAll({
            where: { enseignantId: enseignant.id },
            include: [{
                association: Cours.associations.classe,
                where: { etablissementId: req.etablissementId },
                required: true,
                attributes: []
            }],
            attributes: ['classeId']
        });
        const classes = cours.map(item => Number(item.classeId)).filter(Number.isSafeInteger);
        return [...new Set(classes)];
    }
    if (req.utilisateurRole === RolesUtilisateur.APPRENANT) {
        const cursus = await CursusApprenant.findAll({
            where: { utilisateurId: req.utilisateurId! },
            attributes: ['classeId'],
            include: [{
                association: CursusApprenant.associations.classe,
                where: { etablissementId: req.etablissementId },
                required: true,
                attributes: []
            }]
        });
        return [...new Set(cursus.map(item => Number(item.classeId)).filter(Number.isSafeInteger))];
    }
    const classes = await Classe.findAll({
        where: { etablissementId: req.etablissementId },
        attributes: ['id']
    });
    return classes.map(item => Number(item.id));
}

async function sessionVisiblePour(req: Request, session: SessionExamen): Promise<boolean> {
    const visibleClasses = await classesVisibles(req);
    if (visibleClasses === null) return true;
    const targetClasses = await chargerClassesSession(Number(session.id), session.classeId);
    return targetClasses.some(classId => visibleClasses.includes(classId));
}

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
    classeIds?: number[];
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
    const fields = ['libelle', 'type', 'classeId', 'classeIds', 'anneeAcademiqueId', 'semestre', 'dateDebut', 'dateFin', 'observations'];

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
    if (Object.prototype.hasOwnProperty.call(data, 'classeIds')) {
        if (!Array.isArray(data.classeIds) || !data.classeIds.length || data.classeIds.some((id: unknown) => !isPositiveInteger(id))) {
            return { message: 'La liste des classes est invalide.' };
        }
        data.classeIds = [...new Set(data.classeIds.map(Number))];
        data.classeId = data.classeIds[0];
    } else if (!partial || Object.prototype.hasOwnProperty.call(data, 'classeId')) {
        if (!isPositiveInteger(data.classeId)) return { message: 'La classe est invalide.' };
        data.classeId = Number(data.classeId);
        data.classeIds = [data.classeId];
    }
    if (!partial || Object.prototype.hasOwnProperty.call(data, 'anneeAcademiqueId')) {
        if (!isPositiveInteger(data.anneeAcademiqueId)) return { message: 'L’année académique est invalide.' };
        data.anneeAcademiqueId = Number(data.anneeAcademiqueId);
    }
    if (!partial || Object.prototype.hasOwnProperty.call(data, 'semestre')) {
        if (!SEMESTRES.includes(data.semestre)) return { message: 'Le semestre est invalide.' };
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

async function chargerClassesSession(sessionId: number, fallbackClasseId?: number | null): Promise<number[]> {
    const links = await SessionExamenClasse.findAll({
        where: { sessionExamenId: sessionId },
        attributes: ['classeId']
    });
    const ids = [...new Set(links.map(link => Number(link.classeId)).filter(Number.isSafeInteger))];
    if (!ids.length && fallbackClasseId) ids.push(Number(fallbackClasseId));
    return ids;
}

async function classesValides(req: Request, classeIds: number[]): Promise<Classe[] | null> {
    const classes = await Classe.findAll({
        where: { id: { [Op.in]: classeIds } },
        include: [{
            association: Classe.associations.etablissement,
            where: { actif: true },
            required: true,
            attributes: []
        }]
    });
    if (classes.length !== classeIds.length) return null;
    if (req.etablissementId && classes.some(classe => Number(classe.etablissementId) !== Number(req.etablissementId))) return null;
    return classes;
}

function includeClassePourSite(req: Request, association: any): any {
    if (!req.etablissementId) return association;
    return { association, where: { etablissementId: req.etablissementId }, required: false };
}

function limiterClassesRetournees(
    session: SessionExamen,
    req: Request,
    classeDemandee?: number
): ReturnType<SessionExamen['toJSON']> & { classe?: Classe; classesCibles?: Classe[]; classeId: number } {
    const result = session.toJSON() as ReturnType<SessionExamen['toJSON']> & {
        classe?: Classe;
        classesCibles?: Classe[];
        classeId: number;
    };
    if (!req.etablissementId) return result;
    const targets = session.classesCibles || [];
    const visibleTargets = targets.filter(classe => Number(classe.etablissementId) === Number(req.etablissementId));
    result.classesCibles = visibleTargets;
    if (classeDemandee) {
        const classe = visibleTargets.find(target => Number(target.id) === classeDemandee);
        if (classe) {
            result.classeId = classe.id;
            result.classe = classe;
        }
    } else if (Number(session.classe?.etablissementId) !== Number(req.etablissementId)) {
        const classe = visibleTargets[0];
        if (classe) {
            result.classeId = classe.id;
            result.classe = classe;
        }
    }
    return result;
}

export default class SessionExamenController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const visibleClassIds = await classesVisibles(req);
            const where: any = {};
            if (visibleClassIds !== null) {
                const links = visibleClassIds.length ? await SessionExamenClasse.findAll({
                    where: { classeId: { [Op.in]: visibleClassIds } },
                    attributes: ['sessionExamenId']
                }) : [];
                where.id = { [Op.in]: [...new Set(links.map(link => Number(link.sessionExamenId)))] };
            }
            if (req.utilisateurRole === RolesUtilisateur.APPRENANT || req.utilisateurRole === RolesUtilisateur.ENSEIGNANT) {
                where.statut = { [Op.notIn]: ['brouillon', 'annulee'] };
            }
            const options: FindOptions<InferAttributes<SessionExamen>> = {
                where,
            include: [
                includeClassePourSite(req, SessionExamen.associations.classe),
                includeClassePourSite(req, SessionExamen.associations.classesCibles),
                SessionExamen.associations.anneeAcademique
            ]
            };
            let data = await SessionExamen.findAll(options);
            return res.status(200).send(data.map(session => limiterClassesRetournees(session, req)));
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await SessionExamen.findByPk(req.params.id, {
                include: [
                    includeClassePourSite(req, SessionExamen.associations.classe),
                    includeClassePourSite(req, SessionExamen.associations.classesCibles),
                    SessionExamen.associations.anneeAcademique
                ]
            });
            if (!data) return res.status(404).json({ success: false, message: "Session non trouvée" });
            const ids = await chargerClassesSession(Number(data.id), data.classeId);
            const visibleClassIds = await classesVisibles(req);
            if (visibleClassIds !== null && !ids.some(id => visibleClassIds.includes(id))) return res.status(404).json({ success: false, message: "Session non trouvée" });
            const visibleData = limiterClassesRetournees(data, req);
            if ((req.utilisateurRole === RolesUtilisateur.APPRENANT || req.utilisateurRole === RolesUtilisateur.ENSEIGNANT) && ['brouillon', 'annulee'].includes(data.statut)) {
                return res.status(404).json({ success: false, message: "Session non trouvée" });
            }
            return res.status(200).send(visibleData);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        if (!estAdministrateur(req)) return res.status(403).json({ success: false, message: "Création réservée à l’administrateur" });
        try {
            const parsed = validateSessionPayload(req.body);
            if (!parsed.data) return res.status(400).json({ success: false, message: parsed.message });
            const classes = await classesValides(req, parsed.data.classeIds || [parsed.data.classeId]);
            if (!classes) return res.status(400).json({ success: false, message: "Une classe n’existe pas, est inactive ou ne relève pas du site actif." });
            const [annee] = await Promise.all([
                AnneeAcademique.findByPk(parsed.data.anneeAcademiqueId)
            ]);
            if (!annee) return res.status(400).json({ success: false, message: 'L’année académique n’existe pas.' });
            const { classeIds, ...sessionData } = parsed.data;
            const data = await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                const session = await SessionExamen.create({
                    ...sessionData,
                    classeId: classeIds![0],
                    statut: 'brouillon',
                    datePublication: null
                }, { transaction });
                await SessionExamenClasse.bulkCreate(classeIds!.map(classeId => ({
                    sessionExamenId: Number(session.id),
                    classeId
                })), { transaction });
                return session;
            });
            return res.status(201).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        if (!estAdministrateur(req)) return res.status(403).json({ success: false, message: "Modification réservée à l’administrateur" });
        try {
            if (!isPositiveInteger(req.params.id)) return res.status(400).json({ success: false, message: "Identifiant de session invalide" });
            const data = await SessionExamen.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Session non trouvée" });
            if (data.statut !== 'brouillon') return res.status(409).json({ success: false, message: "Une session publiée ne peut plus être modifiée" });
            const parsed = validateSessionPayload(req.body, true);
            if (!parsed.data) return res.status(400).json({ success: false, message: parsed.message });
            if (Object.keys(parsed.data).length === 0) {
                return res.status(400).json({ success: false, message: 'Aucune donnée valide à mettre à jour.' });
            }
            const classIds = parsed.data.classeIds ?? (parsed.data.classeId ? [parsed.data.classeId] : await chargerClassesSession(Number(data.id), data.classeId));
            const classes = await classesValides(req, classIds);
            if (!classes) return res.status(400).json({ success: false, message: "Une classe n’existe pas, est inactive ou ne relève pas du site actif." });
            const classeId = classIds[0];
            const anneeAcademiqueId = parsed.data.anneeAcademiqueId ?? data.anneeAcademiqueId;
            const [annee] = await Promise.all([
                AnneeAcademique.findByPk(anneeAcademiqueId)
            ]);
            if (!annee) return res.status(400).json({ success: false, message: 'L’année académique n’existe pas.' });
            const { classeIds: _classeIds, ...updateData } = parsed.data;
            const remplaceClasses = parsed.data.classeIds !== undefined || parsed.data.classeId !== undefined;
            await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                await data.update({ ...updateData, classeId }, { transaction });
                if (remplaceClasses) {
                    await SessionExamenClasse.destroy({ where: { sessionExamenId: data.id }, transaction });
                    await SessionExamenClasse.bulkCreate(classIds.map(targetClasseId => ({
                        sessionExamenId: Number(data.id),
                        classeId: targetClasseId
                    })), { transaction });
                }
            });
            return res.status(200).send(data);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        if (!estAdministrateur(req)) return res.status(403).json({ success: false, message: "Suppression réservée à l’administrateur" });
        try {
            if (!isPositiveInteger(req.params.id)) return res.status(400).json({ success: false, message: "Identifiant de session invalide" });
            const data = await SessionExamen.findByPk(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Session non trouvée" });
            if (data.statut !== 'brouillon') {
                return res.status(409).json({ success: false, message: "Seule une session en brouillon peut être supprimée" });
            }
            await data.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async publier(req: Request, res: Response): Promise<Response> {
            if (!estAdministrateur(req)) return res.status(403).json({ success: false, message: "Publication réservée à l’administrateur" });
            try {
                if (!isPositiveInteger(req.params.id)) return res.status(400).json({ success: false, message: "Identifiant de session invalide" });
                const session = await SessionExamen.findByPk(req.params.id);
                if (!session) return res.status(404).json({ success: false, message: "Session non trouvée" });
                if (session.statut !== 'brouillon') {
                    return res.status(409).json({ success: false, message: "Seule une session en brouillon peut être publiée" });
                }
                await session.update({ statut: 'publie', datePublication: new Date() });
                return res.status(200).json({ success: true, session });
            } catch (error) {
                console.error('Erreur publication session examen:', error);
                return res.status(500).json({ success: false, message: 'La session n’a pas pu être publiée' });
        }
    }

    static async getByClasse(req: Request, res: Response): Promise<Response> {
        try {
            const classId = Number(req.params.classeId);
            const visibleClassIds = await classesVisibles(req);
            if (visibleClassIds !== null && !visibleClassIds.includes(classId)) {
                return res.status(404).json({ success: false, message: "Classe non trouvée" });
            }
            const where: any = {};
            if (req.utilisateurRole === RolesUtilisateur.APPRENANT || req.utilisateurRole === RolesUtilisateur.ENSEIGNANT) {
                where.statut = { [Op.notIn]: ['brouillon', 'annulee'] };
            }
            const links = await SessionExamenClasse.findAll({ where: { classeId: classId }, attributes: ['sessionExamenId'] });
            where.id = { [Op.in]: links.map(link => Number(link.sessionExamenId)) };
            const data = await SessionExamen.findAll({
                where,
                include: [
                    includeClassePourSite(req, SessionExamen.associations.classe),
                    includeClassePourSite(req, SessionExamen.associations.classesCibles),
                    SessionExamen.associations.anneeAcademique
                ]
            });
            return res.status(200).send(data.map(session => limiterClassesRetournees(session, req, classId)));
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async creerPaire(req: Request, res: Response): Promise<Response | null> {
        if (!estAdministrateur(req)) return res.status(403).json({ success: false, message: "Création réservée à l’administrateur" });
        try {
            const { classeId, anneeAcademiqueId, semestre, dateDebutNormale, dateFinNormale, dateDebutRattrapage, dateFinRattrapage } = req.body;

            if (!isPositiveInteger(classeId) || !isPositiveInteger(anneeAcademiqueId) || !SEMESTRES.includes(semestre)) {
                return res.status(400).json({ success: false, message: "classeId, anneeAcademiqueId et semestre sont requis" });
            }

            const annee = await AnneeAcademique.findByPk(anneeAcademiqueId);
            const classe = await Classe.findByPk(classeId);
            const classesAutorisees = await classesValides(req, [Number(classeId)]);
            if (!annee || !classe || !classesAutorisees) {
                return res.status(400).json({ success: false, message: "La classe n’existe pas, est inactive ou ne relève pas du site actif." });
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
                    statut: 'brouillon',
                    datePublication: null
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
                await SessionExamenClasse.bulkCreate([
                    { sessionExamenId: Number(sessionNormale.id), classeId: Number(classeId) },
                    { sessionExamenId: Number(sessionRattrapage.id), classeId: Number(classeId) }
                ], { transaction });
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
        if (!estAdministrateur(req)) return res.status(403).json({ success: false, message: "Modification réservée à l’administrateur" });
        try {
            const { correcteurs } = req.body;
            if (!Array.isArray(correcteurs)) {
                return res.status(400).json({ success: false, message: "correcteurs doit être un tableau [{coursId, enseignantId}]" });
            }

            const session = await SessionExamen.findByPk(req.params.id);
            if (!session) return res.status(404).json({ success: false, message: "Session examen non trouvée" });
            if (!(await sessionVisiblePour(req, session))) return res.status(404).json({ success: false, message: "Session examen non trouvée" });
            const sessionClasses = await chargerClassesSession(Number(session.id), session.classeId);
            const visibleClasses = await classesVisibles(req);
            const allowedClassIds = visibleClasses === null ? sessionClasses : sessionClasses.filter(id => visibleClasses.includes(id));

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
                        where: {
                            id: { [Op.in]: rows.map(row => row.coursId) },
                            classeId: { [Op.in]: allowedClassIds }
                        },
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
            const session = await SessionExamen.findByPk(req.params.id);
            if (!session || !(await sessionVisiblePour(req, session))) {
                return res.status(404).json({ success: false, message: "Session examen non trouvée" });
            }
            const sessionClasses = await chargerClassesSession(Number(session.id), session.classeId);
            const visibleClasses = await classesVisibles(req);
            const allowedClassIds = visibleClasses === null ? sessionClasses : sessionClasses.filter(id => visibleClasses.includes(id));
            const correcteurs = await SessionCorrecteur.findAll({
                where: { sessionExamenId: req.params.id },
                include: [
                    {
                        association: SessionCorrecteur.associations.cours,
                        where: { classeId: { [Op.in]: allowedClassIds } },
                        required: true
                    },
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
