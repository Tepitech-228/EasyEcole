import { Request, Response } from "express";
import { JournalComptable } from "../models/JournalComptable";

export default class JournalComptableController {
  constructor() { }

  static async getAllJournaux(req: Request, res: Response): Promise<Response> {
    try {
      const journaux = await JournalComptable.findAll({
        where: { actif: true },
        order: [['code', 'ASC']]
      })
      return res.status(200).send(journaux)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  static async getJournal(req: Request, res: Response): Promise<Response> {
    try {
      const journal = await JournalComptable.findByPk(req.params.id)
      if (!journal) {
        return res.status(404).json({ success: false, message: "Journal non trouvé" })
      }
      return res.status(200).send(journal)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  static async createJournal(req: Request, res: Response): Promise<Response> {
    try {
      const { code, libelle, type, description } = req.body
      if (!code || !libelle || !type) {
        return res.status(400).json({ success: false, message: "Champs obligatoires manquants" })
      }

      const journal = await JournalComptable.create({
        code,
        libelle,
        type,
        description,
        actif: true
      })

      return res.status(201).send(journal)
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: "Ce code de journal existe déjà" })
      }
      return res.status(500).json({ success: false, error: error })
    }
  }
}
