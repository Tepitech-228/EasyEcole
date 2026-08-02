import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'
import { TypesPaiement } from '../../../core/enums/TypesPaiement'

jest.mock('../../../modules/inscription/models/PaiementInscription', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  Mock.associations = {
    utilisateur: 'utilisateur',
    demandeInscription: 'demandeInscription'
  }
  return { PaiementInscription: Mock }
})

jest.mock('../../../modules/inscription/models/DemandeInscription', () => {
  const Mock: any = jest.fn()
  Mock.findOne = jest.fn()
  Mock.findByPk = jest.fn()
  Mock.associations = {
    utilisateur: 'utilisateur',
    session: 'session',
    preInscription: 'preInscription',
    parcoursChoisis: 'parcoursChoisis',
    cours: 'cours',
    coursChoisis: 'coursChoisis',
    paiementsInscription: 'paiementsInscription',
    dossiersDemande: 'dossiersDemande',
    reponseInscription: 'reponseInscription'
  }
  return { DemandeInscription: Mock }
})

jest.mock('../../../modules/auth/models/Banque', () => {
  const Mock: any = jest.fn()
  Mock.findOne = jest.fn()
  return { Banque: Mock }
})

jest.mock('../../../modules/auth/models/CaissierBanque', () => {
  const Mock: any = jest.fn()
  return { CaissierBanque: Mock }
})

jest.mock('../../../modules/auth/models/Utilisateur', () => {
  const Mock: any = jest.fn()
  return { Utilisateur: Mock }
})

jest.mock('../../../core/helpers/IDGenerator', () => ({
  IDGenerator: {
    getInstance: () => ({
      generateNumeroPaiement: () => 'PAY-0001'
    })
  }
}))

jest.mock('../../../modules/comptabilite/helpers/ComptabiliteHelper', () => ({
  creerEcritureComptable: jest.fn().mockResolvedValue({ id: 1 }),
  lettrerEcritures411: jest.fn().mockResolvedValue(true)
}))

const { PaiementInscription } = require('../../../modules/inscription/models/PaiementInscription')
const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
const { creerEcritureComptable, lettrerEcritures411 } = require('../../../modules/comptabilite/helpers/ComptabiliteHelper')
import Ctrl from '../../../modules/inscription/controllers/PaiementInscriptionController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createPaiementInscription', () => {
  it('retourne 403 pour un rôle non autorisé', async () => {
    const req = mockRequest({ utilisateurRole: RolesUtilisateur.APPRENANT } as any)
    const res = mockResponse()

    await Ctrl.createPaiementInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si la demande d inscription n existe pas', async () => {
    const req = mockRequest({
      utilisateurRole: RolesUtilisateur.INSTITUTION,
      body: { matriculeInscription: 'MAT-001', montant: 50000 }
    } as any)
    const res = mockResponse()
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.createPaiementInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ matriculeNotExists: true })
  })

  it('crée un paiement et une écriture comptable 512/411 (INSC-1.2)', async () => {
    const mockDemande = { id: 42, matricule: 'MAT-001' }
    const mockSavedPaiement = {
      id: 100,
      numero: 'PAY-0001',
      matriculeInscription: 'MAT-001',
      montant: 50000,
      description: 'Paiement test',
      datePaiement: new Date(),
      type: TypesPaiement.ESPECE,
      utilisateurId: 1
    }
    const mockSave = jest.fn().mockResolvedValue(mockSavedPaiement)

    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(mockDemande)
    ;(PaiementInscription as jest.Mock).mockReturnValue({ save: mockSave })

    const req = mockRequest({
      utilisateurRole: RolesUtilisateur.INSTITUTION,
      utilisateurId: 1,
      body: { matriculeInscription: 'MAT-001', montant: 50000, description: 'Paiement test' }
    } as any)
    const res = mockResponse()

    await Ctrl.createPaiementInscription(req, res)

    expect(PaiementInscription as jest.Mock).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalled()

    // INSC-1.2: Vérifier que l'écriture utilise 411 (crédit) au lieu de 702
    expect(creerEcritureComptable).toHaveBeenCalledWith(
      expect.objectContaining({
        journalCode: 'VEN',
        compteDebitNumero: '512',
        compteCreditNumero: '411',
        montant: 50000,
        moduleSource: 'inscription',
        referenceModuleId: '100'
      })
    )

    // INSC-1.3: Vérifier que le lettrage est appelé
    expect(lettrerEcritures411).toHaveBeenCalledWith({
      referenceModuleId: '42',
      paiementId: '100',
      montant: 50000
    })

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(mockSavedPaiement)
  })

  it('crée un paiement pour CAISSIER_BANQUE avec type EN_LIGNE', async () => {
    const mockDemande = { id: 42, matricule: 'MAT-001' }
    const mockSavedPaiement = {
      id: 100,
      numero: 'PAY-0001',
      matriculeInscription: 'MAT-001',
      montant: 30000,
      description: 'Paiement en ligne',
      datePaiement: new Date(),
      type: TypesPaiement.EN_LIGNE,
      utilisateurId: 5
    }
    const mockSave = jest.fn().mockResolvedValue(mockSavedPaiement)

    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(mockDemande)
    ;(PaiementInscription as jest.Mock).mockReturnValue({ save: mockSave })

    const req = mockRequest({
      utilisateurRole: RolesUtilisateur.CAISSIER_BANQUE,
      utilisateurId: 5,
      body: { matriculeInscription: 'MAT-001', montant: 30000, description: 'Paiement en ligne' }
    } as any)
    const res = mockResponse()

    await Ctrl.createPaiementInscription(req, res)

    expect(creerEcritureComptable).toHaveBeenCalledWith(
      expect.objectContaining({
        compteCreditNumero: '411'
      })
    )
    expect(lettrerEcritures411).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('retourne 400 si la sauvegarde échoue', async () => {
    const mockDemande = { id: 42, matricule: 'MAT-001' }
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))

    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(mockDemande)
    ;(PaiementInscription as jest.Mock).mockReturnValue({ save: mockSave })

    const req = mockRequest({
      utilisateurRole: RolesUtilisateur.INSTITUTION,
      utilisateurId: 1,
      body: { matriculeInscription: 'MAT-001', montant: 50000 }
    } as any)
    const res = mockResponse()

    await Ctrl.createPaiementInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('getAllPaiementsInscription', () => {
  it('retourne 200 avec la liste pour INSTITUTION', async () => {
    const req = mockRequest({ utilisateurRole: RolesUtilisateur.INSTITUTION } as any)
    const res = mockResponse()
    const mockList = [{ id: 1, montant: 50000 }]
    ;(PaiementInscription.findAll as jest.Mock).mockResolvedValue(mockList)

    await Ctrl.getAllPaiementsInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(mockList)
  })

  it('retourne 500 en cas d erreur', async () => {
    const req = mockRequest({ utilisateurRole: RolesUtilisateur.INSTITUTION } as any)
    const res = mockResponse()
    ;(PaiementInscription.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await Ctrl.getAllPaiementsInscription(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
