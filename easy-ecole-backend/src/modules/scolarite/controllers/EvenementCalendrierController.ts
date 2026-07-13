import { Request, Response } from "express";
import { Op } from "sequelize";
import { EvenementCalendrier } from "../models/EvenementCalendrier";
import { Classe } from "../../inscription/models/Classe";
import { Parcours } from "../../inscription/models/Parcours";

export default class EvenementCalendrierController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const where: any = {};
            if (req.query.type) where.type = req.query.type;
            if (req.query.classeId) where.classeId = req.query.classeId;
            if (req.query.parcoursId) where.parcoursId = req.query.parcoursId;
            if (req.query.statut) where.statutEvenement = req.query.statut;

            const evenements = await EvenementCalendrier.findAll({
                where,
                include: [
                    { association: EvenementCalendrier.associations.classe },
                    { association: EvenementCalendrier.associations.parcours }
                ],
                order: [['date', 'ASC']]
            });
            return res.status(200).send(evenements);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getOne(req: Request, res: Response): Promise<Response> {
        try {
            const evenement = await EvenementCalendrier.findOne({
                where: { id: req.params.id },
                include: [
                    { association: EvenementCalendrier.associations.classe },
                    { association: EvenementCalendrier.associations.parcours }
                ]
            });
            if (evenement == null)
                return res.status(404).json({ success: false, message: "Événement non trouvé" });
            return res.status(200).send(evenement);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let evenement = new EvenementCalendrier();
        evenement.titre = req.body.titre;
        evenement.date = req.body.date;
        evenement.description = req.body.description;
        evenement.type = req.body.type;
        evenement.recurrence = req.body.recurrence || 'aucune';
        evenement.dateFinRecurrence = req.body.dateFinRecurrence || null;
        evenement.couleur = req.body.couleur || null;
        evenement.classeId = req.body.classeId || null;
        evenement.parcoursId = req.body.parcoursId || null;
        evenement.visibilite = req.body.visibilite || 'public';
        evenement.statutEvenement = req.body.statutEvenement || 'proposition';

        await evenement.save()
            .then(async (evenement) => {
                return res.status(201).send(evenement);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null;
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        let evenement = await EvenementCalendrier.findOne({ where: { id: req.params.id } });
        if (evenement != null) {
            await evenement.update(req.body)
                .then(async (evenement) => {
                    return res.status(200).send(evenement);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Événement non trouvé" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let evenement = await EvenementCalendrier.findOne({ where: { id: req.params.id } });
        if (evenement) {
            await evenement.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Événement supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Événement non trouvé" });
        }

        return null;
    }

    static async approuver(req: Request, res: Response): Promise<Response> {
        try {
            const evenement = await EvenementCalendrier.findOne({ where: { id: req.params.id } });
            if (evenement == null)
                return res.status(404).json({ success: false, message: "Événement non trouvé" });

            evenement.statutEvenement = 'approuve';
            await evenement.save();
            return res.status(200).send(evenement);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async publierCalendrier(req: Request, res: Response): Promise<Response> {
        try {
            const ids = req.body.ids as number[];
            if (!ids || ids.length === 0) {
                const [count] = await EvenementCalendrier.update(
                    { statutEvenement: 'publie' },
                    { where: { statutEvenement: { [Op.ne]: 'annule' } } }
                );
                return res.status(200).json({ success: true, message: "Calendrier publié", count });
            }

            const [count] = await EvenementCalendrier.update(
                { statutEvenement: 'publie' },
                { where: { id: { [Op.in]: ids }, statutEvenement: { [Op.ne]: 'annule' } } }
            );
            return res.status(200).json({ success: true, message: "Événements publiés", count });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByType(req: Request, res: Response): Promise<Response> {
        try {
            const evenements = await EvenementCalendrier.findAll({
                where: { type: req.params.type },
                include: [
                    { association: EvenementCalendrier.associations.classe },
                    { association: EvenementCalendrier.associations.parcours }
                ],
                order: [['date', 'ASC']]
            });
            return res.status(200).send(evenements);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByClasse(req: Request, res: Response): Promise<Response> {
        try {
            const evenements = await EvenementCalendrier.findAll({
                where: { classeId: req.params.classeId },
                include: [
                    { association: EvenementCalendrier.associations.classe },
                    { association: EvenementCalendrier.associations.parcours }
                ],
                order: [['date', 'ASC']]
            });
            return res.status(200).send(evenements);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getByParcours(req: Request, res: Response): Promise<Response> {
        try {
            const evenements = await EvenementCalendrier.findAll({
                where: { parcoursId: req.params.parcoursId },
                include: [
                    { association: EvenementCalendrier.associations.classe },
                    { association: EvenementCalendrier.associations.parcours }
                ],
                order: [['date', 'ASC']]
            });
            return res.status(200).send(evenements);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
