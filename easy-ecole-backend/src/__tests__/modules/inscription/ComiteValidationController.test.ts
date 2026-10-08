import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'
import { Op } from 'sequelize'
import { DatabaseConnection } from '../../../core/helpers/DatabaseConnection'

// ---------------------------------------------------------------------------
// Tests du flux « correction / rejet comité » (ComiteValidationController) :
//   • rejet comité          → toutes les pièces SAUF le bordereau sont marquées
//     correctionDemandee, soumissionComite passe à false ;
//   • correction_demandee   → seules les pièces cochées sont marquées, idem
//     soumissionComite=false ;
//   • garde-fous : décision invalide, motif manquant, statut hors comité,
//     pièce étrangère à la demande.
//
// Note : DatabaseConnection n'est PAS mocké au niveau module — les vrais
// modèles séquentiels appellent getInstance().sequelize au chargement.
// On n'intercepte que transaction() sur le singleton réel.
// ---------------------------------------------------------------------------

jest.mock('../../../core/helpers/EmailSender', () => ({
  EmailSender: {
    getInstance: () => ({ sendPdf: jest.fn() }),
  },
}))

jest.mock('../../../modules/inscription/models/DemandeInscription', () => {
  const DemandeInscription: any = jest.fn()
  DemandeInscription.findOne = jest.fn()
  DemandeInscription.associations = {}
  return { DemandeInscription }
})

jest.mock('../../../modules/inscription/models/DemandeInscriptionDossier', () => ({
  DemandeInscriptionDossier: {
    findAll: jest.fn(),
    update: jest.fn(),
    associations: { dossierInscription: 'dossierInscription' },
  },
}))

jest.mock('../../../modules/inscription/models/ComiteVote', () => ({
  ComiteVote: {
    findOne: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    associations: { membre: 'membre' },
  },
}))

jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: {
    count: jest.fn(),
    findByPk: jest.fn(),
  },
}))

const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
const { DemandeInscriptionDossier } = require('../../../modules/inscription/models/DemandeInscriptionDossier')
const { ComiteVote } = require('../../../modules/inscription/models/ComiteVote')
const { Utilisateur } = require('../../../modules/auth/models/Utilisateur')

import Ctrl from '../../../modules/inscription/controllers/ComiteValidationController'

let mockTransaction: any

beforeEach(() => {
  jest.clearAllMocks()
  mockTransaction = {
    LOCK: { UPDATE: 'UPDATE' },
    rollback: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
  }
  ;(DatabaseConnection.getInstance().sequelize.transaction as unknown as jest.Mock) =
    jest.fn().mockResolvedValue(mockTransaction)
  ;(Utilisateur.count as jest.Mock).mockResolvedValue(3)
  ;(ComiteVote.findOne as jest.Mock).mockResolvedValue(null)
  ;(ComiteVote.create as jest.Mock).mockResolvedValue({ id: 1 })
  ;(Utilisateur.findByPk as jest.Mock).mockResolvedValue({
    email: 'etudiant@esa.ci',
    nom: 'Kouassi',
    prenoms: 'Aya',
  })
})

function reqComite(body: Record<string, unknown>) {
  return mockRequest({
    utilisateurRole: RolesUtilisateur.COMITE_ORIENTATION,
    utilisateurId: 5,
    params: { id: '11' },
    body,
  } as any)
}

