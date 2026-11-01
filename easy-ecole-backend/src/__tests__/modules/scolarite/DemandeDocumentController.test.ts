import { Op } from 'sequelize'
import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import DemandeDocumentController from '../../../modules/scolarite/controllers/DemandeDocumentController'

jest.mock('../../../modules/scolarite/models/DemandeDocument', () => ({
  DemandeDocument: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
}))
jest.mock('../../../modules/scolarite/models/TypeDocument', () => ({ TypeDocument: { findByPk: jest.fn(), findOne: jest.fn() } }))
jest.mock('../../../modules/scolarite/models/DocumentDelivre', () => {
  const MockDocumentDelivre: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(undefined),
  }))
  MockDocumentDelivre.findOne = jest.fn()
  return { DocumentDelivre: MockDocumentDelivre }
})
jest.mock('../../../modules/scolarite/models/RecuCaisse', () => ({ RecuCaisse: {} }))
jest.mock('../../../modules/scolarite/models/DemandeDocumentPiece', () => ({
  DemandeDocumentPiece: { findOne: jest.fn(), findAll: jest.fn(), update: jest.fn(), create: jest.fn() },
}))
jest.mock('../../../modules/scolarite/models/DemandeDocumentVote', () => ({ DemandeDocumentVote: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() } }))
jest.mock('../../../modules/inscription/models/CursusApprenant', () => ({
  CursusApprenant: { findOne: jest.fn(), findAll: jest.fn(), associations: {} },
}))
jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: { findAll: jest.fn() },
}))
jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: { findAll: jest.fn(), findOne: jest.fn(), count: jest.fn() },
}))
jest.mock('../../../core/helpers/DocumentPDFGenerator', () => ({
  DocumentPDFGenerator: { generateDocument: jest.fn() },
}))
jest.mock('../../../core/services/ArchiveGedService', () => ({
  ArchiveGedService: { archiverDocumentScolarite: jest.fn(), archiverDocumentInscription: jest.fn() },
}))
jest.mock('../../../modules/scolarite/services/DemandeDocumentPaiementService', () => ({
  __esModule: true,
  default: {
    trouverBordereauDemande: jest.fn(),
    creerBordereauPourDemande: jest.fn(),
    confirmerPaiement: jest.fn(),
    confirmerPaiementAuto: jest.fn(),
  },
}))
jest.mock('../../../modules/scolarite/services/SecretariatWorkflowService', () => ({
  SecretariatWorkflowService: {
    construireCoordonneesEtudiant: jest.fn(),
    passerEnPreparation: jest.fn(),
    genererDocument: jest.fn(),
    confirmerImpression: jest.fn(),
    confirmerRemise: jest.fn(),
    rejeterDemande: jest.fn(),
  },
  ErreurWorkflow: class ErreurWorkflow extends Error {
    httpStatus = 400
    code = 'ERREUR'
  },
}))
jest.mock('../../../modules/scolarite/services/DemandeDocumentWorkflowService', () => ({
  DemandeDocumentWorkflowService: { promouvoirAuComiteSiPret: jest.fn() },
}))

const { DemandeDocument } = require('../../../modules/scolarite/models/DemandeDocument')
const { DocumentDelivre } = require('../../../modules/scolarite/models/DocumentDelivre')
const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const { Utilisateur } = require('../../../modules/auth/models/Utilisateur')

beforeEach(() => jest.clearAllMocks())

