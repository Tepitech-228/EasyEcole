import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/CursusApprenant', () => ({
  CursusApprenant: {
    associations: {
      parcours: 'parcours',
      niveauEtude: 'niveauEtude',
      classe: 'classe',
      anneeAcademique: 'anneeAcademique',
      utilisateur: 'utilisateur',
    },
    findAndCountAll: jest.fn(),
  },
}))

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: {
    associations: { echeances: 'echeances' },
    findAll: jest.fn(),
  },
}))

jest.mock('../../../modules/inscription/models/SemestreAcademique', () => ({
  SemestreAcademique: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
}))

jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: { findAll: jest.fn() },
}))

import FinanceEcheanceController from '../../../modules/inscription/controllers/FinanceEcheanceController'
import { CursusApprenant } from '../../../modules/inscription/models/CursusApprenant'
import { SemestreAcademique } from '../../../modules/inscription/models/SemestreAcademique'

describe('FinanceEcheanceController.getEtudiantsIrreguliers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('ne joint pas les semestres multiples à la requête paginée des cursus', async () => {
    ;(CursusApprenant.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 })
    ;(SemestreAcademique.findAll as jest.Mock).mockResolvedValue([])
    const req = mockRequest({ query: { page: '1', limit: '20' } })
    ;(req as any).etablissementId = 3
    const res = mockResponse()

    await FinanceEcheanceController.getEtudiantsIrreguliers(req, res)

    const options = (CursusApprenant.findAndCountAll as jest.Mock).mock.calls[0][0]
    expect(options.include).toEqual([
      { association: 'parcours' },
      { association: 'niveauEtude' },
      { association: 'classe' },
      { association: 'anneeAcademique' },
      {
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenoms', 'identifiant'],
      },
    ])
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
