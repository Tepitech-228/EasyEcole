import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import UtilisateurController from '../../../modules/auth/controllers/UtilisateurController'

const mockUpdate = jest.fn()
const mockDestroy = jest.fn()

jest.mock('../../../modules/auth/models/Utilisateur', () => {
  const mockFindOne = jest.fn()
  const mockFindAll = jest.fn()
  const mockCount = jest.fn()
  const MockUtilisateur: any = jest.fn()
  MockUtilisateur.findOne = mockFindOne
  MockUtilisateur.findAll = mockFindAll
  MockUtilisateur.count = mockCount

  MockUtilisateur.associations = {
    apprenant: 'apprenant',
    institution: 'institution',
    caissierBanque: 'caissierBanque',
  }

  return { Utilisateur: MockUtilisateur }
})

const { Utilisateur } = require('../../../modules/auth/models/Utilisateur')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('UtilisateurController.getAllUtilisateurs', () => {
  it('retourne 403 pour APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await UtilisateurController.getAllUtilisateurs(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec la liste des utilisateurs', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    const fakeUsers = [{ nom: 'Test', prenoms: 'User', email: 'test@test.com' }]
    ;(Utilisateur.findAll as jest.Mock).mockResolvedValue(fakeUsers)

    await UtilisateurController.getAllUtilisateurs(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeUsers)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Utilisateur.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await UtilisateurController.getAllUtilisateurs(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('UtilisateurController.getUtilisateur', () => {
  it('retourne 200 avec l\'utilisateur connecté', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1 } as any)
    const res = mockResponse()
    const fakeUser = { id: 1, nom: 'Test', email: 'test@test.com' }
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(fakeUser)

    await UtilisateurController.getUtilisateur(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeUser)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1 } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)

    await UtilisateurController.getUtilisateur(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1 } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await UtilisateurController.getUtilisateur(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('UtilisateurController.updateUtilisateur', () => {
  it('retourne 403 si ADMIN', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()

    await UtilisateurController.updateUtilisateur(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si utilisateur introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1, body: { nom: 'Test' } } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)

    await UtilisateurController.updateUtilisateur(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1, body: { nom: 'Nouveau', prenoms: 'Nom', contact: '123' } } as any)
    const res = mockResponse()
    const localUpdate = jest.fn().mockResolvedValue({})

    ;(Utilisateur.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 1, nom: 'Ancien', prenoms: 'Ancien', update: localUpdate })
      .mockResolvedValue(null)

    await UtilisateurController.updateUtilisateur(req, res)

    const statusCodes = (res.status as jest.Mock).mock.calls.map((c: any) => c[0])
    expect(statusCodes[statusCodes.length - 1]).toBe(200)
    expect(localUpdate).toHaveBeenCalledWith({ nom: 'Nouveau', prenoms: 'Nom', contact: '123' })
  })

  it('retourne 400 si nom+prenoms déjà utilisé', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1, body: { nom: 'Existant', prenoms: 'User', contact: '123' } } as any)
    const res = mockResponse()
    const localUpdate = jest.fn()
    ;(Utilisateur.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 1, nom: 'Ancien', prenoms: 'Ancien', update: localUpdate })
      .mockResolvedValueOnce({ id: 2 } as any)

    await UtilisateurController.updateUtilisateur(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ nomPrenomsAlreadyUsed: true })
  })
})

describe('UtilisateurController.deleteUtilisateur', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await UtilisateurController.deleteUtilisateur(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si utilisateur introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)

    await UtilisateurController.deleteUtilisateur(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '1' } } as any)
    const res = mockResponse()
    mockDestroy.mockResolvedValue(undefined)
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await UtilisateurController.deleteUtilisateur(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('UtilisateurController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await UtilisateurController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne le nombre d\'utilisateurs', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Utilisateur.count as jest.Mock).mockResolvedValue(42)

    await UtilisateurController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 42 })
  })
})
