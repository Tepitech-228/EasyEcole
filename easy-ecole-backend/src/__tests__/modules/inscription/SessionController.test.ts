import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Session', () => {
  const Session: any = jest.fn()
  Session.findAll = jest.fn()
  Session.findOne = jest.fn()
  Session.create = jest.fn()
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
  return { FraisInscription }
})

jest.mock('../../../modules/inscription/models/DossierInscription', () => {
  const DossierInscription: any = jest.fn()
  DossierInscription.create = jest.fn()
  return { DossierInscription }
})

jest.mock('../../../config/database', () => ({
  sequelize: { transaction: jest.fn() }
}))

const { Session } = require('../../../modules/inscription/models/Session')
const { FraisInscription } = require('../../../modules/inscription/models/FraisInscription')
const { DossierInscription } = require('../../../modules/inscription/models/DossierInscription')
const { sequelize } = require('../../../config/database')
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
        include: [
          { association: 'niveauEtude' },
          { association: 'anneeAcademique' }
        ]
      })
    )
    expect(res.json).toHaveBeenCalledWith(mockData)
  })
})

describe('getSession', () => {
  it('should return session with all nested includes', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(Session.findByPk as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getSession(req, res)

    expect(Session.findByPk).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        include: [
          { association: 'niveauEtude' },
          { association: 'anneeAcademique' },
          { association: 'fraisInscription' },
          { association: 'dossiersInscription' },
          { association: 'demandesInscription' }
        ]
      })
    )
    expect(res.json).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Session.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.getSession(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createSession', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.createSession(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should create session with transaction including FraisInscription and DossierInscription', async () => {
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() }
    ;(sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction)
    ;(Session.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(FraisInscription.create as jest.Mock).mockResolvedValue({})
    ;(DossierInscription.create as jest.Mock).mockResolvedValue({})

    const req = mockRequest({
      body: {
        libelle: 'Session 2025',
        frais: { montant: 50000 },
        dossier: { pieces: ['releve'] }
      },
      utilisateur: { role: 'AD' }
    })
    const res = mockResponse()

    await Ctrl.createSession(req, res)

    expect(sequelize.transaction).toHaveBeenCalled()
    expect(Session.create).toHaveBeenCalledWith(expect.any(Object), { transaction: mockTransaction })
    expect(FraisInscription.create).toHaveBeenCalledWith(expect.any(Object), { transaction: mockTransaction })
    expect(DossierInscription.create).toHaveBeenCalledWith(expect.any(Object), { transaction: mockTransaction })
    expect(mockTransaction.commit).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('updateSession', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.updateSession(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Session.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateSession(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const existing = { id: 1, save: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, body: { libelle: 'Updated' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Session.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.updateSession(req, res)

    expect(existing.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteSession', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.deleteSession(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Session.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteSession(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockSession = { id: 1, destroy: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Session.findByPk as jest.Mock).mockResolvedValue(mockSession)

    await Ctrl.deleteSession(req, res)

    expect(mockSession.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for authorized roles', async () => {
    const req = mockRequest({ utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Session.findAndCountAll as jest.Mock).mockResolvedValue({ count: 5 })

    await Ctrl.getCount(req, res)

    expect(Session.findAndCountAll).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ count: 5 })
  })
})
