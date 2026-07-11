import { Notification } from "../../modules/elearning/models/Notification";
import { EmailSender } from "./EmailSender";
import { Utilisateur } from "../../modules/auth/models/Utilisateur";
import SseService from "./SseService";

export class NotificationHelper {

    static async envoyerNotification(
        utilisateurId: number,
        type: string,
        titre: string,
        message: string,
        lien?: string,
        envoyerEmail: boolean = false
    ): Promise<Notification> {
        try {
            const notification = await Notification.create({
                utilisateurId,
                type,
                titre,
                message,
                lien
            });

            SseService.sendToUser(utilisateurId, 'notification', {
                id: notification.id,
                type,
                titre,
                message,
                lien,
                date: notification.date,
                lu: false
            });

            if (envoyerEmail) {
                const user = await Utilisateur.findByPk(utilisateurId);
                if (user?.email) {
                    const emailSender = EmailSender.getInstance();
                    await emailSender.sendMail({
                        to: user.email,
                        subject: `Easy Ecole: ${type}`,
                        html: `<p>${message}</p>`
                    });
                }
            }

            return notification;
        } catch (error) {
            console.error(`[NotificationHelper] Erreur envoi notification à ${utilisateurId}:`, error);
            throw error;
        }
    }

    static async envoyerNotificationMultiples(
        utilisateurIds: number[],
        type: string,
        titre: string,
        message: string,
        envoyerEmail: boolean = false
    ): Promise<void> {
        const payloads = utilisateurIds.map(id => ({
            utilisateurId: id,
            type,
            titre,
            message: `${titre}: ${message}`,
            lien: undefined as string | undefined
        }));
        try {
            const notifications = await Notification.bulkCreate(payloads as any);

            for (let i = 0; i < notifications.length; i++) {
                const n = notifications[i];
                const userId = utilisateurIds[i];
                SseService.sendToUser(userId, 'notification', {
                    id: n.id,
                    type,
                    titre,
                    message: n.message,
                    lien: undefined,
                    date: n.date,
                    lu: false
                });
            }

            if (envoyerEmail) {
                const users = await Utilisateur.findAll({
                    where: { id: utilisateurIds }
                });
                const emailSender = EmailSender.getInstance();
                for (const user of users) {
                    if (user.email) {
                        await emailSender.sendMail({
                            to: user.email,
                            subject: `Easy Ecole: ${titre}`,
                            html: `<p>${message}</p>`
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`[NotificationHelper] Erreur envoi notifications multiples:`, error);
        }
    }
}
