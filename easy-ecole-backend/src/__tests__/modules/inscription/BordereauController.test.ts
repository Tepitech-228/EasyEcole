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
  return { Bordereau }
})

jest.mock('../../../modules/inscription/models/DemandeInscription', () => {
  const DemandeInscription: any = jest.fn()
  DemandeInscription.findOne = jest.fn()
  DemandeInscription.associations = {}
  return { DemandeInscription }
})

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: { findOne: jest.fn() },
}))

jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: { findByPk: jest.fn() },
}))

jest.mock('../../../modules/inscription/services/EtudiantUploadStorageService', () => ({
  EtudiantUploadStorageService: {
    store: jest.fn(() => 'public/dossiers/2026-2027/Site/LICENCE/L1/Informatique/Etudiants/Etudiant_Test_123/Bordereaux/INSCRIPTION/DEMANDE_42/Version_01/bordereau.pdf'),
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

import Ctrl from '../../../modules/inscription/controllers/BordereauController'

describe('BordereauController.getAllBordereaux', () => {
  it('allows ESA_COMPTA to see audited bordereaux without an active site', async () => {
    const req = mockRequest({ utilisateurRole: 'esa_compta', etablissementId: null } as any)
    const res = mockResponse()
    ;(Bordereau.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 })

    await Ctrl.getAllBordereaux(req, res)

    expect(Bordereau.findAndCountAll).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
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
