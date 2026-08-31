import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/Parcours', () => {
  const Parcours: any = jest.fn()
  Parcours.findAll = jest.fn()
  Parcours.findOne = jest.fn()
  Parcours.create = jest.fn()
  Parcours.count = jest.fn()
  Parcours.findAndCountAll = jest.fn()
  Parcours.findByPk = jest.fn()
  Parcours.associations = { niveauEtude: 'niveauEtude', cours: 'cours', prerequisParcours: 'prerequisParcours' }
  return { Parcours }
})

jest.mock('../../../modules/inscription/models/Cours', () => ({
  Cours: {
    associations: {
      classe: 'classe'
    }
  }
}))

jest.mock('../../../modules/inscription/models/PrerequisParcours', () => ({
  PrerequisParcours: {
    associations: { matierePrerequis: 'matierePrerequis', niveauEtude: 'niveauEtude' }
  }
}))

const { Parcours } = require('../../../modules/inscription/models/Parcours')
import Ctrl from '../../../modules/inscription/controllers/ParcoursController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllParcours', () => {
  it('should return all parcours with niveauEtude included', async () => {
    const req = mockRequest({ query: {} })
    const res = mockResponse()
    const mockData = [{ id: 1, titre: 'Parcours 1' }]
    ;(Parcours.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllParcours(req, res)

    expect(Parcours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ include: ['niveauEtude'] })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('should filter by niveauEtudeId when query param is provided', async () => {
    const req = mockRequest({ query: { niveauEtudeId: '2' } })
    const res = mockResponse()
    ;(Parcours.findAll as jest.Mock).mockResolvedValue([])

    await Ctrl.getAllParcours(req, res)

    expect(Parcours.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { niveauEtudeId: '2' },
        include: ['niveauEtude']
      })
    )
  })
})

describe('getParcours', () => {
  it('should return parcours with nested includes', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const mockData = { id: 1, titre: 'Parcours 1' }
    ;(Parcours.findOne as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getParcours(req, res)

    expect(Parcours.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        include: [
          'niveauEtude',
          { association: 'cours', include: ['classe'] },
          expect.objectContaining({ as: 'prerequisParcours' })
        ]
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.getParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createParcours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.createParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 with alreadyExists if duplicate titre found', async () => {
    const req = mockRequest({
      body: { titre: 'Existant' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createParcours(req, res)

    expect(Parcours.findOne).toHaveBeenCalledWith({ where: { titre: 'Existant' } })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })

  it('should return 201 on successful creation', async () => {
    const saved = { id: 1, titre: 'Nouveau Parcours' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    const req = mockRequest({
      body: { titre: 'Nouveau Parcours' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValue(null)
    ;(Parcours as jest.Mock).mockReturnValue({ save: mockSave })

    await Ctrl.createParcours(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })
})

describe('updateParcours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.updateParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if parcours not found', async () => {
    const req = mockRequest({
      params: { id: '999' },
      body: { titre: 'Updated' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should check duplicate if titre changed and existing found', async () => {
    const existing = { id: 1, titre: 'Original' }
    const req = mockRequest({
      params: { id: '1' },
      body: { titre: 'Changed' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValueOnce(existing)
    ;(Parcours.findOne as jest.Mock).mockResolvedValueOnce({ id: 2, titre: 'Changed' })

    await Ctrl.updateParcours(req, res)

    expect(Parcours.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })

  it('should return 200 on successful update', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({})
    const existing = { id: 1, titre: 'Original', update: mockUpdate }
    const req = mockRequest({
      params: { id: '1' },
      body: { titre: 'Updated' },
      utilisateurRole: 'admin'
    } as any)
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValueOnce(existing)
    ;(Parcours.findOne as jest.Mock).mockResolvedValueOnce(null)

    await Ctrl.updateParcours(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteParcours', () => {
  it('should return 403 for AP role', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.deleteParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteParcours(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockParcours = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Parcours.findOne as jest.Mock).mockResolvedValue(mockParcours)

    await Ctrl.deleteParcours(req, res)

    expect(mockParcours.destroy).toHaveBeenCalled()
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
    ;(Parcours.count as jest.Mock).mockResolvedValue(5)

    await Ctrl.getCount(req, res)

    expect(Parcours.count).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 })
  })
})