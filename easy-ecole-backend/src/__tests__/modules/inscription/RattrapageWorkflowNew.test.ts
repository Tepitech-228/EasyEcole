import { mockRequest, mockResponse } from '../../helpers/express-mocks'

// ---------------------------------------------------------------------------
// Mocks des modèles utilisés par RattrapageWorkflowController.
// On ne teste que la logique métier (gardes, validation, règles sans session),
// pas l'accès à une vraie base de données.
// ---------------------------------------------------------------------------

jest.mock('../../../modules/inscription/models/RattrapageInscription', () => {
  const RattrapageInscription: any = jest.fn()
  RattrapageInscription.findByPk = jest.fn()
  RattrapageInscription.findOne = jest.fn()
  RattrapageInscription.findAll = jest.fn()
  RattrapageInscription.create = jest.fn()
  RattrapageInscription.update = jest.fn()
  RattrapageInscription.associations = {
    rattrapageSession: 'rattrapageSession',
    demandeur: 'demandeur',
    documentsDeposes: 'documentsDeposes',
    bordereauDepose: 'bordereauDepose',
  }
  return { RattrapageInscription }
})

jest.mock('../../../modules/inscription/models/RattrapageSession', () => ({
  RattrapageSession: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    associations: {
      anneeAcademique: 'anneeAcademique',
      classes: 'classes',
      documentsRequis: 'documentsRequis',
      inscriptions: 'inscriptions',
    },
  },
}))

jest.mock('../../../modules/inscription/models/RattrapageSessionClasse', () => ({
  RattrapageSessionClasse: {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
  },
}))

jest.mock('../../../modules/inscription/models/RattrapageDocumentRequis', () => ({
  RattrapageDocumentRequis: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  },
}))

jest.mock('../../../modules/inscription/models/RattrapageDocumentDepose', () => ({
  RattrapageDocumentDepose: {
    findByPk: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
    associations: { documentRequis: 'documentRequis' },
  },
}))

jest.mock('../../../modules/inscription/models/AnneeAcademique', () => ({
  AnneeAcademique: { findByPk: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/Bordereau', () => ({
  Bordereau: {
    findByPk: jest.fn(),
    create: jest.fn(),
    associations: {},
  },
}))

jest.mock('../../../modules/comptabilite/models/ParametreFrais', () => ({
  ParametreFrais: { findOne: jest.fn() },
}))

// Utilisateur (résolution e-mail) : mocké pour ne pas toucher la base.
jest.mock('../../../modules/auth/models/Utilisateur', () => {
  const Utilisateur: any = jest.fn()
  Utilisateur.findByPk = jest.fn()
  return { Utilisateur }
})

jest.mock('../../../core/helpers/DatabaseConnection', () => ({
  DatabaseConnection: {
    getInstance: () => ({
      sequelize: { transaction: jest.fn() },
    }),
  },
}))

const { RattrapageInscription } = require('../../../modules/inscription/models/RattrapageInscription')
const { RattrapageSession } = require('../../../modules/inscription/models/RattrapageSession')
const { RattrapageDocumentRequis } = require('../../../modules/inscription/models/RattrapageDocumentRequis')
const { RattrapageDocumentDepose } = require('../../../modules/inscription/models/RattrapageDocumentDepose')
const Ctrl = require('../../../modules/inscription/controllers/RattrapageWorkflowController').default

const DOC_FIXES = ['autorisation_provisoire', 'quitus_bordereaux', 'bordereau_rattrapage']

beforeEach(() => {
  jest.clearAllMocks()
})

describe('RattrapageWorkflowController — pièces fixes & UE (demandes sans session)', () => {
  it('GET /documents-requis-fixes renvoie les 3 pièces fixes', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res: any = mockResponse()

    await Ctrl.documentsRequisFixes(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const data = res.json.mock.calls[0][0].data
    expect(data.map((d: any) => d.code).sort()).toEqual([...DOC_FIXES].sort())
  })

  it('GET /ues-non-validees est réservé à l’apprenant et dédoublonne les UE', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res: any = mockResponse()
    await Ctrl.uesNonValidees(req, res)
    expect(res.status).toHaveBeenCalledWith(403)

    // Cas apprenant : historique contenant des doublons.
    const req2 = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 5 } as any)
    const res2: any = mockResponse()
    ;(RattrapageInscription.findAll as jest.Mock).mockResolvedValue([
      { uesDemandees: ['UE Mathématiques', 'UE Méthodologie'], rattrapageSessionId: null, statutDemande: 'en_attente' },
      { uesDemandees: ['UE Mathématiques', 'UE Anglais'], rattrapageSessionId: 3, statutDemande: 'valide' },
    ])

    await Ctrl.uesNonValidees(req2, res2)

    expect(RattrapageInscription.findAll).toHaveBeenCalled()
    const data = res2.json.mock.calls[0][0].data
    expect(data.length).toBe(3) // 3 UE distinctes
    const codes = data.map((u: any) => u.code)
    expect(codes).toContain('UE Mathématiques')
    expect(codes).toContain('UE Méthodologie')
    expect(codes).toContain('UE Anglais')
  })
})

