jest.mock('../../../modules/inscription/models/DemandeInscription', () => ({
  DemandeInscription: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    associations: {
      utilisateur: {},
      parcoursChoisis: {},
      session: {},
      cours: {},
      coursChoisis: {},
      paiementsInscription: {},
      reponseInscription: {},
      dossiersDemande: {},
      preInscription: {},
    },
  },
}))

jest.mock('../../../modules/inscription/models/Bordereau', () => ({
  Bordereau: { findByPk: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/ParcoursChoisi', () => ({
  ParcoursChoisi: { associations: { parcours: {} } },
}))

jest.mock('../../../modules/inscription/models/Cours', () => ({
  Cours: { findAll: jest.fn(), associations: { classe: {} } },
}))

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: { findOne: jest.fn(), findByPk: jest.fn() },
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
  DossierStorageService: {
    creerDossierEtudiant: jest.fn(),
    copierFichier: jest.fn(),
    deplacerFichier: jest.fn(),
    cheminRelatif: jest.fn(),
  },
}))

jest.mock('../../../modules/inscription/services/GenerateurCarteService', () => ({
  GenerateurCarteService: { generer: jest.fn().mockResolvedValue('created/cartes/carte-test.pdf') },
}))

jest.mock('../../../modules/ged/services/FolderAutoService', () => ({
  FolderAutoService: { creerDossierMatricule: jest.fn() },
}))

