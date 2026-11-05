import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import ApprenantController from '../../../modules/auth/controllers/ApprenantController'

jest.mock('../../../core/helpers/DatabaseConnection', () => ({
  DatabaseConnection: {
    getInstance: () => ({ sequelize: {} }),
  },
}))

jest.mock('../../../modules/auth/models/Apprenant', () => ({
  Apprenant: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    associations: {
      adresse: 'adresse',
      identite: 'identite',
      informationsSalarie: 'informationsSalarie',
      informationsParents: 'informationsParents',
      personnePrevenir: 'personnePrevenir',
      utilisateur: 'utilisateur',
    },
  },
}))

jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: {
    findByPk: jest.fn(),
  },
}))

jest.mock('../../../modules/auth/models/AdresseApprenant', () => ({ AdresseApprenant: {} }))
jest.mock('../../../modules/auth/models/InformationsParentsApprenant', () => ({ InformationsParentsApprenant: {} }))
jest.mock('../../../modules/auth/models/IdentiteApprenant', () => ({ IdentiteApprenant: {} }))
jest.mock('../../../modules/auth/models/InformationsSalarieApprenant', () => ({ InformationsSalarieApprenant: {} }))
jest.mock('../../../modules/auth/models/PersonnePrevenirApprenant', () => ({ PersonnePrevenirApprenant: {} }))

const { Apprenant } = require('../../../modules/auth/models/Apprenant')
const { Utilisateur } = require('../../../modules/auth/models/Utilisateur')

describe('Apprenant enrollment photo upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('stores the photo on the account until the student profile exists', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    Apprenant.findOne.mockResolvedValue(null)
    Utilisateur.findByPk.mockResolvedValue({ update })
    const req = mockRequest({
      utilisateurId: 17,
      utilisateurRole: 'apprenant',
      files: { photo: [{ filename: 'student-photo.jpg' }] },
    } as any)
    const res = mockResponse()

    await ApprenantController.updatePhoto(req, res)

    expect(update).toHaveBeenCalledWith({ photoDeProfil: 'student-photo.jpg' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('returns the pending photo when the learner profile is not created yet', async () => {
    const utilisateur = {
      id: 17,
      nom: 'Test',
      prenoms: 'Étudiant',
      email: 'student@example.test',
      contact: '00000000',
      photoDeProfil: 'student-photo.jpg',
    }
    Apprenant.findOne.mockResolvedValue(null)
    Utilisateur.findByPk.mockResolvedValue(utilisateur)
    const req = mockRequest({
      utilisateurId: 17,
      utilisateurRole: 'apprenant',
    } as any)
    const res = mockResponse()

    await ApprenantController.getApprenant(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith({
      photo: 'student-photo.jpg',
      utilisateur: {
        nom: 'Test',
        prenoms: 'Étudiant',
        email: 'student@example.test',
        contact: '00000000',
      },
    })
  })

  it('attaches the pending photo when creating the student profile', async () => {
    const profile = { id: 23 }
    Apprenant.findOne.mockResolvedValue(null)
    Utilisateur.findByPk.mockResolvedValue({ photoDeProfil: 'student-photo.jpg' })
    Apprenant.create.mockResolvedValue(profile)
    const req = mockRequest({
      utilisateurId: 17,
      utilisateurRole: 'apprenant',
      body: {
        dateNaissance: '2000-01-01',
        lieuNaissance: 'Lomé',
        adresse: {},
      },
    } as any)
    const res = mockResponse()

    await ApprenantController.updateApprenant(req, res)

    expect(Apprenant.create).toHaveBeenCalledWith(
      expect.objectContaining({ photo: 'student-photo.jpg', utilisateurId: 17 }),
      expect.any(Object)
    )
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
