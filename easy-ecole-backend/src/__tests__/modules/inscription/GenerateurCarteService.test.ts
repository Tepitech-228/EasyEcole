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
import fs from 'fs'
import path from 'path'
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
      dateNaissance: '1985-08-12T00:00:00.000Z',
      classe: 'Licence 1',
      filiere: 'Informatique',
      anneeAcademique: '2026-2027',
      email: 'aya@example.test',
      utilisateurId: 7,
      periode: 'soir',
      option: 'JOUR',
    })).resolves.toBe('created/cartes/carte-test.pdf')

    const pdf = savePdf.mock.calls[0][0] as Buffer
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(1000)
    expect(textSpy).toHaveBeenCalledWith(
      'COURS DU JOUR',
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ width: expect.any(Number), lineBreak: false }),
    )
    expect(textSpy).toHaveBeenCalledWith('OPTION', expect.any(Number), expect.any(Number))
    expect(textSpy).toHaveBeenCalledWith('12/08/1985', expect.any(Number), 127, expect.any(Object))
    expect(textSpy.mock.calls.some(([text]) => text === 'SITE')).toBe(false)
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

  it('utilise la photo de profil lorsque la photo apprenant est référencée par son nom', async () => {
    const profilePhotoPath = path.resolve('public', 'auth', 'profiles', 'photo.jpg')
    const existsSync = fs.existsSync
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((filePath) =>
      String(filePath) === profilePhotoPath || existsSync(filePath)
    )
    const imageSpy = jest.spyOn(PDFDocument.prototype, 'image')
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    await GenerateurCarteService.generer({
      nom: 'Kouassi',
      prenom: 'Aya',
      matricule: '2026-L1-J-26-ESA',
      dateNaissance: '1985-08-12',
      photo: 'photo.jpg',
      classe: 'Licence 1',
      filiere: 'Informatique',
      anneeAcademique: '2026-2027',
      email: 'aya@example.test',
      utilisateurId: 7,
    })

    expect(existsSyncSpy).toHaveBeenCalledWith(profilePhotoPath)
    expect(imageSpy).toHaveBeenCalledWith(
      profilePhotoPath,
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ fit: expect.any(Array) }),
    )
    warnSpy.mockRestore()
    existsSyncSpy.mockRestore()
    imageSpy.mockRestore()
  })
})
