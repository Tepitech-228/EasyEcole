import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../core/helpers/DatabaseConnection')

jest.mock('../../../modules/inscription/models/Seance', () => ({
  Seance: {
    findByPk: jest.fn(),
    associations: { cours: 'cours' },
  },
}))

jest.mock('../../../modules/inscription/models/SeancePointage', () => ({
  SeancePointage: {
    findOrCreate: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
}))

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: { findOne: jest.fn() },
}))

import SeancePointageController from '../../../modules/inscription/controllers/SeancePointageController'

const { Seance } = require('../../../modules/inscription/models/Seance')
const { SeancePointage } = require('../../../modules/inscription/models/SeancePointage')
const { Enseignant } = require('../../../modules/auth/models/Enseignant')

const TODAY = '2026-11-10'

function seance(overrides: any = {}) {
  return {
    id: 7,
    titre: 'Algorithmique',
    publieeLe: new Date('2026-09-01T00:00:00.000Z'),
    enseignantId: 5,
    jourSemaine: '2',
    dateDebut: '2026-09-01',
    dateFin: '2027-06-30',
    heureDebut: '09:00:00',
    heureFin: '10:00:00',
    cours: { etablissementId: 3, intitule: 'Algorithmique' },
    ...overrides,
  }
}

function request(overrides: any = {}) {
  return mockRequest({
    utilisateurId: 42,
    etablissementId: 3,
    params: { id: '7' },
    body: { date: TODAY },
    ...overrides,
  } as any)
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  jest.setSystemTime(new Date(`${TODAY}T09:15:00.000Z`))
  ;(Seance.findByPk as jest.Mock).mockResolvedValue(seance())
  ;(Enseignant.findOne as jest.Mock).mockResolvedValue({ id: 5 })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('SeancePointageController.pointerDebut', () => {
  it('refuse une date invalide', async () => {
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request({ body: { date: '2026-02-31' } }), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_INPUT' }))
  })

  it('refuse une date qui n est pas le jour de la seance', async () => {
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request({ body: { date: '2026-11-09' } }), res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NOT_TODAY' }))
  })

  it('refuse une seance non publiee', async () => {
    ;(Seance.findByPk as jest.Mock).mockResolvedValue(seance({ publieeLe: null }))
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request(), res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NOT_PROGRAMMED' }))
  })

  it('refuse un enseignant qui n est pas titulaire de la seance', async () => {
    ;(Enseignant.findOne as jest.Mock).mockResolvedValue({ id: 99 })
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request(), res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(SeancePointage.findOrCreate).not.toHaveBeenCalled()
  })

  it('refuse le pointage sur un autre site que celui de la seance', async () => {
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request({ etablissementId: 4 }), res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'WRONG_SITE' }))
  })

  it('refuse un pointage trop tot', async () => {
    jest.setSystemTime(new Date(`${TODAY}T08:30:00.000Z`))
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request(), res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOO_EARLY', minutesRestantes: 30 }))
  })

  it('refuse un pointage apres la fin prevue de la seance', async () => {
    jest.setSystemTime(new Date(`${TODAY}T10:05:00.000Z`))
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request(), res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'SESSION_ENDED' }))
  })

  it('enregistre le debut de la seance avec le retard', async () => {
    ;(SeancePointage.findOrCreate as jest.Mock).mockResolvedValue([{ id: 11 }, true])
    ;(SeancePointage.update as jest.Mock).mockResolvedValue([1])
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request(), res)
    expect(SeancePointage.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      where: { seanceId: 7, date: TODAY },
      defaults: expect.objectContaining({ enseignantId: '5', utilisateurId: 42, etablissementId: 3 }),
    }))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      statut: 'en_cours',
      heureDebutReelle: '09:15:00',
      retardMinutes: 15,
    }))
  })

  it('utilise le site de la séance même si le cours est partagé entre sites', async () => {
    ;(Seance.findByPk as jest.Mock).mockResolvedValue(seance({
      etablissementId: 4,
      cours: { etablissementId: null, intitule: 'Algorithmique' }
    }))
    ;(SeancePointage.findOrCreate as jest.Mock).mockResolvedValue([{ id: 12 }, true])
    ;(SeancePointage.update as jest.Mock).mockResolvedValue([1])
    const res = mockResponse()

    await SeancePointageController.pointerDebut(request({ etablissementId: 4 }), res)

    expect(SeancePointage.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
      defaults: expect.objectContaining({ etablissementId: 4 }),
    }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('refuse un second pointage de debut', async () => {
    ;(SeancePointage.findOrCreate as jest.Mock).mockResolvedValue([{ id: 11 }, false])
    ;(SeancePointage.update as jest.Mock).mockResolvedValue([0])
    const res = mockResponse()
    await SeancePointageController.pointerDebut(request(), res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ALREADY_STARTED' }))
  })
})

describe('SeancePointageController.pointerFin', () => {
  it('exige le pointage du debut', async () => {
    ;(SeancePointage.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await SeancePointageController.pointerFin(request(), res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'START_REQUIRED' }))
  })

  it('refuse une fin deja pointee', async () => {
    ;(SeancePointage.findOne as jest.Mock).mockResolvedValue({
      id: 11,
      utilisateurId: 42,
      heureDebutReelle: '09:15:00',
      heureFinReelle: '09:50:00',
    })
    const res = mockResponse()
    await SeancePointageController.pointerFin(request(), res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ALREADY_FINISHED' }))
  })

  it('enregistre la fin de la seance et le depart anticipe', async () => {
    jest.setSystemTime(new Date(`${TODAY}T09:50:00.000Z`))
    ;(SeancePointage.findOne as jest.Mock).mockResolvedValue({
      id: 11,
      utilisateurId: 42,
      heureDebutReelle: '09:15:00',
      heureFinReelle: null,
    })
    ;(SeancePointage.update as jest.Mock).mockResolvedValue([1])
    const res = mockResponse()
    await SeancePointageController.pointerFin(request(), res)
    expect(SeancePointage.update).toHaveBeenCalledWith(
      { heureFinReelle: '09:50:00' },
      { where: { id: 11, heureFinReelle: null } },
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      statut: 'termine_en_avance',
      dureeMinutes: 35,
      departAnticipeMinutes: 10,
    }))
  })

  it('marque la seance terminee a l heure prevue', async () => {
    jest.setSystemTime(new Date(`${TODAY}T10:00:00.000Z`))
    ;(SeancePointage.findOne as jest.Mock).mockResolvedValue({
      id: 11,
      utilisateurId: 42,
      heureDebutReelle: '09:15:00',
      heureFinReelle: null,
    })
    ;(SeancePointage.update as jest.Mock).mockResolvedValue([1])
    const res = mockResponse()
    await SeancePointageController.pointerFin(request(), res)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      statut: 'termine',
      departAnticipeMinutes: 0,
    }))
  })
})
