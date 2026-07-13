import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import DossierInscriptionController from '../../../modules/inscription/controllers/DossierInscriptionController'

jest.mock('../../../modules/inscription/models/DossierInscription', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { DossierInscription: Mock }
})

const { DossierInscription } = require('../../../modules/inscription/models/DossierInscription')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('DossierInscriptionController.getAllDossiersInscription', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, titre: 'Diplôme' }]
    ;(DossierInscription.findAll as jest.Mock).mockResolvedValue(fakeList)

    await DossierInscriptionController.getAllDossiersInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(DossierInscription.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await DossierInscriptionController.getAllDossiersInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('DossierInscriptionController.getDossierInscription', () => {
  it('retourne 200 si trouvé', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, titre: 'Diplôme' }
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue(fake)

    await DossierInscriptionController.getDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue(null)

    await DossierInscriptionController.getDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(DossierInscription.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await DossierInscriptionController.getDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('DossierInscriptionController.createDossierInscription', () => {
  it('retourne 403 si pas INSTITUTION', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await DossierInscriptionController.createDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 403 si ENSEIGNANT', async () => {
    const req = mockRequest({ utilisateurRole: 'enseignant' } as any)
    const res = mockResponse()

    await DossierInscriptionController.createDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', body: { titre: 'Dossier1', sessionId: 's1' } } as any)
    const res = mockResponse()
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, titre: 'Dossier1' })

    await DossierInscriptionController.createDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ alreadyExists: true })
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', body: { titre: 'Nouveau', description: 'Desc', tailleMax: 5, sessionId: 's1' } } as any)
    const res = mockResponse()
    const saved = { id: 1, titre: 'Nouveau' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DossierInscription as jest.Mock).mockReturnValue({ save: mockSave })

    await DossierInscriptionController.createDossierInscription(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', body: { titre: 'Nouveau', sessionId: 's1' } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DossierInscription as jest.Mock).mockReturnValue({ save: mockSave })

    await DossierInscriptionController.createDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('DossierInscriptionController.updateDossierInscription', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await DossierInscriptionController.updateDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue(null)

    await DossierInscriptionController.updateDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 400 si doublon sur titre+sessionId', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { titre: 'Pris', sessionId: 's1' } } as any)
    const res = mockResponse()
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, titre: 'Ancien', sessionId: 's1' })
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValueOnce({ id: 2, titre: 'Pris', sessionId: 's1' })

    await DossierInscriptionController.updateDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { titre: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, titre: 'Ancien', update: mockUpdate })

    await DossierInscriptionController.updateDossierInscription(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { titre: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, titre: 'Ancien', update: mockUpdate })

    await DossierInscriptionController.updateDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('DossierInscriptionController.deleteDossierInscription', () => {
  it('retourne 403 si pas INSTITUTION', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await DossierInscriptionController.deleteDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue(null)

    await DossierInscriptionController.deleteDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await DossierInscriptionController.deleteDossierInscription(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await DossierInscriptionController.deleteDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('DossierInscriptionController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await DossierInscriptionController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(DossierInscription.count as jest.Mock).mockResolvedValue(8)

    await DossierInscriptionController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 8 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(DossierInscription.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await DossierInscriptionController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
