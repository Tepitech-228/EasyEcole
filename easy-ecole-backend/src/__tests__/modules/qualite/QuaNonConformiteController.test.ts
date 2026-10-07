import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/qualite/models/QuaNonConformite', () => {
  const QuaNonConformite: any = jest.fn()
  QuaNonConformite.findAll = jest.fn()
  QuaNonConformite.findByPk = jest.fn()
  QuaNonConformite.create = jest.fn()
  QuaNonConformite.count = jest.fn()
  return { QuaNonConformite }
})

jest.mock('../../../modules/qualite/models/QuaActionCorrective', () => ({
  QuaActionCorrective: jest.fn()
}))

const { QuaNonConformite } = require('../../../modules/qualite/models/QuaNonConformite')
import QuaNonConformiteController from '../../../modules/qualite/controllers/QuaNonConformiteController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('QuaNonConformiteController', () => {
  it('retourne les non-conformités avec les actions correctives', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const items = [{ id: 7, description: 'Écart de procédure' }]
    QuaNonConformite.findAll.mockResolvedValue(items)

    await QuaNonConformiteController.getAll(req, res)

    expect(QuaNonConformite.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [expect.objectContaining({ as: 'actionsCorrectives' })],
      order: [['createdAt', 'DESC']]
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(items)
  })

  it('retourne 404 si la non-conformité est absente', async () => {
    const req = mockRequest({ params: { id: '404' } })
    const res = mockResponse()
    QuaNonConformite.findByPk.mockResolvedValue(null)

    await QuaNonConformiteController.get(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
  })

  it('crée une non-conformité et retourne 201', async () => {
    const body = { type: 'majeure', source: 'audit', processus: 'achats', description: 'Pièce manquante', declareePar: 9 }
    const created = { id: 8, ...body }
    const req = mockRequest({ body })
    const res = mockResponse()
    QuaNonConformite.create.mockResolvedValue(created)

    await QuaNonConformiteController.create(req, res)

    expect(QuaNonConformite.create).toHaveBeenCalledWith(body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(created)
  })

  it('retourne 400 si la création échoue', async () => {
    const req = mockRequest({ body: { description: 'Invalide' } })
    const res = mockResponse()
    QuaNonConformite.create.mockRejectedValue(new Error('validation'))

    await QuaNonConformiteController.create(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
  })

  it('met à jour une non-conformité existante', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    const item = { id: 7, update }
    const body = { statut: 'traitee' }
    const req = mockRequest({ params: { id: '7' }, body })
    const res = mockResponse()
    QuaNonConformite.findByPk.mockResolvedValue(item)

    await QuaNonConformiteController.update(req, res)

    expect(update).toHaveBeenCalledWith(body)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(item)
  })

  it('retourne 500 si la lecture échoue', async () => {
    const req = mockRequest()
    const res = mockResponse()
    QuaNonConformite.findAll.mockRejectedValue(new Error('database unavailable'))

    await QuaNonConformiteController.getAll(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
