import { mockRequest, mockResponse } from '../../helpers/express-mocks'

// ---------------------------------------------------------------------------
// Tests du workflow PREMIÈRE INSCRIPTION : on verrouille la règle métier clé
// « 1 inscription max par session » via createDemandeInscription.
//   • refus des rôles institution
//   • périmètre de recherche limité (sessionId + utilisateurId) pour l'apprenant
//   • déjà inscrit sur la session → 400 { alreadySignUp: true }
//   • création d'une nouvelle demande → 201
// ---------------------------------------------------------------------------

jest.mock('../../../modules/inscription/models/DemandeInscription', () => {
  const DemandeInscription: any = jest.fn()
  DemandeInscription.findOne = jest.fn()
  DemandeInscription.findAll = jest.fn()
  DemandeInscription.create = jest.fn()
  DemandeInscription.findByPk = jest.fn()
  DemandeInscription.update = jest.fn()
  DemandeInscription.count = jest.fn()
  DemandeInscription.findAndCountAll = jest.fn()
  DemandeInscription.associations = {}
  return { DemandeInscription }
})

jest.mock('../../../modules/inscription/models/Session', () => ({
  Session: { findOne: jest.fn() },
}))

jest.mock('../../../modules/auth/models/SiteUtilisateur', () => ({
  SiteUtilisateur: { findAll: jest.fn(), findOrCreate: jest.fn() },
}))

jest.mock('../../../modules/etablissement/models/Etablissement', () => ({
  Etablissement: { findOne: jest.fn() },
}))

jest.mock('../../../core/helpers/IDGenerator', () => ({
  IDGenerator: {
    getInstance: () => ({ generateInscriptionMatricule: () => 'EI-2026-0042' }),
  },
}))

jest.mock('../../../core/helpers/EmailSender', () => ({
  EmailSender: {
    getInstance: () => ({ sendConfirmationDemandeInscription: jest.fn() }),
  },
}))

const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
const { Session } = require('../../../modules/inscription/models/Session')
const { SiteUtilisateur } = require('../../../modules/auth/models/SiteUtilisateur')
const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')

import Ctrl from '../../../modules/inscription/controllers/DemandeInscriptionController'

beforeEach(() => {
  jest.clearAllMocks()
  ;(Session.findOne as jest.Mock).mockResolvedValue({
    id: 3,
    etablissementId: null,
    dateDebut: new Date(Date.now() - 60_000),
    dateFin: new Date(Date.now() + 60_000),
  })
  ;(SiteUtilisateur.findAll as jest.Mock).mockResolvedValue([])
  ;(SiteUtilisateur.findOrCreate as jest.Mock).mockResolvedValue([{}, false])
  ;(Etablissement.findOne as jest.Mock).mockResolvedValue({ id: 4 })
})

