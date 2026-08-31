import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/CahierDeTexte', () => {
  const CahierDeTexte: any = jest.fn()
  CahierDeTexte.findAll = jest.fn()
  CahierDeTexte.findOne = jest.fn()
  CahierDeTexte.create = jest.fn()
  CahierDeTexte.count = jest.fn()
  CahierDeTexte.findAndCountAll = jest.fn()
  CahierDeTexte.findByPk = jest.fn()
  CahierDeTexte.associations = { cours: 'cours', enseignant: 'enseignant', blocsCahierDeTexte: 'blocsCahierDeTexte' }
  return { CahierDeTexte }
})

jest.mock('../../../modules/inscription/models/Cours', () => ({
  Cours: {
    associations: {
      classe: 'classe',
      enseignant: 'enseignant',
      parcours: 'parcours'
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

jest.mock('../../../modules/inscription/models/Parcours', () => ({
  Parcours: {
    associations: {
      niveauEtude: 'niveauEtude'
    }
  }
}))

jest.mock('../../../modules/inscription/models/CoursParticipant', () => ({
  CoursParticipant: {
    findAll: jest.fn()
  }
}))

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
              'classe',
              { association: 'enseignant', include: ['utilisateur'] },
              { association: 'parcours', include: ['niveauEtude'] }
            ]
          },
          { association: 'enseignant', include: ['utilisateur'] }
        ]
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })
})

describe('getCahierDeTexte', () => {
  it('should return one cahier de texte by id', async () => {
    const req = mockRequest({ params: { id: '1' } } as any)
    const res = mockResponse()
    const mockData = { id: 1 }
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(mockData)

    await Ctrl.getCahierDeTexte(req, res)

    expect(CahierDeTexte.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        include: [
          {
            association: 'cours',
            include: [
              'classe',
              { association: 'enseignant', include: ['utilisateur'] },
              { association: 'parcours', include: ['niveauEtude'] }
            ]
          },
          { association: 'blocsCahierDeTexte' }
        ]
      })
    )
    expect(res.send).toHaveBeenCalledWith(mockData)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' } } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.getCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('createCahierDeTexte', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ body: {}, utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.createCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 400 with alreadyExists if duplicate titre', async () => {
    const req = mockRequest({ body: { titre: 'Cahier 1' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await Ctrl.createCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })

  it('should return 201 on success for IN role', async () => {
    const saved = { id: 1, titre: 'Nouveau Cahier' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    const req = mockRequest({ body: { titre: 'Nouveau Cahier' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(null)
    ;(CahierDeTexte as jest.Mock).mockReturnValue({ save: mockSave })

    await Ctrl.createCahierDeTexte(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('should return 201 on success for EN role', async () => {
    const saved = { id: 1, titre: 'Nouveau Cahier' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    const req = mockRequest({ body: { titre: 'Nouveau Cahier' }, utilisateurRole: 'enseignant' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(null)
    ;(CahierDeTexte as jest.Mock).mockReturnValue({ save: mockSave })

    await Ctrl.createCahierDeTexte(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })
})

describe('updateCahierDeTexte', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.updateCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, body: {}, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.updateCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful update', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({})
    const existing = { id: 1, titre: 'Ancien', update: mockUpdate }
    const req = mockRequest({ params: { id: '1' }, body: { titre: 'Updated' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValueOnce(existing)
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValueOnce(null)

    await Ctrl.updateCahierDeTexte(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('deleteCahierDeTexte', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.deleteCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return 404 if not found', async () => {
    const req = mockRequest({ params: { id: '999' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(null)

    await Ctrl.deleteCahierDeTexte(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 200 on successful deletion', async () => {
    const mockItem = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) }
    const req = mockRequest({ params: { id: '1' }, utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.findOne as jest.Mock).mockResolvedValue(mockItem)

    await Ctrl.deleteCahierDeTexte(req, res)

    expect(mockItem.destroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('getCount', () => {
  it('should return 403 if role is not IN or EN', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await Ctrl.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should return count for IN role', async () => {
    const req = mockRequest({ utilisateurRole: 'institution' } as any)
    const res = mockResponse()
    ;(CahierDeTexte.count as jest.Mock).mockResolvedValue(3)

    await Ctrl.getCount(req, res)

    expect(CahierDeTexte.count).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 3 })
  })
})