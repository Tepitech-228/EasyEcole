import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import ClasseController from '../../../modules/inscription/controllers/ClasseController'

jest.mock('../../../modules/inscription/models/Classe', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { Classe: Mock }
})

const { Classe } = require('../../../modules/inscription/models/Classe')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ClasseController.getAllClasses', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, libelle: '6ème' }]
    ;(Classe.findAll as jest.Mock).mockResolvedValue(fakeList)

    await ClasseController.getAllClasses(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('filtre par niveauEtudeId', async () => {
    const req = mockRequest({ query: { niveauEtudeId: 'niv1' } })
    const res = mockResponse()
    ;(Classe.findAll as jest.Mock).mockResolvedValue([])

    await ClasseController.getAllClasses(req, res)

    expect(Classe.findAll).toHaveBeenCalledWith({ where: { niveauEtudeId: 'niv1' } })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(Classe.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await ClasseController.getAllClasses(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('ClasseController.getClasse', () => {
  it('retourne 200 si trouvée', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, libelle: '6ème' }
    ;(Classe.findOne as jest.Mock).mockResolvedValue(fake)

    await ClasseController.getClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(Classe.findOne as jest.Mock).mockResolvedValue(null)

    await ClasseController.getClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(Classe.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await ClasseController.getClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('ClasseController.createClasse', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await ClasseController.createClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Existant' } } as any)
    const res = mockResponse()
    ;(Classe.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Existant' })

    await ClasseController.createClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Nouveau', description: 'Desc', niveauEtudeId: 'niv1' } } as any)
    const res = mockResponse()
    const saved = { id: 1, libelle: 'Nouveau' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(Classe.findOne as jest.Mock).mockResolvedValue(null)
    ;(Classe as jest.Mock).mockReturnValue({ save: mockSave })

    await ClasseController.createClasse(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Nouveau' } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(Classe.findOne as jest.Mock).mockResolvedValue(null)
    ;(Classe as jest.Mock).mockReturnValue({ save: mockSave })

    await ClasseController.createClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('ClasseController.updateClasse', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await ClasseController.updateClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(Classe.findOne as jest.Mock).mockResolvedValue(null)

    await ClasseController.updateClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(Classe.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await ClasseController.updateClasse(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(Classe.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await ClasseController.updateClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('ClasseController.deleteClasse', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await ClasseController.deleteClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(Classe.findOne as jest.Mock).mockResolvedValue(null)

    await ClasseController.deleteClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(Classe.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await ClasseController.deleteClasse(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(Classe.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await ClasseController.deleteClasse(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('ClasseController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await ClasseController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Classe.count as jest.Mock).mockResolvedValue(3)

    await ClasseController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 3 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(Classe.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await ClasseController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
