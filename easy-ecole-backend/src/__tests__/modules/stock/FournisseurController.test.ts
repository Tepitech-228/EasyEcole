import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import FournisseurController from '../../../modules/stock/controllers/FournisseurController'

jest.mock('../../../modules/stock/models/Fournisseur', () => {
  const mockFindAll = jest.fn()
  const mockFindOne = jest.fn()
  const mockCreate = jest.fn()
  const MockFournisseur: any = jest.fn()
  MockFournisseur.findAll = mockFindAll
  MockFournisseur.findOne = mockFindOne
  MockFournisseur.create = mockCreate
  return { Fournisseur: MockFournisseur }
})

const { Fournisseur } = require('../../../modules/stock/models/Fournisseur')

beforeEach(() => { jest.clearAllMocks() })

describe('FournisseurController.getAll', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(Fournisseur.findAll as jest.Mock).mockResolvedValue([{ id: 1, nom: 'Fournisseur A' }])
    await FournisseurController.getAll(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(Fournisseur.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))
    await FournisseurController.getAll(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('FournisseurController.get', () => {
  it('retourne 200 si trouvé', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(Fournisseur.findOne as jest.Mock).mockResolvedValue({ id: 1 })
    await FournisseurController.get(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Fournisseur.findOne as jest.Mock).mockResolvedValue(null)
    await FournisseurController.get(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('FournisseurController.create', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await FournisseurController.create(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si ENSEIGNANT', async () => {
    const res = mockResponse()
    await FournisseurController.create(mockRequest({ utilisateurRole: 'enseignant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('crée et retourne 200', async () => {
    const req = mockRequest({ body: { nom: 'New' } })
    const res = mockResponse()
    ;(Fournisseur.create as jest.Mock).mockResolvedValue({ id: 1, nom: 'New' })
    await FournisseurController.create(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ body: { nom: 'Dup' } })
    const res = mockResponse()
    ;(Fournisseur.create as jest.Mock).mockRejectedValue(new Error('Duplicate'))
    await FournisseurController.create(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('FournisseurController.update', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await FournisseurController.update(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si ENSEIGNANT', async () => {
    const res = mockResponse()
    await FournisseurController.update(mockRequest({ utilisateurRole: 'enseignant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ params: { id: '1' }, body: { nom: 'Modifié' } })
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(Fournisseur.findOne as jest.Mock).mockResolvedValue({ id: 1, update: mockUpdate })
    await FournisseurController.update(req, res)
    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Fournisseur.findOne as jest.Mock).mockResolvedValue(null)
    await FournisseurController.update(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('FournisseurController.delete', () => {
  it('retourne 403 si APPRENANT', async () => {
    const res = mockResponse()
    await FournisseurController.delete(mockRequest({ utilisateurRole: 'apprenant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('retourne 403 si ENSEIGNANT', async () => {
    const res = mockResponse()
    await FournisseurController.delete(mockRequest({ utilisateurRole: 'enseignant' } as any), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })
  it('supprime et retourne 200', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(Fournisseur.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })
    await FournisseurController.delete(req, res)
    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Fournisseur.findOne as jest.Mock).mockResolvedValue(null)
    await FournisseurController.delete(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })
})
