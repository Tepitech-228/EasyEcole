import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { SessionExamen } from "../models/SessionExamen";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { Classe } from "../models/Classe";

export default class SessionExamenController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<SessionExamen>> = { include: [{ all: true }] }
        try {
            let data = await SessionExamen.findAll(options);
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const data = await SessionExamen.findByPk(req.params.id, { include: [{ all: true }] });
            if (!data) return res.status(404).json({ success: false, message: "Session non trouvée" });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
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
            return res.status(500).json({ success: false, error: error });
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
            return res.status(500).json({ success: false, error: error });
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
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByClasse(req: Request, res: Response): Promise<Response> {
        try {
            const data = await SessionExamen.findAll({
                where: { classeId: req.params.classeId },
                include: [{ all: true }]
            });
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
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
            return res.status(500).json({ success: false, error: error });
        }
    }
}
