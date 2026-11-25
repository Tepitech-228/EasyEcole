import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Bordereau', () => {
  const Bordereau: any = jest.fn()
  Bordereau.findOne = jest.fn()
  Bordereau.findByPk = jest.fn()
  Bordereau.findAndCountAll = jest.fn()
  Bordereau.associations = {
    echeance: {},
    utilisateur: {},
    validePar: {},
    quitus: {},
  }
  return {
    Bordereau,
    BORDEREAU_BANK_REFERENCES: ['ORABANK-TG116', 'IB BANK -TG024', 'ECOBANK TG055'],
  }
})

jest.mock('../../../modules/inscription/models/DemandeInscription', () => {
  const DemandeInscription: any = jest.fn()
  DemandeInscription.findOne = jest.fn()
  DemandeInscription.findAll = jest.fn()
  DemandeInscription.associations = {}
  return { DemandeInscription }
})

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: { findOne: jest.fn(), findAll: jest.fn() },
}))

jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: { findByPk: jest.fn(), findAll: jest.fn() },
}))

jest.mock('../../../modules/inscription/services/EtudiantUploadStorageService', () => ({
  EtudiantUploadStorageService: {
    store: jest.fn(() => 'storage/documents/uploads/2026-2027/Site/LICENCE/L1/Informatique/Etudiants/Etudiant_Test_123/Bordereaux/INSCRIPTION/DEMANDE_42/Version_01/bordereau.pdf'),
    resolveTreeFolders: jest.fn().mockResolvedValue(['2026-2027', 'Site', 'LICENCE', 'L1', 'Informatique']),
    removeTemporaryUpload: jest.fn(),
    removeStoredFile: jest.fn(),
  },
}))

jest.mock('../../../modules/inscription/models/Echeance', () => ({
  Echeance: {
    findByPk: jest.fn(),
    associations: { dossierEtudiant: {} },
  },
}))

jest.mock('../../../modules/inscription/models/RattrapageInscription', () => ({
  RattrapageInscription: { init: jest.fn(), associations: {} },
}))

jest.mock('../../../core/helpers/EmailSender', () => ({
  EmailSender: { getInstance: () => ({ sendConfirmationDemandeInscription: jest.fn(), sendValidationDemandeInscription: jest.fn() }) },
}))

jest.mock('../../../core/services/ArchiveGedService', () => ({
  ArchiveGedService: { archiverDocumentInscription: jest.fn() },
}))

jest.mock('../../../modules/inscription/services/DossierStorageService', () => ({
  DossierStorageService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/ged/services/FolderAutoService', () => ({
  FolderAutoService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/inscription/services/GenerateurCarteService', () => ({
  GenerateurCarteService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/inscription/services/GenerateurEcheancierService', () => ({
  GenerateurEcheancierService: { getInstance: () => ({}) },
  estModalitePaiement: jest.fn(() => true),
}))

jest.mock('../../../modules/inscription/services/GenerateurEcheancierScolariteService', () => ({
  GenerateurEcheancierScolariteService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/inscription/services/GenerateurEcheancierSessionService', () => ({
  nombreEcheances: jest.fn(() => 1),
}))

jest.mock('../../../modules/inscription/services/ImputationService', () => ({
  ImputationService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/inscription/services/SnapshotService', () => ({
  SnapshotService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/inscription/services/TarifService', () => ({
  TarifService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/docgen/services/DocGenGeneratorService', () => ({
  DocGenGeneratorService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/inscription/services/BordereauDossierService', () => ({
  BordereauDossierService: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/inscription/services/BordereauAffectationService', () => ({
  BordereauAffectationService: {
    actualiserPresenceEtRepartir: jest.fn(),
    estPrisEnChargePar: jest.fn(() => true),
    estAffecteA: jest.fn(() => true),
    effacerAffectation: jest.fn(),
  },
}))

jest.mock('../../../core/helpers/DocumentPDFGenerator', () => ({
  DocumentPDFGenerator: { getInstance: () => ({}) },
}))

jest.mock('../../../modules/comptabilite/helpers/ComptabiliteHelper', () => ({
  creerEcritureComptable: jest.fn(),
}))

