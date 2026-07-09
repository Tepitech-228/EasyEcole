import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import SalleDeClasseController from '../../../modules/inscription/controllers/SalleDeClasseController'

jest.mock('../../../modules/inscription/models/SalleDeClasse', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { SalleDeClasse: Mock }
})

const { SalleDeClasse } = require('../../../modules/inscription/models/SalleDeClasse')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SalleDeClasseController.getAllSallesDeClasse', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, libelle: 'Salle 101' }]
    ;(SalleDeClasse.findAll as jest.Mock).mockResolvedValue(fakeList)

    await SalleDeClasseController.getAllSallesDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('filtre par classeId', async () => {
    const req = mockRequest({ query: { classeId: 'cl1' } })
    const res = mockResponse()
    ;(SalleDeClasse.findAll as jest.Mock).mockResolvedValue([])

    await SalleDeClasseController.getAllSallesDeClasse(req, res)

    expect(SalleDeClasse.findAll).toHaveBeenCalledWith({ where: { classeId: 'cl1' } })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(SalleDeClasse.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await SalleDeClasseController.getAllSallesDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('SalleDeClasseController.getSalleDeClasse', () => {
  it('retourne 200 si trouvée', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, libelle: 'Salle 101' }
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue(fake)

    await SalleDeClasseController.getSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue(null)

    await SalleDeClasseController.getSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(SalleDeClasse.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await SalleDeClasseController.getSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('SalleDeClasseController.createSalleDeClasse', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await SalleDeClasseController.createSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Existant' } } as any)
    const res = mockResponse()
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Existant' })

    await SalleDeClasseController.createSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Nouveau', description: 'Desc', classeId: 'cl1' } } as any)
    const res = mockResponse()
    const saved = { id: 1, libelle: 'Nouveau' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue(null)
    ;(SalleDeClasse as jest.Mock).mockReturnValue({ save: mockSave })

    await SalleDeClasseController.createSalleDeClasse(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Nouveau' } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue(null)
    ;(SalleDeClasse as jest.Mock).mockReturnValue({ save: mockSave })

    await SalleDeClasseController.createSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('SalleDeClasseController.updateSalleDeClasse', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await SalleDeClasseController.updateSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue(null)

    await SalleDeClasseController.updateSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await SalleDeClasseController.updateSalleDeClasse(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await SalleDeClasseController.updateSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('SalleDeClasseController.deleteSalleDeClasse', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await SalleDeClasseController.deleteSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue(null)

    await SalleDeClasseController.deleteSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await SalleDeClasseController.deleteSalleDeClasse(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(SalleDeClasse.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await SalleDeClasseController.deleteSalleDeClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('SalleDeClasseController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await SalleDeClasseController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(SalleDeClasse.count as jest.Mock).mockResolvedValue(10)

    await SalleDeClasseController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 10 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(SalleDeClasse.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await SalleDeClasseController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
