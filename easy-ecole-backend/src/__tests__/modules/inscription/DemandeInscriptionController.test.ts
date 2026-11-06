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
  Session: { findOne: jest.fn(), findAll: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/ParcoursChoisi', () => ({
  ParcoursChoisi: { findOne: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/DossierInscription', () => ({
  DossierInscription: { findAll: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/DemandeInscriptionDossier', () => ({
  DemandeInscriptionDossier: { findAll: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: { findOne: jest.fn() },
}))

jest.mock('../../../modules/auth/models/SiteUtilisateur', () => ({
  SiteUtilisateur: { findAll: jest.fn(), findOrCreate: jest.fn() },
}))

jest.mock('../../../modules/auth/models/Apprenant', () => ({
  Apprenant: { findOne: jest.fn() },
}))

jest.mock('../../../modules/etablissement/models/Etablissement', () => ({
  Etablissement: { findOne: jest.fn() },
}))

jest.mock('../../../modules/inscription/services/HikvisionEnrollmentService', () => ({
  __esModule: true,
  default: {
    enqueueStudent: jest.fn(),
    processPending: jest.fn().mockResolvedValue(undefined),
  },
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
const { Apprenant } = require('../../../modules/auth/models/Apprenant')
const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')
const { ParcoursChoisi } = require('../../../modules/inscription/models/ParcoursChoisi')
const { DossierInscription } = require('../../../modules/inscription/models/DossierInscription')
const { DemandeInscriptionDossier } = require('../../../modules/inscription/models/DemandeInscriptionDossier')
const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const HikvisionEnrollmentService = require('../../../modules/inscription/services/HikvisionEnrollmentService').default

import Ctrl from '../../../modules/inscription/controllers/DemandeInscriptionController'

beforeEach(() => {
  jest.clearAllMocks()
  ;(Session.findOne as jest.Mock).mockResolvedValue({
    id: 3,
    etablissementId: null,
    anneeAcademiqueId: 12,
    dateDebut: new Date(Date.now() - 60_000),
    dateFin: new Date(Date.now() + 60_000),
  })
  ;(Session.findAll as jest.Mock).mockResolvedValue([])
  ;(DemandeInscription.findAll as jest.Mock).mockResolvedValue([])
  ;(SiteUtilisateur.findAll as jest.Mock).mockResolvedValue([])
  ;(SiteUtilisateur.findOrCreate as jest.Mock).mockResolvedValue([{}, false])
  ;(Apprenant.findOne as jest.Mock).mockResolvedValue({ photo: 'photo-etudiant.jpg' })
  ;(Etablissement.findOne as jest.Mock).mockResolvedValue({ id: 4 })
  ;(HikvisionEnrollmentService.enqueueStudent as jest.Mock).mockResolvedValue(1)
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

describe('DemandeInscriptionController.soumettreDemande', () => {
  beforeEach(() => {
    ;(ParcoursChoisi.findOne as jest.Mock).mockResolvedValue(null)
    ;(DossierInscription.findAll as jest.Mock).mockResolvedValue([])
    ;(DemandeInscriptionDossier.findAll as jest.Mock).mockResolvedValue([])
    ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue(null)
  })

  it('lets an e-learning applicant submit without a presentiel pathway', async () => {
    const demande = {
      id: 10,
      utilisateurId: 7,
      sessionId: 3,
      etablissementId: 4,
      modeFormation: 'en_ligne',
      statutPipeline: null,
      update: jest.fn().mockResolvedValue(undefined),
    }
    ;(DemandeInscription.findOne as jest.Mock)
      .mockResolvedValueOnce(demande)
      .mockResolvedValueOnce(null)
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '10' },
      body: { matriculeEtudiant: 'ET-2026-001' },
    } as any)
    const res = mockResponse()

    await Ctrl.soumettreDemande(req, res)

    expect(demande.update).toHaveBeenCalledWith(expect.objectContaining({
      matriculeEtudiant: 'ET-2026-001',
      statutPipeline: 'soumis',
    }))
    expect(HikvisionEnrollmentService.enqueueStudent).toHaveBeenCalledWith(
      7,
      4,
      'ET-2026-001',
      null,
    )
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      hikvisionEnrollmentQueued: true,
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    await new Promise<void>(resolve => setImmediate(resolve))
    expect(HikvisionEnrollmentService.processPending).toHaveBeenCalled()
  })

  it('keeps the submitted request successful and reports when no terminal is configured', async () => {
    const demande = {
      id: 10,
      utilisateurId: 7,
      sessionId: 3,
      etablissementId: 4,
      modeFormation: 'en_ligne',
      statutPipeline: null,
      update: jest.fn().mockResolvedValue(undefined),
    }
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(demande)
    ;(ParcoursChoisi.findOne as jest.Mock).mockResolvedValue(null)
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValueOnce(demande).mockResolvedValueOnce(null)
    ;(HikvisionEnrollmentService.enqueueStudent as jest.Mock).mockResolvedValue(0)
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '10' },
      body: { matriculeEtudiant: 'ET-2026-001' },
    } as any)
    const res = mockResponse()

    await Ctrl.soumettreDemande(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      hikvisionEnrollmentQueued: false,
      hikvisionEnrollmentWarning: expect.stringContaining('Aucun terminal'),
    }))
  })

  it('refuses to submit when the applicant has no profile photo', async () => {
    const demande = {
      id: 10,
      utilisateurId: 7,
      sessionId: 3,
      modeFormation: 'en_ligne',
      statutPipeline: null,
      update: jest.fn(),
    }
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(demande)
    ;(Apprenant.findOne as jest.Mock).mockResolvedValue({ photo: null })
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '10' },
      body: { matriculeEtudiant: 'ET-2026-001' },
    } as any)
    const res = mockResponse()

    await Ctrl.soumettreDemande(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('photo'),
    }))
    expect(demande.update).not.toHaveBeenCalled()
  })

  it('refuses a second submission when the request is already marked as submitted', async () => {
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({
      id: 10,
      utilisateurId: 7,
      sessionId: 3,
      modeFormation: 'en_ligne',
      statutPipeline: 'soumis',
      update: jest.fn(),
    })
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '10' },
      body: { matriculeEtudiant: 'ET-2026-001' },
    } as any)
    const res = mockResponse()

    await Ctrl.soumettreDemande(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      alreadySubmitted: true,
      message: expect.stringContaining('déjà été soumise'),
    }))
    expect(DemandeInscription.findOne).toHaveBeenCalled()
  })

  it('requires a proposed student matricule before submission', async () => {
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({
      id: 10,
      utilisateurId: 7,
      modeFormation: 'en_ligne',
      statutPipeline: null,
      update: jest.fn(),
    })
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '10' },
      body: {},
    } as any)
    const res = mockResponse()

    await Ctrl.soumettreDemande(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DossierEtudiant.findOne).not.toHaveBeenCalled()
  })

  it('still requires a pathway for presentiel applications', async () => {
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({
      id: 10,
      utilisateurId: 7,
      sessionId: 3,
      modeFormation: 'presentiel',
      statutPipeline: null,
      update: jest.fn(),
    })
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '10' },
    } as any)
    const res = mockResponse()

    await Ctrl.soumettreDemande(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(ParcoursChoisi.findOne).toHaveBeenCalled()
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

  it('refuse une seconde inscription sur le même site pour la même année académique', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: { sessionId: 3, etablissementId: 4, dateDemande: '2026-09-01' },
    } as any)
    const res = mockResponse()
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DemandeInscription.findAll as jest.Mock).mockResolvedValue([{ id: 9, sessionId: 6 }])
    ;(Session.findAll as jest.Mock).mockResolvedValue([{ id: 6 }])

    await Ctrl.createDemandeInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      alreadySignUp: true,
      message: 'Vous avez déjà une inscription dans cette session.',
    }))
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
      attributes: ['id', 'etablissementId', 'anneeAcademiqueId', 'dateDebut', 'dateFin'],
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
      attributes: ['id', 'etablissementId', 'anneeAcademiqueId', 'dateDebut', 'dateFin'],
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
      attributes: ['id', 'etablissementId', 'anneeAcademiqueId', 'dateDebut', 'dateFin'],
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

  it('persiste le mode de formation en ligne dès la création', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: { sessionId: 3, etablissementId: 4, dateDemande: '2026-09-01', modeFormation: 'en_ligne' },
    } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockResolvedValue({ id: 11 })
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DemandeInscription as jest.Mock).mockReturnValueOnce({ save: mockSave })

    await Ctrl.createDemandeInscription(req, res)

    expect((DemandeInscription as jest.Mock).mock.results[0].value.modeFormation).toBe('en_ligne')
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('refuse un mode de formation inconnu avant toute écriture', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: { sessionId: 3, etablissementId: 4, modeFormation: 'hybride' },
    } as any)
    const res = mockResponse()

    await Ctrl.createDemandeInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DemandeInscription.findOne).not.toHaveBeenCalled()
  })
})

