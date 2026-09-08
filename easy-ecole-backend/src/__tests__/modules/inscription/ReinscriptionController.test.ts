import { mockRequest, mockResponse } from '../../helpers/express-mocks'

// ---------------------------------------------------------------------------
// Tests du workflow RÉINSCRIPTION : on verrouille les règles métier clés du
// parcours « réinscription » via le contrôleur.
//   • réservé à l'apprenant (rôle)
//   • prérequis : être un étudiant déjà inscrit (dossier/cursus existant)
//   • 1 inscription max par session (409)
//   • documents obligatoires requis
// ---------------------------------------------------------------------------

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: { findOne: jest.fn(), create: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/CursusApprenant', () => ({
  CursusApprenant: {
    findOne: jest.fn(),
    create: jest.fn(),
    associations: { parcours: 'parcours', classe: 'classe', niveauEtude: 'niveauEtude', anneeAcademique: 'anneeAcademique' },
  },
}))

jest.mock('../../../modules/inscription/models/Session', () => ({
  Session: {
    findByPk: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    associations: {},
  },
}))

jest.mock('../../../modules/inscription/models/DemandeInscription', () => ({
  DemandeInscription: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    associations: {},
  },
}))

jest.mock('../../../modules/inscription/models/DemandeInscriptionDossier', () => ({
  DemandeInscriptionDossier: { findOrCreate: jest.fn(), findAll: jest.fn(), create: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/DossierInscription', () => ({
  DossierInscription: { findOrCreate: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/Bordereau', () => ({
  Bordereau: { create: jest.fn(), findByPk: jest.fn(), findOne: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/TypeOperationBordereau', () => ({
  TypeOperationBordereau: { findOne: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/Echeance', () => ({
  Echeance: { findAll: jest.fn(), findOne: jest.fn(), count: jest.fn() },
}))

jest.mock('../../../core/helpers/DatabaseConnection', () => {
  const sequelize = { transaction: jest.fn() }
  return { DatabaseConnection: { instance: null, getInstance: jest.fn(() => ({ sequelize })) } }
})

const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const { CursusApprenant } = require('../../../modules/inscription/models/CursusApprenant')
const { Session } = require('../../../modules/inscription/models/Session')
const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')

import Ctrl from '../../../modules/inscription/controllers/ReinscriptionController'

beforeEach(() => {
  jest.clearAllMocks()
})

const apprenantReq = (extra: any = {}) =>
  mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 7, ...extra } as any)

describe('ReinscriptionController.soumettre — règle métier', () => {
  it('refuse l’accès aux non-apprenants (403)', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', utilisateurId: 1 } as any)
    const res = mockResponse()
    await Ctrl.soumettre(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(DossierEtudiant.findOne).not.toHaveBeenCalled()
  })

  it('exige un dossier étudiant existant (être déjà inscrit) → 400', async () => {
    const req = apprenantReq({ body: { sessionId: 3 } })
    const res = mockResponse()
    ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.soumettre(req, res)

    expect(DossierEtudiant.findOne).toHaveBeenCalledWith({ where: { utilisateurId: 7 } })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('déjà inscrits') })
    )
  })

  it('exige une session cible valide → 400', async () => {
    const req = apprenantReq({ body: { sessionId: 999 } })
    const res = mockResponse()
    ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Session.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.soumettre(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Session de réinscription introuvable') })
    )
  })

  it('refuse une demande déjà en cours sur la même session (409, 1 inscription/session)', async () => {
    const req = apprenantReq({ body: { sessionId: 3 } })
    const res = mockResponse()
    ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Session.findByPk as jest.Mock).mockResolvedValue({ id: 3, etablissementId: 5 })
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({ id: 42 })

    await Ctrl.soumettre(req, res)

    expect(DemandeInscription.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ utilisateurId: 7, sessionId: 3, typeDemande: 'reinscription' }),
      })
    )
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('déjà en cours') })
    )
  })

  it('exige le bordereau de paiement → 400 s’il est absent', async () => {
    const req = apprenantReq({ body: { sessionId: 3 }, files: {} })
    const res = mockResponse()
    ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Session.findByPk as jest.Mock).mockResolvedValue({ id: 3, etablissementId: 5 })
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.soumettre(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Bordereau de paiement') })
    )
  })

  it('exige les 6 pièces obligatoires → 400 si manquantes (même avec bordereau)', async () => {
    const req = apprenantReq({
      body: { sessionId: 3 },
      files: { bordereau: [{ filename: 'b.pdf', path: 'tmp/b.pdf' }] },
    })
    const res = mockResponse()
    ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    ;(Session.findByPk as jest.Mock).mockResolvedValue({ id: 3, etablissementId: 5 })
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.soumettre(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Documents manquants') })
    )
  })
})

describe('ReinscriptionController.creerPlanification — règle métier', () => {
  it('refuse l’accès aux non-apprenants (403)', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    await Ctrl.creerPlanification(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('exige un cursus existant (être déjà inscrit) → 400', async () => {
    const req = apprenantReq({ body: { sessionId: 3 } })
    const res = mockResponse()
    ;(CursusApprenant.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.creerPlanification(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('déjà inscrit') })
    )
  })

  it('exige une session cible valide → 400', async () => {
    const req = apprenantReq({ body: { sessionId: 999 } })
    const res = mockResponse()
    ;(CursusApprenant.findOne as jest.Mock).mockResolvedValue({ id: 1, etablissementId: 5 })
    ;(Session.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.creerPlanification(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('refuse une planification dupliquée sur la même session (409)', async () => {
    const req = apprenantReq({ body: { sessionId: 3, anneeAcademiqueId: 9 } })
    const res = mockResponse()
    ;(CursusApprenant.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 1, etablissementId: 5 }) // cursus actuel
      .mockResolvedValueOnce({ id: 2 }) // doublon déjà en_attente/confirme
    ;(Session.findByPk as jest.Mock).mockResolvedValue({ id: 3, anneeAcademiqueId: 9 })

    await Ctrl.creerPlanification(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('existe déjà') })
    )
  })

  it('crée la planification en_attente (201) réutilisant les infos du cursus actuel', async () => {
    const req = apprenantReq({ body: { sessionId: 3, classeId: 4, niveauEtudeId: 2 } })
    const res = mockResponse()
    const cursus = {
      id: 1, externe: false, etablissementId: 5, intituleParcours: 'S1',
      parcoursId: 10, classeId: 11, niveauEtudeId: 12,
    }
    const planif = { id: 99, statutReinscription: 'en_attente' }
    ;(CursusApprenant.findOne as jest.Mock).mockResolvedValueOnce(cursus).mockResolvedValueOnce(null)
    ;(Session.findByPk as jest.Mock).mockResolvedValue({ id: 3, anneeAcademiqueId: 9 })
    ;(CursusApprenant.create as jest.Mock).mockResolvedValue(planif)

    await Ctrl.creerPlanification(req, res)

    expect(CursusApprenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        classeId: 4, // classe cible transmise
        niveauEtudeId: 2,
        anneeAcademiqueId: 9, // depuis la session
        externe: false,
        etablissementId: 5,
        parcoursId: 10,
        statutReinscription: 'en_attente',
      })
    )
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
