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

import Ctrl from '../../../modules/inscription/controllers/DemandeInscriptionController'

beforeEach(() => {
  jest.clearAllMocks()
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
      body: { sessionId: 3, dateDemande: '2026-09-01' },
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
      body: { sessionId: 3 },
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
      body: { sessionId: 3, dateDemande: '2026-09-01' },
    } as any)
    const res = mockResponse()

    const saved = { id: 10, sessionId: 3, matricule: 'EI-2026-0042', utilisateurId: 7 }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
    ;(DemandeInscription as jest.Mock).mockReturnValueOnce({ save: mockSave })

    await Ctrl.createDemandeInscription(req, res)

    expect(DemandeInscription).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
