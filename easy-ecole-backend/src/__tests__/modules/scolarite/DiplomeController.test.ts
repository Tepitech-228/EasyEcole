import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import DiplomeController from '../../../modules/scolarite/controllers/DiplomeController'

jest.mock('../../../modules/scolarite/models/Diplome', () => {
  const mockSave = jest.fn()
  const MockDiplome: any = jest.fn().mockImplementation(() => ({ save: mockSave }))
  MockDiplome.findAll = jest.fn()
  MockDiplome.findOne = jest.fn()
  MockDiplome.count = jest.fn()
  return { Diplome: MockDiplome, mockSave }
})

const { Diplome, mockSave } = require('../../../modules/scolarite/models/Diplome')

beforeEach(() => jest.clearAllMocks())

describe('DiplomeController', () => {
  it('crée un diplôme et renvoie le diplôme sauvegardé', async () => {
    const saved = { id: 17, numeroDiplome: 'DIP-2026-00001' }
    mockSave.mockImplementation(function (this: any) {
      expect(this.cursusApprenantId).toBe(2)
      expect(this.parcoursId).toBe(3)
      expect(this.niveauEtudeId).toBe(4)
      expect(this.anneeObtention).toBe(2026)
      expect(this.mention).toBe('Bien')
      expect(this.numeroDiplome).toBe(saved.numeroDiplome)
      expect(this.extra).toBeUndefined()
      return Promise.resolve(saved)
    })
    const res = mockResponse()

    await DiplomeController.create(mockRequest({
      body: {
        cursusApprenantId: 2,
        parcoursId: 3,
        niveauEtudeId: 4,
        anneeObtention: 2026,
        mention: 'Bien',
        numeroDiplome: saved.numeroDiplome,
        extra: 'non assigné'
      }
    }), res)

    expect(Diplome).toHaveBeenCalledTimes(1)
    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith(saved)
  })

  it('retourne 400 lorsque la sauvegarde du diplôme échoue', async () => {
    mockSave.mockRejectedValue(new Error('validation'))
    const res = mockResponse()

    await DiplomeController.create(mockRequest({ body: { numeroDiplome: 'INVALIDE' } }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.any(Error) }))
  })

  it('retourne 404 pour un diplôme absent', async () => {
    Diplome.findOne.mockResolvedValue(null)
    const res = mockResponse()

    await DiplomeController.get(mockRequest({ params: { id: '999' } }), res)

    expect(Diplome.findOne).toHaveBeenCalledWith({ where: { id: '999' } })
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('génère le prochain numéro à partir du nombre de diplômes de l’année', async () => {
    Diplome.count.mockResolvedValue(9)
    const res = mockResponse()

    await DiplomeController.genererNumero(mockRequest({ params: { annee: '2026' } }), res)

    expect(Diplome.count).toHaveBeenCalledWith({
      where: { anneeObtention: { [require('sequelize').Op.eq]: 2026 } }
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ numero: 'DIP-2026-00010' })
  })

  it('retourne 500 si le calcul du prochain numéro échoue', async () => {
    Diplome.count.mockRejectedValue(new Error('database unavailable'))
    const res = mockResponse()

    await DiplomeController.genererNumero(mockRequest({ params: { annee: '2026' } }), res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
