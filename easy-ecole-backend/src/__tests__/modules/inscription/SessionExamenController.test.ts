import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/SessionExamen', () => {
  const SessionExamen: any = jest.fn()
  SessionExamen.findAll = jest.fn()
  SessionExamen.findByPk = jest.fn()
  SessionExamen.create = jest.fn()
  SessionExamen.associations = { classe: 'classe', classesCibles: 'classesCibles', anneeAcademique: 'anneeAcademique' }
  return { SessionExamen }
})

jest.mock('../../../modules/inscription/models/AnneeAcademique', () => ({
  AnneeAcademique: { findByPk: jest.fn() }
}))

jest.mock('../../../modules/inscription/models/Classe', () => ({
  Classe: { findByPk: jest.fn(), findAll: jest.fn(), associations: { etablissement: 'etablissement' } }
}))

jest.mock('../../../modules/inscription/models/SessionExamenClasse', () => ({
  SessionExamenClasse: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
    findOrCreate: jest.fn()
  }
}))

jest.mock('../../../modules/inscription/models/SessionCorrecteur', () => ({
  SessionCorrecteur: {
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
    associations: { cours: 'cours', enseignant: 'enseignant' }
  }
}))

jest.mock('../../../modules/inscription/models/Cours', () => ({
  Cours: { findAll: jest.fn(), associations: { classe: 'classe' } }
}))

jest.mock('../../../modules/inscription/models/CursusApprenant', () => ({
  CursusApprenant: { findAll: jest.fn(), associations: { classe: 'classe' } }
}))

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: { findAll: jest.fn(), associations: { utilisateur: 'utilisateur' } }
}))

jest.mock('../../../core/helpers/DatabaseConnection', () => {
  const sequelize = { transaction: jest.fn() }
  return { DatabaseConnection: { getInstance: jest.fn(() => ({ sequelize })) } }
})

const { SessionExamen } = require('../../../modules/inscription/models/SessionExamen')
const { AnneeAcademique } = require('../../../modules/inscription/models/AnneeAcademique')
const { Classe } = require('../../../modules/inscription/models/Classe')
const { SessionExamenClasse } = require('../../../modules/inscription/models/SessionExamenClasse')
const { SessionCorrecteur } = require('../../../modules/inscription/models/SessionCorrecteur')
const { Cours } = require('../../../modules/inscription/models/Cours')
const { Enseignant } = require('../../../modules/auth/models/Enseignant')
const { DatabaseConnection } = require('../../../core/helpers/DatabaseConnection')
import Controller from '../../../modules/inscription/controllers/SessionExamenController'

const sequelize = DatabaseConnection.getInstance().sequelize

beforeEach(() => {
  jest.clearAllMocks()
  Classe.findAll.mockResolvedValue([])
  SessionExamenClasse.findAll.mockResolvedValue([])
  sequelize.transaction.mockImplementation(async (callback: (value: any) => Promise<any>) => callback({ id: 'transaction' }))
})

