import { Request, Response } from "express";
import { ParametreFrais } from "../models/ParametreFrais";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

const TYPES_VALIDES = ['montant', 'compte_comptable', 'pourcentage', 'texte'];

export default class ParametreFraisController {

  /**
   * Récupère tous les paramètres de frais (filtres optionnels : module, type)
   */
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const { module, type } = req.query;
      const where: any = {};
      if (module) where.module = module;
      if (type) {
        if (!TYPES_VALIDES.includes(type as string)) {
          return res.status(400).json({ success: false, message: "Type invalide" });
        }
        where.type = type;
      }

      const parametres = await ParametreFrais.findAll({
        where,
        order: [['cle', 'ASC']]
      });
      return res.status(200).send(parametres);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * Récupère un paramètre de frais par son ID
   */
  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const parametre = await ParametreFrais.findByPk(req.params.id);
      if (!parametre) {
        return res.status(404).json({ success: false, message: "Paramètre de frais non trouvé" });
      }
      return res.status(200).send(parametre);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * Retourne uniquement les paramètres de type 'montant'
   * (utilisés par les autres modules pour afficher les frais)
   */
  static async getPublic(req: Request, res: Response): Promise<Response> {
    try {
      const parametres = await ParametreFrais.findAll({
        where: { type: 'montant' },
        attributes: ['id', 'cle', 'libelle', 'valeur', 'description', 'module'],
        order: [['cle', 'ASC']]
      });
      return res.status(200).send(parametres);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * Crée un nouveau paramètre de frais (admin uniquement)
   */
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
        return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
      }

      const { cle, libelle, valeur, description, type, module } = req.body;

      if (!cle || !libelle) {
        return res.status(400).json({ success: false, message: "Champs obligatoires manquants (cle, libelle)" });
      }
      if (type && !TYPES_VALIDES.includes(type)) {
        return res.status(400).json({ success: false, message: "Type invalide" });
      }

      const parametre = await ParametreFrais.create({
        cle,
        libelle,
        valeur: valeur ?? 0,
        description: description ?? null,
        type: type || 'montant',
        module: module ?? null
      });
      return res.status(201).send(parametre);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: "Cette clé de paramètre existe déjà" });
      }
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * Met à jour un paramètre de frais par son ID
   */
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const parametre = await ParametreFrais.findByPk(req.params.id);
      if (!parametre) {
        return res.status(404).json({ success: false, message: "Paramètre de frais non trouvé" });
      }

      const { cle, libelle, valeur, description, type, module } = req.body;
      if (type && !TYPES_VALIDES.includes(type)) {
        return res.status(400).json({ success: false, message: "Type invalide" });
      }

      if (cle !== undefined) parametre.cle = cle;
      if (libelle !== undefined) parametre.libelle = libelle;
      if (valeur !== undefined) parametre.valeur = valeur;
      if (description !== undefined) parametre.description = description;
      if (type !== undefined) parametre.type = type;
      if (module !== undefined) parametre.module = module;

      await parametre.save();
      return res.status(200).send(parametre);
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: "Cette clé de paramètre existe déjà" });
      }
      return res.status(500).json({ success: false, error });
    }
  }

  /**
   * Supprime un paramètre de frais par son ID (soft delete)
   */
  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const parametre = await ParametreFrais.findByPk(req.params.id);
      if (!parametre) {
        return res.status(404).json({ success: false, message: "Paramètre de frais non trouvé" });
      }
      await parametre.destroy();
      return res.status(200).json({ success: true, message: "Paramètre de frais supprimé" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