jest.mock('../../../core/helpers/DatabaseConnection', () => {
  const tx = {
    LOCK: { UPDATE: 'UPDATE' },
    rollback: jest.fn(),
    commit: jest.fn(),
  }
  const sequelize = {
    transaction: jest.fn().mockResolvedValue(tx),
    define: jest.fn(),
    modelManager: {
      addModel: jest.fn(),
      define: jest.fn(),
      removeModel: jest.fn(),
      getModel: jest.fn(),
      models: {},
    },
    models: {},
  }
  return {
    DatabaseConnection: {
      getInstance: () => ({ sequelize }),
    },
  }
})

const { Bordereau } = require('../../../modules/inscription/models/Bordereau')
const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const { Utilisateur } = require('../../../modules/auth/models/Utilisateur')
const { DatabaseConnection } = require('../../../core/helpers/DatabaseConnection')
const { Op } = require('sequelize')

import Ctrl from '../../../modules/inscription/controllers/BordereauController'

describe('BordereauController.getAllBordereaux', () => {
  it('limits cabinet accounts to the active site', async () => {
    const req = mockRequest({ utilisateurRole: 'cabinet_comptable', utilisateurId: 12, etablissementId: 42 } as any)
    const res = mockResponse()
    ;(Bordereau.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 })

    await Ctrl.getAllBordereaux(req, res)

    expect(Bordereau.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ etablissementId: 42 }),
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('refuses cabinet access when no active site is selected', async () => {
    const req = mockRequest({ utilisateurRole: 'cabinet_comptable', utilisateurId: 12, etablissementId: null } as any)
    const res = mockResponse()

    await Ctrl.getAllBordereaux(req, res)

    expect(Bordereau.findAndCountAll).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('allows ESA_COMPTA to see audited bordereaux without an active site', async () => {
    const req = mockRequest({ utilisateurRole: 'esa_compta', etablissementId: null } as any)
    const res = mockResponse()
    ;(Bordereau.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 })

    await Ctrl.getAllBordereaux(req, res)

    expect(Bordereau.findAndCountAll).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('searches student names before applying pagination', async () => {
    const req = mockRequest({
      utilisateurRole: 'cabinet_comptable',
      utilisateurId: 12,
      etablissementId: 42,
      query: { statut: 'en_attente', recherche: 'Amina' },
    } as any)
    const res = mockResponse()
    Utilisateur.findAll.mockResolvedValue([{ id: 21 }])
    DossierEtudiant.findAll.mockResolvedValue([])
    DemandeInscription.findAll.mockResolvedValue([])
    Bordereau.findAndCountAll.mockResolvedValue({ rows: [], count: 0 })

    await Ctrl.getAllBordereaux(req, res)

    const calls = Bordereau.findAndCountAll.mock.calls
    const query = calls[calls.length - 1][0]
    expect(query.where[Op.or]).toEqual(expect.arrayContaining([
      { utilisateurId: { [Op.in]: [21] } },
      { numeroBordereau: { [Op.like]: '%Amina%' } },
    ]))
    expect(query.limit).toBe(20)
    expect(query.offset).toBe(0)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('searches student matricules before applying pagination', async () => {
    const req = mockRequest({
      utilisateurRole: 'cabinet_comptable',
      utilisateurId: 12,
      etablissementId: 42,
      query: { statut: 'en_attente', recherche: '2026-ST' },
    } as any)
    const res = mockResponse()
    Utilisateur.findAll.mockResolvedValue([])
    DossierEtudiant.findAll.mockResolvedValue([{ utilisateurId: 22 }])
    DemandeInscription.findAll.mockResolvedValue([{ utilisateurId: 23 }])
    Bordereau.findAndCountAll.mockResolvedValue({ rows: [], count: 0 })

    await Ctrl.getAllBordereaux(req, res)

    const calls = Bordereau.findAndCountAll.mock.calls
    const query = calls[calls.length - 1][0]
    expect(query.where[Op.or]).toEqual(expect.arrayContaining([
      { utilisateurId: { [Op.in]: [22, 23] } },
      { numeroBordereau: { [Op.like]: '%2026-ST%' } },
    ]))
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('BordereauController.getBordereau', () => {
  it('includes the active site in the lookup for cabinet accounts', async () => {
    const req = mockRequest({
      utilisateurRole: 'cabinet_comptable',
      utilisateurId: 12,
      etablissementId: 42,
      params: { id: '99' },
    } as any)
    const res = mockResponse()
    ;(Bordereau.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.getBordereau(req, res)

    expect(Bordereau.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: '99', etablissementId: 42 }),
    }))
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('BordereauController.validerBordereau', () => {
  it('allows a reused bank reference and saves the cabinet selection', async () => {
    jest.clearAllMocks()
    const bordereau: any = {
      id: 33,
      statut: 'en_attente',
      type: 'inscription',
      utilisateurId: 7,
      referenceBancaire: 'ORABANK-TG116',
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(Bordereau.findOne as jest.Mock)
      .mockResolvedValueOnce(bordereau)
      .mockResolvedValueOnce(null)
    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)

    const req = mockRequest({
      utilisateurRole: 'cabinet_comptable',
      utilisateurId: 12,
      etablissementId: 42,
      params: { id: '33' },
      body: {
        referenceBancaire: 'ORABANK-TG116',
        numeroBordereau: 'B-2026-001',
        datePaiement: '2026-11-23',
      },
    } as any)
    const res = mockResponse()

    await Ctrl.validerBordereau(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(bordereau.referenceBancaire).toBe('ORABANK-TG116')
    expect(bordereau.save).toHaveBeenCalled()
    const duplicateCheckWhere = (Bordereau.findOne as jest.Mock).mock.calls[1][0].where
    expect(duplicateCheckWhere.numeroBordereau).toBe('B-2026-001')
    expect(duplicateCheckWhere).not.toHaveProperty('referenceBancaire')
  })

  it.each([
    {
      existingUtilisateurId: 7,
      expectedCode: 'BORDEREAU_NUMERO_DEJA_UTILISE_PAR_MEME_ETUDIANT',
      expectedMessage: 'Alerte fraude : ce compte a déjà envoyé ce bordereau.',
    },
    {
      existingUtilisateurId: 8,
      expectedCode: 'BORDEREAU_NUMERO_DEJA_UTILISE_PAR_AUTRE_ETUDIANT',
      expectedMessage: "Alerte fraude : ce numéro de dépôt est déjà associé à l'étudiant Alex Dupont. Ne validez pas ce bordereau avant vérification.",
    },
  ])('returns an identity-aware conflict for an already-used receipt number', async ({
    existingUtilisateurId,
    expectedCode,
    expectedMessage,
  }) => {
    jest.clearAllMocks()
    const bordereau: any = {
      id: 33,
      statut: 'en_attente',
      type: 'inscription',
      utilisateurId: 7,
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(Bordereau.findOne as jest.Mock)
      .mockResolvedValueOnce(bordereau)
      .mockResolvedValueOnce({
        id: 42,
        utilisateurId: existingUtilisateurId,
        numeroBordereau: 'B-2026-001',
        utilisateur: { id: existingUtilisateurId, nom: 'Dupont', prenoms: 'Alex' },
      })

    const req = mockRequest({
      utilisateurRole: 'cabinet_comptable',
      utilisateurId: 12,
      etablissementId: 42,
      params: { id: '33' },
      body: {
        referenceBancaire: 'ORABANK-TG116',
        numeroBordereau: 'B-2026-001',
        datePaiement: '2026-11-23',
      },
    } as any)
    const res = mockResponse()

    await Ctrl.validerBordereau(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: expectedCode,
      message: expectedMessage,
      details: expect.objectContaining({
        numeroBordereau: 'B-2026-001',
        etudiant: { id: existingUtilisateurId, nom: 'Dupont', prenoms: 'Alex' },
      }),
    }))
  })
})

describe('BordereauController.corrigerBordereauAudite', () => {
  it('updates only the number and payment date of an audited bordereau', async () => {
    jest.clearAllMocks()
    const bordereau: any = {
      id: 33,
      utilisateurId: 7,
      statut: 'valide',
      numeroBordereau: 'B-OLD',
      datePaiement: new Date('2026-11-20T00:00:00.000Z'),
      referenceBancaire: 'REF-OLD',
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(Bordereau.findOne as jest.Mock)
      .mockResolvedValueOnce(bordereau)
      .mockResolvedValueOnce(null)

    const req = mockRequest({
      utilisateurRole: 'cabinet_comptable',
      utilisateurId: 12,
      etablissementId: 42,
      params: { id: '33' },
      body: {
        numeroBordereau: 'B-CORRIGE',
        datePaiement: '2026-11-24',
        referenceBancaire: 'ECOBANK TG055',
      },
    } as any)
    const res = mockResponse()

    await Ctrl.corrigerBordereauAudite(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(bordereau.numeroBordereau).toBe('B-CORRIGE')
    expect(bordereau.datePaiement.toISOString()).toBe('2026-11-24T00:00:00.000Z')
    expect(bordereau.referenceBancaire).toBe('ECOBANK TG055')
    expect(bordereau.save).toHaveBeenCalledWith({ transaction: expect.any(Object) })
  })

  it('rejects a bank reference outside the configured dropdown choices', async () => {
    jest.clearAllMocks()
    const bordereau: any = {
      id: 33,
      utilisateurId: 7,
      statut: 'valide',
      numeroBordereau: 'B-OLD',
      datePaiement: new Date('2026-11-20T00:00:00.000Z'),
      referenceBancaire: 'REF-OLD',
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(Bordereau.findOne as jest.Mock).mockResolvedValueOnce(bordereau)

    const req = mockRequest({
      utilisateurRole: 'cabinet_comptable',
      utilisateurId: 12,
      etablissementId: 42,
      params: { id: '33' },
      body: {
        numeroBordereau: 'B-OLD',
        datePaiement: '2026-11-24',
        referenceBancaire: 'REFERENCE-INCONNUE',
      },
    } as any)
    const res = mockResponse()

    await Ctrl.corrigerBordereauAudite(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(bordereau.save).not.toHaveBeenCalled()
  })

  it('refuses to modify a bordereau that has not been audited', async () => {
    jest.clearAllMocks()
    ;(Bordereau.findOne as jest.Mock).mockResolvedValueOnce({
      id: 33,
      utilisateurId: 7,
      statut: 'en_attente',
      save: jest.fn(),
    })

    const req = mockRequest({
      utilisateurRole: 'cabinet_comptable',
      utilisateurId: 12,
      etablissementId: 42,
      params: { id: '33' },
      body: {
        numeroBordereau: 'B-CORRIGE',
        datePaiement: '2026-11-24',
      },
    } as any)
    const res = mockResponse()

    await Ctrl.corrigerBordereauAudite(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Seuls les bordereaux déjà audités peuvent être corrigés.",
    }))
  })
})

describe('BordereauController.createBordereau', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Bordereau as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ id: 123, statut: 'en_attente' }),
    }))
  })

  it('refuses a duplicate active bordereau for the same inscription demand', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: {
        type: 'inscription',
        demandeId: '42',
        montant: '15000',
      },
      files: {
        fichier: [{ filename: 'bordereau.pdf' }],
      },
    } as any)
    const res = mockResponse()

    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({
      id: 42,
      createdAt: new Date('2026-10-01T00:00:00Z'),
    })
    ;(Bordereau.findOne as jest.Mock).mockResolvedValue({
      id: 9,
      statut: 'en_attente',
      createdAt: new Date('2026-10-01T07:00:00Z'),
    })

    await Ctrl.createBordereau(req, res)

    expect(Bordereau.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        type: 'inscription',
        utilisateurId: 7,
      }),
    }))
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('déjà actif'),
    }))
  })

  it('ignores rejected bordereaux when checking for active inscription bordereaux', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 7,
      etablissementId: 4,
      body: {
        type: 'inscription',
        demandeId: '42',
        montant: '15000',
      },
      files: {
        fichier: [{ filename: 'nouveau-bordereau.pdf' }],
      },
    } as any)
    const res = mockResponse()

    ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue({
      id: 42,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      matricule: 'ESA-123',
    })
    ;(Bordereau.findOne as jest.Mock).mockResolvedValue(null)
    ;(Utilisateur.findByPk as jest.Mock).mockResolvedValue({
      id: 7,
      nom: 'Etudiant',
      prenoms: 'Test',
    })
    ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.createBordereau(req, res)

    const where = (Bordereau.findOne as jest.Mock).mock.calls[0][0].where
    expect(where.type).toBe('inscription')
    expect(where.utilisateurId).toBe(7)
    expect(where.statut).toEqual(expect.objectContaining({
      [require('sequelize').Op.in]: ['en_attente', 'en_saisie_comptable', 'valide', 'traite']
    }))
    expect(where.statut).not.toEqual(expect.objectContaining({
      [require('sequelize').Op.in]: expect.arrayContaining(['rejete'])
    }))
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
