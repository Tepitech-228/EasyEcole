import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import MatierePrerequisController from '../../../modules/inscription/controllers/MatierePrerequisController'

jest.mock('../../../modules/inscription/models/MatierePrerequis', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  return { MatierePrerequis: Mock }
})

const { MatierePrerequis } = require('../../../modules/inscription/models/MatierePrerequis')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('MatierePrerequisController.getAllMatieresPrerequis', () => {
  it('retourne 200 avec la liste', async () => {
    const req = mockRequest()
    const res = mockResponse()
    const fakeList = [{ id: 1, libelle: 'Mathématiques' }]
    ;(MatierePrerequis.findAll as jest.Mock).mockResolvedValue(fakeList)

    await MatierePrerequisController.getAllMatieresPrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fakeList)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest()
    const res = mockResponse()
    ;(MatierePrerequis.findAll as jest.Mock).mockRejectedValue(new Error('DB error'))

    await MatierePrerequisController.getAllMatieresPrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('MatierePrerequisController.getMatierePrerequis', () => {
  it('retourne 200 si trouvée', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    const fake = { id: 1, libelle: 'Mathématiques' }
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue(fake)

    await MatierePrerequisController.getMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(fake)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ params: { id: '999' } })
    const res = mockResponse()
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue(null)

    await MatierePrerequisController.getMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ params: { id: '1' } })
    const res = mockResponse()
    ;(MatierePrerequis.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await MatierePrerequisController.getMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('MatierePrerequisController.createMatierePrerequis', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await MatierePrerequisController.createMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si doublon', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Existant' } } as any)
    const res = mockResponse()
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Existant' })

    await MatierePrerequisController.createMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Matière déjà existante' })
  })

  it('crée et retourne 201', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Physique' } } as any)
    const res = mockResponse()
    const saved = { id: 1, libelle: 'Physique' }
    const mockSave = jest.fn().mockResolvedValue(saved)
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue(null)
    ;(MatierePrerequis as jest.Mock).mockReturnValue({ save: mockSave })

    await MatierePrerequisController.createMatierePrerequis(req, res)

    expect(mockSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 si erreur save', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', body: { libelle: 'Physique' } } as any)
    const res = mockResponse()
    const mockSave = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue(null)
    ;(MatierePrerequis as jest.Mock).mockReturnValue({ save: mockSave })

    await MatierePrerequisController.createMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('MatierePrerequisController.updateMatierePrerequis', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await MatierePrerequisController.updateMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue(null)

    await MatierePrerequisController.updateMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 400 si nouveau libelle déjà existant', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { libelle: 'Pris' } } as any)
    const res = mockResponse()
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValueOnce({ id: 1, libelle: 'Ancien' })
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValueOnce({ id: 2, libelle: 'Pris' })

    await MatierePrerequisController.updateMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('met à jour et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { name: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockResolvedValue({})
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await MatierePrerequisController.updateMatierePrerequis(req, res)

    expect(mockUpdate).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 400 si erreur update', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' }, body: { name: 'Modifié' } } as any)
    const res = mockResponse()
    const mockUpdate = jest.fn().mockRejectedValue(new Error('Validation error'))
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue({ id: 1, libelle: 'Ancien', update: mockUpdate })

    await MatierePrerequisController.updateMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('MatierePrerequisController.deleteMatierePrerequis', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: '1' } } as any)
    const res = mockResponse()

    await MatierePrerequisController.deleteMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '999' } } as any)
    const res = mockResponse()
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue(null)

    await MatierePrerequisController.deleteMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('supprime et retourne 200', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockResolvedValue(undefined)
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await MatierePrerequisController.deleteMatierePrerequis(req, res)

    expect(mockDestroy).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('retourne 500 si erreur destroy', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: '1' } } as any)
    const res = mockResponse()
    const mockDestroy = jest.fn().mockRejectedValue(new Error('DB error'))
    ;(MatierePrerequis.findOne as jest.Mock).mockResolvedValue({ id: 1, destroy: mockDestroy })

    await MatierePrerequisController.deleteMatierePrerequis(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('MatierePrerequisController.getCount', () => {
  it('retourne 403 si APPRENANT', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant' } as any)
    const res = mockResponse()

    await MatierePrerequisController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 200 avec le count', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(MatierePrerequis.count as jest.Mock).mockResolvedValue(6)

    await MatierePrerequisController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 6 })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()
    ;(MatierePrerequis.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    await MatierePrerequisController.getCount(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
