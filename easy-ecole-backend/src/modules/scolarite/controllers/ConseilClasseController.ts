import { Request, Response } from "express";
import { ConseilClasse } from "../models/ConseilClasse";
import { DecisionConseil } from "../models/DecisionConseil";

export default class ConseilClasseController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const conseils = await ConseilClasse.findAll({
                include: [{ model: DecisionConseil, as: 'decisions' }],
                order: [['date', 'ASC']]
            });
            return res.status(200).send(conseils);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getOne(req: Request, res: Response): Promise<Response> {
        try {
            const conseil = await ConseilClasse.findOne({
                where: { id: req.params.id },
                include: [{ model: DecisionConseil, as: 'decisions' }]
            });
            if (conseil == null)
                return res.status(404).json({ success: false, message: "Conseil non trouvé" });
            return res.status(200).send(conseil);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let conseil = new ConseilClasse();
        conseil.classe = req.body.classe;
        conseil.date = req.body.date;
        conseil.trimestre = req.body.trimestre;
        conseil.president = req.body.president;
        conseil.statut = req.body.statut;

        await conseil.save()
            .then(async (conseil) => {
                if (req.body.decisions && req.body.decisions.length > 0) {
                    for (const d of req.body.decisions) {
                        await conseil.createDecision({ theme: d.theme, description: d.description } as DecisionConseil);
                    }
                }
                const result = await ConseilClasse.findOne({
                    where: { id: conseil.id },
                    include: [{ model: DecisionConseil, as: 'decisions' }]
                });
                return res.status(201).send(result);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null;
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        let conseil = await ConseilClasse.findOne({ where: { id: req.params.id } });
        if (conseil != null) {
            await conseil.update(req.body)
                .then(async (conseil) => {
                    const result = await ConseilClasse.findOne({
                        where: { id: conseil.id },
                        include: [{ model: DecisionConseil, as: 'decisions' }]
                    });
                    return res.status(200).send(result);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Conseil non trouvé" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let conseil = await ConseilClasse.findOne({ where: { id: req.params.id } });
        if (conseil) {
            await DecisionConseil.destroy({ where: { conseilClasseId: req.params.id } });
            await conseil.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Conseil supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Conseil non trouvé" });
        }

        return null;
    }
}
