import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { SessionExamen } from "../models/SessionExamen";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { Classe } from "../models/Classe";
import { SessionCorrecteur } from "../models/SessionCorrecteur";
import { Enseignant } from "../../auth/models/Enseignant";

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
            const data = await SessionExamen.create(req.body);
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
            await data.update(req.body);
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

            if (!classeId || !anneeAcademiqueId || !semestre) {
                return res.status(400).json({ success: false, message: "classeId, anneeAcademiqueId et semestre sont requis" });
            }

            const annee = await AnneeAcademique.findByPk(anneeAcademiqueId);
            const classe = await Classe.findByPk(classeId);
            const suffixe = annee ? annee.libelle : `AA${anneeAcademiqueId}`;
            const classeLabel = classe ? classe.libelle : `C${classeId}`;

            const sessionNormale = await SessionExamen.create({
                libelle: `Session normale - ${suffixe} - ${classeLabel} - ${semestre}`,
                type: 'normale',
                classeId,
                anneeAcademiqueId,
                semestre,
                dateDebut: dateDebutNormale || null,
                dateFin: dateFinNormale || null,
                statut: 'planifiee'
            });

            const sessionRattrapage = await SessionExamen.create({
                libelle: `Session rattrapage - ${suffixe} - ${classeLabel} - ${semestre}`,
                type: 'rattrapage',
                classeId,
                anneeAcademiqueId,
                semestre,
                dateDebut: dateDebutRattrapage || null,
                dateFin: dateFinRattrapage || null,
                statut: 'planifiee'
            });

            return res.status(201).json({
                success: true,
                data: { normale: sessionNormale, rattrapage: sessionRattrapage }
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

            await SessionCorrecteur.destroy({ where: { sessionExamenId: session.id } });

            const rows = correcteurs
                .filter(c => c.coursId && c.enseignantId)
                .map(c => ({ sessionExamenId: session.id, coursId: c.coursId, enseignantId: c.enseignantId }));

            const created = rows.length ? await SessionCorrecteur.bulkCreate(rows) : [];

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
