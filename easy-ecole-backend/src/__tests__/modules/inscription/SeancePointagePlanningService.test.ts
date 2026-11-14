jest.mock('../../../modules/etablissement/models/Etablissement', () => ({
  Etablissement: { findByPk: jest.fn() },
}))
jest.mock('../../../modules/inscription/models/Seance', () => ({
  Seance: {
    findAll: jest.fn(),
    associations: {
      salleDeClasse: 'salleDeClasse',
      etablissement: 'etablissement',
    },
  },
}))

import SeancePointagePlanningService from '../../../modules/inscription/services/SeancePointagePlanningService'

const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')
const { Seance } = require('../../../modules/inscription/models/Seance')

beforeEach(() => {
  jest.clearAllMocks()
  Etablissement.findByPk.mockResolvedValue({ nom: 'Campus principal' })
})

describe('SeancePointagePlanningService.trouverCoursSuivant', () => {
  it('returns room and floor for the next course on the same site', async () => {
    Seance.findAll.mockResolvedValue([
      {
        id: 82,
        etablissementId: 4,
        heureDebut: '09:30:00',
        salle: 'Autre salle',
        etablissement: { nom: 'Campus annexe' },
      },
      {
        id: 83,
        etablissementId: 3,
        heureDebut: '10:00:00',
        salle: 'B204',
        salleDeClasse: { libelle: 'B204', etage: '2e étage' },
        etablissement: { nom: 'Campus principal' },
      },
    ])

    await expect(SeancePointagePlanningService.trouverCoursSuivant(
      9,
      3,
      '2026-10-17',
      '09:00:00',
      81
    )).resolves.toEqual({
      siteActuel: 'Campus principal',
      prochainCours: {
        site: 'Campus principal',
        heureDebut: '10:00:00',
        salle: 'B204',
        etage: '2e étage',
        memeSite: true,
      },
    })
  })

  it('returns the next site and time when no later course remains at the current site', async () => {
    Seance.findAll.mockResolvedValue([{
      id: 82,
      etablissementId: 4,
      heureDebut: '09:30:00',
      salle: 'C12',
      salleDeClasse: { libelle: 'C12', etage: null },
      etablissement: { nom: 'Campus annexe' },
    }])

    await expect(SeancePointagePlanningService.trouverCoursSuivant(
      9,
      3,
      '2026-10-17',
      '09:00:00',
      81
    )).resolves.toEqual({
      siteActuel: 'Campus principal',
      prochainCours: {
        site: 'Campus annexe',
        heureDebut: '09:30:00',
        salle: 'C12',
        etage: null,
        memeSite: false,
      },
    })
  })

  it('returns no next course when the teacher has no later scheduled class', async () => {
    Seance.findAll.mockResolvedValue([])

    await expect(SeancePointagePlanningService.trouverCoursSuivant(
      9,
      3,
      '2026-10-17',
      '09:00:00',
      81
    )).resolves.toEqual({
      siteActuel: 'Campus principal',
      prochainCours: null,
    })
  })
})
