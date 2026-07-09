import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import PrerequisParcoursController from '../../../modules/inscription/controllers/PrerequisParcoursController'

jest.mock('../../../modules/inscription/models/PrerequisParcours', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { PrerequisParcours: Mock }
})

const { PrerequisParcours } = require('../../../modules/inscription/models/PrerequisParcours')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PrerequisParcoursController.getAllPrerequisParcours', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, noteRequise: 10 }]
    ;(PrerequisParcours.findAll as jest.Mock).mockResolvedValue(fakeList)

    await PrerequisParcoursController.getAllPrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(PrerequisParcours.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await PrerequisParcoursController.getAllPrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('PrerequisParcoursController.getPrerequisParcours', () => {
  it('retourne 200 si trouvé', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, noteRequise: 10 }
    ;(PrerequisParcours.findOne as jest.Mock).mockResolvedValue(fake)

    await PrerequisParcoursController.getPrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(PrerequisParcours.findOne as jest.Mock).mockResolvedValue(null)

    await PrerequisParcoursController.getPrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(PrerequisParcours.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await PrerequisParcoursController.getPrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('PrerequisParcoursController.createPrerequisParcours', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await PrerequisParcoursController.createPrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({
      utilisateurRole: 'admin',
      body: { noteRequise: 10, typeEvaluation: 'CC', periodeEvaluation: 'S1', parcoursId: 'p1', niveauEtudeId: 'n1', matierePrerequisId: 'm1' }
    } as any)
    const res = mockResponse()
    const saved = { id: 1, noteRequise: 10 }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(PrerequisParcours as jest.Mock).mockReturnValue({ save: mockSave })

    await PrerequisParcoursController.createPrerequisParcours(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { noteRequise: 10 } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(PrerequisParcours as jest.Mock).mockReturnValue({ save: mockSave })

    await PrerequisParcoursController.createPrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('PrerequisParcoursController.updatePrerequisParcours', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await PrerequisParcoursController.updatePrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(PrerequisParcours.findOne as jest.Mock).mockResolvedValue(null)

    await PrerequisParcoursController.updatePrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { noteRequise: 12 } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(PrerequisParcours.findOne as jest.Mock).mockResolvedValue({ id: 1, noteRequise: 10, update: mockUpdate })

    await PrerequisParcoursController.updatePrerequisParcours(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { noteRequise: 12 } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(PrerequisParcours.findOne as jest.Mock).mockResolvedValue({ id: 1, noteRequise: 10, update: mockUpdate })

    await PrerequisParcoursController.updatePrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('PrerequisParcoursController.deletePrerequisParcours', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await PrerequisParcoursController.deletePrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(PrerequisParcours.findOne as jest.Mock).mockResolvedValue(null)

    await PrerequisParcoursController.deletePrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(PrerequisParcours.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await PrerequisParcoursController.deletePrerequisParcours(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(PrerequisParcours.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await PrerequisParcoursController.deletePrerequisParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('PrerequisParcoursController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await PrerequisParcoursController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(PrerequisParcours.count as jest.Mock).mockResolvedValue(7)

    await PrerequisParcoursController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 7 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(PrerequisParcours.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await PrerequisParcoursController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
