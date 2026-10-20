import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../core/helpers/DatabaseConnection')

jest.mock('../../../modules/inscription/models/Cours', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.findByPk = jest.fn()
  Mock.associations = { classe: 'classe', enseignant: 'enseignant', parcours: 'parcours' }
  return { Cours: Mock }
})

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    associations: { utilisateur: 'utilisateur' },
  },
}))

jest.mock('../../../modules/auth/models/SiteUtilisateur', () => ({
  SiteUtilisateur: { findOne: jest.fn() },
}))
jest.mock('../../../core/helpers/SurveillantSiteScope', () => ({
  getSurveillantSiteId: jest.fn(),
}))

import SeanceController from '../../../modules/inscription/controllers/SeanceController'

jest.mock('../../../modules/inscription/models/Seance', () => {
  const Mock: any = jest.fn(() => ({ save: jest.fn().mockResolvedValue(undefined) }))
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.findByPk = jest.fn()
  Mock.create = jest.fn()
  Mock.findAndCountAll = jest.fn()
  Mock.associations = { cours: 'cours', enseignant: 'enseignant', salleDeClasse: 'salleDeClasse' }
  return { Seance: Mock }
})

const { Seance } = require('../../../modules/inscription/models/Seance')
const { Cours } = require('../../../modules/inscription/models/Cours')
const { Enseignant } = require('../../../modules/auth/models/Enseignant')
const { SiteUtilisateur } = require('../../../modules/auth/models/SiteUtilisateur')
const { getSurveillantSiteId } = require('../../../core/helpers/SurveillantSiteScope')
beforeEach(() => { jest.clearAllMocks() })

describe('SeanceController.getAllSeances', () => {
  it('retourne 200', async () => {
    ;(Seance.findAll as jest.Mock).mockResolvedValue([{ id: 1 }])
    const res = mockResponse()
    await SeanceController.getAllSeances(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('limite les séances au site actif', async () => {
    ;(Cours.findAll as jest.Mock).mockResolvedValue([{ id: 12 }])
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()
    await SeanceController.getAllSeances(mockRequest({ etablissementId: 3 }), res)
    expect(Seance.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { coursId: expect.objectContaining({ [require('sequelize').Op.in]: [12] }) },
    }))
  })
  it('limite les séances du surveillant à son site actif affecté', async () => {
    getSurveillantSiteId.mockResolvedValue(3)
    ;(Cours.findAll as jest.Mock).mockResolvedValue([{ id: 12 }])
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()

    await SeanceController.getAllSeances(mockRequest({
      utilisateurRole: 'surveillant',
      utilisateurId: 8,
      etablissementId: 3,
    } as any), res)

    expect(Seance.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { coursId: expect.objectContaining({ [require('sequelize').Op.in]: [12] }) },
    }))
  })
  it('refuse les séances du surveillant sans site autorisé', async () => {
    getSurveillantSiteId.mockResolvedValue(null)
    const res = mockResponse()

    await SeanceController.getAllSeances(mockRequest({
      utilisateurRole: 'surveillant',
      utilisateurId: 8,
      etablissementId: 99,
    } as any), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(Seance.findAll).not.toHaveBeenCalled()
  })
  it('retourne 500 en cas d\'erreur', async () => {
    ;(Seance.findAll as jest.Mock).mockRejectedValue(new Error('err'))
    const res = mockResponse()
    await SeanceController.getAllSeances(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('SeanceController.getSeance', () => {
  it('retourne 200 si trouvé', async () => {
    ;(Seance.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await SeanceController.getSeance(mockRequest({ params: { id: '1' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Seance.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await SeanceController.getSeance(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('SeanceController.createSeance', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await SeanceController.createSeance(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si ENSEIGNANT', async () => {
    const res = mockResponse()
    await SeanceController.createSeance(mockRequest({ utilisateurRole: 'enseignant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('crée et retourne 201', async () => {
    ;(Cours.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Enseignant.findByPk as jest.Mock).mockResolvedValue({ utilisateurId: 8 })
    ;(SiteUtilisateur.findOne as jest.Mock).mockResolvedValue({ id: 9 })
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()
    await SeanceController.createSeance(mockRequest({
      utilisateurRole: 'institution',
      etablissementId: 3,
      body: { coursId: 1, enseignantId: 9 }
    } as any), res)
    expect(res.status).toHaveBeenCalledWith(201)
  })
  it('refuse une séance si le cours n’appartient pas au site actif', async () => {
    ;(Cours.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await SeanceController.createSeance(mockRequest({
      utilisateurRole: 'institution',
      etablissementId: 3,
      body: { coursId: 1, enseignantId: 9 }
    } as any), res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('SeanceController.updateSeance', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await SeanceController.updateSeance(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Seance.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await SeanceController.updateSeance(mockRequest({ utilisateurRole: 'institution', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(Seance.findOne as jest.Mock).mockResolvedValue({ id: 1, update: up })
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()
    await SeanceController.updateSeance(mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { coursId: 2 } } as any), res)
    expect(up).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('SeanceController.deleteSeance', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await SeanceController.deleteSeance(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(Seance.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await SeanceController.deleteSeance(mockRequest({ utilisateurRole: 'institution', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(Seance.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await SeanceController.deleteSeance(mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
