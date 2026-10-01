import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Ecue', () => {
  const Ecue: any = jest.fn()
  Ecue.findAll = jest.fn()
  Ecue.findByPk = jest.fn()
  Ecue.create = jest.fn()
  Ecue.associations = {
    cours: 'cours',
    enseignant: 'enseignant'
  }
  return { Ecue }
})

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: {
    associations: {
      utilisateur: 'utilisateur'
    }
  }
}))

const { Ecue } = require('../../../modules/inscription/models/Ecue')
import Ctrl from '../../../modules/inscription/controllers/EcueController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAll', () => {
  it('should return all ecues with includes', async () => {
    const req = mockRequest({} as any)
    const res = mockResponse()
    const mockData = [{ id: 1 }]
    ;(Ecue.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAll(req, res)

    expect(Ecue.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: ['cours', { association: 'enseignant', include: ['utilisateur'] }]
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })
})

describe('get', () => {
  it('should return ecue with cours include', async () => {
    const req = mockRequest({ params: { id: '1' } } as any)
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.get(req, res)

    expect(Ecue.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({
      include: ['cours']
    }))
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.get(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('create', () => {
  it('should return 201 on successful creation without APPRENANT restriction', async () => {
    const req = mockRequest({ body: { code: 'ECUE001', libelle: 'ECUE 1' }, utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()
    ;(Ecue.create as jest.Mock).mockResolvedValue({ id: 1, code: 'ECUE001' })

    await Ctrl.create(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('should return 201 for INSTITUTION role', async () => {
    const req = mockRequest({ body: { code: 'ECUE001', libelle: 'ECUE 1' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(Ecue.create as jest.Mock).mockResolvedValue({ id: 1, code: 'ECUE001' })

    await Ctrl.create(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
  })
})

describe('update', () => {
  it('should return 404 if ecue not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: { libelle: 'Updated' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.update(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 403 when ecue belongs to a different etablissement', async () => {
    const mockCours = { etablissementId: 2 }
    const mockEcue = { id: 1, update: jest.fn(), cours: mockCours }
    const req = mockRequest({ params: { id: '1' }, body: { libelle: 'Updated' }, utilisateurRole: 'institution', etablissementId: 1 } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(mockEcue)

    await Ctrl.update(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockEcue.update).not.toHaveBeenCalled()
  })

  it('should return 200 on successful update when ecue belongs to same etablissement', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({})
    const mockCours = { etablissementId: 1 }
    const existing = { id: 1, update: mockUpdate, cours: mockCours }
    const req = mockRequest({ params: { id: '1' }, body: { libelle: 'Updated' }, utilisateurRole: 'institution', etablissementId: 1 } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.update(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should allow ADMIN to update any ecue regardless of etablissement', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({})
    const mockCours = { etablissementId: 999 }
    const existing = { id: 1, update: mockUpdate, cours: mockCours }
    const req = mockRequest({ params: { id: '1' }, body: { libelle: 'Updated' }, utilisateurRole: 'admin', etablissementId: null } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.update(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should return 403 when ecue cours etablissementId is null and user etablissementId is present', async () => {
    const mockCours = { etablissementId: null }
    const mockEcue = { id: 1, update: jest.fn(), cours: mockCours }
    const req = mockRequest({ params: { id: '1' }, body: { libelle: 'Updated' }, utilisateurRole: 'institution', etablissementId: 1 } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(mockEcue)

    await Ctrl.update(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })
})

describe('delete', () => {
  it('should return 404 if ecue not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.delete(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 403 when ecue belongs to a different etablissement', async () => {
    const mockCours = { etablissementId: 2 }
    const mockEcue = { id: 1, destroy: jest.fn(), cours: mockCours }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'institution', etablissementId: 1 } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(mockEcue)

    await Ctrl.delete(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockEcue.destroy).not.toHaveBeenCalled()
  })

  it('should return 200 on successful deletion when ecue belongs to same etablissement', async () => {
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    const mockCours = { etablissementId: 1 }
    const existing = { id: 1, destroy: mockDestroy, cours: mockCours }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'institution', etablissementId: 1 } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.delete(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('should allow ADMIN to delete any ecue regardless of etablissement', async () => {
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    const mockCours = { etablissementId: 999 }
    const existing = { id: 1, destroy: mockDestroy, cours: mockCours }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'admin', etablissementId: null } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.delete(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should return 403 when ecue cours etablissementId is absent on both sides', async () => {
    const mockCours = { etablissementId: null }
    const mockEcue = { id: 1, destroy: jest.fn(), cours: mockCours }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'institution', etablissementId: null } as any)
    const res = mockResponse()
    ;(Ecue.findByPk as jest.Mock).mockResolvedValue(mockEcue)

    await Ctrl.delete(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })
})
