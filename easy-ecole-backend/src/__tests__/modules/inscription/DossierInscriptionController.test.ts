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

jest.mock('../../../modules/inscription/models/DemandeInscription', () => ({
  DemandeInscription: {
    findByPk: jest.fn(),
    associations: {
      cours: {},
      coursChoisis: {},
      session: {},
      etapeInscription: {},
      dossiersDemande: {},
      paiementsInscription: {},
      reponseInscription: {},
    },
  },
}))

jest.mock('../../../modules/inscription/models/DemandeInscriptionDossier', () => ({
  DemandeInscriptionDossier: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
}))

jest.mock('../../../modules/inscription/models/ComiteVote', () => ({
  ComiteVote: { destroy: jest.fn() },
}))

const { DossierInscription } = require('../../../modules/inscription/models/DossierInscription')
const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
const { DemandeInscriptionDossier } = require('../../../modules/inscription/models/DemandeInscriptionDossier')

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

describe('DossierInscriptionController.uploadDossierInscription', () => {
  it('refuse les rôles autres qu’apprenant avant de consulter la demande', async () => {
    const req = mockRequest({
      utilisateurRole: 'enseignant',
      body: { demandeId: '1', dossierId: '2' },
      files: [{ filename: 'document.pdf' }],
    } as any)
    const res = mockResponse()

    await DossierInscriptionController.uploadDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeInscription.findByPk).not.toHaveBeenCalled()
    expect(DemandeInscriptionDossier.findAll).not.toHaveBeenCalled()
  })

  it('refuse à un apprenant de modifier les pièces de la demande d’un autre utilisateur', async () => {
    const req = mockRequest({
      utilisateurId: 7,
      utilisateurRole: 'apprenant',
      body: { demandeId: '1', dossierId: '2' },
      files: [{ filename: 'document.pdf' }],
    } as any)
    const res = mockResponse()
    ;(DemandeInscription.findByPk as jest.Mock).mockResolvedValue({ utilisateurId: 8 })

    await DossierInscriptionController.uploadDossierInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeInscriptionDossier.findAll).not.toHaveBeenCalled()
    expect(DemandeInscriptionDossier.create).not.toHaveBeenCalled()
  })

  it('permet à un apprenant propriétaire de téléverser ses pièces', async () => {
    const req = mockRequest({
      utilisateurId: 7,
      utilisateurRole: 'apprenant',
      body: { demandeId: '1', dossierId: '2' },
      files: [{ filename: 'document.pdf' }],
    } as any)
    const res = mockResponse()
    const demande = { utilisateurId: 7, statutPipeline: 'brouillon' }
    ;(DemandeInscription.findByPk as jest.Mock)
      .mockResolvedValueOnce(demande)
      .mockResolvedValueOnce(demande)
    ;(DemandeInscriptionDossier.findAll as jest.Mock).mockResolvedValue([])
    ;(DemandeInscriptionDossier.create as jest.Mock).mockResolvedValue({})

    await DossierInscriptionController.uploadDossierInscription(req, res)

    expect(DemandeInscriptionDossier.create).toHaveBeenCalledWith({
      nomFichier: 'document.pdf',
      dossierId: '2',
      demandeId: '1',
      correctionDemandee: false,
    })
    expect(res.status).toHaveBeenCalledWith(201)
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
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, titre: 'Ancien', sessionId: 's1', update: mockUpdate })
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValueOnce(null)

    await DossierInscriptionController.updateDossierInscription(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { titre: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, titre: 'Ancien', sessionId: 's1', update: mockUpdate })
    ;(DossierInscription.findOne as jest.Mock).mockResolvedValueOnce(null)

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
