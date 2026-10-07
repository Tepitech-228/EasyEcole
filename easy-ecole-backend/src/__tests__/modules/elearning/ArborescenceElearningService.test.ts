import { ArborescenceElearningService } from '../../../modules/elearning/services/ArborescenceElearningService'

jest.mock('../../../modules/inscription/models/AnneeAcademique', () => ({ AnneeAcademique: { findAll: jest.fn() } }))
jest.mock('../../../modules/inscription/models/Classe', () => ({ Classe: { findAll: jest.fn() } }))
jest.mock('../../../modules/inscription/models/Cours', () => ({ Cours: { findAll: jest.fn() } }))
jest.mock('../../../modules/inscription/models/NiveauEtude', () => ({ NiveauEtude: { findAll: jest.fn() } }))
jest.mock('../../../modules/inscription/models/Parcours', () => ({ Parcours: { findAll: jest.fn() } }))
jest.mock('../../../modules/inscription/models/SemestreAcademique', () => ({ SemestreAcademique: { findAll: jest.fn() } }))
jest.mock('../../../modules/elearning/models/CoursEnLigne', () => ({ CoursEnLigne: { findAll: jest.fn() } }))

const { AnneeAcademique } = require('../../../modules/inscription/models/AnneeAcademique')
const { Classe } = require('../../../modules/inscription/models/Classe')
const { Cours } = require('../../../modules/inscription/models/Cours')
const { NiveauEtude } = require('../../../modules/inscription/models/NiveauEtude')
const { Parcours } = require('../../../modules/inscription/models/Parcours')
const { SemestreAcademique } = require('../../../modules/inscription/models/SemestreAcademique')
const { CoursEnLigne } = require('../../../modules/elearning/models/CoursEnLigne')

const modelMocks = [AnneeAcademique, Parcours, NiveauEtude, Classe, Cours, CoursEnLigne, SemestreAcademique]

beforeEach(() => {
  jest.clearAllMocks()
  modelMocks.forEach((model) => model.findAll.mockResolvedValue([]))
})

describe('ArborescenceElearningService.construireArborescence', () => {
  it('assemble le catalogue et isole les cours en ligne non rattachés', async () => {
    AnneeAcademique.findAll.mockResolvedValue([{ id: 1, libelle: '2025-2026' }])
    Parcours.findAll.mockResolvedValue([{ id: 2, titre: 'Informatique', niveauEtudeId: 3, description: null }])
    NiveauEtude.findAll.mockResolvedValue([{ id: 3, libelle: 'Licence' }])
    Classe.findAll.mockResolvedValue([{ id: 5, libelle: 'L1', parcoursId: 2 }])
    Cours.findAll.mockResolvedValue([
      { id: 7, code: 'INF101', intitule: 'Algorithmique', parcoursId: 2, classeId: 5 },
    ])
    CoursEnLigne.findAll.mockResolvedValue([
      { id: 9, coursId: '7', titre: 'Introduction', statut: 'actif' },
      { id: 10, coursId: null, titre: 'Ressource libre' },
    ])
    SemestreAcademique.findAll.mockResolvedValue([{ anneeAcademiqueId: 1, parcoursId: 2 }])

    const result = await ArborescenceElearningService.construireArborescence()

    expect(result.annees[0].parcours[0].niveaux[0].classes[0].cours[0].coursEnLigne)
      .toEqual([expect.objectContaining({ id: 9, titre: 'Introduction', coursId: '7' })])
    expect(result.nonRattaches).toEqual([expect.objectContaining({ id: 10, titre: 'Ressource libre' })])
    expect(result.totaux).toMatchObject({
      coursEnLigne: 2,
      coursEnLigneRattaches: 1,
      coursEnLigneNonRattaches: 1,
    })
    expect(modelMocks.every((model) => model.findAll.mock.calls.length === 1)).toBe(true)
  })

  it('utilise tout le catalogue en l’absence de semestre pour une année', async () => {
    AnneeAcademique.findAll.mockResolvedValue([{ id: 1, libelle: '2025-2026' }])
    Parcours.findAll.mockResolvedValue([{ id: 2, titre: 'Informatique', niveauEtudeId: null }])
    Cours.findAll.mockResolvedValue([{ id: 7, code: 'INF101', intitule: 'Algorithmique', parcoursId: 2, classeId: null }])

    const result = await ArborescenceElearningService.construireArborescence()

    expect(result.annees[0].parcours.map((parcours: any) => parcours.id)).toEqual([2])
    expect(result.annees[0].parcours[0].niveaux[0].classes[0]).toMatchObject({
      id: null,
      libelle: 'Sans classe',
      estVirtuel: true,
    })
  })

  it('propage une erreur de lecture du catalogue', async () => {
    Cours.findAll.mockRejectedValue(new Error('indisponible'))

    await expect(ArborescenceElearningService.construireArborescence()).rejects.toThrow('indisponible')
  })
})