const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
const { Bordereau } = require('../../../modules/inscription/models/Bordereau')
const fs = require('fs')
const { Cours } = require('../../../modules/inscription/models/Cours')
const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const { CursusApprenant } = require('../../../modules/inscription/models/CursusApprenant')
const { NiveauEtude } = require('../../../modules/inscription/models/NiveauEtude')
const { GenerateurCarteService } = require('../../../modules/inscription/services/GenerateurCarteService')
const { DossierStorageService } = require('../../../modules/inscription/services/DossierStorageService')
const { FolderAutoService } = require('../../../modules/ged/services/FolderAutoService')
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
    DossierEtudiant.findOne.mockImplementation(({ where }: { where: { matricule?: string } }) =>
      Promise.resolve(where.matricule ? null : dossier),
    )

    await expect(
      BordereauDossierService.finaliserAffectationPedagogique(90, { utilisateurId: 5 }, {} as any),
    ).rejects.toThrow('Arrêt du test après la création du cursus')

    expect(NiveauEtude.findByPk).toHaveBeenCalledWith(44, { transaction: expect.anything() })
    expect(DossierStorageService.creerDossierEtudiant).not.toHaveBeenCalled()
    expect(FolderAutoService.creerDossierMatricule).not.toHaveBeenCalled()
    expect(CursusApprenant.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { demandeInscriptionId: 12 },
        defaults: expect.objectContaining({ niveauEtudeId: 44 }),
        transaction: expect.anything(),
      }),
    )
  })

  it('génère et enregistre la carte après la finalisation sans transaction ouverte', async () => {
    const dossier = { update: jest.fn().mockResolvedValue(undefined) }
    DossierEtudiant.findByPk.mockResolvedValue(dossier)

    await BordereauDossierService.genererCarteEtudiantDifferee({
      dossierId: 55,
      data: {
        nom: 'Kouassi',
        prenom: 'Aya',
        matricule: '2026-L1-J-26-ESA',
        dateNaissance: '01/01/2005',
        classe: 'Licence 1',
        filiere: 'Informatique',
        anneeAcademique: '2026-2027',
        email: 'aya@example.test',
        utilisateurId: 90,
      },
    })

    expect(GenerateurCarteService.generer).toHaveBeenCalledWith(expect.objectContaining({
      utilisateurId: 90,
      matricule: '2026-L1-J-26-ESA',
    }))
    expect(DossierEtudiant.findByPk).toHaveBeenCalledWith(55)
    expect(dossier.update).toHaveBeenCalledWith({
      cartePath: 'created/cartes/carte-test.pdf',
      carteGeneree: true,
    })
  })

  describe('BordereauDossierService.preparerDossierEtudiantDiffere', () => {
    it('crée les dossiers locaux et GED après la finalisation', async () => {
      const dossier = {
        anneeAcademique: '2025-2026',
        parcours: 'LICENCE',
        classe: 'À affecter',
        niveau: 'Licence 1',
        matricule: '2025-L1-J-26-TEST',
        anneeAcademiqueId: 22,
        utilisateurId: 5,
      }

      await BordereauDossierService.preparerDossierEtudiantDiffere(dossier)

      expect(DossierStorageService.creerDossierEtudiant).toHaveBeenCalledWith(
        dossier.anneeAcademique,
        dossier.parcours,
        dossier.classe,
        dossier.niveau,
        dossier.matricule,
      )
      expect(FolderAutoService.creerDossierMatricule).toHaveBeenCalledWith({
        anneeAcademiqueId: dossier.anneeAcademiqueId,
        parcoursNom: dossier.parcours,
        classeNom: dossier.classe,
        niveauNom: dossier.niveau,
        matricule: dossier.matricule,
        utilisateurId: dossier.utilisateurId,
      })
    })
  })

  describe('BordereauDossierService.deplacerFichiersDossierDiffere', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('keeps an authorization already stored in the student tree', async () => {
      const preInscription = {
        autorisationPDF: 'public/dossiers/2025-2026/Site/LICENCE/L1/Informatique/Etudiants/Etudiant/Dossiers/INSCRIPTION/DEMANDE_12/AUTORISATIONS/Version_01/API001.pdf',
        save: jest.fn().mockResolvedValue(undefined),
      }
      const bordereau = { fichier: 'public/dossiers/2025-2026/Etudiants/Etudiant/Bordereaux/bordereau.pdf' }
      DemandeInscription.findByPk.mockResolvedValue({ dossiersDemande: [], preInscription })
      Bordereau.findByPk.mockResolvedValue(bordereau)
      jest.spyOn(fs, 'existsSync').mockReturnValue(true)

      await BordereauDossierService.deplacerFichiersDossierDiffere({
        demandeId: 12,
        bordereauId: 34,
        baseChemin: {
          annee: '2025-2026',
          parcours: 'LICENCE',
          classe: 'À affecter',
          niveau: 'Licence 1',
          matricule: '2025-L1-J-26-TEST',
        },
      })

      expect(DossierStorageService.deplacerFichier).not.toHaveBeenCalled()
      expect(preInscription.save).not.toHaveBeenCalled()
    })

    it('met à jour le chemin du bordereau après chargement hors transaction', async () => {
      const bordereau = { fichier: 'bordereau.pdf', save: jest.fn().mockResolvedValue(undefined) }
      DemandeInscription.findByPk.mockResolvedValue({ dossiersDemande: [], preInscription: null })
      Bordereau.findByPk.mockResolvedValue(bordereau)
      DossierStorageService.deplacerFichier.mockReturnValue('destination/bordereau.pdf')
      DossierStorageService.cheminRelatif.mockReturnValue('destination/bordereau.pdf')
      jest.spyOn(fs, 'existsSync').mockReturnValue(true)

      await BordereauDossierService.deplacerFichiersDossierDiffere({
        demandeId: 12,
        bordereauId: 34,
        baseChemin: {
          annee: '2025-2026',
          parcours: 'LICENCE',
          classe: 'À affecter',
          niveau: 'Licence 1',
          matricule: '2025-L1-J-26-TEST',
        },
      })

      expect(DemandeInscription.findByPk).toHaveBeenCalledWith(12, {
        include: [
          DemandeInscription.associations.dossiersDemande,
          DemandeInscription.associations.preInscription,
        ],
      })
      expect(Bordereau.findByPk).toHaveBeenCalledWith(34)
      expect(bordereau.save).toHaveBeenCalledWith(undefined)
      expect(bordereau.fichier).toBe('destination/bordereau.pdf')
    })
  })
})
