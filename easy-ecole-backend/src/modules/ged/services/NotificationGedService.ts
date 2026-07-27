import { Op, fn, col, where } from "sequelize";
import { DocumentGed } from "../models/DocumentGed";
import GedNotification from "../models/GedNotification";
import GedSignature from "../models/GedSignature";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class NotificationGedService {

    static async verifierDUA(): Promise<void> {
        const now = new Date();
        const dans30Jours = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const aujourdHui = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const docsExpirant = await DocumentGed.findAll({
            where: {
                duaEndDate: { [Op.between]: [aujourdHui, dans30Jours] },
                lifecycleStatus: { [Op.notIn]: ['a_detruire'] }
            }
        });

        for (const doc of docsExpirant) {
            const fin = new Date(doc.duaEndDate!);
            const dans = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const type = dans <= 0 ? 'dua_expiration' : 'dua_approche';

            const existing = await GedNotification.findOne({
                where: { documentId: doc.id, type }
            });
            if (existing) continue;

            const msg = dans <= 0
                ? `Le document "${doc.titre}" a atteint sa date de fin d'utilité administrative.`
                : `Le document "${doc.titre}" expire dans ${dans} jour(s).`;

            await GedNotification.create({ documentId: doc.id, type, message: msg });
        }
    }

    static async notifierSignatureDemandee(documentId: number, requestedBy: number): Promise<void> {
        const doc = await DocumentGed.findByPk(documentId);
        if (!doc) return;

        const admins = await Utilisateur.findAll({ where: { role: 'institution' }, attributes: ['id'] });

        for (const admin of admins) {
            await GedNotification.create({
                documentId,
                type: 'signature_demandee',
                message: `Signature demandée pour le document "${doc.titre}" par l'utilisateur #${requestedBy}.`,
                destinataireId: admin.id
            });
        }
    }

    static async notifierSignatureEffectuee(documentId: number, signedBy: number): Promise<void> {
        const doc = await DocumentGed.findByPk(documentId);
        if (!doc) return;

        await GedNotification.create({
            documentId,
            type: 'signature_effectuee',
            message: `Le document "${doc.titre}" a été signé par l'utilisateur #${signedBy}.`,
            destinataireId: (doc as any).uploaderId
        });
    }

    static async getNotifications(utilisateurId: number, onlyUnread = false): Promise<GedNotification[]> {
        const whereClause: any = {};
        if (onlyUnread) whereClause.lu = false;
        whereClause[Op.or] = [{ destinataireId: utilisateurId }, { destinataireId: null }];

        return GedNotification.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 50
        });
    }

    static async markAsRead(notificationId: number): Promise<void> {
        await GedNotification.update({ lu: true, luAt: new Date() }, { where: { id: notificationId } });
    }

    static async marquerToutLu(utilisateurId: number): Promise<void> {
        await GedNotification.update({ lu: true, luAt: new Date() }, {
            where: {
                [Op.or]: [{ destinataireId: utilisateurId }, { destinataireId: null }],
                lu: false
            }
        });
    }
}
