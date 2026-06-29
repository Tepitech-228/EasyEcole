import { Request, Response } from "express";
import { SanctionDiscipline } from "../models/SanctionDiscipline";

export default class SanctionDisciplineController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const sanctions = await SanctionDiscipline.findAll();
            return res.status(200).send(sanctions);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getOne(req: Request, res: Response): Promise<Response> {
        try {
            const sanction = await SanctionDiscipline.findOne({ where: { id: req.params.id } });
            if (sanction == null)
                return res.status(404).json({ success: false, message: "Sanction non trouvée" });
            return res.status(200).send(sanction);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let sanction = new SanctionDiscipline();
        sanction.etudiant = req.body.etudiant;
        sanction.matricule = req.body.matricule;
        sanction.classe = req.body.classe;
        sanction.date = req.body.date;
        sanction.motif = req.body.motif;
        sanction.sanction = req.body.sanction;
        sanction.statut = req.body.statut;

        await sanction.save()
            .then(async (sanction) => {
                return res.status(201).send(sanction);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null;
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        let sanction = await SanctionDiscipline.findOne({ where: { id: req.params.id } });
        if (sanction != null) {
            await sanction.update(req.body)
                .then(async (sanction) => {
                    return res.status(200).send(sanction);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Sanction non trouvée" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let sanction = await SanctionDiscipline.findOne({ where: { id: req.params.id } });
        if (sanction) {
            await sanction.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Sanction supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Sanction non trouvée" });
        }

        return null;
    }
}
