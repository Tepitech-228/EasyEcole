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

function mockChromium(pdf: Buffer) {
  const page = {
    setContent: jest.fn().mockResolvedValue(undefined),
    pdf: jest.fn().mockResolvedValue(pdf),
    close: jest.fn().mockResolvedValue(undefined),
  }
  const browser = { newPage: jest.fn().mockResolvedValue(page) }
  mockGetPuppeteerBrowser.mockResolvedValue(browser)
  return { browser, page }
}

describe('PdfGeneratorService.generateDocGen', () => {
  it("génère l'autorisation provisoire (API001) avec Chromium quand il est disponible", async () => {
    const pdf = Buffer.from('%PDF-1.4 chromium')
    const { page } = mockChromium(pdf)

    const result = await PdfGeneratorService.generateDocGen({ ...baseParams, typeCode: 'API001' })

    expect(result).toEqual(pdf)
    expect(mockGetPuppeteerBrowser).toHaveBeenCalled()
    expect(page.pdf).toHaveBeenCalled()
    expect(mockAutorisationGenerate).not.toHaveBeenCalled()
  })

  it("bascule sur pdfkit si Chromium est indisponible pour API001", async () => {
    const pdf = Buffer.from('%PDF-1.3 pdfkit')
    mockGetPuppeteerBrowser.mockRejectedValue(new Error('chrome_crashpad_handler: --database is required'))
    mockAutorisationGenerate.mockResolvedValue(pdf)

    const result = await PdfGeneratorService.generateDocGen({ ...baseParams, typeCode: 'API001' })

    expect(result).toEqual(pdf)
    expect(mockAutorisationGenerate).toHaveBeenCalledWith({
      etablissement: baseParams.etablissement,
      etudiant: baseParams.etudiant,
      reference: baseParams.reference,
      dateGeneration: baseParams.dateGeneration,
      initialesComite: baseParams.initialesComite,
    })
  })

  it('ne bascule pas sur pdfkit pour les autres types de documents', async () => {
    mockGetPuppeteerBrowser.mockRejectedValue(new Error('chromium indisponible'))

    await expect(
      PdfGeneratorService.generateDocGen({ ...baseParams, typeCode: 'SCO001' }),
    ).rejects.toThrow('chromium indisponible')

    expect(mockAutorisationGenerate).not.toHaveBeenCalled()
  })
})
