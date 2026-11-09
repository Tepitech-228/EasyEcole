jest.mock('../../../modules/etablissement/models/Etablissement', () => ({
  Etablissement: { findOne: jest.fn().mockResolvedValue({ nomCommercial: 'ESA' }) },
}))

jest.mock('../../../core/services/QrTokenService', () => ({
  QrTokenService: { signer: jest.fn().mockReturnValue('token') },
}))

jest.mock('../../../core/services/PdfStorageService', () => ({
  savePdf: jest.fn().mockImplementation((content: Buffer) => {
    return { relativePath: 'created/cartes/carte-test.pdf', content }
  }),
}))

import PDFDocument from 'pdfkit'
import { GenerateurCarteService } from '../../../modules/inscription/services/GenerateurCarteService'

const { savePdf } = require('../../../core/services/PdfStorageService')

describe('GenerateurCarteService', () => {
  it('génère et stocke la carte sans lancer Chromium', async () => {
    const imageSpy = jest.spyOn(PDFDocument.prototype, 'image')
    const textSpy = jest.spyOn(PDFDocument.prototype, 'text')
    await expect(GenerateurCarteService.generer({
      nom: 'Kouassi',
      prenom: 'Aya',
      matricule: '2026-L1-J-26-ESA',
      dateNaissance: '01/01/2005',
      classe: 'Licence 1',
      filiere: 'Informatique',
      anneeAcademique: '2026-2027',
      email: 'aya@example.test',
      utilisateurId: 7,
      periode: 'soir',
      site: 'Lomé',
    })).resolves.toBe('created/cartes/carte-test.pdf')

    const pdf = savePdf.mock.calls[0][0] as Buffer
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(1000)
    expect(textSpy).toHaveBeenCalledWith(
      'COURS DU SOIR',
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ width: expect.any(Number), lineBreak: false }),
    )
    expect(textSpy).toHaveBeenCalledWith('OPTION', expect.any(Number), expect.any(Number))
    expect(textSpy).toHaveBeenCalledWith(
      'Lomé',
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ width: expect.any(Number), height: 9, lineBreak: false }),
    )
    expect(imageSpy).toHaveBeenCalledWith(
      expect.stringMatching(/logo-esa\.png$/),
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ fit: expect.any(Array) }),
    )
    expect(imageSpy).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.any(Number),
      42,
      { width: 42, height: 42 },
    )
  })
})
