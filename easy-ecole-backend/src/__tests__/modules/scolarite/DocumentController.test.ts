import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import DocumentController from '../../../modules/scolarite/controllers/DocumentController'

jest.mock('../../../modules/scolarite/models/TypeDocument', () => ({
  TypeDocument: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
}))

const { TypeDocument } = require('../../../modules/scolarite/models/TypeDocument')

beforeEach(() => jest.clearAllMocks())

describe('DocumentController - tarifs des documents', () => {
  it('retourne les tarifs sans exposer les autres champs du type', async () => {
    const tarifs = [{ id: 2, libelle: 'Attestation', frais: 2500 }]
    TypeDocument.findAll.mockResolvedValue(tarifs)
    const res = mockResponse()

    await DocumentController.getTarifsTypesDocument(mockRequest(), res)

    expect(TypeDocument.findAll).toHaveBeenCalledWith({
      attributes: ['id', 'libelle', 'frais'],
      order: [['libelle', 'ASC']]
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(tarifs)
  })

  it('permet au caissier de modifier uniquement le frais', async () => {
    const type = {
      id: 2,
      libelle: 'Attestation',
      frais: 2500,
      update: jest.fn().mockImplementation(async values => Object.assign(type, values))
    }
    TypeDocument.findByPk.mockResolvedValue(type)
    const res = mockResponse()

    await DocumentController.updateTarifTypeDocument(
      mockRequest({
        params: { id: '2' },
        body: { frais: 4000 },
        utilisateurRole: 'caissier_banque'
      } as any),
      res
    )

    expect(type.update).toHaveBeenCalledWith({ frais: 4000 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith({ id: 2, libelle: 'Attestation', frais: 4000 })
  })

  it('refuse à la secrétaire de modifier les tarifs', async () => {
    const res = mockResponse()

    await DocumentController.updateTarifTypeDocument(
      mockRequest({
        params: { id: '2' },
        body: { frais: 4000 },
        utilisateurRole: 'secretaire'
      } as any),
      res
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(TypeDocument.findByPk).not.toHaveBeenCalled()
  })

  it('refuse un tarif négatif ou une tentative de modifier le type', async () => {
    const negativeResponse = mockResponse()
    await DocumentController.updateTarifTypeDocument(
      mockRequest({
        params: { id: '2' },
        body: { frais: -1 },
        utilisateurRole: 'caissier_banque'
      } as any),
      negativeResponse
    )

    const mutationResponse = mockResponse()
    await DocumentController.updateTarifTypeDocument(
      mockRequest({
        params: { id: '2' },
        body: { frais: 500, libelle: 'Autre type' },
        utilisateurRole: 'caissier_banque'
      } as any),
      mutationResponse
    )

    expect(negativeResponse.status).toHaveBeenCalledWith(400)
    expect(mutationResponse.status).toHaveBeenCalledWith(400)
    expect(TypeDocument.findByPk).not.toHaveBeenCalled()
  })
})

describe('DocumentController - activation des types de documents', () => {
  it('permet au secrétariat d’activer ou désactiver un type', async () => {
    const type = {
      id: 2,
      libelle: 'Quitus',
      update: jest.fn().mockResolvedValue(undefined)
    }
    TypeDocument.findOne.mockResolvedValue(type)
    const res = mockResponse()

    await DocumentController.updateTypeDocument(
      mockRequest({
        params: { id: '2' },
        body: { libelle: 'Quitus', actif: false },
        utilisateurRole: 'secretaire'
      } as any),
      res
    )

    expect(type.update).toHaveBeenCalledWith(expect.objectContaining({ actif: false }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('refuse un état d’activation qui n’est pas booléen', async () => {
    const res = mockResponse()

    await DocumentController.updateTypeDocument(
      mockRequest({
        params: { id: '2' },
        body: { libelle: 'Quitus', actif: 'false' },
        utilisateurRole: 'secretaire'
      } as any),
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(TypeDocument.findOne).not.toHaveBeenCalled()
  })
})
