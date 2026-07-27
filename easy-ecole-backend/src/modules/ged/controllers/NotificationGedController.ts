import { Request, Response } from "express";
import { NotificationGedService } from "../services/NotificationGedService";

class NotificationGedController {
    static async list(req: Request, res: Response): Promise<Response> {
        try {
            const onlyUnread = req.query.unread === 'true';
            const notifications = await NotificationGedService.getNotifications((req as any).utilisateurId, onlyUnread);
            return res.status(200).json(notifications);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async markAsRead(req: Request, res: Response): Promise<Response> {
        try {
            await NotificationGedService.markAsRead(Number(req.params.id));
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async markAllRead(req: Request, res: Response): Promise<Response> {
        try {
            await NotificationGedService.marquerToutLu((req as any).utilisateurId);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async runDUACheck(req: Request, res: Response): Promise<Response> {
        try {
            await NotificationGedService.verifierDUA();
            return res.status(200).json({ success: true, message: "Vérification DUA effectuée" });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

export default NotificationGedController;
