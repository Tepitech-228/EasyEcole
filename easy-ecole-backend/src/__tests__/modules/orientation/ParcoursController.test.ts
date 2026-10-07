import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import ParcoursController from '../../../modules/orientation/controllers/ParcoursController'

jest.mock('../../../modules/orientation/models/Parcours', () => {
  const MockParcours: any = jest.fn()
  MockParcours.findAll = jest.fn()
  MockParcours.findOne = jest.fn()
  MockParcours.count = jest.fn()
  MockParcours.associations = {
    categorie: 'categorie',
    niveauEtude: 'niveauEtude',
    debouchesParcours: 'debouchesParcours',
  }
  return { Parcours: MockParcours }
})

jest.mock('../../../modules/orientation/models/PrerequisParcours', () => ({
  PrerequisParcours: {
    associations: { matierePrerequis: 'matierePrerequis', niveauEtude: 'niveauEtude' },
  },
}))

const { Parcours } = require('../../../modules/orientation/models/Parcours')

beforeEach(() => jest.clearAllMocks())

describe('ParcoursController', () => {
  it('retourne les parcours demandés', async () => {
    const parcours = [{ id: 4, titre: 'Sciences' }]
    Parcours.findAll.mockResolvedValue(parcours)
    const res = mockResponse()

    await ParcoursController.getAllParcours(mockRequest(), res)

    expect(Parcours.findAll).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(parcours)
  })

  it('renvoie 500 si la lecture échoue', async () => {
    Parcours.findAll.mockRejectedValue(new Error('indisponible'))
    const res = mockResponse()

    await ParcoursController.getAllParcours(mockRequest(), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
  })

  it('renvoie 404 quand le parcours demandé n’existe pas', async () => {
    Parcours.findOne.mockResolvedValue(null)
    const res = mockResponse()

    await ParcoursController.getParcours(mockRequest({ params: { id: '404' } }), res)

    expect(Parcours.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: '404' } }))
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 403 et ne consulte pas le modèle pour un apprenant', async () => {
    const res = mockResponse()

    await ParcoursController.createParcours(
      mockRequest({ utilisateurRole: 'apprenant', body: { titre: 'Sciences' } } as any),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(Parcours.findOne).not.toHaveBeenCalled()
  })

  it('refuse la création d’un titre déjà utilisé', async () => {
    Parcours.findOne.mockResolvedValue({ id: 2, titre: 'Sciences' })
    const res = mockResponse()

    await ParcoursController.createParcours(
      mockRequest({ utilisateurRole: 'ADMIN', body: { titre: 'Sciences' } } as any),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
    expect(Parcours).not.toHaveBeenCalled()
  })
})
