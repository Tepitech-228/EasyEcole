import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'
import DocumentTypeController from '../../../modules/ged/controllers/DocumentTypeController'

jest.mock('../../../modules/ged/models/DocumentType', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}))

jest.mock('../../../modules/ged/models/Domain', () => ({
  __esModule: true,
  default: {}
}))

const DocumentType = require('../../../modules/ged/models/DocumentType').default

beforeEach(() => jest.clearAllMocks())

describe('DocumentTypeController', () => {
  it('filtre les types par domaine et les trie par code', async () => {
    const types = [{ id: 5, code: 'ARCHIVE' }]
    DocumentType.findAll.mockResolvedValue(types)
    const res = mockResponse()

    await DocumentTypeController.list(mockRequest({ query: { domainId: '12' } }), res)

    expect(DocumentType.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { domainId: '12' },
      order: [['code', 'ASC']]
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(types)
  })

  it('retourne 404 si le type demandé n’existe pas', async () => {
    DocumentType.findByPk.mockResolvedValue(null)
    const res = mockResponse()

    await DocumentTypeController.get(mockRequest({ params: { id: '404' } }), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('refuse la création à un rôle non institutionnel', async () => {
    const res = mockResponse()

    await DocumentTypeController.create(mockRequest({
      utilisateurRole: RolesUtilisateur.ENSEIGNANT,
      body: { domainId: 1, code: 'RH', label: 'Dossier RH' }
    } as any), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DocumentType.create).not.toHaveBeenCalled()
  })

  it('crée un type autorisé avec les valeurs par défaut prévues', async () => {
    const type = { id: 7, code: 'RH', label: 'Dossier RH' }
    DocumentType.create.mockResolvedValue(type)
    const res = mockResponse()

    await DocumentTypeController.create(mockRequest({
      utilisateurRole: RolesUtilisateur.INSTITUTION,
      body: { domainId: 2, code: 'RH', label: 'Dossier RH' }
    } as any), res)

    expect(DocumentType.create).toHaveBeenCalledWith({
      domainId: 2,
      code: 'RH',
      shortCode: null,
      label: 'Dossier RH',
      defaultConfidentiality: 'interne',
      duaDurationYears: null,
      isPermanent: false
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(type)
  })

  it('réserve la suppression aux administrateurs', async () => {
    const res = mockResponse()

    await DocumentTypeController.remove(mockRequest({
      utilisateurRole: RolesUtilisateur.INSTITUTION,
      params: { id: '7' }
    } as any), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DocumentType.findByPk).not.toHaveBeenCalled()
  })
})
