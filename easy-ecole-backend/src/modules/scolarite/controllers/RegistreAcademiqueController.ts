import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RegistreAcademique } from "../models/RegistreAcademique";

export default class RegistreAcademiqueController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
            const offset = (page - 1) * limit;

            const { anneeScolaire, classe, decision, search } = req.query;

            const where: any = {};

            if (anneeScolaire) where.anneeScolaire = anneeScolaire;
            if (classe) where.classe = classe;
            if (decision) where.decision = decision;
            if (search) {
                where[Op.or] = [
                    { etudiant: { [Op.substring]: search } },
                    { matricule: { [Op.substring]: search } }
                ];
            }

            const { count, rows } = await RegistreAcademique.findAndCountAll({
                where,
                offset,
                limit,
                order: [['anneeScolaire', 'DESC'], ['classe', 'ASC'], ['etudiant', 'ASC']]
            });

            return res.status(200).json({
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async batchStatut(req: Request, res: Response): Promise<Response> {
        try {
            const { ids, decision } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, message: "IDs requis" });
            }
            if (!decision) {
                return res.status(400).json({ success: false, message: "Décision requise" });
            }

            const [count] = await RegistreAcademique.update(
                { decision },
                { where: { id: ids } }
            );

            return res.status(200).json({ success: true, count });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getOne(req: Request, res: Response): Promise<Response> {
        try {
            const registre = await RegistreAcademique.findOne({ where: { id: req.params.id } });
            if (registre == null)
                return res.status(404).json({ success: false, message: "Registre non trouvé" });
            return res.status(200).send(registre);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let registre = new RegistreAcademique();
        registre.etudiant = req.body.etudiant;
        registre.matricule = req.body.matricule;
        registre.classe = req.body.classe;
        registre.moyenne = req.body.moyenne;
        registre.rang = req.body.rang;
        registre.decision = req.body.decision;
        registre.anneeScolaire = req.body.anneeScolaire;

        await registre.save()
            .then(async (registre) => {
                return res.status(201).send(registre);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null;
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        let registre = await RegistreAcademique.findOne({ where: { id: req.params.id } });
        if (registre != null) {
            await registre.update(req.body)
                .then(async (registre) => {
                    return res.status(200).send(registre);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Registre non trouvé" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let registre = await RegistreAcademique.findOne({ where: { id: req.params.id } });
        if (registre) {
            await registre.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Registre supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Registre non trouvé" });
        }

        return null;
    }
}