describe('DemandeInscriptionController.getAllDemandesInscription', () => {
  it('scopes the list to the active site', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', etablissementId: 4 } as any)
    const res = mockResponse()
    ;(DemandeInscription.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 })

    await Ctrl.getAllDemandesInscription(req, res)

    expect(DemandeInscription.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { etablissementId: 4 } })
    )
  })

  it('refuses to list requests without an active site', async () => {
    const req = mockRequest({ utilisateurRole: 'institution' } as any)
    const res = mockResponse()

    await Ctrl.getAllDemandesInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeInscription.findAndCountAll).not.toHaveBeenCalled()
  })

  it('lets an applicant list only their own requests before selecting a site', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 7 } as any)
    const res = mockResponse()
    ;(DemandeInscription.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 })

    await Ctrl.getAllDemandesInscription(req, res)

    expect(DemandeInscription.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { utilisateurId: 7 } })
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('DemandeInscriptionController.getDemandeInscription', () => {
  it('scopes the detail to the active site', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', etablissementId: 4, params: { id: '10' } } as any)
    const res = mockResponse()
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.getDemandeInscription(req, res)

    expect(DemandeInscription.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '10', etablissementId: 4 } })
    )
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('DemandeInscriptionController.createDemandeInscription — 1ère inscription', () => {
  it('refuse le rôle institution (403)', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', utilisateurId: 2 } as any)
    const res = mockResponse()
    await Ctrl.createDemandeInscription(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ success: false })
  })

  it('limite la recherche à sessionId + utilisateurId pour l’apprenant', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: { sessionId: 3, etablissementId: 4, dateDemande: '2026-09-01' },
    } as any)
    const res = mockResponse()
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DemandeInscription as jest.Mock).mockReturnValue({ save: jest.fn().mockResolvedValue({}) })

    await Ctrl.createDemandeInscription(req, res)

    expect(DemandeInscription.findOne).toHaveBeenCalledWith({
      where: { sessionId: 3, utilisateurId: 7 },
    })
  })

  it('renvoie alreadySignUp (400) si une demande existe déjà pour la session', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: { sessionId: 3, etablissementId: 4 },
    } as any)
    const res = mockResponse()
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createDemandeInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ alreadySignUp: true })
  })

  it('crée une nouvelle demande quand aucune n’existe (201)', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: { sessionId: 3, etablissementId: 4, dateDemande: '2026-09-01' },
    } as any)
    const res = mockResponse()

    const saved = { id: 10, sessionId: 3, matricule: 'EI-2026-0042', utilisateurId: 7 }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DemandeInscription as jest.Mock).mockReturnValueOnce({ save: mockSave })

    await Ctrl.createDemandeInscription(req, res)

    expect(DemandeInscription).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalled()
    expect((DemandeInscription as jest.Mock).mock.results[0].value.etablissementId).toBe(4)
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('uses the active site when the applicant omits it from the request body', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: { sessionId: 3, dateDemande: '2026-09-01' },
    } as any)
    const res = mockResponse()

    const saved = { id: 10, sessionId: 3, matricule: 'EI-2026-0042', utilisateurId: 7 }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DemandeInscription as jest.Mock).mockReturnValueOnce({ save: mockSave })

    await Ctrl.createDemandeInscription(req, res)

    expect(Session.findOne).toHaveBeenCalledWith({
      where: { id: 3 },
      attributes: ['id', 'etablissementId', 'dateDebut', 'dateFin'],
    })
    expect((DemandeInscription as jest.Mock).mock.results[0].value.etablissementId).toBe(4)
    expect(SiteUtilisateur.findOrCreate).toHaveBeenCalledWith({
      where: { utilisateurId: 7, etablissementId: 4 },
      defaults: { utilisateurId: 7, etablissementId: 4 },
    })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('allows an unassigned applicant to select a site for a global session', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      body: { sessionId: 3, etablissementId: 4, dateDemande: '2026-09-01' },
    } as any)
    const res = mockResponse()
    const saved = { id: 10, sessionId: 3, matricule: 'EI-2026-0042', utilisateurId: 7 }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DemandeInscription as jest.Mock).mockReturnValueOnce({ save: mockSave })

    await Ctrl.createDemandeInscription(req, res)

    expect(Etablissement.findOne).toHaveBeenCalledWith({
      where: { id: 4, actif: true },
      attributes: ['id'],
    })
    expect(Session.findOne).toHaveBeenCalledWith({
      where: { id: 3 },
      attributes: ['id', 'etablissementId', 'dateDebut', 'dateFin'],
    })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('allows the same global session to be selected for a different site', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 8,
      body: { sessionId: 3, etablissementId: 8 },
    } as any)
    const res = mockResponse()
    ;(SiteUtilisateur.findAll as jest.Mock).mockResolvedValue([])
    ;(Etablissement.findOne as jest.Mock).mockResolvedValue({ id: 8 })
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
    const mockSave = jest.fn().mockResolvedValue({ id: 10 })
    ;(DemandeInscription as jest.Mock).mockReturnValueOnce({ save: mockSave })

    await Ctrl.createDemandeInscription(req, res)

    expect(Session.findOne).toHaveBeenCalledWith({
      where: { id: 3 },
      attributes: ['id', 'etablissementId', 'dateDebut', 'dateFin'],
    })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('rejects a submitted site that differs from the active site', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: { sessionId: 3, etablissementId: 9 },
    } as any)
    const res = mockResponse()
    ;(Session.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.createDemandeInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(Session.findOne).not.toHaveBeenCalled()
  })
})
