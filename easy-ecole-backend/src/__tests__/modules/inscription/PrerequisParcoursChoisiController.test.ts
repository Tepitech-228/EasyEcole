import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import PrerequisParcoursChoisiController from '../../../modules/inscription/controllers/PrerequisParcoursChoisiController'

jest.mock('../../../modules/inscription/models/PrerequisParcoursChoisi', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { PrerequisParcoursChoisi: Mock }
})

const { PrerequisParcoursChoisi } = require('../../../modules/inscription/models/PrerequisParcoursChoisi')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PrerequisParcoursChoisiController.getAllPrerequisParcoursChoisi', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, note: 15 }]
    ;(PrerequisParcoursChoisi.findAll as jest.Mock).mockResolvedValue(fakeList)

    await PrerequisParcoursChoisiController.getAllPrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(PrerequisParcoursChoisi.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await PrerequisParcoursChoisiController.getAllPrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('PrerequisParcoursChoisiController.getPrerequisParcoursChoisi', () => {
  it('retourne 200 si trouvé', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, note: 15 }
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockResolvedValue(fake)

    await PrerequisParcoursChoisiController.getPrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockResolvedValue(null)

    await PrerequisParcoursChoisiController.getPrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await PrerequisParcoursChoisiController.getPrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('PrerequisParcoursChoisiController.createPrerequisParcoursChoisi', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await PrerequisParcoursChoisiController.createPrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { note: 15 } } as any)
    const res = mockResponse()
    const saved = { id: 1, note: 15 }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(PrerequisParcoursChoisi as jest.Mock).mockReturnValue({ save: mockSave })

    await PrerequisParcoursChoisiController.createPrerequisParcoursChoisi(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { note: 15 } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(PrerequisParcoursChoisi as jest.Mock).mockReturnValue({ save: mockSave })

    await PrerequisParcoursChoisiController.createPrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('PrerequisParcoursChoisiController.updatePrerequisParcoursChoisi', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await PrerequisParcoursChoisiController.updatePrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockResolvedValue(null)

    await PrerequisParcoursChoisiController.updatePrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { note: 18 } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockResolvedValue({ id: 1, note: 15, update: mockUpdate })

    await PrerequisParcoursChoisiController.updatePrerequisParcoursChoisi(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { note: 18 } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockResolvedValue({ id: 1, note: 15, update: mockUpdate })

    await PrerequisParcoursChoisiController.updatePrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('PrerequisParcoursChoisiController.deletePrerequisParcoursChoisi', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await PrerequisParcoursChoisiController.deletePrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockResolvedValue(null)

    await PrerequisParcoursChoisiController.deletePrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await PrerequisParcoursChoisiController.deletePrerequisParcoursChoisi(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(PrerequisParcoursChoisi.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await PrerequisParcoursChoisiController.deletePrerequisParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('PrerequisParcoursChoisiController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await PrerequisParcoursChoisiController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(PrerequisParcoursChoisi.count as jest.Mock).mockResolvedValue(3)

    await PrerequisParcoursChoisiController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 3 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(PrerequisParcoursChoisi.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await PrerequisParcoursChoisiController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
