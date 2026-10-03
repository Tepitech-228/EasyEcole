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

jest.mock('../../../modules/inscription/models/RattrapageComiteVote', () => ({
  RattrapageComiteVote: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    associations: { rattrapageInscription: 'rattrapageInscription', membre: 'membre' },
  },
}))

jest.mock('../../../modules/inscription/models/RattrapagePlanning', () => ({
  RattrapagePlanning: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    associations: { enseignants: 'enseignants', classe: 'classe', session: 'session' },
  },
}))

jest.mock('../../../modules/inscription/models/RattrapageEnseignant', () => ({
  RattrapageEnseignant: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    associations: { enseignant: 'enseignant', planning: 'planning' },
  },
}))

jest.mock('../../../modules/inscription/models/RattrapageNote', () => ({
  RattrapageNote: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    bulkCreate: jest.fn(),
    associations: { rattrapageInscription: 'rattrapageInscription', ue: 'ue' },
  },
}))

jest.mock('../../../modules/inscription/models/Classe', () => ({
  Classe: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), associations: {} },
}))

jest.mock('../../../modules/inscription/models/Cours', () => ({
  Cours: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), associations: {} },
}))

jest.mock('../../../modules/inscription/models/Ecue', () => ({
  Ecue: { findByPk: jest.fn() },
}))

jest.mock('../../../modules/inscription/models/CoursParticipant', () => ({
  CoursParticipant: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), associations: {} },
}))

jest.mock('../../../modules/inscription/models/CursusApprenant', () => ({
  CursusApprenant: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), associations: {} },
}))

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), associations: {} },
}))

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), associations: {} },
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

jest.mock('../../../core/helpers/DatabaseConnection', () => {
  const transaction = jest.fn()
  return {
    mockTransaction: transaction,
    DatabaseConnection: {
      getInstance: () => ({ sequelize: { transaction } }),
    },
  }
})

jest.mock('../../../modules/bulletins/services/GenerationBulletinService', () => ({
  GenerationBulletinService: { generer: jest.fn() },
}))

const { RattrapageInscription } = require('../../../modules/inscription/models/RattrapageInscription')
const { RattrapageSession } = require('../../../modules/inscription/models/RattrapageSession')
const { RattrapageDocumentRequis } = require('../../../modules/inscription/models/RattrapageDocumentRequis')
const { RattrapageDocumentDepose } = require('../../../modules/inscription/models/RattrapageDocumentDepose')
const { RattrapageNote } = require('../../../modules/inscription/models/RattrapageNote')
const { RattrapagePlanning } = require('../../../modules/inscription/models/RattrapagePlanning')
const { Cours } = require('../../../modules/inscription/models/Cours')
const { CursusApprenant } = require('../../../modules/inscription/models/CursusApprenant')
const { CoursParticipant } = require('../../../modules/inscription/models/CoursParticipant')
const { GenerationBulletinService } = require('../../../modules/bulletins/services/GenerationBulletinService')
const { DatabaseConnection, mockTransaction } = require('../../../core/helpers/DatabaseConnection')
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

describe('RattrapageWorkflowController — validation de note', () => {
  it('refuse la validation par un autre rôle', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '8' } } as any)
    const res = mockResponse()

    await Ctrl.validerNote(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('valide la note de son enseignant auteur et recalcule le bulletin', async () => {
    const transaction = {
      LOCK: { UPDATE: 'UPDATE' },
      commit: jest.fn(),
      rollback: jest.fn(),
    }
    ;(mockTransaction as jest.Mock).mockResolvedValue(transaction)
    const note = {
      id: 8,
      rattrapageInscriptionId: 12,
      etudiantId: 30,
      ueId: 4,
      saisiPar: 50,
      note_rattrapage: 12,
      statut: 'saisie',
      update: jest.fn().mockResolvedValue(undefined),
    }
    ;(RattrapageNote.findByPk as jest.Mock).mockResolvedValue(note)
    ;(RattrapageInscription.findByPk as jest.Mock).mockResolvedValue({
      id: 12,
      statutDemande: 'valide',
      statutPaiement: 'paye',
      rattrapageSessionId: 6,
    })
    ;(RattrapageSession.findByPk as jest.Mock).mockResolvedValue({ anneeAcademiqueId: 2026 })
    ;(Cours.findByPk as jest.Mock).mockResolvedValue({ id: 4, parcoursId: 7, semestre: 'semestre1' })
    ;(CursusApprenant.findOne as jest.Mock).mockResolvedValue({
      id: 15,
      classeId: 3,
      parcoursId: 7,
    })
    ;(CoursParticipant.findOne as jest.Mock).mockResolvedValue({ id: 21 })
    ;(GenerationBulletinService.generer as jest.Mock).mockResolvedValue([{
      bulletin: { id: 19 },
      ues: [{ lignes: [{ coursId: 4 }] }],
    }])

    const req = mockRequest({
      utilisateurRole: 'enseignant',
      utilisateurId: 50,
      params: { id: '8' },
    } as any)
    const res = mockResponse()

    await Ctrl.validerNote(req, res)

    expect(note.update).toHaveBeenCalledWith({ statut: 'validée' }, { transaction })
    expect(GenerationBulletinService.generer).toHaveBeenCalledWith(
      3,
      'semestre1',
      2026,
      transaction,
      null,
      { refreshExisting: true, cursusApprenantId: 15 },
    )
    expect(transaction.commit).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
