import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/communication/models/Communication', () => {
  const Communication: any = jest.fn(function (this: any) {
    this.id = 14
    this.save = jest.fn().mockResolvedValue(this)
  })
  Communication.findAll = jest.fn()
  Communication.findOne = jest.fn()
  Communication.findByPk = jest.fn()
  Communication.count = jest.fn()
  return { Communication }
})

jest.mock('../../../modules/auth/models/Utilisateur', () => ({ Utilisateur: jest.fn() }))

const { Communication } = require('../../../modules/communication/models/Communication')
import CommunicationController from '../../../modules/communication/controllers/CommunicationController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('CommunicationController', () => {
  it('limite la liste des apprenants aux communications publiées qui les ciblent', async () => {
    const items = [{ id: '1', titre: 'Annonce' }]
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()
    Communication.findAll.mockResolvedValue(items)

    await CommunicationController.getAllCommunications(req, res)

    const options = Communication.findAll.mock.calls[0][0]
    expect(options.where.statut).toBe('publiee')
    expect(options.where.cible).toEqual(expect.objectContaining({ [require('sequelize').Op.in]: ['tous', 'apprenants'] }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(items)
  })

  it('refuse la création par un rôle qui ne peut pas publier', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', body: { titre: 'Annonce' } } as any)
    const res = mockResponse()

    await CommunicationController.createCommunication(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(Communication.findByPk).not.toHaveBeenCalled()
  })

  it('crée et relit une communication pour un utilisateur institutionnel', async () => {
    const req = mockRequest({
      utilisateurRole: 'institution',
      utilisateurId: 42,
      body: { titre: 'Rentrée', contenu: 'La rentrée est lundi.' }
    } as any)
    const res = mockResponse()
    const saved = { id: 14, titre: 'Rentrée' }
    Communication.findByPk.mockResolvedValue(saved)

    await CommunicationController.createCommunication(req, res)

    expect(Communication.findByPk).toHaveBeenCalledWith(14, expect.objectContaining({ include: expect.any(Array) }))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
    expect(Communication.mock.instances[0].titre).toBe('Rentrée')
    expect(Communication.mock.instances[0].statut).toBe('publiee')
    expect(Communication.mock.instances[0].cible).toBe('tous')
    expect(Communication.mock.instances[0].utilisateurId).toBe(42)
  })

  it('retourne 404 si la communication à modifier est absente', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: 'absent' } } as any)
    const res = mockResponse()
    Communication.findOne.mockResolvedValue(null)

    await CommunicationController.updateCommunication(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
  })

  it('retourne 500 si le décompte échoue', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    Communication.count.mockRejectedValue(new Error('database unavailable'))

    await CommunicationController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
