import { Echeance } from '../../../modules/inscription/models/Echeance'
import { GenerateurEcheancierService } from '../../../modules/inscription/services/GenerateurEcheancierService'
import { GenerateurEcheancierScolariteService } from '../../../modules/inscription/services/GenerateurEcheancierScolariteService'
import { VerificationPaiementService } from '../../../modules/inscription/services/VerificationPaiementService'

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => {
  const Mock: any = jest.fn()
  Mock.findOne = jest.fn()
  Mock.associations = { echeances: 'echeances' }
  return { DossierEtudiant: Mock }
})

const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')

describe('échéanciers d\'inscription et de scolarité', () => {
  const originalSave = Echeance.prototype.save

  beforeEach(() => {
    Echeance.prototype.save = async function save() {
      this.id = this.id ?? 1
      return this
    }
    ;(DossierEtudiant.findOne as jest.Mock).mockResolvedValue(null)
  })

  afterEach(() => {
    Echeance.prototype.save = originalSave
  })

  it('décale la première échéance d\'inscription au mois suivant la validation', async () => {
    const dossier = { id: 42, montant: 3000 } as any
    const echeances = await GenerateurEcheancierService.generer(dossier, '3x', undefined, 3000)

    expect(echeances).toHaveLength(3)
    const base = new Date()
    const first = new Date(echeances[0].dateLimite)
    const monthDelta = (first.getFullYear() - base.getFullYear()) * 12 + (first.getMonth() - base.getMonth())

    expect(monthDelta).toBe(1)
    expect(new Date(echeances[1].dateLimite).getMonth()).toBe((base.getMonth() + 1 + 1) % 12)
  })

  it('décale la première échéance de scolarité au mois suivant le mois courant', async () => {
    const dossier = { id: 84 } as any
    const frais = { montant: 1200, modalite: '3x' } as any

    const echeances = await GenerateurEcheancierScolariteService.generer(dossier, frais)

    expect(echeances).toHaveLength(3)
    const base = new Date()
    const first = new Date(echeances[0].dateLimite)
    const monthDelta = (first.getFullYear() - base.getFullYear()) * 12 + (first.getMonth() - base.getMonth())

    expect(monthDelta).toBe(1)
  })

  it('n\'impose pas le menu de régularisation si l\'étudiant n\'a pas encore de dossier', async () => {
    const result = await VerificationPaiementService.verifierPaiement(999999)

    expect(result.statut).toBe('vert')
    expect(result.echeancesEnRetard).toBe(0)
  })
})
