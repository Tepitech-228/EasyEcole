import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import ArticleController from '../../../modules/stock/controllers/ArticleController'

jest.mock('../../../modules/stock/models/Article', () => {
  const mockFindAll = jest.fn()
  const mockFindOne = jest.fn()
  const mockCreate = jest.fn()

  const MockArticle: any = jest.fn()
  MockArticle.findAll = mockFindAll
  MockArticle.findOne = mockFindOne
  MockArticle.create = mockCreate

  MockArticle.associations = {
    categorie: 'categorie',
    site: 'site',
  }

  return { Article: MockArticle }
})

const { Article } = require('../../../modules/stock/models/Article')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ArticleController.getAll', () => {
  it('retourne 200 avec la liste des articles', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeArticles = [{ id: 1, libelle: 'Article 1' }]
    ;(Article.findAll as jest.Mock).mockResolvedValue(fakeArticles)

    await ArticleController.getAll(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeArticles)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(Article.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await ArticleController.getAll(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('ArticleController.get', () => {
  it('retourne 200 avec l\'article', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fakeArticle = { id: 1, libelle: 'Article 1' }
    ;(Article.findOne as jest.Mock).mockResolvedValue(fakeArticle)

    await ArticleController.get(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeArticle)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Article.findOne as jest.Mock).mockResolvedValue(null)

    await ArticleController.get(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(Article.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await ArticleController.get(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('ArticleController.create', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await ArticleController.create(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 403 si ENSEIGNANT', async () => {
    const req = mockRequest({ utilisateurRole: 'enseignant' } as any)
    const res = mockResponse()

    await ArticleController.create(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('crée un article et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Nouvel article', prixUnitaire: 100 } } as any)
    const res = mockResponse()
    const created = { id: 1, libelle: 'Nouvel article' }
    ;(Article.create as jest.Mock).mockResolvedValue(created)

    await ArticleController.create(req, res)

    expect(Article.create).toHaveBeenCalledWith({ libelle: 'Nouvel article', prixUnitaire: 100 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(created)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Existant' } } as any)
    const res = mockResponse()
    const error = new Error('Duplicate')
    error.name = 'SequelizeUniqueConstraintError'
    ;(Article.create as jest.Mock).mockRejectedValue(error)

    await ArticleController.create(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })
})

describe('ArticleController.update', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await ArticleController.update(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si article introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(Article.findOne as jest.Mock).mockResolvedValue(null)

    await ArticleController.update(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('met à jour l\'article et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(Article.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await ArticleController.update(req, res)

    expect(mockUpdate).toHaveBeenCalledWith({ libelle: 'Modifié' })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('ArticleController.delete', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await ArticleController.delete(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(Article.findOne as jest.Mock).mockResolvedValue(null)

    await ArticleController.delete(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(Article.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await ArticleController.delete(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
