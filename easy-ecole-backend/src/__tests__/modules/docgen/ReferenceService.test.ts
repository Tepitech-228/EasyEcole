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

import { ReferenceService } from '../../../modules/docgen/services/ReferenceService'
import { DocGenReference } from '../../../modules/docgen/models/DocGenReference'

const mockFindOrCreate = DocGenReference.findOrCreate as jest.Mock

describe('ReferenceService', () => {
  let mockRefSave: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockRefSave = jest.fn().mockResolvedValue(undefined)
  })

  it('génère une référence au format DOC-ANNEE-TYPEID-XXXX', async () => {
    mockFindOrCreate.mockResolvedValue([{ compteur: 0, save: mockRefSave }])
    const annee = new Date().getFullYear()
    const ref = await ReferenceService.generer(1)
    expect(ref).toMatch(new RegExp(`^DOC-${annee}-1-0001$`))
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
