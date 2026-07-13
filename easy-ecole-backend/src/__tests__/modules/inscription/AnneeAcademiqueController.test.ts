import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import AnneeAcademiqueController from '../../../modules/inscription/controllers/AnneeAcademiqueController'

jest.mock('../../../modules/inscription/models/AnneeAcademique', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { AnneeAcademique: Mock }
})

const { AnneeAcademique } = require('../../../modules/inscription/models/AnneeAcademique')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AnneeAcademiqueController.getAllAnneesAcademiques', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, libelle: '2024-2025' }]
    ;(AnneeAcademique.findAll as jest.Mock).mockResolvedValue(fakeList)

    await AnneeAcademiqueController.getAllAnneesAcademiques(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(AnneeAcademique.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await AnneeAcademiqueController.getAllAnneesAcademiques(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('AnneeAcademiqueController.getAnneeAcademique', () => {
  it('retourne 200 si trouvée', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, libelle: '2024-2025' }
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue(fake)

    await AnneeAcademiqueController.getAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue(null)

    await AnneeAcademiqueController.getAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(AnneeAcademique.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await AnneeAcademiqueController.getAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('AnneeAcademiqueController.createAnneeAcademique', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await AnneeAcademiqueController.createAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Existant' } } as any)
    const res = mockResponse()
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Existant' })

    await AnneeAcademiqueController.createAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Nouveau', description: 'Desc' } } as any)
    const res = mockResponse()
    const saved = { id: 1, libelle: 'Nouveau', description: 'Desc' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue(null)
    ;(AnneeAcademique as jest.Mock).mockReturnValue({ save: mockSave })

    await AnneeAcademiqueController.createAnneeAcademique(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Nouveau' } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue(null)
    ;(AnneeAcademique as jest.Mock).mockReturnValue({ save: mockSave })

    await AnneeAcademiqueController.createAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('AnneeAcademiqueController.updateAnneeAcademique', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await AnneeAcademiqueController.updateAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue(null)

    await AnneeAcademiqueController.updateAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await AnneeAcademiqueController.updateAnneeAcademique(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await AnneeAcademiqueController.updateAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('AnneeAcademiqueController.deleteAnneeAcademique', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await AnneeAcademiqueController.deleteAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue(null)

    await AnneeAcademiqueController.deleteAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await AnneeAcademiqueController.deleteAnneeAcademique(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(AnneeAcademique.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await AnneeAcademiqueController.deleteAnneeAcademique(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('AnneeAcademiqueController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await AnneeAcademiqueController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(AnneeAcademique.count as jest.Mock).mockResolvedValue(5)

    await AnneeAcademiqueController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(AnneeAcademique.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await AnneeAcademiqueController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
