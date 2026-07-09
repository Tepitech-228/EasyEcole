import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/ListePresence', () => {
  const ListePresence: any = jest.fn()
  ListePresence.findAll = jest.fn()
  ListePresence.findOne = jest.fn()
  ListePresence.create = jest.fn()
  ListePresence.findAndCountAll = jest.fn()
  ListePresence.findByPk = jest.fn()
  ListePresence.associations = { cours: 'cours', enseignant: 'enseignant', presences: 'presences' }
  return { ListePresence }
})

const { ListePresence } = require('../../../modules/inscription/models/ListePresence')
import Ctrl from '../../../modules/inscription/controllers/ListePresenceController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllListesPresences', () => {
  it('should return all listes de presence with nested includes', async () => {
    const req = mockRequest({})
    const res = mockResponse()
    const mockData = [{ id: 1 }]
    ;(ListePresence.findAll as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getAllListesPresences(req, res)

    expect(ListePresence.findAll).toHaveBeenCalledWith(
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

describe('getListePresence', () => {
  it('should return liste de presence with presences includes', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(ListePresence.findByPk as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getListePresence(req, res)

    expect(ListePresence.findByPk).toHaveBeenCalledWith(
      '1',
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
          { association: 'enseignant', include: [{ association: 'utilisateur' }] },
          { association: 'presences', include: [{ association: 'presencesCoursParticipants' }] }
        ]
      })
    )
    expect(res.json).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(ListePresence.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.getListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createListePresence', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ body: {}, utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.createListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 with alreadyExists if duplicate titre', async () => {
    const req = mockRequest({ body: { titre: 'Liste 1' }, utilisateur: { role: 'IN' } })
    const res = mockResponse()
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ alreadyExists: true })
  })

  it('should return 200 on success', async () => {
    const req = mockRequest({ body: { titre: 'Nouvelle Liste' }, utilisateur: { role: 'IN' } })
    const res = mockResponse()
    ;(ListePresence.findOne as jest.Mock).mockResolvedValue(null)
    ;(ListePresence.create as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('updateListePresence', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.updateListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateur: { role: 'IN' } })
    const res = mockResponse()
    ;(ListePresence.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const existing = { id: 1, save: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, body: { titre: 'Updated' }, utilisateur: { role: 'IN' } })
    const res = mockResponse()
    ;(ListePresence.findByPk as jest.Mock).mockResolvedValue(existing)

    await Ctrl.updateListePresence(req, res)

    expect(existing.save).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteListePresence', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.deleteListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateur: { role: 'IN' } })
    const res = mockResponse()
    ;(ListePresence.findByPk as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteListePresence(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockItem = { id: 1, destroy: jest.fn() }
    const req = mockRequest({ params: { id: '1' }, utilisateur: { role: 'IN' } })
    const res = mockResponse()
    ;(ListePresence.findByPk as jest.Mock).mockResolvedValue(mockItem)

    await Ctrl.deleteListePresence(req, res)

    expect(mockItem.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateur: { role: 'AP' } })
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for IN role', async () => {
    const req = mockRequest({ utilisateur: { role: 'IN' } })
    const res = mockResponse()
    ;(ListePresence.findAndCountAll as jest.Mock).mockResolvedValue({ count: 3 })

    await Ctrl.getCount(req, res)

    expect(res.json).toHaveBeenCalledWith({ count: 3 })
  })
})
