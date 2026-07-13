import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import TypeNoteEvaluationController from '../../../modules/inscription/controllers/TypeNoteEvaluationController'

jest.mock('../../../modules/inscription/models/TypeNoteEvaluation', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { TypeNoteEvaluation: Mock }
})

const { TypeNoteEvaluation } = require('../../../modules/inscription/models/TypeNoteEvaluation')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('TypeNoteEvaluationController.getAllTypesNoteEvaluation', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, libelle: 'CC' }]
    ;(TypeNoteEvaluation.findAll as jest.Mock).mockResolvedValue(fakeList)

    await TypeNoteEvaluationController.getAllTypesNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(TypeNoteEvaluation.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await TypeNoteEvaluationController.getAllTypesNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('TypeNoteEvaluationController.getTypeNoteEvaluation', () => {
  it('retourne 200 si trouvé', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, libelle: 'CC' }
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue(fake)

    await TypeNoteEvaluationController.getTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue(null)

    await TypeNoteEvaluationController.getTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await TypeNoteEvaluationController.getTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('TypeNoteEvaluationController.createTypeNoteEvaluation', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await TypeNoteEvaluationController.createTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Existant' } } as any)
    const res = mockResponse()
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Existant' })

    await TypeNoteEvaluationController.createTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'EFM', description: 'Examen', poids: 1 } } as any)
    const res = mockResponse()
    const saved = { id: 1, libelle: 'EFM' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue(null)
    ;(TypeNoteEvaluation as jest.Mock).mockReturnValue({ save: mockSave })

    await TypeNoteEvaluationController.createTypeNoteEvaluation(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'EFM' } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue(null)
    ;(TypeNoteEvaluation as jest.Mock).mockReturnValue({ save: mockSave })

    await TypeNoteEvaluationController.createTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('TypeNoteEvaluationController.updateTypeNoteEvaluation', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await TypeNoteEvaluationController.updateTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue(null)

    await TypeNoteEvaluationController.updateTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 400 si nouveau libelle déjà existant', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Pris' } } as any)
    const res = mockResponse()
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, libelle: 'Ancien' })
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValueOnce({ id: 2, libelle: 'Pris' })

    await TypeNoteEvaluationController.updateTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await TypeNoteEvaluationController.updateTypeNoteEvaluation(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await TypeNoteEvaluationController.updateTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('TypeNoteEvaluationController.deleteTypeNoteEvaluation', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await TypeNoteEvaluationController.deleteTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue(null)

    await TypeNoteEvaluationController.deleteTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await TypeNoteEvaluationController.deleteTypeNoteEvaluation(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(TypeNoteEvaluation.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await TypeNoteEvaluationController.deleteTypeNoteEvaluation(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('TypeNoteEvaluationController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await TypeNoteEvaluationController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(TypeNoteEvaluation.count as jest.Mock).mockResolvedValue(2)

    await TypeNoteEvaluationController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 2 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(TypeNoteEvaluation.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await TypeNoteEvaluationController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
