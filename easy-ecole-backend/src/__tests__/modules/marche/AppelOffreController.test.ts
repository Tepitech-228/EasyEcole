import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../modules/marche/models/AppelOffre', () => {
  const AppelOffre: any = jest.fn()
  AppelOffre.findAll = jest.fn()
  AppelOffre.findByPk = jest.fn()
  AppelOffre.create = jest.fn()
  return { AppelOffre }
})

const { AppelOffre } = require('../../../modules/marche/models/AppelOffre')
import AppelOffreController from '../../../modules/marche/controllers/AppelOffreController'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AppelOffreController', () => {
  it('retourne la liste des appels d’offres', async () => {
    const items = [{ id: 1, reference: 'AO-2026-01' }]
    const req = mockRequest()
    const res = mockResponse()
    AppelOffre.findAll.mockResolvedValue(items)

    await AppelOffreController.getAll(req, res)

    expect(AppelOffre.findAll).toHaveBeenCalledWith()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(items)
  })

  it('retourne 404 si l’appel d’offres est introuvable', async () => {
    const req = mockRequest({ params: { id: 'absent' } })
    const res = mockResponse()
    AppelOffre.findByPk.mockResolvedValue(null)

    await AppelOffreController.get(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('crée un appel d’offres et retourne 201', async () => {
    const body = { planificationMarcheId: 2, reference: 'AO-2026-02', objet: 'Fournitures scolaires' }
    const created = { id: 3, ...body }
    const req = mockRequest({ body })
    const res = mockResponse()
    AppelOffre.create.mockResolvedValue(created)

    await AppelOffreController.create(req, res)

    expect(AppelOffre.create).toHaveBeenCalledWith(body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(created)
  })

  it('lance un appel d’offres existant', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    const item = { id: 3, update }
    const req = mockRequest({ params: { id: '3' } })
    const res = mockResponse()
    AppelOffre.findByPk.mockResolvedValue(item)

    await AppelOffreController.lancer(req, res)

    expect(update).toHaveBeenCalledWith({ statut: 'lance' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(item)
  })

  it('retourne 500 si le lancement échoue', async () => {
    const req = mockRequest({ params: { id: '3' } })
    const res = mockResponse()
    AppelOffre.findByPk.mockRejectedValue(new Error('database unavailable'))

    await AppelOffreController.lancer(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
