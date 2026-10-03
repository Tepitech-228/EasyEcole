import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'
import EtablissementController from '../../../modules/etablissement/controllers/EtablissementController'

jest.mock('../../../modules/etablissement/models/Etablissement', () => ({
  Etablissement: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}))

const { Etablissement } = require('../../../modules/etablissement/models/Etablissement')

describe('EtablissementController', () => {
  it('limite la liste d’un utilisateur à son établissement', async () => {
    const item = { id: 4, nom: 'École' }
    Etablissement.findByPk.mockResolvedValue(item)
    const req = mockRequest({ utilisateurRole: RolesUtilisateur.INSTITUTION, etablissementId: 4 } as any)
    const res = mockResponse()

    await EtablissementController.getAll(req, res)

    expect(Etablissement.findByPk).toHaveBeenCalledWith(4)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith([item])
  })

  it('refuse la consultation d’un autre établissement', async () => {
    Etablissement.findByPk.mockResolvedValue({ id: 5, nom: 'Autre école' })
    const req = mockRequest({
      params: { id: '5' },
      utilisateurRole: RolesUtilisateur.INSTITUTION,
      etablissementId: 4,
    } as any)
    const res = mockResponse()

    await EtablissementController.get(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Accès non autorisé' })
  })

  it('réserve la création aux administrateurs', async () => {
    const req = mockRequest({
      body: { nom: 'Nouvelle école' },
      utilisateurRole: RolesUtilisateur.INSTITUTION,
    } as any)
    const res = mockResponse()

    await EtablissementController.create(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(Etablissement.create).not.toHaveBeenCalled()
  })

  it('permet à un administrateur de créer un établissement', async () => {
    const created = { id: 9, nom: 'Nouvelle école' }
    Etablissement.create.mockResolvedValue(created)
    const req = mockRequest({
      body: { nom: 'Nouvelle école' },
      utilisateurRole: RolesUtilisateur.ADMIN,
    } as any)
    const res = mockResponse()

    await EtablissementController.create(req, res)

    expect(Etablissement.create).toHaveBeenCalledWith({ nom: 'Nouvelle école' })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(created)
  })
})
