import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'
import CategorieImmobilisationController from '../../../modules/immobilisation/controllers/CategorieImmobilisationController'

jest.mock('../../../modules/immobilisation/models/CategorieImmobilisation', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findByPk = jest.fn()
  Mock.create = jest.fn()
  return { CategorieImmobilisation: Mock }
})

const { CategorieImmobilisation } = require('../../../modules/immobilisation/models/CategorieImmobilisation')

beforeEach(() => jest.clearAllMocks())

describe('CategorieImmobilisationController', () => {
  it('renvoie les catégories', async () => {
    const categories = [{ id: 1, libelle: 'Informatique' }]
    CategorieImmobilisation.findAll.mockResolvedValue(categories)
    const res = mockResponse()

    await CategorieImmobilisationController.getAll(mockRequest(), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(categories)
  })

  it('renvoie 404 si une catégorie est introuvable', async () => {
    CategorieImmobilisation.findByPk.mockResolvedValue(null)
    const res = mockResponse()

    await CategorieImmobilisationController.get(mockRequest({ params: { id: '70' } }), res)

    expect(CategorieImmobilisation.findByPk).toHaveBeenCalledWith('70')
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('bloque la création pour un apprenant sans toucher au modèle', async () => {
    const res = mockResponse()

    await CategorieImmobilisationController.create(mockRequest({
      utilisateurRole: RolesUtilisateur.APPRENANT,
      body: { libelle: 'Interdite' }
    } as any), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(CategorieImmobilisation.create).not.toHaveBeenCalled()
  })

  it('crée une catégorie pour un rôle autorisé', async () => {
    const category = { id: 3, libelle: 'Mobilier' }
    CategorieImmobilisation.create.mockResolvedValue(category)
    const res = mockResponse()

    await CategorieImmobilisationController.create(mockRequest({
      utilisateurRole: RolesUtilisateur.ADMIN,
      body: { libelle: 'Mobilier' }
    } as any), res)

    expect(CategorieImmobilisation.create).toHaveBeenCalledWith({ libelle: 'Mobilier' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(category)
  })

  it('signale un conflit sur un libellé déjà utilisé', async () => {
    const error: any = new Error('duplicate')
    error.name = 'SequelizeUniqueConstraintError'
    CategorieImmobilisation.create.mockRejectedValue(error)
    const res = mockResponse()

    await CategorieImmobilisationController.create(mockRequest({
      utilisateurRole: RolesUtilisateur.ADMIN,
      body: { libelle: 'Déjà pris' }
    } as any), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, alreadyExists: true })
  })
})
