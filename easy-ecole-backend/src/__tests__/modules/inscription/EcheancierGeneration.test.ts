import { Echeance } from '../../../modules/inscription/models/Echeance'
import { GenerateurEcheancierService } from '../../../modules/inscription/services/GenerateurEcheancierService'
import { GenerateurEcheancierScolariteService } from '../../../modules/inscription/services/GenerateurEcheancierScolariteService'
import { VerificationPaiementService } from '../../../modules/inscription/services/VerificationPaiementService'
import SituationFinanciereService from '../../../modules/inscription/services/SituationFinanciereService'

jest.mock('../../../modules/inscription/models/DossierEtudiant', () => {
  return {
    DossierEtudiant: {
      findOne: jest.fn(),
      associations: { echeances: 'echeances' }
    }
  }
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

  it('autorise le pointage avec un avertissement lorsqu’une échéance est partiellement payée', () => {
    const result = VerificationPaiementService.verifierDossier({
      statut: 'actif',
      echeances: [{ statut: 'partiel', numeroEcheance: 2 }]
    } as any)

    expect(result.statut).toBe('vert')
    expect(result.avertissementPaiement).toBe('Échéance mois 2 partiellement payée.')
  })

  it('calcule le total global, les montants payés et le reste sur inscription et scolarité', () => {
    const situation = SituationFinanciereService.calculer({
      fraisScolarite: 9999,
      echeances: [
        {
          type: 'inscription',
          montant: 1000,
          montantPaye: 1000,
          dateLimite: new Date('2026-09-01T00:00:00'),
          numeroEcheance: 1,
          statut: 'paye',
          devise: 'XAF'
        },
        {
          type: 'scolarite',
          montant: 2000,
          montantPaye: 500,
          dateLimite: new Date('2026-11-01T00:00:00'),
          numeroEcheance: 2,
          statut: 'partiel',
          devise: 'XAF'
        }
      ]
    } as any)

    expect(situation.sommeGlobale).toBe(3000)
    expect(situation.montantPaye).toBe(1500)
    expect(situation.resteAPayer).toBe(1500)
    expect(situation.echeances).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'inscription', estPaye: true, resteAPayer: 0 }),
      expect.objectContaining({ type: 'scolarite', montantPaye: 500, resteAPayer: 1500, statut: 'partiel' })
    ]))
  })
})
