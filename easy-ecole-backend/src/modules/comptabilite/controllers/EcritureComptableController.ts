import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { EcritureComptable } from "../models/EcritureComptable";
import { JournalComptable } from "../models/JournalComptable";
import { Compte } from "../models/Compte";
import { Utilisateur } from "../../auth/models/Utilisateur";

export default class EcritureComptableController {
  constructor() { }

  /**
   * Récupère toutes les écritures comptables
   */
  static async getAllEcritures(req: Request, res: Response): Promise<Response> {
    try {
      let options: FindOptions<InferAttributes<EcritureComptable>> = {
        include: [
          { association: 'journal', attributes: ['id', 'code', 'libelle', 'type'] },
          { association: 'compteDebit', attributes: ['id', 'numero', 'libelle'] },
          { association: 'compteCredit', attributes: ['id', 'numero', 'libelle'] },
          { association: 'utilisateurSaisie', attributes: ['id', 'nom', 'prenoms'] },
          { association: 'utilisateurValidation', attributes: ['id', 'nom', 'prenoms'] }
        ],
        order: [['dateEcriture', 'DESC']]
      }

      // Filtres optionnels
      if (req.query.journalId) {
        options.where = { ...options.where, journalId: String(req.query.journalId) }
      }
      if (req.query.dateDebut || req.query.dateFin) {
        const dateDebut = req.query.dateDebut ? new Date(req.query.dateDebut as string) : new Date('2000-01-01')
        const dateFin = req.query.dateFin ? new Date(req.query.dateFin as string) : new Date()
        options.where = { ...options.where, dateEcriture: { [Op.between]: [dateDebut, dateFin] } }
      }
      if (req.query.validee !== undefined) {
        options.where = { ...options.where, validee: req.query.validee === 'true' }
      }

      const ecritures = await EcritureComptable.findAll(options)
      return res.status(200).send(ecritures)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Récupère une écriture par ID
   */
  static async getEcriture(req: Request, res: Response): Promise<Response> {
    try {
      const ecriture = await EcritureComptable.findByPk(req.params.id, {
        include: [
          { association: 'journal' },
          { association: 'compteDebit' },
          { association: 'compteCredit' },
          { association: 'utilisateurSaisie' },
          { association: 'utilisateurValidation' }
        ]
      })

      if (!ecriture) {
        return res.status(404).json({ success: false, message: "Écriture non trouvée" })
      }

      return res.status(200).send(ecriture)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Crée une nouvelle écriture comptable
   */
  static async createEcriture(req: Request, res: Response): Promise<Response> {
    try {
      const {
        journalId, numeroEcriture, dateEcriture, dateComptable,
        compteDebitId, compteCreditId, montant, libelle,
        reference, moduleSource, referenceModuleId
      } = req.body

      // Validations
      if (!journalId || !dateEcriture || !compteDebitId || !compteCreditId || !montant || !libelle) {
        return res.status(400).json({ success: false, message: "Champs obligatoires manquants" })
      }

      if (compteDebitId === compteCreditId) {
        return res.status(400).json({ success: false, message: "Compte débit et crédit doivent être différents" })
      }

      // Génère un numéro d'écriture s'il n'est pas fourni
      let numEcriture = numeroEcriture
      if (!numEcriture) {
        const journal = await JournalComptable.findByPk(journalId)
        const count = await EcritureComptable.count({ where: { journalId } })
        numEcriture = `${journal?.code}${String(count + 1).padStart(5, '0')}`
      }

      const ecriture = await EcritureComptable.create({
        journalId,
        numeroEcriture: numEcriture,
        dateEcriture: new Date(dateEcriture),
        dateComptable: dateComptable ? new Date(dateComptable) : new Date(dateEcriture),
        compteDebitId,
        compteCreditId,
        montant,
        libelle,
        reference,
        moduleSource,
        referenceModuleId,
        utilisateurSaisieId: (req as any).utilisateurId,
        validee: false
      })

      const result = await EcritureComptable.findByPk(ecriture.id, {
        include: [
          { association: 'journal' },
          { association: 'compteDebit' },
          { association: 'compteCredit' },
          { association: 'utilisateurSaisie' }
        ]
      })

      return res.status(201).send(result)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Valide une écriture comptable
   */
  static async validerEcriture(req: Request, res: Response): Promise<Response> {
    try {
      const ecriture = await EcritureComptable.findByPk(req.params.id)
      if (!ecriture) {
        return res.status(404).json({ success: false, message: "Écriture non trouvée" })
      }

      if (ecriture.validee) {
        return res.status(400).json({ success: false, message: "Écriture déjà validée" })
      }

      ecriture.validee = true
      ecriture.utilisateurValidationId = (req as any).utilisateurId
      ecriture.dateValidation = new Date()

      await ecriture.save()

      const result = await EcritureComptable.findByPk(ecriture.id, {
        include: [
          { association: 'journal' },
          { association: 'compteDebit' },
          { association: 'compteCredit' },
          { association: 'utilisateurValidation' }
        ]
      })

      return res.status(200).send(result)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Récupère le grand livre (toutes les opérations d'un compte)
   */
  static async getGrandLivre(req: Request, res: Response): Promise<Response> {
    try {
      const compteId = req.params.compteId
      const compte = await Compte.findByPk(compteId)
      if (!compte) {
        return res.status(404).json({ success: false, message: "Compte non trouvé" })
      }

      const ecritures = await EcritureComptable.findAll({
        where: {
          [Op.or]: [
            { compteDebitId: compteId },
            { compteCreditId: compteId }
          ],
          validee: true
        },
        include: [
          { association: 'journal' },
          { association: 'compteDebit', attributes: ['numero', 'libelle'] },
          { association: 'compteCredit', attributes: ['numero', 'libelle'] }
        ],
        order: [['dateEcriture', 'ASC']]
      })

      // Calcule les soldes
      let soldeDebit = 0
      let soldeCredit = 0
      const mouvements = ecritures.map(e => {
        const isDebit = e.compteDebitId == compteId
        if (isDebit) soldeDebit += e.montant
        else soldeCredit += e.montant

        return {
          ...e.toJSON(),
          typeEcriture: isDebit ? 'D' : 'C'
        }
      })

      return res.status(200).json({
        compte,
        mouvements,
        soldeDebit,
        soldeCredit,
        solde: soldeDebit - soldeCredit
      })
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }

  /**
   * Récupère la balance comptable
   */
  static async getBalance(req: Request, res: Response): Promise<Response> {
    try {
      const ecritures = await EcritureComptable.findAll({
        where: { validee: true },
        include: [
          { association: 'compteDebit', attributes: ['id', 'numero', 'libelle', 'classe'] },
          { association: 'compteCredit', attributes: ['id', 'numero', 'libelle', 'classe'] }
        ]
      })

      // Agrège par compte
      const balances: any = {}
      ecritures.forEach(e => {
        // Compte débit
        if (!balances[e.compteDebitId]) {
          balances[e.compteDebitId] = {
            compte: e.compteDebit,
            debit: 0,
            credit: 0
          }
        }
        balances[e.compteDebitId].debit += e.montant

        // Compte crédit
        if (!balances[e.compteCreditId]) {
          balances[e.compteCreditId] = {
            compte: e.compteCredit,
            debit: 0,
            credit: 0
          }
        }
        balances[e.compteCreditId].credit += e.montant
      })

      const resultat = Object.values(balances)
        .sort((a: any, b: any) => a.compte.numero.localeCompare(b.compte.numero))

      return res.status(200).json(resultat)
    } catch (error) {
      return res.status(500).json({ success: false, error: error })
    }
  }
}
