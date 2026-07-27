import { Request, Response } from 'express';
import Domain from '../models/Domain';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';
import { cacheJson } from './cacheged'

export default class DomainController {
  static async list(req: Request, res: Response) {
    try {
      const ttlSeconds = 60
      const cacheKey = `ged:admin:domains`

      const domains = await cacheJson(cacheKey, ttlSeconds, async () => {
        return Domain.findAll({ order: [['code', 'ASC']] })
      })

      return res.status(200).json(domains)

    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }


  static async get(req: Request, res: Response) {
    try {
      const domain = await Domain.findByPk(req.params.id);
      if (!domain) return res.status(404).json({ success: false, message: 'Domaine non trouvé' });
      return res.status(200).json(domain);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
      (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'institution' });
    }
    try {
      const domain = await Domain.create({
        code: req.body.code,
        label: req.body.label
      });
      return res.status(201).json(domain);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
      (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'institution' });
    }
    try {
      const domain = await Domain.findByPk(req.params.id);
      if (!domain) return res.status(404).json({ success: false, message: 'Domaine non trouvé' });
      domain.code = req.body.code || domain.code;
      domain.label = req.body.label || domain.label;
      await domain.save();
      return res.status(200).json(domain);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async remove(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'administrateur' });
    }
    try {
      const domain = await Domain.findByPk(req.params.id);
      if (!domain) return res.status(404).json({ success: false, message: 'Domaine non trouvé' });
      await domain.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
