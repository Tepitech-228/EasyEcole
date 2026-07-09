import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/CahierDeTexte', () => {
  const CahierDeTexte: any = jest.fn()
  CahierDeTexte.findAll = jest.fn()
  CahierDeTexte.findOne = jest.fn()
  CahierDeTexte.create = jest.fn()
  CahierDeTexte.findAndCountAll = jest.fn()
  CahierDeTexte.findByPk = jest.fn()
  CahierDeTexte.associations = { cours: 'cours', enseignant: 'enseignant', blocsCahierDeTexte: 'blocsCahierDeTexte' }
  return { CahierDeTexte }
})

const { CahierDeTexte } = require('../../../modules/inscription/models/CahierDeTexte')
import Ctrl from '../../../modules/inscription/controllers/CahierDeTexteController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllCahiersDeTexte', () => {
  it('should return all cahiers de texte with nested includes', async () => {
    const req = mockRequest({} as any)
    const res = mockResponse()
    const mockData = [{ id: 1 }]
    ;(CahierDeTexte.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllCahiersDeTexte(req, res)

    expect(CahierDeTexte.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          {
            association: 'cours',
            include: [
              { association: 'classe' },
              { association: 'enseignant', include: [{ association: 'utilisateur' }] },
              { association: 'parcours', include: [{ association: 'niveauEtude' }] }
            ]
          },
          { association: 'enseignant', include: [{ association: 'utilisateur' }] }
        ]
      })
    )
    expect(res.json).toHaveBeenCalledWith(mockData)
  })
})

describe('getCahierDeTexte', () => {
  it('should return one cahier de texte by id', async () => {
    const req = mockRequest({ params: { id: '1' } } as any)
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(CahierDeTexte.findByPk as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getCahierDeTexte(req, res)

    expect(CahierDeTexte.findByPk).toHaveBeenCalledWith('1')
    expect(res.json).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.getCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createCahierDeTexte', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ body: {}, utilisateurRole: 'AP' } as any)
    const res = mockResponse()

    await Ctrl.createCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 with alreadyExists if duplicate titre', async () => {
    const req = mockRequest({ body: { titre: 'Cahier 1' }, utilisateurRole: 'IN' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ alreadyExists: true })
  })

  it('should return 200 on success for IN role', async () => {
    const req = mockRequest({ body: { titre: 'Nouveau Cahier' }, utilisateurRole: 'IN' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(null)
    ;(CahierDeTexte.create as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should return 200 on success for EN role', async () => {
    const req = mockRequest({ body: { titre: 'Nouveau Cahier' }, utilisateurRole: 'EN' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(null)
    ;(CahierDeTexte.create as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('updateCahierDeTexte', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'AP' } as any)
    const res = mockResponse()

    await Ctrl.updateCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateurRole: 'IN' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const existing = { id: 1, save: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, body: { titre: 'Updated' }, utilisateurRole: 'IN' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.updateCahierDeTexte(req, res)

    expect(existing.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteCahierDeTexte', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'AP' } as any)
    const res = mockResponse()

    await Ctrl.deleteCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'IN' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockItem = { id: 1, destroy: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'IN' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findByPk as jest.Mock).mockResolvedValue(mockItem)

    await Ctrl.deleteCahierDeTexte(req, res)

    expect(mockItem.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'AP' } as any)
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for IN role', async () => {
    const req = mockRequest({ utilisateurRole: 'IN' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findAndCountAll as jest.Mock).mockResolvedValue({ count: 3 })

    await Ctrl.getCount(req, res)

    expect(res.json).toHaveBeenCalledWith({ count: 3 })
  })
})