describe('SessionExamenController CRUD', () => {
  it('rejects invalid session data before writing', async () => {
    const req = mockRequest({
      body: { libelle: 'Session', type: 'incorrect', classeId: 1, anneeAcademiqueId: 2, semestre: 'semestre1' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Controller.create(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(SessionExamen.create).not.toHaveBeenCalled()
  })

  it('does not allow the secretariat to create an exam session', async () => {
    const req = mockRequest({
      body: { libelle: 'Session', type: 'normale', classeId: 1, anneeAcademiqueId: 2, semestre: 'semestre1' },
      utilisateurRole: 'institution'
    } as any)
    const res = mockResponse()

    await Controller.create(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(SessionExamen.create).not.toHaveBeenCalled()
  })

  it('whitelists update properties and checks referenced records', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    SessionExamen.findByPk.mockResolvedValue({ id: 7, statut: 'brouillon', classeId: 3, anneeAcademiqueId: 4, update })
    Classe.findAll.mockResolvedValue([{ id: 3 }])
    AnneeAcademique.findByPk.mockResolvedValue({ id: 4 })
    const req = mockRequest({
      params: { id: '7' },
      body: { libelle: ' Session modifiée ', statut: 'publie', id: 99, deletedAt: new Date(), utilisateurId: 10 },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Controller.update(req, res)

    expect(update).toHaveBeenCalledWith({ libelle: 'Session modifiée', classeId: 3 }, { transaction: { id: 'transaction' } })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('creates paired normal and catch-up sessions inside one transaction', async () => {
    const transaction = { id: 'transaction' }
    sequelize.transaction.mockImplementation(async (callback: (value: any) => Promise<any>) => callback(transaction))
    Classe.findByPk.mockResolvedValue({ id: 3, libelle: 'L1' })
    Classe.findAll.mockResolvedValue([{ id: 3 }])
    AnneeAcademique.findByPk.mockResolvedValue({ id: 4, libelle: '2025-2026' })
    SessionExamen.create.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 2 })
    const req = mockRequest({
      body: { classeId: 3, anneeAcademiqueId: 4, semestre: 'semestre1' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Controller.creerPaire(req, res)

    expect(SessionExamen.create).toHaveBeenCalledTimes(2)
    expect(SessionExamen.create.mock.calls[0][0]).toEqual(expect.objectContaining({ statut: 'brouillon', datePublication: null }))
    expect(SessionExamen.create.mock.calls[1][0]).toEqual(expect.objectContaining({ statut: 'brouillon', datePublication: null }))
    expect(SessionExamen.create.mock.calls[0][1]).toEqual({ transaction })
    expect(SessionExamen.create.mock.calls[1][1]).toEqual({ transaction })
    expect(SessionExamenClasse.bulkCreate).toHaveBeenCalledWith([
      { sessionExamenId: 1, classeId: 3 },
      { sessionExamenId: 2, classeId: 3 }
    ], { transaction })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('creates one session for several active classes in a single transaction', async () => {
    const transaction = { id: 'transaction' }
    sequelize.transaction.mockImplementation(async (callback: (value: any) => Promise<any>) => callback(transaction))
    Classe.findAll.mockResolvedValue([{ id: 3 }, { id: 5 }])
    AnneeAcademique.findByPk.mockResolvedValue({ id: 4 })
    SessionExamen.create.mockResolvedValue({ id: 12 })
    const req = mockRequest({
      body: { libelle: 'Session multisite', type: 'normale', classeIds: [3, 5], anneeAcademiqueId: 4, semestre: 'semestre1' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Controller.create(req, res)

    expect(SessionExamen.create).toHaveBeenCalledWith(expect.objectContaining({ classeId: 3 }), { transaction })
    expect(SessionExamenClasse.bulkCreate).toHaveBeenCalledWith([
      { sessionExamenId: 12, classeId: 3 },
      { sessionExamenId: 12, classeId: 5 }
    ], { transaction })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('publishes a draft only through the publication action', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    SessionExamen.findByPk.mockResolvedValue({ id: 7, statut: 'brouillon', update })
    const req = mockRequest({
      params: { id: '7' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Controller.publier(req, res)

    expect(update).toHaveBeenCalledWith({
      statut: 'publie',
      datePublication: expect.any(Date)
    })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('does not delete a published session', async () => {
    SessionExamen.findByPk.mockResolvedValue({ id: 7, statut: 'publie', destroy: jest.fn() })
    const req = mockRequest({
      params: { id: '7' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Controller.delete(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('does not delete existing correctors for an invalid replacement payload', async () => {
    SessionExamen.findByPk.mockResolvedValue({ id: 7, classeId: 3 })
    const req = mockRequest({
      params: { id: '7' },
      body: { correcteurs: [{ coursId: 'bad', enseignantId: 12 }] },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Controller.saveCorrecteurs(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(SessionCorrecteur.destroy).not.toHaveBeenCalled()
  })

  it('allows clearing all correctors atomically', async () => {
    const transaction = { commit: jest.fn(), rollback: jest.fn() }
    sequelize.transaction.mockResolvedValue(transaction)
    SessionExamen.findByPk.mockResolvedValue({ id: 7, classeId: 3 })
    SessionCorrecteur.destroy.mockResolvedValue(2)
    const req = mockRequest({
      params: { id: '7' },
      body: { correcteurs: [] },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Controller.saveCorrecteurs(req, res)

    expect(SessionCorrecteur.destroy).toHaveBeenCalledWith({
      where: { sessionExamenId: 7 },
      transaction
    })
    expect(SessionCorrecteur.bulkCreate).not.toHaveBeenCalled()
    expect(transaction.commit).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
