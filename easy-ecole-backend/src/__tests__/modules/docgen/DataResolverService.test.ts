process.env.DB_DIALECT = 'mysql'
process.env.DB_HOST = 'localhost'
process.env.DB_NAME = 'test'
process.env.DB_USER = 'test'
process.env.DB_PASS = 'test'

import { DataResolverService } from '../../../modules/docgen/services/DataResolverService'
import { genererInitialesUniquesComite } from '../../../modules/inscription/services/ComiteInitialesService'

jest.mock('../../../modules/inscription/models/CursusApprenant', () => {
  const MockModel: any = jest.fn()
  MockModel.findOne = jest.fn()
  MockModel.findAll = jest.fn()
  MockModel.associations = {}
  return { CursusApprenant: MockModel }
})

jest.mock('../../../modules/inscription/models/DemandeInscription', () => {
  const MockModel: any = jest.fn()
  MockModel.findByPk = jest.fn()
  MockModel.findOne = jest.fn()
  MockModel.associations = {}
  return { DemandeInscription: MockModel }
})

jest.mock('../../../modules/inscription/models/ComiteVote', () => {
  const MockModel: any = jest.fn()
  MockModel.findAll = jest.fn()
  MockModel.associations = {}
  return { ComiteVote: MockModel }
})

jest.mock('../../../modules/inscription/models/CoursParticipant', () => {
  const MockModel: any = jest.fn()
  MockModel.findAll = jest.fn()
  MockModel.associations = {}
  return { CoursParticipant: MockModel }
})

jest.mock('../../../modules/inscription/models/Cours', () => {
  const MockModel: any = jest.fn()
  MockModel.findOne = jest.fn()
  MockModel.findAll = jest.fn()
  MockModel.associations = {}
  return { Cours: MockModel }
})

jest.mock('../../../modules/inscription/models/RegleEvaluation', () => {
  const MockModel: any = jest.fn()
  MockModel.findAll = jest.fn()
  MockModel.associations = {}
  return { RegleEvaluation: MockModel }
})

jest.mock('../../../modules/bulletins/models/EchelleNote', () => {
  const MockModel: any = jest.fn()
  MockModel.findAll = jest.fn()
  MockModel.associations = {}
  return { EchelleNote: MockModel }
})

jest.mock('../../../modules/etablissement/models/Etablissement', () => {
  const MockModel: any = jest.fn()
  MockModel.findOne = jest.fn()
  MockModel.associations = {}
  return { Etablissement: MockModel }
})

jest.mock('../../../modules/auth/models/Enseignant', () => {
  const MockModel: any = jest.fn()
  MockModel.findByPk = jest.fn()
  MockModel.associations = {}
  return { Enseignant: MockModel }
})

