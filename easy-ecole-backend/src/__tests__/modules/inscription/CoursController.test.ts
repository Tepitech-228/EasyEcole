import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Cours', () => {
  const Cours: any = jest.fn()
  Cours.findAll = jest.fn()
  Cours.findOne = jest.fn()
  Cours.create = jest.fn()
  Cours.count = jest.fn()
  Cours.findAndCountAll = jest.fn()
  Cours.findByPk = jest.fn()
  Cours.associations = {
    classe: 'classe',
    enseignant: 'enseignant',
    parcours: 'parcours',
    chapitresCours: 'chapitresCours',
    seances: 'seances',
    ecues: 'ecues'
  }
  return { Cours }
})

jest.mock('../../../modules/inscription/models/Parcours', () => ({
  Parcours: {
    associations: {
      niveauEtude: 'niveauEtude'
    }
  }
}))

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: {
    associations: {
      utilisateur: 'utilisateur'
    }
  }
}))

const { Cours } = require('../../../modules/inscription/models/Cours')
import Ctrl from '../../../modules/inscription/controllers/CoursController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllCours', () => {
  it('should return all cours with includes for AD role', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    const mockData = [{ id: 1 }]
    ;(Cours.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllCours(req, res)

    expect(Cours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          'classe',
          { association: 'enseignant', include: ['utilisateur'] },
          { association: 'parcours', include: ['niveauEtude'] },
          'ecues'
        ]
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('should filter by enseignant.utilisateurId for EN role', async () => {
    const req = mockRequest({ utilisateurRole: 'enseignant', utilisateurId: 5 } as any)
    const res = mockResponse()
    ;(Cours.findAll as jest.Mock).mockResolvedValue([])

    await Ctrl.getAllCours(req, res)

    expect(Cours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          'classe',
          {
            association: 'enseignant',
            where: { utilisateurId: 5 }
          },
          { association: 'parcours', include: ['niveauEtude'] },
          'ecues'
        ]
      })
    )
  })

  it('should support parcoursId filter', async () => {
    const req = mockRequest({ query: { parcoursId: '3' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.findAll as jest.Mock).mockResolvedValue([])

    await Ctrl.getAllCours(req, res)

    expect(Cours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parcoursId: '3' },
        include: [
          'classe',
          { association: 'enseignant', include: ['utilisateur'] },
          { association: 'parcours', include: ['niveauEtude'] },
          'ecues'
        ]
      })
    )
  })
})

describe('getCours', () => {
  it('should return cours with full includes for AP/IN role', async () => {
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(Cours.findOne as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getCours(req, res)

    expect(Cours.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        include: [
          'classe',
          'chapitresCours',
          'seances',
          'enseignant',
          'ecues',
          { association: 'parcours', include: ['niveauEtude'] }
        ]
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.getCours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createCours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.createCours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 if duplicate {code, parcoursId} exists', async () => {
    const req = mockRequest({ body: { code: 'C001', parcoursId: 1 }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createCours(req, res)

    expect(Cours.findOne).toHaveBeenCalledWith({ where: { code: 'C001', parcoursId: 1 } })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should return 200 on successful creation', async () => {
    const req = mockRequest({ body: { code: 'C002', parcoursId: 1 }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValue(null)
    ;(Cours.create as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createCours(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
  })
})

describe('updateCours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.updateCours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateCours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({})
    const existing = { id: 1, code: 'C001', update: mockUpdate }
    const req = mockRequest({ params: { id: '1' }, body: { code: 'C003' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValueOnce(existing)
    ;(Cours.findOne as jest.Mock).mockResolvedValueOnce(null)

    await Ctrl.updateCours(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteCours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.deleteCours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteCours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockCours = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.findOne as jest.Mock).mockResolvedValue(mockCours)

    await Ctrl.deleteCours(req, res)

    expect(mockCours.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for authorized roles', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Cours.count as jest.Mock).mockResolvedValue(5)

    await Ctrl.getCount(req, res)

    expect(Cours.count).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 })
  })
})
