import 'dotenv/config'
import { startIntegrationServer, getJSON, IntegrationServer } from '../../helpers/integration-server'

/**
 * Tests d'intégration — GET /api/v1/inscription/documents-requis-niveau
 *
 * Frappent le VRAI endpoint (route → Authenticate → controller → base),
 * ce qui valide le référentiel de documents requis par niveau utilisé à
 * l'étape 2 du wizard d'inscription.
 *
 * Convention : le backend transforme le paramètre `niveau` en uppercase
 * avant de requêter la table `ins_document_requis_niveau`.
 */
describe('Integration — Documents requis par niveau (API réelle)', () => {
  let srv: IntegrationServer

  beforeAll(async () => {
    srv = await startIntegrationServer()
  }, 30000)

  afterAll(async () => {
    await srv?.close()
  })

  // ── LICENCE 1 : tronc commun seul = 11 documents ──────────────────────
  it('LICENCE 1 retourne 11 documents (tronc commun)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=LICENCE 1`,
      srv.token
    )
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const docs = res.body.data as Array<{ code: string; niveau: string; ordre: number }>
    expect(docs.length).toBe(11)
    expect(docs[0].niveau).toBe('LICENCE 1')
    // Codes clés du tronc commun
    const codes = docs.map((d) => d.code)
    expect(codes).toContain('demande_dg')
    expect(codes).toContain('photo_identite')
    expect(codes).toContain('recu_frais_dossier')
  })

  // ── LICENCE 2 : tronc commun + relevés 1ère année = 12 documents ──────
  it('LICENCE 2 retourne 12 documents (tronc + relevés 1ère année)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=LICENCE 2`,
      srv.token
    )
    expect(res.status).toBe(200)
    const docs = res.body.data as Array<{ code: string }>
    expect(docs.length).toBe(12)
    const codes = docs.map((d) => d.code)
    expect(codes).toContain('releves_1ere')
  })

  // ── LICENCE 3 : tronc commun + relevés 1ère + 1ère&2ème = 13 documents ─
  it('LICENCE 3 retourne 13 documents (tronc + 2 niveaux de relevés)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=LICENCE 3`,
      srv.token
    )
    expect(res.status).toBe(200)
    const docs = res.body.data as Array<{ code: string }>
    expect(docs.length).toBe(13)
    const codes = docs.map((d) => d.code)
    expect(codes).toContain('releves_1ere')
    expect(codes).toContain('releves_2eme')
  })

  // ── MASTER : tronc commun + attestation réussite + relevés 3 ans = 13 ──
  it('MASTER 1 retourne 13 documents (tronc + attestation + relevés Licence)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=MASTER 1`,
      srv.token
    )
    expect(res.status).toBe(200)
    const docs = res.body.data as Array<{ code: string }>
    expect(docs.length).toBe(13)
    const codes = docs.map((d) => d.code)
    expect(codes).toContain('attestation_reussite')
    expect(codes).toContain('releves_licence')
  })

  it('MASTER 2 retourne 13 documents (même logique que Master 1)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=MASTER 2`,
      srv.token
    )
    expect(res.status).toBe(200)
    const docs = res.body.data as Array<{ code: string }>
    expect(docs.length).toBe(13)
  })

  // ── BTS : tronc commun = 11 documents (après seed corrige BTS 1 / BTS 2) ──
  it('BTS 1 retourne 11 documents (tronc commun — corrigé par le seed)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=BTS 1`,
      srv.token
    )
    expect(res.status).toBe(200)
    const docs = res.body.data as Array<{ code: string; niveau: string }>
    expect(docs.length).toBe(11)
    // Le niveau doit bien être « BTS 1 » (pas « BTS » sans numéro).
    expect(docs[0].niveau).toBe('BTS 1')
  })

  it('BTS 2 retourne 11 documents (tronc commun)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=BTS 2`,
      srv.token
    )
    expect(res.status).toBe(200)
    const docs = res.body.data as Array<{ code: string; niveau: string }>
    expect(docs.length).toBe(11)
    expect(docs[0].niveau).toBe('BTS 2')
  })

  // ── MBA : tronc commun = 11 documents ─────────────────────────────────
  it('MBA 1 retourne 11 documents (tronc commun)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=MBA 1`,
      srv.token
    )
    expect(res.status).toBe(200)
    const docs = res.body.data as Array<{ code: string }>
    expect(docs.length).toBe(11)
  })

  // ── Niveau vide / inexistant → 0 documents (valeur acceptée) ──────────
  it('Niveau inexistant retourne 0 documents', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=NIVEAU_FAKE_99`,
      srv.token
    )
    expect(res.status).toBe(200)
    const docs = res.body.data as unknown[]
    expect(docs.length).toBe(0)
  })

  it('refuse l’accès sans token (401)', async () => {
    const res = await getJSON(
      `${srv.baseUrl}/api/v1/inscription/documents-requis-niveau?niveau=LICENCE 1`,
      ''
    )
    expect(res.status).toBe(401)
  })
})