describe('DataResolverService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('resolve est une fonction statique', () => {
    expect(typeof DataResolverService.resolve).toBe('function')
  })

  it('génère des initiales uniques en suffixant les doublons', () => {
    expect(genererInitialesUniquesComite([
      { prenoms: 'Jean', nom: 'Doe' },
      { prenoms: 'Jean', nom: 'Doe' },
      { prenoms: 'Jane', nom: 'Doe' },
    ])).toEqual(['JD', 'JD-1', 'JD-2'])
  })

  it('résout les initiales des votes validés du comité pour l’autorisation', async () => {
    const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')
    const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
    const { ComiteVote } = require('../../../modules/inscription/models/ComiteVote')
    const { CoursParticipant } = require('../../../modules/inscription/models/CoursParticipant')

    Etablissement.findOne.mockResolvedValue(null)
    DemandeInscription.findByPk.mockResolvedValue({
      id: 42,
      statutPipeline: 'valide',
      utilisateurId: 12,
      matricule: 'MAT-12',
      utilisateur: { nom: 'Doe', prenoms: 'Jane', identifiant: 'MAT-12' },
      parcoursChoisis: [{ parcours: { titre: 'Gestion', type: 'LICENCE' } }],
      session: { anneeAcademique: { libelle: '2026-2027' } },
    })
    ComiteVote.findAll.mockResolvedValue([
      { membre: { nom: 'Doe', prenoms: 'Jane' } },
      { membre: { nom: 'Doe', prenoms: 'Jane' } },
      { membre: { nom: 'Smith', prenoms: 'John' } },
    ])
    CoursParticipant.findAll.mockResolvedValue([])

    const result = await DataResolverService.resolve('API001', {
      typeCode: 'API001',
      sourceId: 42,
    })

    expect(ComiteVote.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { demandeInscriptionId: 42, decision: 'valide' },
    }))
    expect(result.initialesComite).toBe('JD, JD-1, JS')
  })

  it('getResolver retourne une fonction pour un code enregistré', () => {
    const resolver = DataResolverService.getResolver('NOT001')
    expect(resolver).toBeDefined()
    expect(typeof resolver).toBe('function')
  })

  it('getResolver retourne undefined pour un code inconnu', () => {
    const resolver = DataResolverService.getResolver('INCONNU')
    expect(resolver).toBeUndefined()
  })

  it('getResolver trouve ATTESTATION par code SCO001', () => {
    const resolver = DataResolverService.getResolver('SCO001')
    expect(resolver).toBeDefined()
  })

  it('enregistre les nouveaux formulaires annexes de la maquette', () => {
    expect(DataResolverService.getResolver('API002')).toBeDefined()
    expect(DataResolverService.getResolver('RCH008')).toBeDefined()
  })

  it('getResolver trouve DIPLOME par code DIP001', () => {
    const resolver = DataResolverService.getResolver('DIP001')
    expect(resolver).toBeDefined()
  })

  it('getResolver trouve PV par code DEL001', () => {
    const resolver = DataResolverService.getResolver('DEL001')
    expect(resolver).toBeDefined()
  })

  it('getResolver trouve DECISION par code ADM009', () => {
    const resolver = DataResolverService.getResolver('ADM009')
    expect(resolver).toBeDefined()
  })

  it('resolve avec code inconnu retourne les params', async () => {
    const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')
    Etablissement.findOne.mockResolvedValue(null)

    const result = await DataResolverService.resolve('INCONNU', { typeCode: 'INCONNU' } as any)
    expect(result.etablissement).toBeDefined()
    expect(result.etudiants).toEqual([])
  })

  it('resolve ATTESTATION avec cursusApprenantId', async () => {
    const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')
    const { CursusApprenant } = require('../../../modules/inscription/models/CursusApprenant')

    Etablissement.findOne.mockResolvedValue(null)
    CursusApprenant.findOne.mockResolvedValue({
      id: 1,
      utilisateur: { nom: 'Doe', prenoms: 'John', identifiant: 'MAT001' },
      classe: { libelle: 'Classe A' },
      parcours: { titre: 'Informatique' },
      anneeAcademique: { libelle: '2024-2025' },
    })

    const result = await DataResolverService.resolve('SCO001', { typeCode: 'SCO001', cursusApprenantId: 1 })
    expect(result.etudiants).toHaveLength(1)
    expect(result.etudiants[0].nom).toBe('Doe')
    expect(result.etudiants[0].prenom).toBe('John')
  })

  it('resolve RELEVE_NOTES avec getMention', async () => {
    const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')
    const { CursusApprenant } = require('../../../modules/inscription/models/CursusApprenant')
    const { EchelleNote } = require('../../../modules/bulletins/models/EchelleNote')

    Etablissement.findOne.mockResolvedValue(null)
    EchelleNote.findAll.mockResolvedValue([
      { noteMin: 16, noteMax: 20, mention: 'Très bien' },
      { noteMin: 14, noteMax: 15.99, mention: 'Bien' },
      { noteMin: 12, noteMax: 13.99, mention: 'Assez bien' },
      { noteMin: 10, noteMax: 11.99, mention: 'Passable' },
    ])
    CursusApprenant.findAll.mockResolvedValue([{
      id: 1,
      utilisateur: { nom: 'Test', prenoms: 'User', identifiant: 'MAT001' },
      classe: { libelle: 'Classe A' },
      parcours: { titre: 'Informatique' },
      niveauEtude: { libelle: 'Licence 1' },
      anneeAcademique: { libelle: '2024-2025' },
      coursParticipants: [{
        coursId: 10,
        cours: {
          code: 'UE-MAJ-1',
          intitule: 'Fondamentaux',
          categorieUe: 'MAJEURE',
          semestre: 'semestre1',
          creditEcts: 6,
          coefficient: 1,
        },
        notesEvaluation: [],
      }],
    }])

    const result = await DataResolverService.resolve('NOT001', {
      typeCode: 'NOT001',
      classeId: 1,
      semestre: 'semestre1',
    })
    expect(result.etudiants).toHaveLength(1)
    expect(result.etudiants[0].mention).toBe('Insuffisant')
    expect(result.etudiants[0].unites[0].categorieUe).toBe('MAJEURE')
    expect(result.etudiants[0].unites[0].categorieUeLibelle).toBe('UE majeure')
    expect(result.etudiants[0].unites[0].semestre).toBe('Semestre 1')
  })

  it('calcule le statut et les crédits obtenus pour chaque UE et ECUE', async () => {
    const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')
    const { CursusApprenant } = require('../../../modules/inscription/models/CursusApprenant')
    const { EchelleNote } = require('../../../modules/bulletins/models/EchelleNote')
    const { RegleEvaluation } = require('../../../modules/inscription/models/RegleEvaluation')

    Etablissement.findOne.mockResolvedValue(null)
    EchelleNote.findAll.mockResolvedValue([
      { noteMin: 10, noteMax: 20, mention: 'Admis' },
    ])
    RegleEvaluation.findAll.mockResolvedValue([
      { parcoursId: 2, semestre: 'semestre1', valeur: '10' },
    ])
    CursusApprenant.findAll.mockResolvedValue([{
      id: 1,
      parcoursId: 2,
      utilisateur: { nom: 'Test', prenoms: 'User', identifiant: 'MAT001' },
      classe: { libelle: 'Classe A' },
      parcours: { titre: 'Informatique' },
      niveauEtude: { libelle: 'Licence 1' },
      anneeAcademique: { libelle: '2024-2025' },
      coursParticipants: [{
        coursId: 10,
        cours: {
          code: 'UE-MAJ-1',
          intitule: 'Fondamentaux',
          categorieUe: 'MAJEURE',
          semestre: 'semestre1',
          creditEcts: 6,
          coefficient: 1,
        },
        notesEvaluation: [
          {
            note: 12,
            listeNoteEvaluation: {
              poidsTypeNoteEvaluation: 1,
              coursId: 101,
              cours: { id: 101, code: 'ECUE101', intitule: 'Algorithmes', creditEcts: 2, coefficient: 1 },
            },
          },
          {
            note: 8,
            listeNoteEvaluation: {
              poidsTypeNoteEvaluation: 1,
              coursId: 102,
              cours: { id: 102, code: 'ECUE102', intitule: 'Architecture', creditEcts: 2, coefficient: 1 },
            },
          },
        ],
      }],
    }])

    const result = await DataResolverService.resolve('NOT003', {
      typeCode: 'NOT003',
      cursusApprenantId: 1,
      semestre: 'semestre1',
    })
    const etudiant = result.etudiants[0]
    const ue = etudiant.unites[0]

    expect(ue).toMatchObject({
      code: 'UE-MAJ-1',
      moyenneUe: '10.00',
      statut: 'Validé',
      creditEcts: 6,
      creditsObtenus: 6,
    })
    expect(ue.matieres).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ECUE101', statut: 'Validé', creditsObtenus: 2 }),
      expect.objectContaining({ code: 'ECUE102', statut: 'Non validé', creditsObtenus: 0 }),
    ]))
    expect(etudiant.creditsTotal).toBe(6)
    expect(etudiant.creditsValides).toBe(6)
    expect(etudiant.uesValidees).toBe(1)
    expect(etudiant.uesTotal).toBe(1)
  })
})
