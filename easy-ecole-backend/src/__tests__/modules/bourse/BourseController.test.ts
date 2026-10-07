import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import BourseAttributionController from '../../../modules/bourse/controllers/BourseAttributionController'
import BourseConfigurationController from '../../../modules/bourse/controllers/BourseConfigurationController'

jest.mock('../../../modules/bourse/models/BourseConfiguration', () => ({
  BourseConfiguration: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}))

jest.mock('../../../modules/bourse/services/BourseService', () => ({
  BourseService: {
    attribuer: jest.fn(),
    getBourseActive: jest.fn(),
  },
}))

const { BourseConfiguration } = require('../../../modules/bourse/models/BourseConfiguration')
const { BourseService } = require('../../../modules/bourse/services/BourseService')

describe('BourseConfigurationController.create', () => {
  it('force le taux à 100 pour une configuration totale', async () => {
    const config = { id: 1, nom: 'Exonération totale', taux: 100 }
    BourseConfiguration.create.mockResolvedValue(config)
    const req = mockRequest({
      body: { nom: '  Exonération totale ', type: 'TOTAL', taux: 15 },
    })
    const res = mockResponse()

    await BourseConfigurationController.create(req, res)

    expect(BourseConfiguration.create).toHaveBeenCalledWith({
      nom: 'Exonération totale',
      type: 'TOTAL',
      taux: 100,
      description: null,
      statut: 'ACTIVE',
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(config)
  })

  it('refuse un taux partiel hors intervalle sans appeler le modèle', async () => {
    const req = mockRequest({
      body: { nom: 'Aide partielle', type: 'PARTIELLE', taux: 100 },
    })
    const res = mockResponse()

    await BourseConfigurationController.create(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(BourseConfiguration.create).not.toHaveBeenCalled()
  })

  it('retourne 500 si la création échoue', async () => {
    BourseConfiguration.create.mockRejectedValue(new Error('write failed'))
    const req = mockRequest({
      body: { nom: 'Aide partielle', type: 'PARTIELLE', taux: 25 },
    })
    const res = mockResponse()

    await BourseConfigurationController.create(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('BourseAttributionController', () => {
  it('refuse un identifiant de dossier invalide sans appeler le service', async () => {
    const req = mockRequest({ params: { dossierId: 'abc' } })
    const res = mockResponse()

    await BourseAttributionController.getBourseActive(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(BourseService.getBourseActive).not.toHaveBeenCalled()
  })

  it('traduit une attribution conflictuelle en 409', async () => {
    BourseService.attribuer.mockRejectedValue(new Error('Cet étudiant a déjà une bourse active'))
    const req = mockRequest({
      params: { dossierId: '42' },
      body: { configurationId: 3, dateDebut: '2026-09-01' },
      utilisateurId: 7,
    } as any)
    const res = mockResponse()

    await BourseAttributionController.attribuer(req, res)

    expect(BourseService.attribuer).toHaveBeenCalledWith(42, 3, '2026-09-01', null, null, 7)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('retourne 201 lorsque le service attribue la bourse', async () => {
    const attribution = { id: 8, statut: 'ACTIVE' }
    BourseService.attribuer.mockResolvedValue(attribution)
    const req = mockRequest({
      params: { dossierId: '42' },
      body: { configurationId: 3, dateDebut: '2026-09-01', motif: 'Mérite' },
      utilisateurId: 7,
    } as any)
    const res = mockResponse()

    await BourseAttributionController.attribuer(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(attribution)
  })
})
