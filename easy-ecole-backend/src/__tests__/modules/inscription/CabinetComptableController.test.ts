import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Bordereau', () => ({
  Bordereau: {
    sequelize: { query: jest.fn() },
  },
  BORDEREAU_BANK_REFERENCES: ['ORABANK-TG116', 'IB BANK -TG024', 'ECOBANK TG055'],
}))

import { CabinetComptableDashboardController } from '../../../modules/inscription/controllers/CabinetComptableController'
import { Bordereau } from '../../../modules/inscription/models/Bordereau'
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'

describe('CabinetComptableDashboardController.getStatistiquesBancaires', () => {
  const query = Bordereau.sequelize!.query as jest.Mock

  beforeEach(() => {
    query.mockReset()
  })

  it('refuse une période ou une granularité invalide avant toute requête SQL', async () => {
    const req = mockRequest({
      query: { dateDebut: '2026-02-30', dateFin: '2026-03-01', granularite: 'semaine' },
      utilisateurRole: RolesUtilisateur.CABINET_COMPTABLE,
      etablissementId: 4,
    } as any)
    const res = mockResponse()

    await CabinetComptableDashboardController.getStatistiquesBancaires(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('agrège les bordereaux traités par banque et respecte le site actif', async () => {
    query
      .mockResolvedValueOnce([
        { referenceBancaire: 'ORABANK-TG116', nombreEtudiants: '2', nombrePaiements: '3', montantTotal: '125000' },
      ])
      .mockResolvedValueOnce([
        { periode: '2026-01', referenceBancaire: 'ORABANK-TG116', nombreEtudiants: '2', montantTotal: '125000' },
      ])
      .mockResolvedValueOnce([{ nombreEtudiants: '2', nombrePaiements: '3', montantTotal: '125000' }])

    const req = mockRequest({
      query: { dateDebut: '2026-01-01', dateFin: '2026-01-31', granularite: 'mois' },
      utilisateurRole: RolesUtilisateur.CABINET_COMPTABLE,
      etablissementId: 4,
    } as any)
    const res = mockResponse()

    await CabinetComptableDashboardController.getStatistiquesBancaires(req, res)

    expect(query).toHaveBeenCalledTimes(3)
    expect(query.mock.calls[0][0]).toContain("statut = 'traite'")
    expect(query.mock.calls[0][1].replacements).toMatchObject({
      dateDebut: '2026-01-01',
      dateFin: '2026-01-31',
      etablissementId: 4,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        totalEtudiants: 2,
        nombrePaiements: 3,
        montantTotal: 125000,
        parBanque: [
          { referenceBancaire: 'ORABANK-TG116', nombreEtudiants: '2', nombrePaiements: '3', montantTotal: '125000' },
        ],
        evolution: [
          { periode: '2026-01', referenceBancaire: 'ORABANK-TG116', nombreEtudiants: '2', montantTotal: '125000' },
        ],
      },
    })
  })
})