describe('ComiteValidationController.decider — rejet comité', () => {
  it('signale uniquement les pièces fautives cochées (bordereau écarté) et coupe la soumission comité', async () => {
    const res = mockResponse()
    const demande = {
      id: 11,
      utilisateurId: 90,
      statutPipeline: 'transmis_comite',
      soumissionComite: true,
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(demande)
    ;(DemandeInscriptionDossier.findAll as jest.Mock).mockResolvedValue([
      { dossierId: 1, dossierInscription: { titre: 'Bordereau de paiement' } },
      { dossierId: 2, dossierInscription: { titre: 'Relevé de notes' } },
    ])
    ;(DemandeInscriptionDossier.update as jest.Mock).mockResolvedValue([1])

    await Ctrl.decider(
      reqComite({ decision: 'rejete', motif: 'Dossier incomplet', dossierIdsAReposer: [1, 2] }),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    // 1er update : reset global correctionDemandee=false
    expect(DemandeInscriptionDossier.update).toHaveBeenNthCalledWith(
      1,
      { correctionDemandee: false },
      expect.objectContaining({ where: { demandeId: 11 }, transaction: mockTransaction }),
    )
    // 2e update : seule la pièce fautive (hors bordereau) est signalée
    const second = (DemandeInscriptionDossier.update as jest.Mock).mock.calls[1]
    expect(second[0]).toEqual({ correctionDemandee: true })
    expect(second[1].where.dossierId).toEqual({ [Op.in]: [2] })
    // statut + soumissionComite
    expect(demande.statutPipeline).toBe('rejete')
    expect(demande.soumissionComite).toBe(false)
    expect(demande.save).toHaveBeenCalledWith({ transaction: mockTransaction })
    expect(mockTransaction.commit).toHaveBeenCalled()
  })

  it('refuse un rejet sans sélection de pièce (400)', async () => {
    const res = mockResponse()
    await Ctrl.decider(reqComite({ decision: 'rejete', motif: 'Dossier incomplet' }), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(DemandeInscription.findOne).not.toHaveBeenCalled()
    expect(mockTransaction.rollback).not.toHaveBeenCalled()
  })

  it('refuse un rejet qui ne coche que le bordereau (400, rollback)', async () => {
    const res = mockResponse()
    const demande = {
      id: 11,
      utilisateurId: 90,
      statutPipeline: 'transmis_comite',
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(demande)
    ;(DemandeInscriptionDossier.findAll as jest.Mock).mockResolvedValue([
      { dossierId: 1, dossierInscription: { titre: 'Bordereau de paiement' } },
    ])
    ;(DemandeInscriptionDossier.update as jest.Mock).mockResolvedValue([1])

    await Ctrl.decider(
      reqComite({ decision: 'rejete', motif: 'Paiement non conforme', dossierIdsAReposer: [1] }),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(mockTransaction.rollback).toHaveBeenCalled()
    expect(DemandeInscriptionDossier.update).not.toHaveBeenCalled()
    expect(demande.save).not.toHaveBeenCalled()
  })
})

describe('ComiteValidationController.decider — correction demandée', () => {
  it('marque uniquement les pièces cochées par le comité et coupe la soumission comité', async () => {
    const res = mockResponse()
    const demande = {
      id: 11,
      utilisateurId: 90,
      statutPipeline: 'transmis_comite',
      soumissionComite: true,
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(demande)
    ;(DemandeInscriptionDossier.findAll as jest.Mock).mockResolvedValue([
      { dossierId: 2 },
    ])
    ;(DemandeInscriptionDossier.update as jest.Mock).mockResolvedValue([1])

    await Ctrl.decider(reqComite({ decision: 'correction_demandee', motif: 'Relevé illisible', dossierIdsAReposer: [2] }), res)

    expect(res.status).toHaveBeenCalledWith(200)
    const second = (DemandeInscriptionDossier.update as jest.Mock).mock.calls[1]
    expect(second[0]).toEqual({ correctionDemandee: true })
    expect(second[1].where.dossierId).toEqual({ [Op.in]: [2] })
    expect(demande.statutPipeline).toBe('correction_demandee')
    expect(demande.soumissionComite).toBe(false)
    expect(mockTransaction.commit).toHaveBeenCalled()
  })

  it('refuse (400, rollback) une pièce qui n’appartient pas à la demande', async () => {
    const res = mockResponse()
    const demande = {
      id: 11,
      utilisateurId: 90,
      statutPipeline: 'transmis_comite',
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(demande)
    ;(DemandeInscriptionDossier.findAll as jest.Mock).mockResolvedValue([{ dossierId: 2 }])

    await Ctrl.decider(reqComite({ decision: 'correction_demandee', motif: 'Doc', dossierIdsAReposer: [2, 99] }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(mockTransaction.rollback).toHaveBeenCalled()
    expect(DemandeInscriptionDossier.update).not.toHaveBeenCalled()
  })
})

describe('ComiteValidationController.decider — garde-fous', () => {
  it('refuse une décision inconnue (400)', async () => {
    const res = mockResponse()
    await Ctrl.decider(reqComite({ decision: 'annuler', motif: 'x' }), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(DemandeInscriptionDossier.update).not.toHaveBeenCalled()
  })

  it('exige un motif pour une correction ou un rejet (400)', async () => {
    const res = mockResponse()
    await Ctrl.decider(reqComite({ decision: 'rejete', motif: '   ' }), res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('refuse un dossier hors statuts comité (400)', async () => {
    const res = mockResponse()
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({
      id: 11,
      statutPipeline: 'brouillon',
      save: jest.fn(),
    })
    await Ctrl.decider(reqComite({ decision: 'valide', motif: '' }), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(mockTransaction.rollback).toHaveBeenCalled()
  })

  it('refuse un rôle autre que comité/admin (403)', async () => {
    const res = mockResponse()
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 5,
      params: { id: '11' },
      body: { decision: 'rejete', motif: 'x' },
    } as any)
    await Ctrl.decider(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeInscription.findOne).not.toHaveBeenCalled()
  })
})