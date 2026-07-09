import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Parcours', () => {
  const Parcours: any = jest.fn()
  Parcours.findAll = jest.fn()
  Parcours.findOne = jest.fn()
  Parcours.create = jest.fn()
  Parcours.findAndCountAll = jest.fn()
  Parcours.findByPk = jest.fn()
  Parcours.associations = { niveauEtude: 'niveauEtude', cours: 'cours', prerequisParcours: 'prerequisParcours' }
  return { Parcours }
})

const { Parcours } = require('../../../modules/inscription/models/Parcours')
import Ctrl from '../../../modules/inscription/controllers/ParcoursController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllParcours', () => {
  it('should return all parcours with niveauEtude included', async () => {
    const req = mockRequest({ query: {} })
    const res = mockResponse()
    const mockData = [{ id: 1, titre: 'Parcours 1' }]
    ;(Parcours.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllParcours(req, res)

    expect(Parcours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ include: [{ association: 'niveauEtude' }] })
    )
    expect(res.json).toHaveBeenCalledWith(mockData)
  })

  it('should filter by niveauEtudeId when query param is provided', async () => {
    const req = mockRequest({ query: { niveauEtudeId: '2' } })
    const res = mockResponse()
    ;(Parcours.findAll as jest.Mock).mockResolvedValue([])

    await Ctrl.getAllParcours(req, res)

    expect(Parcours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { niveauEtudeId: 2 },
        include: [{ association: 'niveauEtude' }]
      })
    )
  })
})

describe('getParcours', () => {
  it('should return parcours with nested includes', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const mockData = { id: 1, titre: 'Parcours 1' }
    ;(Parcours.findByPk as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getParcours(req, res)

    expect(Parcours.findByPk).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        include: [
          { association: 'niveauEtude' },
          { association: 'cours', include: [{ association: 'classe' }] },
          {
            association: 'prerequisParcours',
            include: [
              { association: 'matierePrerequis' },
              { association: 'niveauEtude' }
            ]
          }
        ]
      })
    )
    expect(res.json).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Parcours.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.getParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createParcours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.createParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 with alreadyExists if duplicate titre found', async () => {
    const req = mockRequest({
      body: { titre: 'Existant' },
      utilisateur: { role: 'AD' }
    })
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createParcours(req, res)

    expect(Parcours.findOne).toHaveBeenCalledWith({ where: { titre: 'Existant' } })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ alreadyExists: true })
  })

  it('should return 200 on successful creation', async () => {
    const req = mockRequest({
      body: { titre: 'Nouveau Parcours' },
      utilisateur: { role: 'AD' }
    })
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValue(null)
    ;(Parcours.create as jest.Mock).mockResolvedValue({ id: 1, titre: 'Nouveau Parcours' })

    await Ctrl.createParcours(req, res)

    expect(Parcours.create).toHaveBeenCalledWith({ titre: 'Nouveau Parcours' })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('updateParcours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.updateParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if parcours not found', async () => {
    const req = mockRequest({
      params: { id: '999' },
      body: { titre: 'Updated' },
      utilisateur: { role: 'AD' }
    })
    const res = mockResponse()
    ;(Parcours.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should check duplicate if titre changed and existing found', async () => {
    const existing = { id: 1, titre: 'Original', save: jest.fn() }
    const req = mockRequest({
      params: { id: '1' },
      body: { titre: 'Changed' },
      utilisateur: { role: 'AD' }
    })
    const res = mockResponse()
    ;(Parcours.findByPk as jest.Mock).mockResolvedValue(existing)
    ;(Parcours.findOne as jest.Mock).mockResolvedValue({ id: 2, titre: 'Changed' })

    await Ctrl.updateParcours(req, res)

    expect(Parcours.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ alreadyExists: true })
  })

  it('should return 200 on successful update', async () => {
    const existing = { id: 1, titre: 'Original', save: jest.fn() }
    const req = mockRequest({
      params: { id: '1' },
      body: { titre: 'Updated' },
      utilisateur: { role: 'AD' }
    })
    const res = mockResponse()
    ;(Parcours.findByPk as jest.Mock).mockResolvedValue(existing)
    ;(Parcours.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateParcours(req, res)

    expect(existing.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteParcours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.deleteParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Parcours.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockParcours = { id: 1, destroy: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Parcours.findByPk as jest.Mock).mockResolvedValue(mockParcours)

    await Ctrl.deleteParcours(req, res)

    expect(mockParcours.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for authorized roles', async () => {
    const req = mockRequest({ utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Parcours.findAndCountAll as jest.Mock).mockResolvedValue({ count: 5 })

    await Ctrl.getCount(req, res)

    expect(Parcours.findAndCountAll).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ count: 5 })
  })
})
