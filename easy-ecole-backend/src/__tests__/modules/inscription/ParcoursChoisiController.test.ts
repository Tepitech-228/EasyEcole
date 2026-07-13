import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/ParcoursChoisi', () => {
  const ParcoursChoisi: any = jest.fn()
  ParcoursChoisi.findAll = jest.fn()
  ParcoursChoisi.findOne = jest.fn()
  ParcoursChoisi.create = jest.fn()
  ParcoursChoisi.findAndCountAll = jest.fn()
  ParcoursChoisi.findByPk = jest.fn()
  ParcoursChoisi.associations = { prerequisParcoursChoisis: 'prerequisParcoursChoisis' }
  return { ParcoursChoisi }
})

const { ParcoursChoisi } = require('../../../modules/inscription/models/ParcoursChoisi')
import Ctrl from '../../../modules/inscription/controllers/ParcoursChoisiController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllParcoursChoisis', () => {
  it('should return all parcoursChoisi', async () => {
    const req = mockRequest({} as any)
    const res = mockResponse()
    const mockData = [{ id: 1 }]
    ;(ParcoursChoisi.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllParcoursChoisis(req, res)

    expect(ParcoursChoisi.findAll).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(mockData)
  })
})

describe('getParcoursChoisi', () => {
  it('should return one parcoursChoisi by id', async () => {
    const req = mockRequest({ params: { id: '1' } } as any)
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(ParcoursChoisi.findByPk as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getParcoursChoisi(req, res)

    expect(ParcoursChoisi.findByPk).toHaveBeenCalledWith('1')
    expect(res.json).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.getParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createParcoursChoisi', () => {
  it('should return 403 if role is not AP, IN, or AD', async () => {
    const req = mockRequest({ body: {}, utilisateurRole: 'EN' } as any)
    const res = mockResponse()

    await Ctrl.createParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 200 on success for AP role', async () => {
    const req = mockRequest({ body: { parcoursId: 1 }, utilisateurRole: 'AP' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.create as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('updateParcoursChoisi', () => {
  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateurRole: 'AP' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const existing = { id: 1, save: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, body: { parcoursId: 2 }, utilisateurRole: 'AP' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.updateParcoursChoisi(req, res)

    expect(existing.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteParcoursChoisi', () => {
  it('should return 403 for IN role', async () => {
    const req = mockRequest({ utilisateurRole: 'IN' } as any)
    const res = mockResponse()

    await Ctrl.deleteParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 403 for AD role', async () => {
    const req = mockRequest({ utilisateurRole: 'AD' } as any)
    const res = mockResponse()

    await Ctrl.deleteParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 200 on success for AP role', async () => {
    const mockItem = { id: 1, destroy: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'AP' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findByPk as jest.Mock).mockResolvedValue(mockItem)

    await Ctrl.deleteParcoursChoisi(req, res)

    expect(mockItem.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'AP' } as any)
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for authorized roles', async () => {
    const req = mockRequest({ utilisateurRole: 'AD' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findAndCountAll as jest.Mock).mockResolvedValue({ count: 5 })

    await Ctrl.getCount(req, res)

    expect(ParcoursChoisi.findAndCountAll).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ count: 5 })
  })
})
