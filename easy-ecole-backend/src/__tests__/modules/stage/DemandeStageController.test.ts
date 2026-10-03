import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/stage/models/DemandeStage', () => {
  const DemandeStage: any = jest.fn()
  DemandeStage.findAll = jest.fn()
  DemandeStage.findByPk = jest.fn()
  DemandeStage.create = jest.fn()
  return { DemandeStage }
})

jest.mock('../../../modules/stage/models/OffreStage', () => ({ OffreStage: jest.fn() }))
jest.mock('../../../modules/auth/models/Apprenant', () => ({ Apprenant: jest.fn() }))
jest.mock('../../../modules/auth/models/Utilisateur', () => ({ Utilisateur: jest.fn() }))

const { DemandeStage } = require('../../../modules/stage/models/DemandeStage')
import DemandeStageController from '../../../modules/stage/controllers/DemandeStageController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('DemandeStageController', () => {
  it('crée une demande et retourne celle-ci', async () => {
    const body = { offreStageId: 3, apprenantId: 12, dateDebut: '2026-11-01', dateFin: '2027-01-31' }
    const created = { id: 'demande-1', ...body }
    const req = mockRequest({ utilisateurRole: 'apprenant', body } as any)
    const res = mockResponse()
    DemandeStage.create.mockResolvedValue(created)

    await DemandeStageController.create(req, res)

    expect(DemandeStage.create).toHaveBeenCalledWith(body)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(created)
  })

  it('refuse la création par un enseignant sans appeler le modèle', async () => {
    const req = mockRequest({ utilisateurRole: 'enseignant', body: {} } as any)
    const res = mockResponse()

    await DemandeStageController.create(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeStage.create).not.toHaveBeenCalled()
  })

  it('marque la demande comme validée pour un administrateur', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    const item = { id: 'demande-1', update }
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: 'demande-1' } } as any)
    const res = mockResponse()
    DemandeStage.findByPk.mockResolvedValue(item)

    await DemandeStageController.valider(req, res)

    expect(update).toHaveBeenCalledWith({ statut: 'valide' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(item)
  })

  it('refuse à un apprenant de valider une demande', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', params: { id: 'demande-1' } } as any)
    const res = mockResponse()

    await DemandeStageController.valider(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DemandeStage.findByPk).not.toHaveBeenCalled()
  })

  it('retourne 404 si la demande à valider n’existe pas', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: 'absent' } } as any)
    const res = mockResponse()
    DemandeStage.findByPk.mockResolvedValue(null)

    await DemandeStageController.valider(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 500 si la validation échoue', async () => {
    const req = mockRequest({ utilisateurRole: 'admin', params: { id: 'demande-1' } } as any)
    const res = mockResponse()
    DemandeStage.findByPk.mockRejectedValue(new Error('database unavailable'))

    await DemandeStageController.valider(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
