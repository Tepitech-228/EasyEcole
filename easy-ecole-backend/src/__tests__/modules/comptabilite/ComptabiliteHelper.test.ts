import { mockRequest } from '../../helpers/express-mocks'

jest.mock('../../../modules/comptabilite/models/EcritureComptable', () => {
  const Mock: any = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  Mock.update = jest.fn()
  Mock.findAll = jest.fn()
  return { EcritureComptable: Mock }
})

jest.mock('../../../modules/comptabilite/models/JournalComptable', () => {
  const Mock: any = jest.fn()
  Mock.findOne = jest.fn()
  return { JournalComptable: Mock }
})

jest.mock('../../../modules/comptabilite/models/Compte', () => {
  const Mock: any = jest.fn()
  Mock.findOne = jest.fn()
  return { Compte: Mock }
})

jest.mock('../../../modules/comptabilite/models/ExerciceComptable', () => {
  const Mock: any = jest.fn()
  Mock.findOne = jest.fn()
  return { ExerciceComptable: Mock }
})

jest.mock('../../../core/helpers/DatabaseConnection', () => ({
  DatabaseConnection: {
    getInstance: () => ({
      sequelize: { transaction: jest.fn() }
    })
  }
}))

const { EcritureComptable } = require('../../../modules/comptabilite/models/EcritureComptable')
const { Compte } = require('../../../modules/comptabilite/models/Compte')
const { JournalComptable } = require('../../../modules/comptabilite/models/JournalComptable')
const { ExerciceComptable } = require('../../../modules/comptabilite/models/ExerciceComptable')
const { creerEcritureComptable, lettrerEcritures411 } = require('../../../modules/comptabilite/helpers/ComptabiliteHelper')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('creerEcritureComptable', () => {
  it('crée une écriture avec les bons comptes débit/crédit', async () => {
    const req = mockRequest({ utilisateurId: 1 })
    const exercice = { id: 1 }
    const journal = { id: 1, code: 'VEN' }
    const compteDebit = { id: 10, numero: '411' }
    const compteCredit = { id: 20, numero: '702100' }

    ;(ExerciceComptable.findOne as jest.Mock).mockResolvedValue(exercice)
    ;(JournalComptable.findOne as jest.Mock).mockResolvedValue(journal)
    ;(Compte.findOne as jest.Mock).mockResolvedValueOnce(compteDebit).mockResolvedValueOnce(compteCredit)
    ;(EcritureComptable.count as jest.Mock).mockResolvedValue(5)
    ;(EcritureComptable.create as jest.Mock).mockResolvedValue({ id: 1 })

    const result = await creerEcritureComptable({
      req,
      journalCode: 'VEN',
      compteDebitNumero: '411',
      compteCreditNumero: '702100',
      montant: 50000,
      libelle: 'Frais d inscription',
      reference: 'ESA-2024-001',
      moduleSource: 'inscription',
      referenceModuleId: '42'
    })

    expect(JournalComptable.findOne).toHaveBeenCalledWith({ where: { code: 'VEN' }, transaction: undefined })
    expect(Compte.findOne).toHaveBeenCalledWith({ where: { numero: '411' }, transaction: undefined })
    expect(Compte.findOne).toHaveBeenCalledWith({ where: { numero: '702100' }, transaction: undefined })
    expect(EcritureComptable.create).toHaveBeenCalledWith(
      expect.objectContaining({
        journalId: 1,
        exerciceId: 1,
        numeroEcriture: 'VEN00006',
        compteDebitId: 10,
        compteCreditId: 20,
        montant: 50000,
        libelle: 'Frais d inscription',
        moduleSource: 'inscription',
        referenceModuleId: '42',
        validee: false
      }),
      { transaction: undefined }
    )
    expect(result.id).toBe(1)
  })

  it('lance une erreur si le journal est introuvable', async () => {
    const req = mockRequest({ utilisateurId: 1 })
    ;(ExerciceComptable.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    ;(JournalComptable.findOne as jest.Mock).mockResolvedValue(null)

    await expect(creerEcritureComptable({
      req,
      journalCode: 'VEN',
      compteDebitNumero: '411',
      compteCreditNumero: '702',
      montant: 100,
      libelle: 'Test'
    })).rejects.toThrow('Journal comptable introuvable')
  })

  it('lance une erreur si le compte débit est introuvable', async () => {
    const req = mockRequest({ utilisateurId: 1 })
    ;(ExerciceComptable.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    ;(JournalComptable.findOne as jest.Mock).mockResolvedValue({ id: 1, code: 'VEN' })
    ;(Compte.findOne as jest.Mock).mockResolvedValueOnce(null)

    await expect(creerEcritureComptable({
      req,
      journalCode: 'VEN',
      compteDebitNumero: '999',
      compteCreditNumero: '702',
      montant: 100,
      libelle: 'Test'
    })).rejects.toThrow('Compte débit introuvable')
  })
})

describe('lettrerEcritures411', () => {
  it('lettre les écritures débit et crédit 411 pour le même étudiant', async () => {
    const compte411 = { id: 1, numero: '411' }
    const ecritureDebit = { id: 100, update: jest.fn().mockResolvedValue(true) }
    const ecritureCredit = { id: 200, update: jest.fn().mockResolvedValue(true) }

    ;(Compte.findOne as jest.Mock).mockResolvedValue(compte411)
    ;(EcritureComptable.findOne as jest.Mock)
      .mockResolvedValueOnce(ecritureDebit)
      .mockResolvedValueOnce(ecritureCredit)

    const result = await lettrerEcritures411({
      referenceModuleId: '42',
      paiementId: '100',
      montant: 50000
    })

    expect(Compte.findOne).toHaveBeenCalledWith({ where: { numero: '411' }, transaction: undefined })
    expect(EcritureComptable.findOne).toHaveBeenCalledWith({
      where: {
        compteDebitId: 1,
        moduleSource: 'inscription',
        referenceModuleId: '42',
        validee: true,
        lettre: null
      },
      transaction: undefined
    })
    expect(EcritureComptable.findOne).toHaveBeenCalledWith({
      where: {
        compteCreditId: 1,
        moduleSource: 'inscription',
        referenceModuleId: '100',
        validee: true,
        lettre: null
      },
      transaction: undefined
    })
    expect(ecritureDebit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        lettre: 'L000100',
        dateLettrage: expect.any(Date)
      }),
      { transaction: undefined }
    )
    expect(ecritureCredit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        lettre: 'L000100',
        dateLettrage: expect.any(Date)
      }),
      { transaction: undefined }
    )
    expect(result).toBe(true)
  })

  it('retourne false si le compte 411 est introuvable', async () => {
    ;(Compte.findOne as jest.Mock).mockResolvedValue(null)

    const result = await lettrerEcritures411({
      referenceModuleId: '42',
      paiementId: '100',
      montant: 50000
    })

    expect(result).toBe(false)
  })

  it('retourne false si aucune écriture débit 411 trouvée', async () => {
    const compte411 = { id: 1, numero: '411' }
    ;(Compte.findOne as jest.Mock).mockResolvedValue(compte411)
    ;(EcritureComptable.findOne as jest.Mock).mockResolvedValueOnce(null)

    const result = await lettrerEcritures411({
      referenceModuleId: '42',
      paiementId: '100',
      montant: 50000
    })

    expect(result).toBe(false)
  })

  it('retourne false si aucune écriture crédit 411 trouvée', async () => {
    const compte411 = { id: 1, numero: '411' }
    const ecritureDebit = { id: 100, update: jest.fn().mockResolvedValue(true) }
    ;(Compte.findOne as jest.Mock).mockResolvedValue(compte411)
    ;(EcritureComptable.findOne as jest.Mock)
      .mockResolvedValueOnce(ecritureDebit)
      .mockResolvedValueOnce(null)

    const result = await lettrerEcritures411({
      referenceModuleId: '42',
      paiementId: '100',
      montant: 50000
    })

    expect(result).toBe(false)
  })

  it('retourne false si les écritures sont déjà lettrées', async () => {
    const compte411 = { id: 1, numero: '411' }
    ;(Compte.findOne as jest.Mock).mockResolvedValue(compte411)
    ;(EcritureComptable.findOne as jest.Mock).mockResolvedValueOnce(null)

    const result = await lettrerEcritures411({
      referenceModuleId: '42',
      paiementId: '100',
      montant: 50000
    })

    expect(result).toBe(false)
  })
})
