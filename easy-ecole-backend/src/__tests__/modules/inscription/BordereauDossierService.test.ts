jest.mock('../../../modules/inscription/models/DemandeInscription', () => ({
  DemandeInscription: {
    findOne: jest.fn(),
    associations: {
      utilisateur: {},
      parcoursChoisis: {},
      session: {},
      cours: {},
      coursChoisis: {},
      paiementsInscription: {},
      reponseInscription: {},
    },
  },
}))

jest.mock('../../../modules/inscription/models/ParcoursChoisi', () => ({
  ParcoursChoisi: { associations: { parcours: {} } },
}))

jest.mock('../../../modules/inscription/models/Cours', () => ({
  Cours: { findAll: jest.fn(), associations: { classe: {} } },
}))

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: { findOne: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/CursusApprenant', () => ({
  CursusApprenant: { findOrCreate: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/NiveauEtude', () => ({
  NiveauEtude: { findByPk: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/Session', () => ({
  Session: { associations: { anneeAcademique: {} } },
}))

jest.mock('../../../modules/inscription/services/DossierStorageService', () => ({
  DossierStorageService: { creerDossierEtudiant: jest.fn() },
}))

jest.mock('../../../modules/ged/services/FolderAutoService', () => ({
  FolderAutoService: { creerDossierMatricule: jest.fn() },
}))

const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
const { Cours } = require('../../../modules/inscription/models/Cours')
const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const { CursusApprenant } = require('../../../modules/inscription/models/CursusApprenant')
const { NiveauEtude } = require('../../../modules/inscription/models/NiveauEtude')
import { BordereauDossierService } from '../../../modules/inscription/services/BordereauDossierService'

describe('BordereauDossierService.finaliserAffectationPedagogique', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Cours.findAll.mockResolvedValue([])
    NiveauEtude.findByPk.mockResolvedValue({ id: 44, libelle: 'Licence 1' })
    CursusApprenant.findOrCreate.mockRejectedValue(new Error('Arrêt du test après la création du cursus'))
  })

  it('utilise le niveau de la session si le parcours et la classe ne définissent pas de niveau', async () => {
    const demande = {
      id: 12,
      utilisateurId: 90,
      typeDemande: 'inscription',
      modeFormation: 'presentiel',
      matricule: '2025-L1-J-26-TEST',
      matriculeEtudiant: '2025-L1-J-26-TEST',
      createdAt: new Date('2025-01-01'),
      update: jest.fn().mockResolvedValue(undefined),
      utilisateur: { apprenant: { periode: 'matin' } },
      reponseInscription: {},
      parcoursChoisis: [{
        parcoursId: 3,
        choixFinal: true,
        parcours: { id: 3, type: 'LICENCE', titre: 'Licence', niveauEtudeId: null },
      }],
      coursChoisis: [],
      paiementsInscription: [],
      session: {
        niveauEtudeId: 44,
        anneeAcademiqueId: 22,
        anneeAcademique: { libelle: '2025-2026' },
      },
    }
    const dossier = {
      id: 55,
      matricule: demande.matricule,
      etablissementId: null,
      update: jest.fn().mockResolvedValue(undefined),
    }
    DemandeInscription.findOne.mockResolvedValue(demande)
    DossierEtudiant.findOne.mockImplementation(({ where }) =>
      Promise.resolve(where.matricule ? null : dossier),
    )

    await expect(
      BordereauDossierService.finaliserAffectationPedagogique(90, { utilisateurId: 5 }, {} as any),
    ).rejects.toThrow('Arrêt du test après la création du cursus')

    expect(NiveauEtude.findByPk).toHaveBeenCalledWith(44, { transaction: expect.anything() })
    expect(CursusApprenant.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        defaults: expect.objectContaining({ niveauEtudeId: 44 }),
      }),
      { transaction: expect.anything() },
    )
  })
})
