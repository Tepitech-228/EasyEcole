import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import BonCommandeController from '../../../modules/stock/controllers/BonCommandeController'

jest.mock('../../../modules/stock/models/BonCommande', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.associations = { fournisseur: 'fournisseur', lignesBonCommande: 'lignesBonCommande', site: 'site' }
  return { BonCommande: Mock }
})

const { BonCommande } = require('../../../modules/stock/models/BonCommande')
beforeEach(() => { jest.clearAllMocks() })

describe('BonCommandeController.getAll', () => {
  it('retourne 200', async () => {
    ;(BonCommande.findAll as jest.Mock).mockResolvedValue([{ id: 1 }])
    const res = mockResponse()
    await BonCommandeController.getAll(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    ;(BonCommande.findAll as jest.Mock).mockRejectedValue(new Error('err'))
    const res = mockResponse()
    await BonCommandeController.getAll(mockRequest(), res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('BonCommandeController.get', () => {
  it('retourne 200 si trouvé', async () => {
    ;(BonCommande.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await BonCommandeController.get(mockRequest({ params: { id: '1' } }), res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    ;(BonCommande.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await BonCommandeController.get(mockRequest({ params: { id: '999' } }), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('BonCommandeController.create', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await BonCommandeController.create(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si ENSEIGNANT', async () => {
    const res = mockResponse()
    await BonCommandeController.create(mockRequest({ utilisateurRole: 'enseignant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si CAISSIER_BANQUE', async () => {
    const res = mockResponse()
    await BonCommandeController.create(mockRequest({ utilisateurRole: 'caissier_banque' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('crée et retourne 200', async () => {
    ;(BonCommande.create as jest.Mock).mockResolvedValue({ id: 1 })
    const res = mockResponse()
    await BonCommandeController.create(mockRequest({ utilisateurRole: 'admin', body: { reference: 'BC001' } } as any), res)
    expect(BonCommande.create).toHaveBeenCalledWith({ reference: 'BC001' })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('BonCommandeController.update', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await BonCommandeController.update(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(BonCommande.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await BonCommandeController.update(mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('met à jour et retourne 200', async () => {
    const up = jest.fn().mockResolvedValue({})
    ;(BonCommande.findOne as jest.Mock).mockResolvedValue({ id: 1, update: up })
    const res = mockResponse()
    await BonCommandeController.update(mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { reference: 'BC002' } } as any), res)
    expect(up).toHaveBeenCalledWith({ reference: 'BC002' })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('BonCommandeController.delete', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await BonCommandeController.delete(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 404 si introuvable', async () => {
    ;(BonCommande.findOne as jest.Mock).mockResolvedValue(null)
    const res = mockResponse()
    await BonCommandeController.delete(mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any), res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
  it('supprime et retourne 200', async () => {
    const d = jest.fn().mockResolvedValue(undefined)
    ;(BonCommande.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: d })
    const res = mockResponse()
    await BonCommandeController.delete(mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any), res)
    expect(d).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
