import { Request, Response } from "express";
import { Op } from "sequelize";
import Tag from "../models/Tag";
import DocumentTag from "../models/DocumentTag";
import { DocumentGed } from "../models/DocumentGed";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

export default class TagController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const { search, page, limit } = req.query;
      const where: any = {};
      if (search) where.nom = { [Op.like]: `%${search}%` };

      const p = Math.max(1, parseInt(page as string) || 1);
      const l = Math.min(Math.max(1, parseInt(limit as string) || 50), 100);
      const offset = (p - 1) * l;

      const { rows, count } = await Tag.findAndCountAll({
        where,
        order: [['nom', 'ASC']],
        limit: l,
        offset,
      });

      return res.status(200).json({
        data: rows,
        pagination: { page: p, limit: l, total: count, totalPages: Math.ceil(count / l) }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const tag = await Tag.findByPk(req.params.id);
      if (!tag) return res.status(404).json({ success: false, message: "Tag non trouvé" });
      return res.status(200).json(tag);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
    }

    try {
      const { nom, couleur, description } = req.body;
      if (!nom) return res.status(400).json({ success: false, message: "Le nom du tag est requis" });

      const [tag, created] = await Tag.findOrCreate({
        where: { nom: nom.trim() },
        defaults: { nom: nom.trim(), couleur, description }
      });

      if (!created) return res.status(409).json({ success: false, message: "Ce tag existe déjà" });
      return res.status(201).json(tag);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
    }

    try {
      const tag = await Tag.findByPk(req.params.id);
      if (!tag) return res.status(404).json({ success: false, message: "Tag non trouvé" });

      const { nom, couleur, description } = req.body;
      if (nom !== undefined) tag.nom = nom.trim();
      if (couleur !== undefined) tag.couleur = couleur;
      if (description !== undefined) tag.description = description;
      await tag.save();

      return res.status(200).json(tag);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
      return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
    }

    try {
      const tag = await Tag.findByPk(req.params.id);
      if (!tag) return res.status(404).json({ success: false, message: "Tag non trouvé" });

      // Supprimer les associations avant de supprimer le tag
      await DocumentTag.destroy({ where: { tagId: tag.id } });
      await tag.destroy();

      return res.status(200).json({ success: true, message: "Tag supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  // ── Association document ⇔ tags ──

  static async addTagToDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { id: documentId, tagId } = req.params;

      const document = await DocumentGed.findByPk(documentId);
      if (!document) return res.status(404).json({ success: false, message: "Document non trouvé" });

      const tag = await Tag.findByPk(tagId);
      if (!tag) return res.status(404).json({ success: false, message: "Tag non trouvé" });

      const [docTag, created] = await DocumentTag.findOrCreate({
        where: { documentId: Number(documentId), tagId: Number(tagId) },
        defaults: { documentId: Number(documentId), tagId: Number(tagId) }
      });

      if (!created) return res.status(409).json({ success: false, message: "Ce tag est déjà associé à ce document" });

      // Mettre à jour le champ tags texte du document pour la recherche legacy
      await TagController.syncTagsField(Number(documentId));

      return res.status(201).json(docTag);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async removeTagFromDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { id: documentId, tagId } = req.params;

      const deleted = await DocumentTag.destroy({
        where: { documentId: Number(documentId), tagId: Number(tagId) }
      });

      if (!deleted) return res.status(404).json({ success: false, message: "Association non trouvée" });

      await TagController.syncTagsField(Number(documentId));

      return res.status(200).json({ success: true, message: "Tag retiré du document" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getDocumentTags(req: Request, res: Response): Promise<Response> {
    try {
      const documentTags = await DocumentTag.findAll({
        where: { documentId: req.params.id },
        include: [{ model: Tag, as: 'tag' }]
      });
      return res.status(200).json(documentTags.map((dt: any) => dt.tag));
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  // Synchronise le champ texte `tags` du document avec les noms des tags liés
  private static async syncTagsField(documentId: number): Promise<void> {
    try {
      const docTags = await DocumentTag.findAll({
        where: { documentId },
        include: [{ model: Tag, as: 'tag' }]
      });
      const tagNames = docTags.map((dt: any) => dt.tag?.nom).filter(Boolean);
      await DocumentGed.update({ tags: tagNames.join(', ') }, { where: { id: documentId } });
    } catch (err) {
      console.error('Erreur syncTagsField:', err);
    }
  }
}
