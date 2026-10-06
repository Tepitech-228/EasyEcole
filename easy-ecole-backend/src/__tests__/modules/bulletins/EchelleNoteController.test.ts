import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/bulletins/models/EchelleNote', () => ({
  EchelleNote: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}))

const { EchelleNote } = require('../../../modules/bulletins/models/EchelleNote')
import Controller from '../../../modules/bulletins/controllers/EchelleNoteController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('EchelleNoteController CRUD', () => {
  it('rejects score bounds outside the grading scale', async () => {
    const req = mockRequest({
      body: { libelle: 'Excellent', noteMin: -1, noteMax: 20, mention: 'A' },
      utilisateurRole: 'institution'
    } as any)
    const res = mockResponse()

    await Controller.create(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(EchelleNote.create).not.toHaveBeenCalled()
  })

  it('creates only allowed scale properties with explicit defaults', async () => {
    EchelleNote.create.mockResolvedValue({ id: 1 })
    const req = mockRequest({
      body: {
        libelle: ' Excellent ',
        noteMin: '16',
        noteMax: '20',
        mention: 'A',
        estActive: true,
        ordre: '2',
        id: 999,
        deletedAt: new Date()
      },
      utilisateurRole: 'institution'
    } as any)
    const res = mockResponse()

    await Controller.create(req, res)

    expect(EchelleNote.create).toHaveBeenCalledWith({
      libelle: 'Excellent',
      noteMin: 16,
      noteMax: 20,
      mention: 'A',
      estActive: true,
      ordre: 2
    })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('rejects an update that would invert the existing interval', async () => {
    const update = jest.fn()
    EchelleNote.findByPk.mockResolvedValue({ noteMin: 10, noteMax: 15, update })
    const req = mockRequest({
      params: { id: '3' },
      body: { noteMin: 18, id: 100 },
      utilisateurRole: 'institution'
    } as any)
    const res = mockResponse()

    await Controller.update(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(update).not.toHaveBeenCalled()
  })

  it('whitelists fields on update', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    EchelleNote.findByPk.mockResolvedValue({ noteMin: 10, noteMax: 15, update })
    const req = mockRequest({
      params: { id: '3' },
      body: { mention: 'Très bien', id: 100, deletedAt: new Date() },
      utilisateurRole: 'institution'
    } as any)
    const res = mockResponse()

    await Controller.update(req, res)

    expect(update).toHaveBeenCalledWith({ mention: 'Très bien' })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
