import { verifierDocumentsObligatoires } from '../../../modules/inscription/controllers/RattrapageController'

describe('Rattrapage workflow', () => {
  it('renvoie les pièces obligatoires manquantes', () => {
    const required = [
      { id: 1, libelle: 'Certificat médical', obligatoire: true },
      { id: 2, libelle: 'Relevé de notes', obligatoire: true },
    ] as any[]

    const uploaded = [{ documentRequisId: 1 }] as any[]

    const result = verifierDocumentsObligatoires(required, uploaded)

    expect(result.ok).toBe(false)
    expect(result.missing).toEqual([2])
  })

  it('accepte un dossier complet', () => {
    const required = [
      { id: 1, libelle: 'Certificat médical', obligatoire: true },
      { id: 2, libelle: 'Relevé de notes', obligatoire: true },
    ] as any[]

    const uploaded = [
      { documentRequisId: 1 },
      { documentRequisId: 2 },
    ] as any[]

    const result = verifierDocumentsObligatoires(required, uploaded)

    expect(result.ok).toBe(true)
    expect(result.missing).toEqual([])
  })
})
