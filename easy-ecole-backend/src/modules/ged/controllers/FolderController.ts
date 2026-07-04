import { Request, Response } from 'express';
import Folder from '../models/Folder';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';

export default class FolderController {
  static async list(req: Request, res: Response) {
    try {
      const folders = await Folder.findAll({ order: [['nom', 'ASC']] });
      return res.status(200).json(folders);
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
      const folder = await Folder.create({
        nom: req.body.nom,
        description: req.body.description || null,
        parentId: req.body.parentId || null,
        createdBy: (req as any).utilisateurId
      });
      return res.status(201).json(folder);
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
      const folder = await Folder.findByPk(req.params.id);
      if (!folder) return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
      folder.nom = req.body.nom || folder.nom;
      folder.description = req.body.description || folder.description;
      await folder.save();
      return res.status(200).json(folder);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async remove(req: Request, res: Response) {
    if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
      (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: 'Réservé à l\'institution' });
    }
    try {
      const folder = await Folder.findByPk(req.params.id);
      if (!folder) return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
      await folder.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
