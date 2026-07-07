import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import LigneBonCommandeController from '../../../modules/stock/controllers/LigneBonCommandeController'

jest.mock('../../../modules/stock/models/LigneBonCommande', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.associations = { bonCommande: 'bonCommande', article: 'article' }
  return { LigneBonCommande: Mock }
})

const { LigneBonCommande } = require('../../../modules/stock/models/LigneBonCommande')
beforeEach(() => { jest.clearAllMocks() })

describe('LigneBonCommandeController.getAll', () => {
  it('retourne 200', async () => {
    ;(LigneBonCommande.findAll as jest.Mock).mockResolvedValue([{ id: 1 }])
    const res = mockResponse()
    await LigneBonCommandeController.getAll(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    ;(LigneBonCommande.findAll as jest.Mock).mockRejectedValue(new Error('err'))
    const res = mockResponse()
    await LigneBonCommandeController.getAll(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('LigneBonCommandeController.get', () => {
  it('retourne 200 si trouvé', async () => {
    ;(LigneBonCommande.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await LigneBonCommandeController.get(mockRequest({ params: { id: '1' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(LigneBonCommande.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await LigneBonCommandeController.get(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('LigneBonCommandeController.create', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await LigneBonCommandeController.create(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si ENSEIGNANT', async () => {
    const res = mockResponse()
    await LigneBonCommandeController.create(mockRequest({ utilisateurRole: 'enseignant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si CAISSIER_BANQUE', async () => {
    const res = mockResponse()
    await LigneBonCommandeController.create(mockRequest({ utilisateurRole: 'caissier_banque' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('crée et retourne 200', async () => {
    ;(LigneBonCommande.create as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await LigneBonCommandeController.create(mockRequest({ utilisateurRole: 'admin', body: { bonCommandeId: 1, articleId: 1, quantite: 5 } } as any), res)
    expect(LigneBonCommande.create).toHaveBeenCalledWith({ bonCommandeId: 1, articleId: 1, quantite: 5 })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('LigneBonCommandeController.update', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await LigneBonCommandeController.update(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(LigneBonCommande.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await LigneBonCommandeController.update(mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(LigneBonCommande.findOne as jest.Mock).mockResolvedValue({ id: 1, update: up })
    const res = mockResponse()
    await LigneBonCommandeController.update(mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { quantite: 10 } } as any), res)
    expect(up).toHaveBeenCalledWith({ quantite: 10 })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('LigneBonCommandeController.delete', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await LigneBonCommandeController.delete(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(LigneBonCommande.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await LigneBonCommandeController.delete(mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(LigneBonCommande.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await LigneBonCommandeController.delete(mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
