import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Session', () => {
  const Session: any = jest.fn()
  Session.findAll = jest.fn()
  Session.findOne = jest.fn()
  Session.create = jest.fn()
  Session.count = jest.fn()
  Session.findAndCountAll = jest.fn()
  Session.findByPk = jest.fn()
  Session.associations = {
    niveauEtude: 'niveauEtude',
    anneeAcademique: 'anneeAcademique',
    fraisInscription: 'fraisInscription',
    dossiersInscription: 'dossiersInscription',
    demandesInscription: 'demandesInscription'
  }
  return { Session }
})

jest.mock('../../../modules/inscription/models/FraisInscription', () => {
  const FraisInscription: any = jest.fn()
  FraisInscription.create = jest.fn()
  FraisInscription.findOne = jest.fn()
  return { FraisInscription }
})

jest.mock('../../../modules/inscription/models/DossierInscription', () => {
  const DossierInscription: any = jest.fn()
  DossierInscription.create = jest.fn()
  DossierInscription.findOne = jest.fn()
  return { DossierInscription }
})

jest.mock('../../../core/helpers/DatabaseConnection', () => {
  const { Sequelize } = require('sequelize')
  const sequelize = new Sequelize({
    database: 'easyecole_test',
    username: 'root',
    password: '',
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    logging: false,
  })
  sequelize.transaction = jest.fn()
  return { DatabaseConnection: { instance: null, getInstance: jest.fn(() => ({ sequelize })) } }
})

const { Session } = require('../../../modules/inscription/models/Session')
const { FraisInscription } = require('../../../modules/inscription/models/FraisInscription')
const { DossierInscription } = require('../../../modules/inscription/models/DossierInscription')
const { DatabaseConnection } = require('../../../core/helpers/DatabaseConnection')
const sequelize = DatabaseConnection.getInstance().sequelize
import Ctrl from '../../../modules/inscription/controllers/SessionController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllSessions', () => {
  it('should return all sessions with niveauEtude and anneeAcademique', async () => {
    const req = mockRequest({})
    const res = mockResponse()
    const mockData = [{ id: 1 }]
    ;(Session.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllSessions(req, res)

    expect(Session.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: ['niveauEtude', 'anneeAcademique']
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })
})

describe('getSession', () => {
  it('should return session with all nested includes', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(Session.findOne as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getSession(req, res)

    expect(Session.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        include: [
          'niveauEtude',
          'anneeAcademique',
          'fraisInscription',
          'dossiersInscription',
          expect.objectContaining({ association: 'demandesInscription' })
        ]
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Session.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.getSession(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createSession', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.createSession(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should create session with transaction including FraisInscription and DossierInscription', async () => {
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() }
    ;(sequelize.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(mockTransaction))
    ;(Session.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(FraisInscription.create as jest.Mock).mockResolvedValue({})
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DossierInscription.create as jest.Mock).mockResolvedValue({})

    const req = mockRequest({
      body: {
        libelle: 'Session 2025',
        frais: [{ titre: 'Frais Inscription', montant: 50000 }],
        dossiers: [{ titre: 'Dossier Inscription' }]
      },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()

    await Ctrl.createSession(req, res)

    expect(sequelize.transaction).toHaveBeenCalled()
    expect(Session.create).toHaveBeenCalledWith(expect.any(Object), { transaction: mockTransaction })
    expect(FraisInscription.findOne).toHaveBeenCalled()
    expect(FraisInscription.create).toHaveBeenCalledWith(expect.any(Object), { transaction: mockTransaction })
    expect(DossierInscription.findOne).toHaveBeenCalled()
    expect(DossierInscription.create).toHaveBeenCalledWith(expect.any(Object), { transaction: mockTransaction })
    expect(res.status).toHaveBeenCalledWith(201)
  })
})

describe('updateSession', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.updateSession(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Session.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateSession(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({})
    const existing = { id: 1, update: mockUpdate }
    const req = mockRequest({ params: { id: '1' }, body: { libelle: 'Updated' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Session.findOne as jest.Mock).mockResolvedValue(existing)

    await Ctrl.updateSession(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteSession', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.deleteSession(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Session.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteSession(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockSession = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Session.findOne as jest.Mock).mockResolvedValue(mockSession)

    await Ctrl.deleteSession(req, res)

    expect(mockSession.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for authorized roles', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Session.count as jest.Mock).mockResolvedValue(5)

    await Ctrl.getCount(req, res)

    expect(Session.count).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 })
  })
})