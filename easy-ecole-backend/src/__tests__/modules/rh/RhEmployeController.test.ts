import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import RhEmployeController from '../../../modules/rh/controllers/RhEmployeController'

jest.mock('../../../modules/rh/models/RhEmploye', () => {
  const Mock: any = jest.fn()
  Mock.findAll = jest.fn()
  Mock.findOne = jest.fn()
  Mock.findByPk = jest.fn()
  Mock.create = jest.fn()
  Mock.count = jest.fn()
  Mock.associations = { poste: {}, departement: {}, typeContrat: {} }
  return { RhEmploye: Mock }
})

const { RhEmploye } = require('../../../modules/rh/models/RhEmploye')

beforeEach(() => jest.clearAllMocks())

describe('RhEmployeController', () => {
  it('retourne la liste des employés', async () => {
    const employes = [{ id: 4, nom: 'Diallo' }]
    RhEmploye.findAll.mockResolvedValue(employes)
    const res = mockResponse()

    await RhEmployeController.getAll(mockRequest(), res)

    expect(RhEmploye.findAll).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(employes)
  })

  it('retourne 404 lorsque l’employé demandé est absent', async () => {
    RhEmploye.findOne.mockResolvedValue(null)
    const res = mockResponse()

    await RhEmployeController.get(mockRequest({ params: { id: '404' } }), res)

    expect(RhEmploye.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: '404' } }))
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('ne transmet à la création que les champs RH autorisés', async () => {
    const employe = { id: 8, nom: 'Kone' }
    RhEmploye.create.mockResolvedValue(employe)
    const res = mockResponse()

    await RhEmployeController.create(mockRequest({
      body: { nom: 'Kone', matricule: 'RH-8', isAdmin: true, motDePasse: 'ignore' }
    }), res)

    expect(RhEmploye.create).toHaveBeenCalledWith({ matricule: 'RH-8', nom: 'Kone' })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(employe)
  })

  it('ne transmet à la mise à jour que les champs RH autorisés', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    RhEmploye.findByPk.mockResolvedValue({ update })
    const res = mockResponse()

    await RhEmployeController.update(mockRequest({
      params: { id: '8' },
      body: { salaireBase: 1200, isAdmin: true, motDePasse: 'ignore' },
    }), res)

    expect(update).toHaveBeenCalledWith({ salaireBase: 1200 })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('refuse la mise à jour si l’employé n’existe pas', async () => {
    RhEmploye.findByPk.mockResolvedValue(null)
    const res = mockResponse()

    await RhEmployeController.update(mockRequest({ params: { id: '9' }, body: { nom: 'Nouveau' } }), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(RhEmploye.findByPk).toHaveBeenCalledWith('9')
  })

  it('retourne une erreur contrôlée si la création échoue', async () => {
    RhEmploye.create.mockRejectedValue(new Error('validation'))
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = mockResponse()

    await RhEmployeController.create(mockRequest({ body: { nom: 'Invalide' } }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Erreur interne serveur' })
    log.mockRestore()
  })

  it('ne renvoie pas les détails internes si la suppression échoue', async () => {
    const internalError = new Error('sensitive database detail')
    RhEmploye.findByPk.mockResolvedValue({ destroy: jest.fn().mockRejectedValue(internalError) })
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = mockResponse()

    await RhEmployeController.delete(mockRequest({ params: { id: '8' } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Erreur interne serveur' })
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ error: internalError }))
    log.mockRestore()
  })

  it('ne renvoie pas les détails internes si le comptage échoue', async () => {
    const internalError = new Error('sensitive database detail')
    RhEmploye.count.mockRejectedValue(internalError)
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = mockResponse()

    await RhEmployeController.getCount(mockRequest(), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Erreur interne serveur' })
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ error: internalError }))
    log.mockRestore()
  })
})
