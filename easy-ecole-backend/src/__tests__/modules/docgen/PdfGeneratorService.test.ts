jest.mock('../../../core/services/PuppeteerBrowserPool', () => ({
  getPuppeteerBrowser: jest.fn(),
}))

jest.mock('../../../modules/docgen/services/AutorisationProvisoirePdfService', () => ({
  AutorisationProvisoirePdfService: { generate: jest.fn() },
}))

import { getPuppeteerBrowser } from '../../../core/services/PuppeteerBrowserPool'
import { AutorisationProvisoirePdfService } from '../../../modules/docgen/services/AutorisationProvisoirePdfService'
import { PdfGeneratorService } from '../../../modules/docgen/services/PdfGeneratorService'

const mockGetPuppeteerBrowser = getPuppeteerBrowser as jest.Mock
const mockAutorisationGenerate = AutorisationProvisoirePdfService.generate as jest.Mock

const baseParams = {
  html: '<p>Document</p>',
  etablissement: { nom: 'ESA' },
  etudiant: { nom: 'Kouassi', prenom: 'Aya', matricule: '2026-L1-J-26-ESA' },
  reference: 'API-2026-001',
  dateGeneration: '2026-11-06',
  initialesComite: 'AK, JD',
}

describe('PdfGeneratorService.generateDocGen', () => {
  it("génère l'autorisation provisoire (API001) sans Chromium", async () => {
    const pdf = Buffer.from('%PDF-1.7')
    mockAutorisationGenerate.mockResolvedValue(pdf)

    const result = await PdfGeneratorService.generateDocGen({ ...baseParams, typeCode: 'API001' })

    expect(result).toBe(pdf)
    expect(mockAutorisationGenerate).toHaveBeenCalledWith({
      etablissement: baseParams.etablissement,
      etudiant: baseParams.etudiant,
      reference: baseParams.reference,
      dateGeneration: baseParams.dateGeneration,
      initialesComite: baseParams.initialesComite,
    })
    expect(mockGetPuppeteerBrowser).not.toHaveBeenCalled()
  })

  it('utilise Chromium pour les autres types de documents', async () => {
    mockGetPuppeteerBrowser.mockRejectedValue(new Error('chromium indisponible'))

    await expect(
      PdfGeneratorService.generateDocGen({ ...baseParams, typeCode: 'SCO001' }),
    ).rejects.toThrow('chromium indisponible')

    expect(mockGetPuppeteerBrowser).toHaveBeenCalled()
    expect(mockAutorisationGenerate).not.toHaveBeenCalled()
  })
})
