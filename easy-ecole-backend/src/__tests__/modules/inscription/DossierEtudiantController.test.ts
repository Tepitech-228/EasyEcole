import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => {
  const DossierEtudiant: any = jest.fn()
  DossierEtudiant.findOne = jest.fn()
  DossierEtudiant.findAll = jest.fn()
  DossierEtudiant.associations = { utilisateur: 'utilisateur', echeances: 'echeances' }
  return { DossierEtudiant }
})

jest.mock('../../../modules/inscription/models/DemandeInscription', () => ({
  DemandeInscription: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    associations: {
      dossiersDemande: 'dossiersDemande',
      cursusApprenant: 'cursusApprenant',
      session: 'session',
    },
  },
}))

jest.mock('../../../modules/inscription/models/Bordereau', () => ({
  Bordereau: { findAll: jest.fn(), associations: { echeance: 'echeance' } },
}))

jest.mock('../../../modules/auth/models/Utilisateur', () => ({ Utilisateur: jest.fn() }))
jest.mock('../../../modules/auth/models/Apprenant', () => ({ Apprenant: jest.fn() }))
jest.mock('../../../modules/auth/models/IdentiteApprenant', () => ({ IdentiteApprenant: jest.fn() }))
jest.mock('../../../modules/auth/models/AdresseApprenant', () => ({ AdresseApprenant: jest.fn() }))
jest.mock('../../../modules/auth/models/InformationsParentsApprenant', () => ({ InformationsParentsApprenant: jest.fn() }))
jest.mock('../../../modules/auth/models/InformationsSalarieApprenant', () => ({ InformationsSalarieApprenant: jest.fn() }))
jest.mock('../../../modules/auth/models/PersonnePrevenirApprenant', () => ({ PersonnePrevenirApprenant: jest.fn() }))
jest.mock('../../../modules/parent/models/ParentEnfant', () => ({ ParentEnfant: { findAll: jest.fn() } }))
jest.mock('../../../core/helpers/IDGenerator', () => ({ IDGenerator: { getInstance: jest.fn() } }))
jest.mock('../../../modules/inscription/models/Echeance', () => ({ Echeance: jest.fn() }))
jest.mock('../../../modules/inscription/models/DemandeInscriptionDossier', () => ({ DemandeInscriptionDossier: jest.fn() }))
jest.mock('../../../modules/inscription/models/DossierInscription', () => ({ DossierInscription: jest.fn() }))
jest.mock('../../../modules/inscription/models/Session', () => ({ Session: jest.fn() }))
jest.mock('../../../modules/inscription/models/ParcoursChoisi', () => ({ ParcoursChoisi: jest.fn() }))
jest.mock('../../../modules/inscription/models/CoursParticipant', () => ({ CoursParticipant: jest.fn() }))
jest.mock('../../../modules/inscription/models/CursusApprenant', () => ({ CursusApprenant: jest.fn() }))
jest.mock('../../../modules/etablissement/models/Etablissement', () => ({ Etablissement: jest.fn() }))
jest.mock('../../../modules/inscription/models/Parcours', () => ({ Parcours: jest.fn() }))
jest.mock('../../../modules/inscription/models/AnneeAcademique', () => ({ AnneeAcademique: jest.fn() }))
jest.mock('../../../modules/inscription/models/NiveauEtude', () => ({ NiveauEtude: jest.fn() }))
jest.mock('../../../modules/inscription/models/Classe', () => ({ Classe: jest.fn() }))
jest.mock('../../../modules/inscription/models/SalleDeClasse', () => ({ SalleDeClasse: jest.fn() }))
jest.mock('../../../modules/inscription/services/GenerateurCarteService', () => ({ GenerateurCarteService: { generer: jest.fn() } }))

const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const { DemandeInscription } = require('../../../modules/inscription/models/DemandeInscription')
const { Bordereau } = require('../../../modules/inscription/models/Bordereau')
import DossierEtudiantController from '../../../modules/inscription/controllers/DossierEtudiantController'

beforeEach(() => {
  jest.clearAllMocks()
  ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue({ id: 13, utilisateurId: 51 })
  ;(DemandeInscription.findOne as jest.Mock).mockResolvedValue(null)
  ;(Bordereau.findAll as jest.Mock).mockResolvedValue([])
})

describe('DossierEtudiantController.getDossierComplet', () => {
  it('scopes both the dossier and related request to the active site', async () => {
    const req = mockRequest({
      utilisateurRole: 'institution',
      etablissementId: 4,
      params: { id: '13' },
    } as any)
    const res = mockResponse()

    await DossierEtudiantController.getDossierComplet(req, res)

    expect(DossierEtudiant.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: '13', etablissementId: 4 },
    }))
    expect(DemandeInscription.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { utilisateurId: 51, etablissementId: 4 },
      include: expect.arrayContaining([
        expect.objectContaining({
          association: 'session',
          where: { etablissementId: 4 },
          required: true,
        }),
      ]),
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('refuses dossier detail without an active site', async () => {
    const req = mockRequest({ utilisateurRole: 'institution', params: { id: '13' } } as any)
    const res = mockResponse()

    await DossierEtudiantController.getDossierComplet(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DossierEtudiant.findOne).not.toHaveBeenCalled()
    expect(DemandeInscription.findOne).not.toHaveBeenCalled()
  })
})
