import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/ParcoursChoisi', () => {
  const ParcoursChoisi: any = jest.fn()
  ParcoursChoisi.findAll = jest.fn()
  ParcoursChoisi.findOne = jest.fn()
  ParcoursChoisi.create = jest.fn()
  ParcoursChoisi.findAndCountAll = jest.fn()
  ParcoursChoisi.findByPk = jest.fn()
  ParcoursChoisi.count = jest.fn()
  ParcoursChoisi.associations = { prerequisParcoursChoisis: 'prerequisParcoursChoisis' }
  return { ParcoursChoisi }
})

jest.mock('../../../core/helpers/DatabaseConnection', () => {
  const { Sequelize } = require('sequelize')
  const sequelize = new Sequelize({
    database: 'easyecole_test',
    username: 'root',
    password: '',
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    logging: false,
  })
  sequelize.transaction = jest.fn()
  return { DatabaseConnection: { instance: null, getInstance: jest.fn(() => ({ sequelize })) } }
})

const { ParcoursChoisi } = require('../../../modules/inscription/models/ParcoursChoisi')
const { DatabaseConnection } = require('../../../core/helpers/DatabaseConnection')
const sequelize = DatabaseConnection.getInstance().sequelize
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
    expect(res.send).toHaveBeenCalledWith(mockData)
  })
})

describe('getParcoursChoisi', () => {
  it('should return one parcoursChoisi by id', async () => {
    const req = mockRequest({ params: { id: '1' } } as any)
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(ParcoursChoisi.findOne as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getParcoursChoisi(req, res)

    expect(ParcoursChoisi.findOne).toHaveBeenCalledWith({ where: { id: '1' } })
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.getParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createParcoursChoisi', () => {
  it('should return 403 if role is not AP, IN, or AD', async () => {
    const req = mockRequest({ body: {}, utilisateurRole: 'enseignant' } as any)
    const res = mockResponse()

    await Ctrl.createParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 201 on success for AP role', async () => {
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() }
    ;(sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction)
    const req = mockRequest({ body: { parcoursId: 1 }, utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.create as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createParcoursChoisi(req, res)

    expect(sequelize.transaction).toHaveBeenCalled()
    expect(ParcoursChoisi.create).toHaveBeenCalled()
    expect(mockTransaction.commit).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })
})

describe('updateParcoursChoisi', () => {
  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({})
    const req = mockRequest({ params: { id: '1' }, body: { parcoursId: 2 }, utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findOne as jest.Mock).mockResolvedValue({ id: 1, update: mockUpdate })

    await Ctrl.updateParcoursChoisi(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteParcoursChoisi', () => {
  it('should return 403 for IN role', async () => {
    const req = mockRequest({ utilisateurRole: 'institution' } as any)
    const res = mockResponse()

    await Ctrl.deleteParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found for role admin', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteParcoursChoisi(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on success for AP role', async () => {
    const mockItem = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.findOne as jest.Mock).mockResolvedValue(mockItem)

    await Ctrl.deleteParcoursChoisi(req, res)

    expect(mockItem.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for authorized roles', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(ParcoursChoisi.count as jest.Mock).mockResolvedValue(5)

    await Ctrl.getCount(req, res)

    expect(ParcoursChoisi.count).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 })
  })
})
