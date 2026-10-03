import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import DemandeController from '../../../modules/achats/controllers/DemandeController'

jest.mock('../../../modules/achats/models/Demande', () => {
  const Demande: any = {}
  Demande.findAll = jest.fn()
  Demande.findOne = jest.fn()
  Demande.findByPk = jest.fn()
  Demande.create = jest.fn()
  Demande.associations = { soumisPar: 'soumisPar', lignesDemande: 'lignesDemande', validations: 'validations', commandes: 'commandes' }
  return { Demande }
})

jest.mock('../../../modules/achats/models/LigneDemande', () => ({
  LigneDemande: { create: jest.fn(), destroy: jest.fn() },
}))

const { Demande } = require('../../../modules/achats/models/Demande')
const { LigneDemande } = require('../../../modules/achats/models/LigneDemande')

beforeEach(() => jest.clearAllMocks())

describe('DemandeController', () => {
  it('crée une demande avec son auteur et ses lignes, puis retourne la ressource complète', async () => {
    const item = { id: 17 }
    const complete = { id: 17, lignesDemande: [{ designation: 'Papier' }] }
    Demande.create.mockResolvedValue(item)
    Demande.findByPk.mockResolvedValue(complete)
    const res = mockResponse()

    await DemandeController.create(
      mockRequest({
        utilisateurId: 6,
        body: {
          description: 'Fournitures',
          statut: 'soumise',
          lignesDemande: [{ designation: 'Papier', quantite: 2 }],
        },
      } as any),
      res,
    )

    expect(Demande.create).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Fournitures',
      soumisParId: 6,
      dateSoumission: expect.any(Date),
    }))
    expect(LigneDemande.create).toHaveBeenCalledWith({ designation: 'Papier', quantite: 2, demandeId: 17 })
    expect(Demande.findByPk).toHaveBeenCalledWith(17, expect.any(Object))
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(complete)
  })

  it('renvoie uniquement les demandes de l’utilisateur connecté', async () => {
    const demandes = [{ id: 3 }]
    Demande.findAll.mockResolvedValue(demandes)
    const res = mockResponse()

    await DemandeController.getMesDemandes(mockRequest({ utilisateurId: 11 } as any), res)

    expect(Demande.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { soumisParId: 11 } }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(demandes)
  })

  it('renvoie 404 si la demande à supprimer est absente', async () => {
    Demande.findOne.mockResolvedValue(null)
    const res = mockResponse()

    await DemandeController.delete(mockRequest({ params: { id: '999' } }), res)

    expect(LigneDemande.destroy).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('renvoie 500 quand la création de demande échoue', async () => {
    const error = new Error('échec de persistance')
    Demande.create.mockRejectedValue(error)
    const res = mockResponse()

    await DemandeController.create(mockRequest({ body: { description: 'Fournitures' } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ success: false, error })
  })
})
