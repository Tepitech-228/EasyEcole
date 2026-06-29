import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { Compte } from "../models/Compte";

export default class CompteController {
  constructor() { }

  /**
   * Récupère tous les comptes (plan comptable complet)
   */
  static async getAllComptes(req: Request, res: Response): Promise<Response> {
    try {
      const comptes = await Compte.findAll({
        where: { actif: true },
        order: [['numero', 'ASC']]
      })
      return res.status(200).send(comptes)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Récupère les comptes par classe (1, 2, 3, 4, 5, 6, 7, 8, 9)
   */
  static async getComptesByClasse(req: Request, res: Response): Promise<Response> {
    try {
      const classe = req.params.classe
      if (!['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(classe)) {
        return res.status(400).json({ success: false, message: "Classe invalide" })
      }

      const comptes = await Compte.findAll({
        where: { classe, actif: true },
        order: [['numero', 'ASC']]
      })
      return res.status(200).send(comptes)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Récupère un compte par son ID
   */
  static async getCompte(req: Request, res: Response): Promise<Response> {
    try {
      const compte = await Compte.findByPk(req.params.id)
      if (!compte) {
        return res.status(404).json({ success: false, message: "Compte non trouvé" })
      }
      return res.status(200).send(compte)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Crée un nouveau compte
   */
  static async createCompte(req: Request, res: Response): Promise<Response> {
    try {
      const { numero, libelle, classe, sousClasse, nature, categorie, description, moduleSource } = req.body

      if (!numero || !libelle || !classe || !nature || !categorie) {
        return res.status(400).json({ success: false, message: "Champs obligatoires manquants" })
      }

      const compte = await Compte.create({
        numero,
        libelle,
        classe,
        sousClasse,
        nature,
        categorie,
        description,
        moduleSource,
        actif: true
      })

      return res.status(201).send(compte)
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: "Ce numéro de compte existe déjà" })
      }
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Met à jour un compte
   */
  static async updateCompte(req: Request, res: Response): Promise<Response> {
    try {
      const compte = await Compte.findByPk(req.params.id)
      if (!compte) {
        return res.status(404).json({ success: false, message: "Compte non trouvé" })
      }

      const { libelle, sousClasse, nature, categorie, description, actif } = req.body
      if (libelle) compte.libelle = libelle
      if (sousClasse) compte.sousClasse = sousClasse
      if (nature) compte.nature = nature
      if (categorie) compte.categorie = categorie
      if (description) compte.description = description
      if (actif !== undefined) compte.actif = actif

      await compte.save()
      return res.status(200).send(compte)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }
}