describe('DemandeDocumentController - contrôle d\'accès', () => {
  it('refuse la liste complète des demandes à un parent', async () => {
    const res = mockResponse()

    await DemandeDocumentController.getAllDemandesDocument(
      mockRequest({ query: {}, utilisateurRole: 'parent', utilisateurId: 9 } as any),
      res
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeDocument.findAndCountAll).not.toHaveBeenCalled()
  })

  it('limite un apprenant à ses propres demandes', async () => {
    DemandeDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 })
    const res = mockResponse()

    await DemandeDocumentController.getAllDemandesDocument(
      mockRequest({ query: {}, utilisateurRole: 'apprenant', utilisateurId: 42 } as any),
      res
    )

    expect(DemandeDocument.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { etudiantId: 42 } })
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('recherche par nom, identifiant ou matricule pour le personnel', async () => {
    Utilisateur.findAll.mockResolvedValue([{ id: 7 }])
    DossierEtudiant.findAll.mockResolvedValue([{ utilisateurId: 8 }])
    DemandeDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 })
    const res = mockResponse()

    await DemandeDocumentController.getAllDemandesDocument(
      mockRequest({ query: { search: 'dupont' }, utilisateurRole: 'secretaire', utilisateurId: 3 } as any),
      res
    )

    expect(Utilisateur.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          [Op.or]: [
            { nom: { [Op.like]: '%dupont%' } },
            { prenoms: { [Op.like]: '%dupont%' } },
            { identifiant: { [Op.like]: '%dupont%' } },
          ],
        },
      })
    )
    expect(DossierEtudiant.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { matricule: { [Op.like]: '%dupont%' } } })
    )
    expect(DemandeDocument.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ etudiantId: { [Op.in]: [7, 8] } }),
      })
    )
  })

  it('renvoie une liste vide quand la recherche ne correspond à personne', async () => {
    Utilisateur.findAll.mockResolvedValue([])
    DossierEtudiant.findAll.mockResolvedValue([])
    DemandeDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 })
    const res = mockResponse()

    await DemandeDocumentController.getAllDemandesDocument(
      mockRequest({ query: { search: 'inconnu' }, utilisateurRole: 'admin', utilisateurId: 1 } as any),
      res
    )

    expect(DemandeDocument.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ etudiantId: { [Op.in]: [] } }),
      })
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('réserve le compteur des demandes au personnel interne', async () => {
    const res = mockResponse()

    await DemandeDocumentController.getCount(
      mockRequest({ utilisateurRole: 'enseignant', utilisateurId: 4 } as any),
      res
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeDocument.count).not.toHaveBeenCalled()
  })

  it('réserve la suppression au secrétariat et à la direction', async () => {
    const resRefus = mockResponse()
    await DemandeDocumentController.deleteDemandeDocument(
      mockRequest({ params: { id: '5' }, utilisateurRole: 'parent' } as any),
      resRefus
    )
    expect(resRefus.status).toHaveBeenCalledWith(403)

    const destroy = jest.fn().mockResolvedValue(undefined)
    DemandeDocument.findOne.mockResolvedValue({ id: 5, destroy })
    const resOk = mockResponse()
    await DemandeDocumentController.deleteDemandeDocument(
      mockRequest({ params: { id: '5' }, utilisateurRole: 'secretaire' } as any),
      resOk
    )
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(resOk.status).toHaveBeenCalledWith(200)
  })
})

describe('DemandeDocumentController - traitement', () => {
  it('ne régénère pas de document déjà délivré', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    DemandeDocument.findOne.mockResolvedValue({
      id: 12,
      statut: 'soumise',
      source: 'automatique',
      fraisPayes: true,
      typeDocumentId: 2,
      typeDocument: { libelle: 'Attestation' },
      anneeAcademiqueId: 1,
      parcoursId: 2,
      niveauEtudeId: 3,
      classeId: 4,
      update,
    })
    DocumentDelivre.findOne.mockResolvedValue({ demandeId: 12, fichierPDF: 'document-12.pdf' })
    const res = mockResponse()

    await DemandeDocumentController.traiterDemandeDocument(
      mockRequest({ params: { id: '12' }, body: { statut: 'delivree' }, utilisateurRole: 'institution' } as any),
      res
    )

    expect(DocumentDelivre.findOne).toHaveBeenCalledWith({ where: { demandeId: 12 } })
    expect(DocumentDelivre).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith({ statut: 'delivree' })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('renvoie 500 au lieu de laisser la promesse échouer', async () => {
    DemandeDocument.findOne.mockRejectedValue(new Error('db down'))
    const res = mockResponse()

    await DemandeDocumentController.traiterDemandeDocument(
      mockRequest({ params: { id: '12' }, body: { statut: 'delivree' }, utilisateurRole: 'institution' } as any),
      res
    )

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
  })
})
