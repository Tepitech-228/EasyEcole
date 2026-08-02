import { Request, Response } from "express";
import { Op } from "sequelize";
import { ExerciceComptable } from "../models/ExerciceComptable";

export default class ExerciceComptableController {
  constructor() { }

  /**
   * Récupère tous les exercices comptables (triés par dateDebut DESC)
   */
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const exercices = await ExerciceComptable.findAll({
        order: [['dateDebut', 'DESC']]
      })
      return res.status(200).send(exercices)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Récupère l'exercice actif en cours
   */
  static async getEnCours(req: Request, res: Response): Promise<Response> {
    try {
      const exercice = await ExerciceComptable.findOne({
        where: { actif: true }
      })

      if (!exercice) {
        return res.status(404).json({ success: false, message: "Aucun exercice actif trouvé" })
      }

      return res.status(200).send(exercice)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Récupère un exercice comptable par son ID
   */
  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const exercice = await ExerciceComptable.findByPk(req.params.id)

      if (!exercice) {
        return res.status(404).json({ success: false, message: "Exercice comptable non trouvé" })
      }

      return res.status(200).send(exercice)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Crée un nouvel exercice comptable
   *
   * Contrôles métier :
   * - Vérifie qu'aucun exercice n'existe sur la même période (chevauchement)
   * - Si c'est le premier exercice, le marque actif:true
   */
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { code, libelle, dateDebut, dateFin } = req.body

      // Champs obligatoires
      if (!code || !libelle || !dateDebut || !dateFin) {
        return res.status(400).json({
          success: false,
          message: "Champs obligatoires manquants : code, libelle, dateDebut, dateFin"
        })
      }

      // Vérifier la cohérence des dates
      if (new Date(dateDebut) >= new Date(dateFin)) {
        return res.status(400).json({
          success: false,
          message: "La date de fin doit être postérieure à la date de début"
        })
      }

      // Vérifier qu'aucun exercice n'existe sur la même période (chevauchement)
      const exerciceExistant = await ExerciceComptable.findOne({
        where: {
          [Op.and]: [
            { dateDebut: { [Op.lte]: dateFin } },
            { dateFin: { [Op.gte]: dateDebut } }
          ]
        }
      })

      if (exerciceExistant) {
        return res.status(400).json({
          success: false,
          message: "Un exercice comptable existe déjà sur cette période"
        })
      }

      // Déterminer si c'est le premier exercice pour définir actif
      const nombreExercices = await ExerciceComptable.count()
      const estPremierExercice = nombreExercices === 0

      const exercice = await ExerciceComptable.create({
        code,
        libelle,
        dateDebut,
        dateFin,
        statut: 'Ouvert',
        actif: estPremierExercice,
        dateCloture: null,
        resultatNet: null
      })

      return res.status(201).send(exercice)
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: "Ce code d'exercice existe déjà"
        })
      }
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Modifie un exercice comptable
   *
   * Contrôles métier :
   * - Impossible de modifier un exercice clôturé (statut === 'Clôturé')
   * - Impossible de changer `actif` si l'exercice est clôturé
   */
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const exercice = await ExerciceComptable.findByPk(req.params.id)

      if (!exercice) {
        return res.status(404).json({ success: false, message: "Exercice comptable non trouvé" })
      }

      // Impossible de modifier un exercice clôturé
      if (exercice.statut === 'Clôturé') {
        return res.status(400).json({
          success: false,
          message: "Impossible de modifier un exercice clôturé"
        })
      }

      const { code, libelle, dateDebut, dateFin, actif } = req.body

      // code
      if (code !== undefined) {
        // Vérifier l'unicité du code (hors exercice courant)
        const existant = await ExerciceComptable.findOne({
          where: { code, id: { [Op.ne]: exercice.id } }
        })
        if (existant) {
          return res.status(400).json({
            success: false,
            message: "Ce code d'exercice est déjà utilisé"
          })
        }
        exercice.code = code
      }

      // libelle
      if (libelle !== undefined) exercice.libelle = libelle

      // dates (doivent être modifiées ensemble)
      if (dateDebut || dateFin) {
        if (!dateDebut || !dateFin) {
          return res.status(400).json({
            success: false,
            message: "Les dates dateDebut et dateFin doivent être fournies ensemble"
          })
        }

        if (new Date(dateDebut) >= new Date(dateFin)) {
          return res.status(400).json({
            success: false,
            message: "La date de fin doit être postérieure à la date de début"
          })
        }

        // Vérifier le chevauchement avec d'autres exercices (exclure l'exercice courant)
        const chevauchement = await ExerciceComptable.findOne({
          where: {
            id: { [Op.ne]: exercice.id },
            [Op.and]: [
              { dateDebut: { [Op.lte]: dateFin } },
              { dateFin: { [Op.gte]: dateDebut } }
            ]
          }
        })

        if (chevauchement) {
          return res.status(400).json({
            success: false,
            message: "Un exercice comptable existe déjà sur cette période"
          })
        }

        exercice.dateDebut = dateDebut
        exercice.dateFin = dateFin
      }

      // actif (l'exercice clôturé est déjà bloqué plus haut)
      if (actif !== undefined) {
        // Si on active cet exercice, désactiver les autres
        if (actif === true) {
          await ExerciceComptable.update(
            { actif: false },
            { where: { id: { [Op.ne]: exercice.id } } }
          )
        }
        exercice.actif = actif
      }

      await exercice.save()

      // Recharger pour avoir les données à jour
      const updated = await ExerciceComptable.findByPk(exercice.id)

      return res.status(200).send(updated)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }
}
