process.env.DB_DIALECT = 'mysql'
process.env.DB_HOST = 'localhost'
process.env.DB_NAME = 'test'
process.env.DB_USER = 'test'
process.env.DB_PASS = 'test'

jest.mock('../../../modules/docgen/models/DocGenReference', () => ({
  DocGenReference: {
    findOrCreate: jest.fn(),
    associations: {}
  }
}))

jest.mock('../../../modules/docgen/models/DocGenType', () => ({
  DocGenType: {
    findByPk: jest.fn(),
    associations: {}
  }
}))

import { ReferenceService } from '../../../modules/docgen/services/ReferenceService'
import { DocGenReference } from '../../../modules/docgen/models/DocGenReference'
import { DocGenType } from '../../../modules/docgen/models/DocGenType'

const mockFindOrCreate = DocGenReference.findOrCreate as jest.Mock
const mockFindByPk = DocGenType.findByPk as jest.Mock

describe('ReferenceService', () => {
  let mockRefSave: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockRefSave = jest.fn().mockResolvedValue(undefined)
    // Aucun type en base : le service retombe sur String(typeId) comme code.
    mockFindByPk.mockResolvedValue(null)
  })

  it('génère une référence au format ESA-ANNEE-TYPEID-XXXX', async () => {
    mockFindOrCreate.mockResolvedValue([{ compteur: 0, save: mockRefSave }])
    const annee = new Date().getFullYear()
    const ref = await ReferenceService.generer(1)
    expect(ref).toMatch(new RegExp(`^ESA-${annee}-1-0001$`))
    expect(mockRefSave).toHaveBeenCalled()
  })

  it('incrémente le compteur', async () => {
    mockFindOrCreate.mockResolvedValue([{ compteur: 5, save: mockRefSave }])
    const ref = await ReferenceService.generer(1)
    expect(ref).toContain('-0006')
  })

  it('utilise le typeId et annee pour findOrCreate', async () => {
    mockFindOrCreate.mockResolvedValue([{ compteur: 0, save: mockRefSave }])
    await ReferenceService.generer(42)
    expect(mockFindOrCreate).toHaveBeenCalledWith({
      where: { typeId: 42, annee: new Date().getFullYear() },
      defaults: { typeId: 42, annee: new Date().getFullYear(), compteur: 0 }
    })
  })

  it('gère de grands nombres', async () => {
    mockFindOrCreate.mockResolvedValue([{ compteur: 99999, save: mockRefSave }])
    const ref = await ReferenceService.generer(1)
    expect(ref).toContain('-100000')
  })
})
