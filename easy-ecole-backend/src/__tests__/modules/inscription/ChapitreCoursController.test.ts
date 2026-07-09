import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../core/helpers/DatabaseConnection', () => ({
  DatabaseConnection: {
    instance: null,
    getInstance: jest.fn().mockReturnValue({
      sequelize: {
        define: jest.fn().mockReturnValue({}),
        authenticate: jest.fn().mockResolvedValue(undefined),
        sync: jest.fn().mockResolvedValue(undefined)
      }
    })
  }
}))

jest.mock('../../../modules/inscription/models/Cours', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.associations = { classe: 'classe', parcours: 'parcours' }
  return { Cours: Mock }
})

jest.mock('../../../modules/inscription/models/Parcours', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.associations = { niveauEtude: 'niveauEtude' }
  return { Parcours: Mock }
})

jest.mock('../../../modules/inscription/models/Ressource', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.associations = { fichiersRessource: 'fichiersRessource' }
  return { Ressource: Mock }
})

import ChapitreCoursController from '../../../modules/inscription/controllers/ChapitreCoursController'

jest.mock('../../../modules/inscription/models/ChapitreCours', () => {
  const Mock: any = jest.fn(() => ({ save: jest.fn().mockResolvedValue(undefined) }))
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.findAndCountAll = jest.fn()
  Mock.associations = { cours: 'cours', ressources: 'ressources' }
  return { ChapitreCours: Mock }
})

const { ChapitreCours } = require('../../../modules/inscription/models/ChapitreCours')
beforeEach(() => { jest.clearAllMocks() })

describe('ChapitreCoursController.getAllChapitresCours', () => {
  it('retourne 200', async () => {
    ;(ChapitreCours.findAll as jest.Mock).mockResolvedValue([{ id: 1 }])
    const res = mockResponse()
    await ChapitreCoursController.getAllChapitresCours(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    ;(ChapitreCours.findAll as jest.Mock).mockRejectedValue(new Error('err'))
    const res = mockResponse()
    await ChapitreCoursController.getAllChapitresCours(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('ChapitreCoursController.getChapitreCours', () => {
  it('retourne 200 si trouvé', async () => {
    ;(ChapitreCours.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await ChapitreCoursController.getChapitreCours(mockRequest({ params: { id: '1' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(ChapitreCours.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await ChapitreCoursController.getChapitreCours(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('ChapitreCoursController.createChapitreCours', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await ChapitreCoursController.createChapitreCours(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si INstitution', async () => {
    const res = mockResponse()
    await ChapitreCoursController.createChapitreCours(mockRequest({ utilisateurRole: 'institution' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 400 si doublon titre', async () => {
    ;(ChapitreCours.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await ChapitreCoursController.createChapitreCours(mockRequest({ utilisateurRole: 'enseignant', body: { titre: 'Chap' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })
  it('crée et retourne 201', async () => {
    ;(ChapitreCours.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await ChapitreCoursController.createChapitreCours(mockRequest({ utilisateurRole: 'enseignant', body: { titre: 'Chap' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(201)
  })
})

describe('ChapitreCoursController.updateChapitreCours', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await ChapitreCoursController.updateChapitreCours(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(ChapitreCours.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await ChapitreCoursController.updateChapitreCours(mockRequest({ utilisateurRole: 'enseignant', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(ChapitreCours.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 1, titre: 'Ancien', update: up })
      .mockResolvedValueOnce(null)
    const res = mockResponse()
    await ChapitreCoursController.updateChapitreCours(mockRequest({ utilisateurRole: 'enseignant', params: { id: '1' }, body: { titre: 'Modifié' } } as any), res)
    expect(up).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('ChapitreCoursController.deleteChapitreCours', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await ChapitreCoursController.deleteChapitreCours(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(ChapitreCours.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await ChapitreCoursController.deleteChapitreCours(mockRequest({ utilisateurRole: 'enseignant', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(ChapitreCours.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await ChapitreCoursController.deleteChapitreCours(mockRequest({ utilisateurRole: 'enseignant', params: { id: '1' } } as any), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