describe('RattrapageWorkflowController — creerDemande (session vs sans session)', () => {
  it('refuse la création par un non-apprenant', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    await Ctrl.creerDemande(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('exige une période pour une demande sans session (400)', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 5,
      body: { uesDemandees: ['UE Mathématiques'] },
    } as any)
    const res = mockResponse()
    await Ctrl.creerDemande(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('période'),
    }))
  })

  it('crée une demande sans session (orpheline) avec période + UE', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 5,
      body: { periode: '2026-2027', uesDemandees: ['UE Mathématiques', 'UE Méthodologie'] },
    } as any)
    const res = mockResponse()

    const demande = { id: 10, rattrapageSessionId: null, periode: '2026-2027', uesDemandees: ['UE Mathématiques', 'UE Méthodologie'] }
    ;(RattrapageInscription.create as jest.Mock).mockResolvedValue(demande)
    ;(RattrapageInscription.findByPk as jest.Mock).mockResolvedValue(demande)

    await Ctrl.creerDemande(req, res)

    expect(RattrapageInscription.create).toHaveBeenCalledWith(expect.objectContaining({
      rattrapageSessionId: null,
      periode: '2026-2027',
      uesDemandees: ['UE Mathématiques', 'UE Méthodologie'],
      statutDemande: 'en_attente',
    }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('refuse une seconde demande pour la même session de rattrapage', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 5,
      body: { rattrapageSessionId: 3 },
    } as any)
    const res = mockResponse()

    ;(RattrapageSession.findByPk as jest.Mock).mockResolvedValue({ id: 3, statut: 'ouverte' })
    ;(RattrapageInscription.findOne as jest.Mock).mockResolvedValue({ id: 99 }) // déjà une demande

    await Ctrl.creerDemande(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('déjà'),
    }))
  })
})

describe('RattrapageWorkflowController — uploaderDocument (pièces fixes pour demande sans session)', () => {
  const fakeFichier = { path: 'public/inscription/rattrapage/nonexistent.pdf', filename: 'f.pdf', originalname: 'f.pdf' }

  it('refuse une pièce fixe inconnue (400) pour une demande sans session', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 5,
      params: { id: '10' },
      body: { codeDocument: 'pièce_inconnue' },
    } as any) as any
    req.file = fakeFichier
    const res = mockResponse()

    ;(RattrapageInscription.findByPk as jest.Mock).mockResolvedValue({ id: 10, demandePar: 5, rattrapageSessionId: null })

    await Ctrl.uploaderDocument(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ codes: expect.any(Array) }))
  })

  it('accepte une pièce fixe valide (codeDocument) pour une demande sans session', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 5,
      params: { id: '10' },
      body: { codeDocument: 'autorisation_provisoire' },
    } as any) as any
    req.file = fakeFichier
    const res = mockResponse()

    ;(RattrapageInscription.findByPk as jest.Mock).mockResolvedValue({ id: 10, demandePar: 5, rattrapageSessionId: null })
    ;(RattrapageDocumentDepose.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(RattrapageDocumentDepose.findAll as jest.Mock).mockResolvedValue([])

    await Ctrl.uploaderDocument(req, res)

    expect(RattrapageDocumentDepose.create).toHaveBeenCalledWith(expect.objectContaining({
      rattrapageInscriptionId: 10,
      documentRequisId: null,
      codeDocument: 'autorisation_provisoire',
    }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('exige documentRequisId pour une demande rattachée à une session', async () => {
    const req = mockRequest({
      utilisateurRole: 'apprenant',
      utilisateurId: 5,
      params: { id: '10' },
      body: {},
    } as any) as any
    req.file = fakeFichier
    const res = mockResponse()

    ;(RattrapageInscription.findByPk as jest.Mock).mockResolvedValue({ id: 10, demandePar: 5, rattrapageSessionId: 3 })

    await Ctrl.uploaderDocument(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('documentRequisId'),
    }))
  })
})
