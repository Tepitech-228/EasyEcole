import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { DocumentGed } from "../models/DocumentGed";
import Domain from "../models/Domain";
import DocumentType from "../models/DocumentType";
import Folder from "../models/Folder";
import GedNotification from "../models/GedNotification";

class DashboardGedController {

    static async global(req: Request, res: Response): Promise<Response> {
        try {
            const totalDocs = await DocumentGed.count();
            const totalArchived = await DocumentGed.count({ where: { isArchived: true } });
            const totalCourant = await DocumentGed.count({ where: { lifecycleStatus: 'courant' } });
            const totalIntermediaire = await DocumentGed.count({ where: { lifecycleStatus: 'intermediaire' } });
            const totalDefinitif = await DocumentGed.count({ where: { lifecycleStatus: 'definitif' } });
            const totalADetruire = await DocumentGed.count({ where: { lifecycleStatus: 'a_detruire' } });
            const totalLocked = await DocumentGed.count({ where: { isLocked: true } });
            const totalSansDUA = await DocumentGed.count({ where: literal('dua_end_date IS NULL') });
            const duaExpire = await DocumentGed.count({ where: { duaEndDate: { [Op.lte]: new Date() }, lifecycleStatus: { [Op.notIn]: ['a_detruire'] } } });

            const totalFolders = await Folder.count();
            const totalDomains = await Domain.count();
            const totalTypes = await DocumentType.count();

            const unreadNotifications = await GedNotification.count({ where: { lu: false, [Op.or]: [{ destinataireId: (req as any).utilisateurId }, { destinataireId: null }] } });

            return res.status(200).json({
                documents: {
                    total: totalDocs,
                    parStatut: { courant: totalCourant, intermediaire: totalIntermediaire, definitif: totalDefinitif, aDetruire: totalADetruire },
                    archived: totalArchived,
                    locked: totalLocked,
                    sansDUA: totalSansDUA,
                    duaExpire,
                },
                structure: {
                    dossiers: totalFolders,
                    domaines: totalDomains,
                    types: totalTypes
                },
                notifications: { nonLues: unreadNotifications }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async parDomaine(req: Request, res: Response): Promise<Response> {
        try {
            const domains = await Domain.findAll({
                attributes: ['id', 'code', 'nom'],
                include: [{
                    association: 'documents',
                    attributes: [],
                    required: false
                }]
            });

            const result: any[] = [];
            for (const d of domains) {
                const count = await DocumentGed.count({ where: { domainId: d.id } });
                result.push({ id: d.id, code: d.code, label: d.label, count });
            }

            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async recentActivity(req: Request, res: Response): Promise<Response> {
        try {
            const { default: DocumentAuditLog } = await import("../models/DocumentAuditLog");

            const logs = await DocumentAuditLog.findAll({
                order: [['createdAt', 'DESC']],
                limit: 20,
                include: [
                    { association: 'document', attributes: ['id', 'titre', 'reference'] }
                ]
            });

            return res.status(200).json(logs);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}

export default DashboardGedController;
