import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import RessourceController from '../../../modules/inscription/controllers/RessourceController'

jest.mock('../../../modules/inscription/models/Ressource', () => {
  const Mock: any = jest.fn(() => ({ save: jest.fn().mockResolvedValue(undefined) }))
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.findAndCountAll = jest.fn()
  Mock.associations = { chapitreCours: 'chapitreCours', fichiersRessource: 'fichiersRessource' }
  return { Ressource: Mock }
})

const { Ressource } = require('../../../modules/inscription/models/Ressource')
beforeEach(() => { jest.clearAllMocks() })

describe('RessourceController.getAllRessources', () => {
  it('retourne 200', async () => {
    ;(Ressource.findAll as jest.Mock).mockResolvedValue([{ id: 1 }])
    const res = mockResponse()
    await RessourceController.getAllRessources(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    ;(Ressource.findAll as jest.Mock).mockRejectedValue(new Error('err'))
    const res = mockResponse()
    await RessourceController.getAllRessources(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('RessourceController.getRessource', () => {
  it('retourne 200 si trouvé', async () => {
    ;(Ressource.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await RessourceController.getRessource(mockRequest({ params: { id: '1' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Ressource.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await RessourceController.getRessource(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('RessourceController.createRessource', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await RessourceController.createRessource(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si INstitution', async () => {
    const res = mockResponse()
    await RessourceController.createRessource(mockRequest({ utilisateurRole: 'institution' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 400 si doublon titre', async () => {
    ;(Ressource.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await RessourceController.createRessource(mockRequest({ utilisateurRole: 'enseignant', body: { titre: 'Res' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })
  it('crée et retourne 201', async () => {
    ;(Ressource.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await RessourceController.createRessource(mockRequest({ utilisateurRole: 'enseignant', body: { titre: 'Res' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(201)
  })
})

describe('RessourceController.updateRessource', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await RessourceController.updateRessource(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Ressource.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await RessourceController.updateRessource(mockRequest({ utilisateurRole: 'enseignant', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(Ressource.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 1, update: up, titre: 'Original' })
      .mockResolvedValueOnce(null)
    const res = mockResponse()
    await RessourceController.updateRessource(mockRequest({ utilisateurRole: 'enseignant', params: { id: '1' }, body: { titre: 'Modifié' } } as any), res)
    expect(up).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('RessourceController.deleteRessource', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await RessourceController.deleteRessource(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Ressource.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await RessourceController.deleteRessource(mockRequest({ utilisateurRole: 'enseignant', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(Ressource.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await RessourceController.deleteRessource(mockRequest({ utilisateurRole: 'enseignant', params: { id: '1' } } as any), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