describe('DemandeInscriptionController.updateModeFormation', () => {
  it('bascule la demande en e-learning avant la transmission au comité', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    const demande = { id: 1, modeFormation: 'presentiel', statutPipeline: 'soumis', update }
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(demande)

    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '1' },
      body: { modeFormation: 'en_ligne' },
    } as any)
    const res = mockResponse()

    await Ctrl.updateModeFormation(req, res)

    expect(DemandeInscription.findOne).toHaveBeenCalledWith({ where: { id: 1, utilisateurId: 7 } })
    expect(update).toHaveBeenCalledWith({ modeFormation: 'en_ligne' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, modeFormation: 'en_ligne' })
  })

  it('refuse un mode invalide (400)', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '1' },
      body: { modeFormation: 'hybride' },
    } as any)
    const res = mockResponse()

    await Ctrl.updateModeFormation(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DemandeInscription.findOne).not.toHaveBeenCalled()
  })

  it('verrouille le mode une fois la demande engagée dans la validation (409)', async () => {
    const update = jest.fn()
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      modeFormation: 'presentiel',
      statutPipeline: 'transmis_comite',
      update,
    })

    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      params: { id: '1' },
      body: { modeFormation: 'en_ligne' },
    } as any)
    const res = mockResponse()

    await Ctrl.updateModeFormation(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(update).not.toHaveBeenCalled()
  })

  it('refuse un rôle autre qu’apprenant (403)', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', utilisateurId: 7, params: { id: '1' } } as any)
    const res = mockResponse()

    await Ctrl.updateModeFormation(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeInscription.findOne).not.toHaveBeenCalled()
  })
})
