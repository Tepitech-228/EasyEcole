import { Request, Response } from "express";
import { Salon } from "../models/Salon";
import { Message } from "../models/Message";
import { ParticipantSalon } from "../models/ParticipantSalon";

export default class ChatController {

    static async getSalons(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const salons = await Salon.findAll({
                include: [Salon.associations.messages, Salon.associations.participants]
            });
            return res.status(200).send(salons);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getSalon(req: Request, res: Response): Promise<Response> {
        try {
            const salon = await Salon.findOne({
                where: { id: req.params.id },
                include: [{
                    model: Message,
                    as: 'messages'
                }, Salon.associations.participants]
            });

            if (!salon)
                return res.status(404).json({ success: false, message: "Salon non trouvé" });

            return res.status(200).send(salon);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createSalon(req: Request, res: Response): Promise<Response> {
        try {
            const salon = await Salon.create({
                coursId: req.body.coursId,
                titre: req.body.titre,
                type: req.body.type || 'cours'
            });
            return res.status(201).send(salon);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async getMessages(req: Request, res: Response): Promise<Response> {
        try {
            const messages = await Message.findAll({
                where: { salonId: req.params.salonId },
                order: [['date', 'ASC']]
            });
            return res.status(200).send(messages);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async sendMessage(req: Request, res: Response): Promise<Response> {
        try {
            const message = await Message.create({
                salonId: req.params.salonId,
                utilisateurId: (req as any).utilisateurId,
                message: req.body.message
            });
            return res.status(201).send(message);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async ajouterParticipant(req: Request, res: Response): Promise<Response> {
        try {
            const participant = await ParticipantSalon.create({
                salonId: req.params.salonId,
                utilisateurId: req.body.utilisateurId
            });
            return res.status(201).send(participant);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }
}
