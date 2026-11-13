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

jest.mock('../../../modules/auth/models/Apprenant', () => ({
  Apprenant: { findAll: jest.fn().mockResolvedValue([]) },
}))

jest.mock('../../../modules/auth/models/SiteUtilisateur', () => ({
  SiteUtilisateur: { findOne: jest.fn() },
}))
jest.mock('../../../core/helpers/SurveillantSiteScope', () => ({
  getSurveillantSiteId: jest.fn(),
}))

jest.mock('../../../modules/inscription/models/Pointage', () => ({
  Pointage: { findAll: jest.fn(), findOne: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/SeancePointage', () => ({
  SeancePointage: { findAll: jest.fn(), findOne: jest.fn() },
}))

import SeanceController from '../../../modules/inscription/controllers/SeanceController'

jest.mock('../../../modules/inscription/models/Seance', () => {
  const Mock: any = jest.fn(function (this: any) {
    this.save = jest.fn().mockImplementation(() => Promise.resolve(this))
  })
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.findByPk = jest.fn()
  Mock.create = jest.fn()
  Mock.findAndCountAll = jest.fn()
  Mock.update = jest.fn().mockResolvedValue([1])
  Mock.associations = { etablissement: 'etablissement', cours: 'cours', enseignant: 'enseignant', salleDeClasse: 'salleDeClasse' }
  return { Seance: Mock }
})

const { Seance } = require('../../../modules/inscription/models/Seance')
const { Cours } = require('../../../modules/inscription/models/Cours')
const { Enseignant } = require('../../../modules/auth/models/Enseignant')
const { Apprenant } = require('../../../modules/auth/models/Apprenant')
const { SiteUtilisateur } = require('../../../modules/auth/models/SiteUtilisateur')
const { getSurveillantSiteId } = require('../../../core/helpers/SurveillantSiteScope')
const { Pointage } = require('../../../modules/inscription/models/Pointage')
const { SeancePointage } = require('../../../modules/inscription/models/SeancePointage')
beforeEach(() => { jest.clearAllMocks() })

describe('SeanceController.getAllSeances', () => {
  it('retourne 200', async () => {
    ;(Seance.findAll as jest.Mock).mockResolvedValue([{ id: 1 }])
    const res = mockResponse()
    await SeanceController.getAllSeances(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('limite les séances au site actif', async () => {
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()
    await SeanceController.getAllSeances(mockRequest({ etablissementId: 3 }), res)
    expect(Seance.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        etablissementId: 3,
        publieeLe: expect.objectContaining({ [require('sequelize').Op.ne]: null }),
      }),
    }))
  })
  it('lets administrators see unpublished schedules from all sites', async () => {
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()

    await SeanceController.getAllSeances(mockRequest({
      utilisateurRole: 'admin',
      etablissementId: 3,
    } as any), res)

    const query = (Seance.findAll as jest.Mock).mock.calls[0][0]
    expect(query.where.etablissementId).toBeUndefined()
    expect(query.where.publieeLe).toBeUndefined()
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('limite les séances du surveillant à son site actif affecté', async () => {
    getSurveillantSiteId.mockResolvedValue(3)
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()

    await SeanceController.getAllSeances(mockRequest({
      utilisateurRole: 'surveillant',
      utilisateurId: 8,
      etablissementId: 3,
    } as any), res)

    expect(Seance.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        etablissementId: 3,
        publieeLe: expect.objectContaining({ [require('sequelize').Op.ne]: null }),
      }),
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

describe('SeanceController.checkConflits', () => {
  it('allows parallel sessions for different teachers and classes in the same time slot', async () => {
    ;(Cours.findByPk as jest.Mock).mockResolvedValue({ classeId: 2 })
    ;(Cours.findAll as jest.Mock).mockResolvedValue([{ id: 20 }])
    ;(Seance.findAll as jest.Mock).mockImplementation((options: any) =>
      Promise.resolve(options.where.creneauId === 3 ? [{ id: 21, enseignantId: 9, coursId: 10 }] : [])
    )
    const res = mockResponse()

    await SeanceController.checkConflits(mockRequest({
      body: {
        jourSemaine: 'LUNDI',
        heureDebut: '08:00:00',
        heureFin: '10:00:00',
        dateDebut: '2026-11-09',
        dateFin: '2026-12-31',
        enseignantId: 8,
        coursId: 20,
        creneauId: 3,
      },
    } as any), res)

    expect(Seance.findAll).not.toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ creneauId: 3 }),
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith([])
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
    ;(Cours.findByPk as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Enseignant.findByPk as jest.Mock).mockResolvedValue({ utilisateurId: 8 })
    ;(SiteUtilisateur.findOne as jest.Mock).mockResolvedValue({ id: 9 })
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()
    await SeanceController.createSeance(mockRequest({
      utilisateurRole: 'superviseur_general',
      etablissementId: 3,
      body: { coursId: 1, enseignantId: 9 }
    } as any), res)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ etablissementId: 3 }))
  })
  it('autorise un administrateur à créer une séance sur le site actif', async () => {
    ;(Cours.findByPk as jest.Mock).mockResolvedValue({ id: 1, etablissementId: null })
    ;(Enseignant.findByPk as jest.Mock).mockResolvedValue({ utilisateurId: 8 })
    ;(SiteUtilisateur.findOne as jest.Mock).mockResolvedValue({ id: 9 })
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()
    await SeanceController.createSeance(mockRequest({
      utilisateurRole: 'admin',
      etablissementId: 3,
      body: { coursId: 1, enseignantId: 9 }
    } as any), res)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ etablissementId: 3 }))
  })
  it('accepte un cours partagé sans site propre et rattache la séance au site actif', async () => {
    ;(Cours.findByPk as jest.Mock).mockResolvedValue({ id: 1, etablissementId: null })
    ;(Enseignant.findByPk as jest.Mock).mockResolvedValue({ utilisateurId: 8 })
    ;(SiteUtilisateur.findOne as jest.Mock).mockResolvedValue({ id: 9 })
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()
    await SeanceController.createSeance(mockRequest({
      utilisateurRole: 'superviseur_general',
      etablissementId: 3,
      body: { coursId: 1, enseignantId: 9 }
    } as any), res)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ etablissementId: 3 }))
  })
  it('accepts a course whose parcours belongs to another site', async () => {
    ;(Cours.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      etablissementId: null,
      parcours: { etablissementId: 4 }
    })
    ;(Enseignant.findByPk as jest.Mock).mockResolvedValue({ utilisateurId: 8 })
    ;(SiteUtilisateur.findOne as jest.Mock).mockResolvedValue({ id: 9 })
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()

    await SeanceController.createSeance(mockRequest({
      utilisateurRole: 'superviseur_general',
      etablissementId: 3,
      body: { coursId: 1, enseignantId: 9 }
    } as any), res)

    expect(Cours.findByPk).toHaveBeenCalledWith(1, { attributes: ['id'] })
    expect(res.status).toHaveBeenCalledWith(201)
  })
  it('accepts a course assigned directly to another site', async () => {
    ;(Cours.findByPk as jest.Mock).mockResolvedValue({ id: 1, etablissementId: 4 })
    ;(Enseignant.findByPk as jest.Mock).mockResolvedValue({ utilisateurId: 8 })
    ;(SiteUtilisateur.findOne as jest.Mock).mockResolvedValue({ id: 9 })
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()

    await SeanceController.createSeance(mockRequest({
      utilisateurRole: 'superviseur_general',
      etablissementId: 3,
      body: { coursId: 1, enseignantId: 9 }
    } as any), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ etablissementId: 3 }))
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
    await SeanceController.updateSeance(mockRequest({ utilisateurRole: 'superviseur_general', etablissementId: 3, params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(Cours.findByPk as jest.Mock).mockResolvedValue({ id: 12, etablissementId: null })
    ;(Enseignant.findByPk as jest.Mock).mockResolvedValue({ utilisateurId: 8 })
    ;(SiteUtilisateur.findOne as jest.Mock).mockResolvedValue({ id: 9 })
    ;(Seance.findOne as jest.Mock).mockResolvedValue({ id: 1, etablissementId: 3, coursId: 12, enseignantId: 9, update: up })
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()
    await SeanceController.updateSeance(mockRequest({ utilisateurRole: 'superviseur_general', etablissementId: 3, params: { id: '1' }, body: { coursId: 12, enseignantId: 9 } } as any), res)
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
    await SeanceController.deleteSeance(mockRequest({ utilisateurRole: 'superviseur_general', etablissementId: 3, params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(Seance.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await SeanceController.deleteSeance(mockRequest({ utilisateurRole: 'superviseur_general', etablissementId: 3, params: { id: '1' } } as any), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('SeanceController.getRetardsEnseignants', () => {
  it('utilise le pointage de séance en priorité', async () => {
    ;(Seance.findAll as jest.Mock).mockResolvedValue([{
      id: 7,
      heureDebut: '09:00:00',
      heureFin: '10:00:00',
      cours: { intitule: 'Algorithmique' },
      enseignant: { utilisateur: { id: 42 } },
    }])
    ;(SeancePointage.findAll as jest.Mock).mockResolvedValue([
      { seanceId: 7, heureDebutReelle: '09:15:00' },
    ])
    ;(Pointage.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()

    await SeanceController.getRetardsEnseignants(mockRequest(), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        seanceId: 7,
        heureArrivee: '09:15:00',
        sourcePointage: 'seance',
        statut: 'en_retard',
      }),
    ])
  })

  it('retombe sur le pointage QR quand la séance n a pas été pointée', async () => {
    ;(Seance.findAll as jest.Mock).mockResolvedValue([{
      id: 8,
      heureDebut: '09:00:00',
      heureFin: '10:00:00',
      cours: { intitule: 'Physique' },
      enseignant: { utilisateur: { id: 43 } },
    }])
    ;(SeancePointage.findAll as jest.Mock).mockResolvedValue([])
    ;(Pointage.findAll as jest.Mock).mockResolvedValue([
      { utilisateurId: 43, heureArrivee: '08:50:00' },
    ])
    const res = mockResponse()

    await SeanceController.getRetardsEnseignants(mockRequest(), res)

    expect(res.json).toHaveBeenCalledWith([])
  })
})

describe('SeanceController.publierEmploiDuTemps', () => {
  it('requires an active site when a general supervisor publishes', async () => {
    const res = mockResponse()

    await SeanceController.publierEmploiDuTemps(mockRequest({
      utilisateurRole: 'superviseur_general',
      etablissementId: null,
    } as any), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(Seance.findAll).not.toHaveBeenCalled()
  })

  it('limits a general supervisor publication to schedules from the active site', async () => {
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    ;(Apprenant.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()

    await SeanceController.publierEmploiDuTemps(mockRequest({
      utilisateurRole: 'superviseur_general',
      etablissementId: 3,
    } as any), res)

    expect(Seance.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { etablissementId: 3 },
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('allows an administrator to publish schedules for the active site', async () => {
    ;(Seance.findAll as jest.Mock).mockResolvedValue([])
    const res = mockResponse()

    await SeanceController.publierEmploiDuTemps(mockRequest({
      utilisateurRole: 'admin',
      etablissementId: 3,
    } as any), res)

    expect(Seance.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { etablissementId: 3 },
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
