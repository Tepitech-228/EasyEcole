import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import FraisInscriptionController from '../../../modules/inscription/controllers/FraisInscriptionController'

jest.mock('../../../modules/inscription/models/FraisInscription', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { FraisInscription: Mock }
})

const { FraisInscription } = require('../../../modules/inscription/models/FraisInscription')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('FraisInscriptionController.getAllFraisInscription', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, titre: 'Frais 2024' }]
    ;(FraisInscription.findAll as jest.Mock).mockResolvedValue(fakeList)

    await FraisInscriptionController.getAllFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(FraisInscription.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await FraisInscriptionController.getAllFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('FraisInscriptionController.getFraisInscription', () => {
  it('retourne 200 si trouvé', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, titre: 'Frais 2024' }
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue(fake)

    await FraisInscriptionController.getFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue(null)

    await FraisInscriptionController.getFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(FraisInscription.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await FraisInscriptionController.getFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('FraisInscriptionController.createFraisInscription', () => {
  it('retourne 403 si pas INSTITUTION', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await FraisInscriptionController.createFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 403 si ENSEIGNANT', async () => {
    const req = mockRequest({ utilisateurRole: 'enseignant' } as any)
    const res = mockResponse()

    await FraisInscriptionController.createFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', body: { titre: 'Frais1', sessionId: 's1' } } as any)
    const res = mockResponse()
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, titre: 'Frais1' })

    await FraisInscriptionController.createFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ alreadyExists: true })
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', body: { titre: 'Nouveau', description: 'Desc', montant: 5000, fraisDesCours: 2000, sessionId: 's1' } } as any)
    const res = mockResponse()
    const saved = { id: 1, titre: 'Nouveau' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(FraisInscription as jest.Mock).mockReturnValue({ save: mockSave })

    await FraisInscriptionController.createFraisInscription(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', body: { titre: 'Nouveau', sessionId: 's1' } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(FraisInscription as jest.Mock).mockReturnValue({ save: mockSave })

    await FraisInscriptionController.createFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('FraisInscriptionController.updateFraisInscription', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await FraisInscriptionController.updateFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue(null)

    await FraisInscriptionController.updateFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 400 si doublon sur titre+sessionId', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { titre: 'Pris', sessionId: 's1' } } as any)
    const res = mockResponse()
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, titre: 'Ancien', sessionId: 's1' })
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValueOnce({ id: 2, titre: 'Pris', sessionId: 's1' })

    await FraisInscriptionController.updateFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { titre: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, titre: 'Ancien', update: mockUpdate })

    await FraisInscriptionController.updateFraisInscription(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { titre: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, titre: 'Ancien', update: mockUpdate })

    await FraisInscriptionController.updateFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('FraisInscriptionController.deleteFraisInscription', () => {
  it('retourne 403 si pas INSTITUTION', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await FraisInscriptionController.deleteFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue(null)

    await FraisInscriptionController.deleteFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await FraisInscriptionController.deleteFraisInscription(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(FraisInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await FraisInscriptionController.deleteFraisInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('FraisInscriptionController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await FraisInscriptionController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(FraisInscription.count as jest.Mock).mockResolvedValue(5)

    await FraisInscriptionController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(FraisInscription.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await FraisInscriptionController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
