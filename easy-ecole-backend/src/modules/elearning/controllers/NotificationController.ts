import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { EmailSender } from "../../../core/helpers/EmailSender";

export default class NotificationController {

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const where: any = { utilisateurId: (req as any).utilisateurId };
            if (req.query.lu === 'false') {
                where.lu = false;
            }
            const notifications = await Notification.findAll({
                where,
                order: [['date', 'DESC']]
            });
            return res.status(200).send(notifications);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response> {
        try {
            const count = await Notification.count({
                where: { utilisateurId: (req as any).utilisateurId, lu: false }
            });
            return res.status(200).json({ count });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async marquerLu(req: Request, res: Response): Promise<Response> {
        try {
            await Notification.update(
                { lu: true },
                { where: { id: req.params.id, utilisateurId: (req as any).utilisateurId } }
            );
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async marquerToutesLues(req: Request, res: Response): Promise<Response> {
        try {
            await Notification.update(
                { lu: true },
                { where: { utilisateurId: (req as any).utilisateurId, lu: false } }
            );
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async envoyerNotification(req: Request, res: Response): Promise<Response> {
        try {
            const { utilisateurId, type, message, email } = req.body;

            await Notification.create({
                utilisateurId,
                type,
                message
            });

            if (email) {
                const emailSender = EmailSender.getInstance();
                await emailSender.sendMail({
                    to: email,
                    subject: `Easy Ecole: ${type}`,
                    html: `<p>${message}</p>`
                });
            }

            return res.status(201).json({ success: true });
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }
}
