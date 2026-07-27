process.env.DB_DIALECT = 'mysql'
process.env.DB_HOST = 'localhost'
process.env.DB_NAME = 'test'
process.env.DB_USER = 'test'
process.env.DB_PASS = 'test'

import { DataResolverService } from '../../../modules/docgen/services/DataResolverService'

jest.mock('../../../modules/inscription/models/CursusApprenant', () => {
  const MockModel: any = jest.fn()
  MockModel.findOne = jest.fn()
  MockModel.findAll = jest.fn()
  MockModel.associations = {}
  return { CursusApprenant: MockModel }
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
      coursParticipants: [],
    }])

    const result = await DataResolverService.resolve('NOT001', { typeCode: 'NOT001', classeId: 1 })
    expect(result.etudiants).toHaveLength(1)
    expect(result.etudiants[0].mention).toBe('Insuffisant')
  })
})
