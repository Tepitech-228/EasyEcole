import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../core/helpers/DatabaseConnection')

jest.mock('../../../modules/inscription/models/PresenceCoursParticipant', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  return { PresenceCoursParticipant: Mock }
})

import PresenceController from '../../../modules/inscription/controllers/PresenceController'

jest.mock('../../../modules/inscription/models/Presence', () => {
  const Mock: any = jest.fn(() => ({ save: jest.fn().mockResolvedValue(undefined) }))
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.findAndCountAll = jest.fn()
  Mock.associations = { presencesCoursParticipants: 'presencesCoursParticipants', listePresence: 'listePresence' }
  return { Presence: Mock }
})

const { Presence } = require('../../../modules/inscription/models/Presence')
beforeEach(() => { jest.clearAllMocks() })

describe('PresenceController.getAllPresences', () => {
  it('retourne 200', async () => {
    ;(Presence.findAll as jest.Mock).mockResolvedValue([{ id: 1 }])
    const res = mockResponse()
    await PresenceController.getAllPresences(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    ;(Presence.findAll as jest.Mock).mockRejectedValue(new Error('err'))
    const res = mockResponse()
    await PresenceController.getAllPresences(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('PresenceController.getPresence', () => {
  it('retourne 200 si trouvé', async () => {
    ;(Presence.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await PresenceController.getPresence(mockRequest({ params: { id: '1' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Presence.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await PresenceController.getPresence(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('PresenceController.createPresence', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await PresenceController.createPresence(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si ADMIN', async () => {
    const res = mockResponse()
    await PresenceController.createPresence(mockRequest({ utilisateurRole: 'admin' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 400 si doublon date/heure', async () => {
    ;(Presence.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await PresenceController.createPresence(mockRequest({ utilisateurRole: 'institution', body: { date: '2026-01-01' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ alreadyExists: true })
  })
  it('crée et retourne 201', async () => {
    ;(Presence.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await PresenceController.createPresence(mockRequest({ utilisateurRole: 'institution', body: { date: '2026-01-01' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(201)
  })
})

describe('PresenceController.updatePresence', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await PresenceController.updatePresence(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Presence.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await PresenceController.updatePresence(mockRequest({ utilisateurRole: 'institution', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(Presence.findOne as jest.Mock).mockResolvedValue({ id: 1, update: up })
    const res = mockResponse()
    await PresenceController.updatePresence(mockRequest({ utilisateurRole: 'institution', params: { id: '1' }, body: { date: '2026-02-01' } } as any), res)
    expect(up).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('PresenceController.deletePresence', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await PresenceController.deletePresence(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Presence.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await PresenceController.deletePresence(mockRequest({ utilisateurRole: 'institution', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(Presence.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await PresenceController.deletePresence(mockRequest({ utilisateurRole: 'institution', params: { id: '1' } } as any), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
