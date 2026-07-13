import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import MouvementStockController from '../../../modules/stock/controllers/MouvementStockController'

jest.mock('../../../modules/stock/models/MouvementStock', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.associations = { article: 'article', fournisseur: 'fournisseur', site: 'site' }
  return { MouvementStock: Mock }
})

const { MouvementStock } = require('../../../modules/stock/models/MouvementStock')
beforeEach(() => { jest.clearAllMocks() })

describe('MouvementStockController.getAll', () => {
  it('retourne 200', async () => {
    ;(MouvementStock.findAll as jest.Mock).mockResolvedValue([{ id: 1 }])
    const res = mockResponse()
    await MouvementStockController.getAll(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    ;(MouvementStock.findAll as jest.Mock).mockRejectedValue(new Error('err'))
    const res = mockResponse()
    await MouvementStockController.getAll(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('MouvementStockController.get', () => {
  it('retourne 200 si trouvé', async () => {
    ;(MouvementStock.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await MouvementStockController.get(mockRequest({ params: { id: '1' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(MouvementStock.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await MouvementStockController.get(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('MouvementStockController.create', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await MouvementStockController.create(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si ENSEIGNANT', async () => {
    const res = mockResponse()
    await MouvementStockController.create(mockRequest({ utilisateurRole: 'enseignant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('crée avec utilisateurId et retourne 200', async () => {
    ;(MouvementStock.create as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await MouvementStockController.create(mockRequest({ utilisateurRole: 'admin', utilisateurId: 5, body: { articleId: 1, quantite: 10 } } as any), res)
    expect(MouvementStock.create).toHaveBeenCalledWith({ articleId: 1, quantite: 10, utilisateurId: 5 })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('MouvementStockController.update', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await MouvementStockController.update(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(MouvementStock.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await MouvementStockController.update(mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(MouvementStock.findOne as jest.Mock).mockResolvedValue({ id: 1, update: up })
    const res = mockResponse()
    await MouvementStockController.update(mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { quantite: 20 } } as any), res)
    expect(up).toHaveBeenCalledWith({ quantite: 20 })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('MouvementStockController.delete', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await MouvementStockController.delete(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(MouvementStock.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await MouvementStockController.delete(mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(MouvementStock.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await MouvementStockController.delete(mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
