import { CalculMoyenneUeService } from '../../../modules/bulletins/services/CalculMoyenneUeService'

jest.mock('../../../modules/bulletins/models/LigneBulletin', () => ({ LigneBulletin: {} }))
jest.mock('../../../modules/inscription/models/Mcc', () => ({ Mcc: {} }))

describe('CalculMoyenneUeService', () => {
  it('calcule une moyenne pondérée en ignorant les cours optionnels non suivis', () => {
    const mccs = [
      { coursId: 1, coefficient: 2, cours: { code: 'A', estObligatoire: true } },
      { coursId: 2, coefficient: 3, cours: { code: 'B', estObligatoire: false } },
      { coursId: 3, coefficient: 5, cours: { code: 'C', estObligatoire: false } },
    ]

    const [result] = CalculMoyenneUeService.calculerMoyennesUe(
      [{ id: 12, mccs }],
      [{ coursId: 1, moyenne: 12 }, { coursId: 2, moyenne: 18 }] as any,
      new Set(['1', '2']),
      10,
    )

    expect(result).toMatchObject({
      coursId: 12,
      moyenneUe: 15.6,
      sommeCoefUe: 5,
      aDesCoursActifs: true,
    })
    expect(result.details.map((detail) => detail.mcc.coursId)).toEqual([1, 2])
    expect(result.details.every((detail) => detail.estValide)).toBe(true)
  })

  it('conserve les notes absentes comme null et signale une UE sans moyenne calculable', () => {
    const [result] = CalculMoyenneUeService.calculerMoyennesUe(
      [{ id: 8, mccs: [{ coursId: 4, coefficient: 2, cours: { estObligatoire: true } }] }],
      [],
      new Set(),
      10,
    )

    expect(result.moyenneUe).toBe(0)
    expect(result.sommeCoefUe).toBe(0)
    expect(result.details[0]).toMatchObject({ moyenne: null, estValide: false })
  })

  it('retourne les cours éliminatoires sous le seuil configuré', () => {
    const [result] = CalculMoyenneUeService.calculerMoyennesUe(
      [{
        id: 1,
        mccs: [{
          coursId: 3,
          coefficient: 1,
          estEliminatoire: true,
          cours: { code: 'MAT1', intitule: 'Mathématiques' },
        }],
      }],
      [{ coursId: 3, moyenne: 6 }] as any,
      new Set(['3']),
      10,
    )

    expect(CalculMoyenneUeService.verifierUeEliminatoires([result], 7)).toEqual([{
      ueCode: 'MAT1',
      ueLibelle: 'Mathématiques',
      moyenne: 6,
      seuil: 7,
    }])
  })
})
