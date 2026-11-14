import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/ListePresence', () => {
  const ListePresence: any = jest.fn()
  ListePresence.findAll = jest.fn()
  ListePresence.findOne = jest.fn()
  ListePresence.create = jest.fn()
  ListePresence.count = jest.fn()
  ListePresence.findAndCountAll = jest.fn()
  ListePresence.findByPk = jest.fn()
  ListePresence.associations = {
    cours: 'cours',
    enseignant: 'enseignant',
    presences: 'presences',
    parcours: 'parcours',
    niveauEtude: 'niveauEtude',
    etablissement: 'etablissement',
  }
  return { ListePresence }
})

jest.mock('../../../modules/inscription/models/Cours', () => ({
  Cours: {
    associations: {
      classe: 'classe',
      enseignant: 'enseignant',
      parcours: 'parcours'
    }
  }
}))

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: {
    findOne: jest.fn(),
    associations: {
      utilisateur: 'utilisateur'
    }
  }
}))

jest.mock('../../../modules/inscription/services/CahierCohorteService', () => ({
  __esModule: true,
  default: {
    trouverCohortes: jest.fn(),
    conditionsPourCohortes: jest.fn((cohortes: any[]) => cohortes.map(({ parcoursId, niveauEtudeId, etablissementId }) => ({
      parcoursId,
      niveauEtudeId,
      etablissementId,
    }))),
    enseignantAssocieAuCahier: jest.fn(),
    trouverCoursIds: jest.fn(),
  },
}))

jest.mock('../../../modules/inscription/models/Parcours', () => ({
  Parcours: {
    associations: {
      niveauEtude: 'niveauEtude'
    }
  }
}))

jest.mock('../../../modules/inscription/models/Presence', () => ({
  Presence: {
    associations: {
      presencesCoursParticipants: 'presencesCoursParticipants'
    }
  }
}))

jest.mock('../../../modules/inscription/models/CoursParticipant', () => ({
  CoursParticipant: {
    findAll: jest.fn(),
    associations: {
      utilisateur: 'utilisateur',
      cursusApprenant: 'cursusApprenant',
    },
  }
}))

jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: {
    associations: {
      apprenant: 'apprenant',
    },
  },
}))

const { ListePresence } = require('../../../modules/inscription/models/ListePresence')
const { Enseignant } = require('../../../modules/auth/models/Enseignant')
const { CoursParticipant } = require('../../../modules/inscription/models/CoursParticipant')
const CahierCohorteService = require('../../../modules/inscription/services/CahierCohorteService').default
import Ctrl from '../../../modules/inscription/controllers/ListePresenceController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllListesPresences', () => {
  it('should return all listes de presence with nested includes', async () => {
    const req = mockRequest({})
    const res = mockResponse()
    const mockData = [{ id: 1 }]
    ;(ListePresence.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllListesPresences(req, res)

    expect(ListePresence.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          {
            association: 'cours',
            include: [
              'classe',
              { association: 'enseignant', include: ['utilisateur'] },
              { association: 'parcours', include: ['niveauEtude'] }
            ]
          },
          { association: 'enseignant', include: ['utilisateur'] },
          { association: 'parcours', include: ['niveauEtude'] },
          'niveauEtude',
          'etablissement',
        ]
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('inclut les cahiers partagés des cohortes enseignées', async () => {
    const cohortes = [{ parcoursId: 4, niveauEtudeId: 2, etablissementId: 3 }]
    Enseignant.findOne.mockResolvedValue({ id: 9 })
    CahierCohorteService.trouverCohortes.mockResolvedValue(cohortes)
    ;(ListePresence.findAll as jest.Mock).mockResolvedValue([])
    const req = mockRequest({ utilisateurRole: 'enseignant', utilisateurId: 100 } as any)
    const res = mockResponse()

    await Ctrl.getAllListesPresences(req, res)

    expect(ListePresence.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        [require('sequelize').Op.or]: [
          { enseignantId: 9 },
          { parcoursId: 4, niveauEtudeId: 2, etablissementId: 3 },
        ],
      },
    }))
  })
})

describe('getListePresence', () => {
  it('should return liste de presence with presences includes', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const mockData = { id: 1, toJSON: () => ({ id: 1 }) }
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getListePresence(req, res)

    expect(ListePresence.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        include: [
          {
            association: 'cours',
            include: [
              'classe',
              { association: 'enseignant', include: ['utilisateur'] },
              { association: 'parcours', include: ['niveauEtude'] }
            ]
          },
          { association: 'presences', include: ['presencesCoursParticipants'] },
          { association: 'parcours', include: ['niveauEtude'] },
          'niveauEtude',
          'etablissement',
        ]
      })
    )
    expect(res.send).toHaveBeenCalledWith({ id: 1 })
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.getListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('autorise un enseignant associé à consulter le cahier de cohorte', async () => {
    const cahierPartage = {
      id: 7,
      parcoursId: 4,
      niveauEtudeId: 2,
      etablissementId: 3,
      presences: [
        { id: 1, auteurEnseignantId: 9 },
        { id: 2, auteurEnseignantId: 10 },
      ],
      toJSON: () => ({
        id: 7,
        parcoursId: 4,
        niveauEtudeId: 2,
        etablissementId: 3,
        presences: [
          { id: 1, auteurEnseignantId: 9 },
          { id: 2, auteurEnseignantId: 10 },
        ],
      }),
    }
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue(cahierPartage)
    CoursParticipant.findAll.mockResolvedValue([])
    Enseignant.findOne.mockResolvedValue({ id: 9 })
    CahierCohorteService.enseignantAssocieAuCahier.mockResolvedValue(true)
    CahierCohorteService.trouverCoursIds.mockResolvedValue([])
    const req = mockRequest({ params: { id: '7' }, utilisateurRole: 'enseignant', utilisateurId: 100 } as any)
    const res = mockResponse()

    await Ctrl.getListePresence(req, res)

    expect(CahierCohorteService.enseignantAssocieAuCahier).toHaveBeenCalledWith(9, cahierPartage)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      presences: [{ id: 1, auteurEnseignantId: 9 }],
    }))
  })
})

describe('createListePresence', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ body: {}, utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.createListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 with alreadyExists if duplicate titre', async () => {
    const req = mockRequest({ body: { titre: 'Liste 1' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })

  it('should return 201 on success', async () => {
    const req = mockRequest({ body: { titre: 'Nouvelle Liste' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    const saved = { id: 1, titre: 'Nouvelle Liste' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue(null)
    ;(ListePresence as jest.Mock).mockReturnValue({ save: mockSave })

    await Ctrl.createListePresence(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })
})

describe('updateListePresence', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.updateListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({})
    const existing = { id: 1, titre: 'Ancien', update: mockUpdate }
    const req = mockRequest({ params: { id: '1' }, body: { titre: 'Updated' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(ListePresence.findOne as jest.Mock).mockResolvedValueOnce(existing)
    ;(ListePresence.findOne as jest.Mock).mockResolvedValueOnce(null)

    await Ctrl.updateListePresence(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteListePresence', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.deleteListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockItem = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue(mockItem)

    await Ctrl.deleteListePresence(req, res)

    expect(mockItem.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for IN role', async () => {
    const req = mockRequest({ utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(ListePresence.count as jest.Mock).mockResolvedValue(3)

    await Ctrl.getCount(req, res)

    expect(ListePresence.count).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 3 })
  })
})
