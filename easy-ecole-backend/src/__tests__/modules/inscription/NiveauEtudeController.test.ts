import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import NiveauEtudeController from '../../../modules/inscription/controllers/NiveauEtudeController'

jest.mock('../../../modules/inscription/models/NiveauEtude', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { NiveauEtude: Mock }
})

const { NiveauEtude } = require('../../../modules/inscription/models/NiveauEtude')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('NiveauEtudeController.getAllNiveauxEtude', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, libelle: 'Licence' }]
    ;(NiveauEtude.findAll as jest.Mock).mockResolvedValue(fakeList)

    await NiveauEtudeController.getAllNiveauxEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(NiveauEtude.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await NiveauEtudeController.getAllNiveauxEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('NiveauEtudeController.getNiveauEtude', () => {
  it('retourne 200 si trouvé', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, libelle: 'Licence' }
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue(fake)

    await NiveauEtudeController.getNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue(null)

    await NiveauEtudeController.getNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(NiveauEtude.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await NiveauEtudeController.getNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('NiveauEtudeController.createNiveauEtude', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await NiveauEtudeController.createNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Existant' } } as any)
    const res = mockResponse()
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Existant' })

    await NiveauEtudeController.createNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Niveau d'étude déjà existant" })
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Master' } } as any)
    const res = mockResponse()
    const saved = { id: 1, libelle: 'Master' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue(null)
    ;(NiveauEtude as jest.Mock).mockReturnValue({ save: mockSave })

    await NiveauEtudeController.createNiveauEtude(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Master' } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue(null)
    ;(NiveauEtude as jest.Mock).mockReturnValue({ save: mockSave })

    await NiveauEtudeController.createNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('NiveauEtudeController.updateNiveauEtude', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await NiveauEtudeController.updateNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue(null)

    await NiveauEtudeController.updateNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 400 si nouveau libelle déjà existant', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Pris' } } as any)
    const res = mockResponse()
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, libelle: 'Ancien' })
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValueOnce({ id: 2, libelle: 'Pris' })

    await NiveauEtudeController.updateNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { name: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await NiveauEtudeController.updateNiveauEtude(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { name: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await NiveauEtudeController.updateNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('NiveauEtudeController.deleteNiveauEtude', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await NiveauEtudeController.deleteNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue(null)

    await NiveauEtudeController.deleteNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await NiveauEtudeController.deleteNiveauEtude(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(NiveauEtude.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await NiveauEtudeController.deleteNiveauEtude(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('NiveauEtudeController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await NiveauEtudeController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(NiveauEtude.count as jest.Mock).mockResolvedValue(4)

    await NiveauEtudeController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 4 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(NiveauEtude.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await NiveauEtudeController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
