import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Parcours } from "../models/Parcours";
import { PrerequisParcours } from "../models/PrerequisParcours";
import { Cours } from "../models/Cours";

export default class ParcoursController {

    constructor() { }

    static async getAllParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Parcours>> = {
            include: [Parcours.associations.niveauEtude]
        }

        if (req.query.niveauEtudeId) {
            options.where = { niveauEtudeId: req.query.niveauEtudeId as string }
        }

        try {
            let parcours: Parcours[];
            parcours = await Parcours.findAll(options);

            return res.status(200).send(parcours);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        options = { where: { id: req.params.id }, include: [Parcours.associations.niveauEtude, {association: Parcours.associations.cours, include: [Cours.associations.classe]}, {model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] }

        try {
            const parcours: Parcours | null = await Parcours.findOne(options);

            if (parcours == null)
                return res.status(404).json({ success: false, message: "Filière non trouvée" });

            return res.status(200).send(parcours);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createParcours(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let parcours: Parcours | null = await Parcours.findOne({ where: { titre: req.body.titre } });

        if (parcours != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let parcours: Parcours = new Parcours();
            parcours.titre = req.body.titre
            parcours.description = req.body.description
            parcours.type = req.body.type
            parcours.grade = req.body.grade != null ? String(req.body.grade).trim() : null
            parcours.niveauEtudeId = req.body.niveauEtudeId

            await parcours.save()
                .then((parcours) => {
                    return res.status(201).send(parcours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        return null
    }

    static async updateParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let parcours: Parcours | null = await Parcours.findOne(options);
        if (parcours != null) {

            if (await Parcours.findOne({ where: { titre: req.body.titre } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {

                await parcours.update({
                    titre: req.body.titre,
                    description: req.body.description,
                    type: req.body.type,
                    grade: req.body.grade != null ? String(req.body.grade).trim() : null,
                    niveauEtudeId: req.body.niveauEtudeId,
                })
                    .then(async (parcours) => {
                        return res.status(200).send(parcours);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Parcours non trouvé" });
        }

        return null
    }

    static async deleteParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let parcours: Parcours | null = await Parcours.findOne({ where: { id: req.params.id } });
        if (parcours) {
            await parcours.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Filière supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Parcours non trouvé" });
        }

        return null
    }

    /**
     * Arborescence pour la PHASE 1 du wizard d'inscription :
     * Parcours (cycle) -> Grades -> Filières.
     * Retourne une structure groupée par type (LICENCE/MASTER/...) puis grade,
     * avec les filières (Parcours.titre) disponibles à chaque niveau.
     *
     * Filtres query :
     *   - type      : filtrer par cycle (LICENCE, MASTER, BTS, MBA, DOCTORAT)
     *   - grade     : filtrer par grade (ex : "Licence 1", "Master 2")
     *   - sessionId : ID d'une session → déduit le niveauEtudeId et filtre les
     *                 parcours dont le niveauEtudeId correspond à celui de la
     *                 session (permet de n'afficher que les filières du cycle
     *                 correspondant à la session choisie).
     *   - niveauEtudeId : filtrer directement par niveau d'étude
     */
    static async getArborescence(req: Request, res: Response): Promise<Response | null> {
        try {
            const filtres: any = {}
            if (req.query.type) filtres.type = req.query.type as string
            if (req.query.grade) filtres.grade = req.query.grade as string

            // ── Filtrage par sessionId ──────────────────────────────────────
            // Si un sessionId est fourni, on résout le niveauEtudeId de la
            // session et on filtre les parcours dont le niveauEtudeId ou le
            // type correspond au cycle de cette session.
            if (req.query.sessionId) {
                try {
                    const { Session } = require('../models/Session')
                    const session = await Session.findByPk(req.query.sessionId as string)
                    if (session && session.niveauEtudeId) {
                        filtres.niveauEtudeId = session.niveauEtudeId
                    }
                } catch (_e) {
                    // Si la session n'est pas trouvée, on ignore le filtre
                }
            }

            // ── Filtrage direct par niveauEtudeId ───────────────────────────
            if (req.query.niveauEtudeId && !filtres.niveauEtudeId) {
                filtres.niveauEtudeId = req.query.niveauEtudeId as string
            }

            const parcoursList: Parcours[] = await Parcours.findAll({
                where: filtres,
                order: [['type', 'ASC'], ['titre', 'ASC']],
                include: [Parcours.associations.niveauEtude]
            })

            // Parcours (types) distincts, dans un ordre stable
            const types = Array.from(new Set(parcoursList.map(p => p.type).filter(Boolean))) as string[]

            const arborescence = types.map((type) => {
                const deType = parcoursList.filter(p => p.type === type)
                // Grades distincts pour ce type (ordre d'apparition)
                const grades: string[] = []
                const gradeMap: Record<string, any[]> = {}
                for (const p of deType) {
                    const g = (p.grade || '').trim() || 'Sans grade'
                    if (!grades.includes(g)) grades.push(g)
                    if (!gradeMap[g]) gradeMap[g] = []
                    gradeMap[g].push({
                        id: p.id,
                        titre: p.titre,
                        type: p.type,
                        grade: p.grade || null,
                        niveauEtudeId: p.niveauEtudeId,
                        niveauEtude: p.niveauEtude || null
                    })
                }
                return { type, grades: grades.map(grade => ({ grade, filieres: gradeMap[grade] })) }
            })

            return res.status(200).json({ success: true, data: arborescence })
        } catch (error) {
            console.error('Erreur getArborescence', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Parcours>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Parcours.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }
}