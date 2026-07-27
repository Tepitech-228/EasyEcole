import { Request, Response } from 'express';
import DisposalRecord from '../models/DisposalRecord';
import { DocumentGed } from '../models/DocumentGed';
import { AuditService } from '../../../core/services/AuditService';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';

export default class DisposalController {
  static async list(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      const where: any = {};
      if (req.query.status) {
        where.status = req.query.status;
      }

      const { count, rows } = await DisposalRecord.findAndCountAll({
        where,
        include: [
          { association: DisposalRecord.associations.document, attributes: ['id', 'titre', 'reference'] },
          { association: 'requester', attributes: ['id', 'nom', 'prenoms'] },
          { association: 'confirmer', attributes: ['id', 'nom', 'prenoms'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset
      });

      return res.status(200).json({
        data: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async reject(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }

    try {
      const disposal = await DisposalRecord.findByPk(req.params.id);
      if (!disposal) {
        return res.status(404).json({ success: false, message: 'Demande d\'élimination non trouvée' });
      }

      disposal.status = 'rejetee';
      disposal.confirmedBy = (req as any).utilisateurId;
      disposal.confirmedAt = new Date();
      await disposal.save();

      const document = await DocumentGed.findByPk(disposal.documentId);
      if (document) {
        document.lifecycleStatus = 'intermediaire';
        await document.save();
      }

      await AuditService.log(
        disposal.documentId,
        (req as any).utilisateurId,
        'marquage_destruction',
        { action: 'rejet_destruction', disposalId: disposal.id }
      );

      return res.status(200).json({ success: true, disposal });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
