import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import ParentController from '../../../modules/parent/controllers/ParentController'

jest.mock('../../../modules/parent/models/ParentEnfant', () => ({
  ParentEnfant: {
    count: jest.fn(),
    findAll: jest.fn(),
  },
}))

jest.mock('../../../modules/auth/models/Apprenant', () => ({
  Apprenant: {
    findByPk: jest.fn(),
  },
}))

jest.mock('../../../modules/bulletins/models/Bulletin', () => ({
  Bulletin: {
    findAll: jest.fn(),
  },
}))

const { ParentEnfant } = require('../../../modules/parent/models/ParentEnfant')
const { Apprenant } = require('../../../modules/auth/models/Apprenant')
const { Bulletin } = require('../../../modules/bulletins/models/Bulletin')

describe('ParentController.getNotes', () => {
  it('refuse l’accès aux notes d’un enfant non rattaché au parent', async () => {
    ParentEnfant.count.mockResolvedValue(0)
    const req = mockRequest({
      params: { id: '14' },
      utilisateurId: 3,
    } as any)
    const res = mockResponse()

    await ParentController.getNotes(req, res)

    expect(ParentEnfant.count).toHaveBeenCalledWith({
      where: { parentUtilisateurId: 3, apprenantId: 14 },
    })
    expect(Apprenant.findByPk).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si l’enfant autorisé n’existe plus', async () => {
    ParentEnfant.count.mockResolvedValue(1)
    Apprenant.findByPk.mockResolvedValue(null)
    const req = mockRequest({ params: { id: '14' }, utilisateurId: 3 } as any)
    const res = mockResponse()

    await ParentController.getNotes(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne les notes publiées avec les informations du cours', async () => {
    ParentEnfant.count.mockResolvedValue(1)
    Apprenant.findByPk.mockResolvedValue({ id: 14, utilisateurId: 28 })
    Bulletin.findAll.mockResolvedValue([{
      id: 6,
      semestre: 'S1',
      lignesBulletins: [{
        coursId: 11,
        moyenne: 15,
        coefficient: 2,
        cours: { intitule: 'Mathématiques', code: 'MATH', coefficient: 3 },
      }],
      anneeAcademique: { libelle: '2026-2027' },
      classe: { libelle: 'Terminale' },
    }])
    const req = mockRequest({ params: { id: '14' }, utilisateurId: 3 } as any)
    const res = mockResponse()

    await ParentController.getNotes(req, res)

    expect(Bulletin.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { utilisateurId: 28, statut: 'publie' },
      order: [['createdAt', 'DESC']],
    }))
    expect(res.json).toHaveBeenCalledWith([{
      bulletinId: 6,
      semestre: 'S1',
      anneeAcademique: '2026-2027',
      classe: 'Terminale',
      coursId: 11,
      cours: 'Mathématiques',
      code: 'MATH',
      moyenne: 15,
      coefficient: 2,
      appreciation: undefined,
    }])
  })
})
