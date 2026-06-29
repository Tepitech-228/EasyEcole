import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RegistreAcademique } from "../models/RegistreAcademique";

export default class RegistreAcademiqueController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const registres = await RegistreAcademique.findAll();
            return res.status(200).send(registres);
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
