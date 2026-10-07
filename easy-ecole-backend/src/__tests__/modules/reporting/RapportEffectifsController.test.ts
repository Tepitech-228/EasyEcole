import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import RapportEffectifsController from '../../../modules/reporting/controllers/RapportEffectifsController'

jest.mock('../../../modules/reporting/models/RptEffectif', () => ({
  RptEffectif: {
    findAll: jest.fn(),
    sum: jest.fn(),
  },
}))

const { RptEffectif } = require('../../../modules/reporting/models/RptEffectif')

describe('RapportEffectifsController', () => {
  it('filtre les rapports par classe et période', async () => {
    const rows = [{ classeId: 12, periode: '2026-09', nbInscrits: 30 }]
    RptEffectif.findAll.mockResolvedValue(rows)
    const req = mockRequest({ query: { classeId: '12', periode: '2026-09' } })
    const res = mockResponse()

    await RapportEffectifsController.getAll(req, res)

    expect(RptEffectif.findAll).toHaveBeenCalledWith({
      where: { classeId: '12', periode: '2026-09' },
      order: [['periode', 'ASC']],
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(rows)
  })

  it('agrège les colonnes de synthèse et retourne leurs résultats', async () => {
    RptEffectif.sum
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(90)
      .mockResolvedValueOnce(48)
      .mockResolvedValueOnce(52)
    const res = mockResponse()

    await RapportEffectifsController.getSummary(mockRequest(), res)

    expect(RptEffectif.sum.mock.calls.map(([column]: [string]) => column)).toEqual([
      'nbInscrits',
      'nbActifs',
      'nbHommes',
      'nbFemmes',
    ])
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      totalInscrits: 100,
      totalActifs: 90,
      totalHommes: 48,
      totalFemmes: 52,
    })
  })

  it('retourne 500 si la lecture du rapport échoue', async () => {
    RptEffectif.findAll.mockRejectedValue(new Error('read failed'))
    const res = mockResponse()

    await RapportEffectifsController.getAll(mockRequest(), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
