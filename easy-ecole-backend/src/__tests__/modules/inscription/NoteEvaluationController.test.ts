import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/NoteEvaluation', () => ({
  NoteEvaluation: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn()
  }
}))

jest.mock('../../../modules/inscription/models/CoursParticipant', () => ({
  CoursParticipant: { findAll: jest.fn(), findByPk: jest.fn(), associations: { cours: 'cours' } }
}))

jest.mock('../../../modules/inscription/models/ListeNoteEvaluation', () => ({
  ListeNoteEvaluation: { findByPk: jest.fn(), associations: { cours: 'cours' } }
}))

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: { findOne: jest.fn() }
}))

jest.mock('../../../modules/bulletins/models/AuditNote', () => ({
  AuditNote: { create: jest.fn() }
}))

jest.mock('../../../modules/inscription/models/SemestreAcademique', () => ({
  SemestreAcademique: { findOne: jest.fn() }
}))

jest.mock('../../../modules/inscription/models/Cours', () => ({
  Cours: { findByPk: jest.fn() }
}))

jest.mock('../../../modules/inscription/services/SemestreAcademiqueService', () => ({
  SemestreAcademiqueService: { canWriteNotes: jest.fn(() => ({ allowed: true })) }
}))

jest.mock('../../../core/helpers/DatabaseConnection', () => {
  const sequelize = { transaction: jest.fn() }
  return {
    DatabaseConnection: {
      getInstance: jest.fn(() => ({ sequelize }))
    }
  }
})

const { NoteEvaluation } = require('../../../modules/inscription/models/NoteEvaluation')
const { CoursParticipant } = require('../../../modules/inscription/models/CoursParticipant')
const { ListeNoteEvaluation } = require('../../../modules/inscription/models/ListeNoteEvaluation')
const { Enseignant } = require('../../../modules/auth/models/Enseignant')
const { AuditNote } = require('../../../modules/bulletins/models/AuditNote')
const { SemestreAcademique } = require('../../../modules/inscription/models/SemestreAcademique')
const { Cours } = require('../../../modules/inscription/models/Cours')
const { DatabaseConnection } = require('../../../core/helpers/DatabaseConnection')
import Controller from '../../../modules/inscription/controllers/NoteEvaluationController'

const sequelize = DatabaseConnection.getInstance().sequelize

beforeEach(() => {
  jest.clearAllMocks()
})

describe('NoteEvaluationController bulk CRUD', () => {
  it('rejects invalid notes before querying or writing', async () => {
    const req = mockRequest({
      body: { listeNoteEvaluationId: 3, notes: [{ coursParticipantId: 8, note: 25 }] },
      utilisateurRole: 'institution',
      utilisateurId: 2
    } as any)
    const res = mockResponse()

    await Controller.bulkUpsert(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(ListeNoteEvaluation.findByPk).not.toHaveBeenCalled()
    expect(NoteEvaluation.create).not.toHaveBeenCalled()
  })

  it('refuses teachers who do not own the evaluation course', async () => {
    ListeNoteEvaluation.findByPk.mockResolvedValue({ id: 3, coursId: 5 })
    Enseignant.findOne.mockResolvedValue({ id: 7 })
    Cours.findByPk.mockResolvedValue({ id: 5, enseignantId: 9 })
    const req = mockRequest({
      body: { listeNoteEvaluationId: 3, notes: [{ coursParticipantId: 8, note: 15 }] },
      utilisateurRole: 'enseignant',
      utilisateurId: 2
    } as any)
    const res = mockResponse()

    await Controller.bulkUpsert(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(sequelize.transaction).not.toHaveBeenCalled()
  })

  it('updates existing notes instead of relying on a missing composite unique key', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } }
    sequelize.transaction.mockImplementation(async (callback: (value: any) => Promise<any>) => callback(transaction))
    ListeNoteEvaluation.findByPk.mockResolvedValue({
      id: 3,
      coursId: 5,
      anneeAcademiqueId: 2026,
      getCours: jest.fn().mockResolvedValue({ parcoursId: null })
    })
    CoursParticipant.findAll.mockResolvedValue([{ id: 8 }])
    const existing = { id: 11, coursParticipantId: 8, note: 12, statut: 'brouillon', save: jest.fn().mockResolvedValue(undefined) }
    NoteEvaluation.findAll.mockResolvedValue([existing])
    AuditNote.create.mockResolvedValue({})
    const req = mockRequest({
      body: { listeNoteEvaluationId: 3, notes: [{ coursParticipantId: 8, note: 16.5 }] },
      utilisateurRole: 'institution',
      utilisateurId: 2
    } as any)
    const res = mockResponse()

    await Controller.bulkUpsert(req, res)

    expect(existing.note).toBe(16.5)
    expect(existing.save).toHaveBeenCalledWith({ transaction })
    expect(NoteEvaluation.create).not.toHaveBeenCalled()
    expect(NoteEvaluation.bulkCreate).not.toHaveBeenCalled()
    expect(AuditNote.create).toHaveBeenCalledWith(expect.objectContaining({
      noteEvaluationId: 11,
      ancienneNote: 12,
      nouvelleNote: 16.5
    }), { transaction })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns a server error rather than allowing writes when semester state cannot be read', async () => {
    ListeNoteEvaluation.findByPk.mockResolvedValue({
      id: 3,
      coursId: 5,
      anneeAcademiqueId: 2026,
      getCours: jest.fn().mockResolvedValue({ parcoursId: 4, semestre: 'semestre1' })
    })
    SemestreAcademique.findOne.mockRejectedValue(new Error('database unavailable'))
    const req = mockRequest({
      body: { listeNoteEvaluationId: 3, notes: [{ coursParticipantId: 8, note: 16 }] },
      utilisateurRole: 'institution',
      utilisateurId: 2
    } as any)
    const res = mockResponse()

    await Controller.bulkUpsert(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(sequelize.transaction).not.toHaveBeenCalled()
  })

  it('prevents a teacher from deleting another teacher’s draft note', async () => {
    NoteEvaluation.findByPk.mockResolvedValue({
      id: 11,
      listeNoteEvaluationId: 3,
      coursParticipantId: 8,
      note: 14,
      statut: 'brouillon',
      destroy: jest.fn()
    })
    ListeNoteEvaluation.findByPk.mockResolvedValue({ id: 3, coursId: 5 })
    CoursParticipant.findByPk.mockResolvedValue({ id: 8, coursId: 5 })
    Enseignant.findOne.mockResolvedValue({ id: 7 })
    Cours.findByPk.mockResolvedValue({ id: 5, enseignantId: 9 })
    const req = mockRequest({
      params: { id: '11' },
      body: {},
      utilisateurRole: 'enseignant',
      utilisateurId: 2
    } as any)
    const res = mockResponse()

    await Controller.delete(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(sequelize.transaction).not.toHaveBeenCalled()
  })
})
