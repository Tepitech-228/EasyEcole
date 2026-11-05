import { AutorisationProvisoirePdfService } from '../../../modules/docgen/services/AutorisationProvisoirePdfService'

describe('AutorisationProvisoirePdfService', () => {
  it('génère un PDF sans navigateur avec les informations de validation', async () => {
    const pdf = await AutorisationProvisoirePdfService.generate({
      etablissement: { nom: 'ESA' },
      etudiant: {
        nom: 'Kouassi',
        prenom: 'Aya',
        matricule: '2026-L1-J-26-ESA',
        dateNaissance: '01/01/2005',
        filiere: 'Informatique',
        anneeAcademique: '2026-2027',
      },
      reference: 'API-2026-001',
      dateGeneration: '2026-11-05',
      initialesComite: 'AK, JD',
    })

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(1000)
  })
})
