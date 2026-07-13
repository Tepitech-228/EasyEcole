import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import CategorieArticleController from '../../../modules/stock/controllers/CategorieArticleController'

jest.mock('../../../modules/stock/models/CategorieArticle', () => {
  const mockFindAll = jest.fn()
  const mockFindOne = jest.fn()
  const mockCreate = jest.fn()
  const Mock: any = jest.fn()
  Mock.findAll = mockFindAll
  Mock.findOne = mockFindOne
  Mock.create = mockCreate
  return { CategorieArticle: Mock }
})

const { CategorieArticle } = require('../../../modules/stock/models/CategorieArticle')

beforeEach(() => { jest.clearAllMocks() })

describe('CategorieArticleController.getAll', () => {
  it('retourne 200', async () => {
    ;(CategorieArticle.findAll as jest.Mock).mockResolvedValue([{ id: 1, libelle: 'Cat A' }])
    const res = mockResponse()
    await CategorieArticleController.getAll(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    ;(CategorieArticle.findAll as jest.Mock).mockRejectedValue(new Error('err'))
    const res = mockResponse()
    await CategorieArticleController.getAll(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('CategorieArticleController.get', () => {
  it('retourne 200 si trouvé', async () => {
    ;(CategorieArticle.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await CategorieArticleController.get(mockRequest({ params: { id: '1' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(CategorieArticle.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await CategorieArticleController.get(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('CategorieArticleController.create', () => {
  it('crée et retourne 200', async () => {
    ;(CategorieArticle.create as jest.Mock).mockResolvedValue({ id: 1, libelle: 'New' })
    const res = mockResponse()
    await CategorieArticleController.create(mockRequest({ body: { libelle: 'New' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 400 si doublon', async () => {
    const err: any = new Error('Dup')
    err.name = 'SequelizeUniqueConstraintError'
    ;(CategorieArticle.create as jest.Mock).mockRejectedValue(err)
    const res = mockResponse()
    await CategorieArticleController.create(mockRequest({ body: { libelle: 'Dup' } }), res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('CategorieArticleController.update', () => {
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(CategorieArticle.findOne as jest.Mock).mockResolvedValue({ id: 1, update: up })
    const res = mockResponse()
    await CategorieArticleController.update(mockRequest({ params: { id: '1' }, body: { libelle: 'M' } }), res)
    expect(up).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(CategorieArticle.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await CategorieArticleController.update(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('CategorieArticleController.delete', () => {
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(CategorieArticle.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await CategorieArticleController.delete(mockRequest({ params: { id: '1' } }), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(CategorieArticle.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await CategorieArticleController.delete(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})
