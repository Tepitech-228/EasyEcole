import 'dotenv/config'
import { startIntegrationServer, getJSON, IntegrationServer } from '../../helpers/integration-server'

/**
 * Tests d'intégration — GET /api/v1/inscription/parcours/arborescence
 *
 * Ils frappent le VRAI endpoint HTTP (route → Authenticate → controller → base
 * MariaDB locale), ce qui valide bout en bout le filtrage par session / niveau
 * utilisé par la PHASE 1 du wizard d'inscription.
 */
describe('Integration — Parcours arborescence (API réelle)', () => {
  let srv: IntegrationServer

  beforeAll(async () => {
    srv = await startIntegrationServer()
  }, 30000)

  afterAll(async () => {
    await srv?.close()
  })

  it('retourne une arborescence non vide sans filtrage', async () => {
    const res = await getJSON(`${srv.baseUrl}/api/v1/inscription/parcours/arborescence`, srv.token)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const data = res.body.data as Array<{ type: string }>
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    // Les types attendus sont présents (au moins LICENCE et MASTER).
    const types = data.map((t) => t.type)
    expect(types).toContain('LICENCE')
    expect(types).toContain('MASTER')
  })

  it('filtre par niveauEtudeId=3 → uniquement des filières Licence 3', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/parcours/arborescence?niveauEtudeId=3`,
      srv.token
    )
    expect(res.status).toBe(200)
    const data = res.body.data as Array<{
      type: string
      grades: Array<{
        grade: string
        filieres: Array<{ niveauEtudeId: number }>
      }>
    }>
    // Chaque filière retournée doit être rattachée au niveau 3 (Licence 3).
    for (const type of data) {
      for (const g of type.grades) {
        for (const f of g.filieres) {
          expect(f.niveauEtudeId).toBe(3)
        }
      }
    }
  })

  // Points de repère issus du seed 015 : niveauEtudeId=3 (Licence 3) ⇒ 37 filières LICENCE.
  it('licence 3 (niveauEtudeId=3) expose des filières non vides', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/parcours/arborescence?niveauEtudeId=3`,
      srv.token
    )
    expect(res.status).toBe(200)
    const data = res.body.data as Array<{
      type: string
      grades: Array<{ grade: string; filieres: unknown[] }>
    }>
    const licence = data.find((d) => d.type === 'LICENCE')
    expect(licence).toBeDefined()
    const gradeLicence3 = licence?.grades.find((g) => g.grade === 'Licence 3')
    expect(gradeLicence3).toBeDefined()
    expect(gradeLicence3!.filieres.length).toBeGreaterThan(0)
  })

  it('refuse l’accès sans token (401) — middleware Authenticate réel', async () => {
    const res = await getJSON(`${srv.baseUrl}/api/v1/inscription/parcours/arborescence`, '')
    expect(res.status).toBe(401)
  })
})
