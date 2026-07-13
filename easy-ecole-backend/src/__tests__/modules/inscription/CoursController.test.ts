import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Cours', () => {
  const Cours: any = jest.fn()
  Cours.findAll = jest.fn()
  Cours.findOne = jest.fn()
  Cours.create = jest.fn()
  Cours.findAndCountAll = jest.fn()
  Cours.findByPk = jest.fn()
  Cours.associations = {
    classe: 'classe',
    enseignant: 'enseignant',
    parcours: 'parcours',
    chapitresCours: 'chapitresCours',
    seances: 'seances'
  }
  return { Cours }
})

const { Cours } = require('../../../modules/inscription/models/Cours')
import Ctrl from '../../../modules/inscription/controllers/CoursController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllCours', () => {
  it('should return all cours with includes for AD role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AD' } })
    const res = mockResponse()
    const mockData = [{ id: 1 }]
    ;(Cours.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllCours(req, res)

    expect(Cours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          { association: 'classe' },
          { association: 'enseignant', include: [{ association: 'utilisateur' }] },
          { association: 'parcours', include: [{ association: 'niveauEtude' }] }
        ]
      })
    )
    expect(res.json).toHaveBeenCalledWith(mockData)
  })

  it('should filter by enseignant.utilisateurId for EN role', async () => {
    const req = mockRequest({ utilisateur: { role: 'EN', id: 5 } })
    const res = mockResponse()
    ;(Cours.findAll as jest.Mock).mockResolvedValue([])

    await Ctrl.getAllCours(req, res)

    expect(Cours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          { association: 'classe' },
          {
            association: 'enseignant',
            include: [{ association: 'utilisateur' }],
            where: { utilisateurId: 5 }
          },
          { association: 'parcours', include: [{ association: 'niveauEtude' }] }
        ]
      })
    )
  })

  it('should support parcoursId filter', async () => {
    const req = mockRequest({ query: { parcoursId: '3' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Cours.findAll as jest.Mock).mockResolvedValue([])

    await Ctrl.getAllCours(req, res)

    expect(Cours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parcoursId: 3 },
        include: [
          { association: 'classe' },
          { association: 'enseignant', include: [{ association: 'utilisateur' }] },
          { association: 'parcours', include: [{ association: 'niveauEtude' }] }
        ]
      })
    )
  })
})

describe('getCours', () => {
  it('should return cours with full includes for AP/IN role', async () => {
    const req = mockRequest({ params: { id: '1' }, utilisateur: { role: 'AP' } })
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(Cours.findByPk as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getCours(req, res)

    expect(Cours.findByPk).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        include: [
          { association: 'chapitresCours' },
          { association: 'seances' },
          { association: 'enseignant' },
          { association: 'parcours' }
        ]
      })
    )
    expect(res.json).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Cours.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.getCours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createCours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.createCours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 if duplicate {code, parcoursId} exists', async () => {
    const req = mockRequest({ body: { code: 'C001', parcoursId: 1 }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createCours(req, res)

    expect(Cours.findOne).toHaveBeenCalledWith({ where: { code: 'C001', parcoursId: 1 } })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should return 200 on successful creation', async () => {
    const req = mockRequest({ body: { code: 'C002', parcoursId: 1 }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValue(null)
    ;(Cours.create as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createCours(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('updateCours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.updateCours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Cours.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateCours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const existing = { id: 1, save: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, body: { code: 'C003' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Cours.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.updateCours(req, res)

    expect(existing.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteCours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.deleteCours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Cours.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteCours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockCours = { id: 1, destroy: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Cours.findByPk as jest.Mock).mockResolvedValue(mockCours)

    await Ctrl.deleteCours(req, res)

    expect(mockCours.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for authorized roles', async () => {
    const req = mockRequest({ utilisateur: { role: 'AD' } })
    const res = mockResponse()
    ;(Cours.findAndCountAll as jest.Mock).mockResolvedValue({ count: 5 })

    await Ctrl.getCount(req, res)

    expect(Cours.findAndCountAll).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ count: 5 })
  })
})
