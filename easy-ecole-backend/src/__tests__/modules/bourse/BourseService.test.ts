import { BourseService } from '../../../modules/bourse/services/BourseService'
import { Op } from 'sequelize'

jest.mock('../../../modules/inscription/models/Echeance', () => ({
  Echeance: {
    findAll: jest.fn(),
  },
}))

const { Echeance } = require('../../../modules/inscription/models/Echeance')

describe('BourseService.appliquerBourseSurEcheances', () => {
  it('réduit les échéances de scolarité depuis le montant d’origine sans passer sous le montant payé', async () => {
    const scolaritePartielle = {
      montant: 600,
      montantOriginal: 800,
      montantPaye: 100,
      save: jest.fn().mockResolvedValue(undefined),
    }
    Echeance.findAll.mockResolvedValue([scolaritePartielle])

    const modified = await BourseService.appliquerBourseSurEcheances(22, 50)

    expect(Echeance.findAll).toHaveBeenCalledWith({
      where: {
        dossierEtudiantId: 22,
        type: 'scolarite',
        statut: { [Op.in]: ['impaye', 'partiel', 'en_retard'] },
      },
    })
    expect(scolaritePartielle.montant).toBe(400)
    expect(scolaritePartielle.montantOriginal).toBe(800)
    expect(scolaritePartielle.save).toHaveBeenCalledTimes(1)
    expect(modified).toBe(1)
  })

  it('conserve le montant déjà payé si celui-ci dépasse la réduction calculée', async () => {
    const echeance = {
      montant: 600,
      montantOriginal: null,
      montantPaye: 700,
      save: jest.fn().mockResolvedValue(undefined),
    }
    Echeance.findAll.mockResolvedValue([echeance])

    const modified = await BourseService.appliquerBourseSurEcheances(22, 50)

    expect(echeance.montant).toBe(700)
    expect(echeance.montantOriginal).toBe(600)
    expect(echeance.save).toHaveBeenCalledTimes(1)
    expect(modified).toBe(1)
  })
})
