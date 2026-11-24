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

  it('génère une échéance mensuelle du mois suivant le début jusqu’à la fin de session', async () => {
    const dossier = { id: 85, demarrageParcours: new Date(2025, 7, 22) } as any
    const frais = { montant: 1200, modalite: '10x' } as any

    const echeances = await GenerateurEcheancierScolariteService.generer(
      dossier,
      frais,
      undefined,
      new Date(2025, 7, 22),
      new Date(2026, 8, 22)
    )

    expect(echeances).toHaveLength(13)
    expect(echeances[0].moisConcerne).toBe('2025-09')
    expect(new Date(echeances[0].dateLimite)).toEqual(new Date(2025, 8, 5))
    expect(echeances[12].moisConcerne).toBe('2026-09')
    expect(new Date(echeances[12].dateLimite)).toEqual(new Date(2026, 8, 5))
    expect(echeances.reduce((total, echeance) => total + echeance.montant, 0)).toBeCloseTo(1200, 2)
  })

  it('n\'impose pas le menu de régularisation si l\'étudiant n\'a pas encore de dossier', async () => {
    const result = await VerificationPaiementService.verifierPaiement(999999)

    expect(result.statut).toBe('vert')
    expect(result.echeancesEnRetard).toBe(0)
  })

  it('autorise le pointage avec un avertissement lorsqu’une échéance est partiellement payée', () => {
    const result = VerificationPaiementService.verifierDossier({
      statut: 'actif',
      echeances: [{ type: 'scolarite', statut: 'partiel', numeroEcheance: 2 }]
    } as any)

    expect(result.statut).toBe('vert')
    expect(result.avertissementPaiement).toBe('Échéance mois 2 partiellement payée.')
  })

  it('ne traite pas les frais d’inscription comme une échéance de scolarité en retard', () => {
    const result = VerificationPaiementService.verifierDossier({
      statut: 'actif',
      echeances: [{
        type: 'inscription',
        statut: 'impaye',
        numeroEcheance: 1,
        dateLimite: new Date(2000, 0, 1)
      }]
    } as any)

    expect(result.statut).toBe('vert')
    expect(result.echeancesEnRetard).toBe(0)
    expect(result.echeancesRestantes).toHaveLength(0)
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
    expect(situation.fraisInscriptionSession).toBe(1000)
    expect(situation.fraisScolariteSession).toBe(9999)
    expect(situation.montantInscriptionPaye).toBe(1000)
    expect(situation.montantScolaritePaye).toBe(500)
    expect(situation.resteInscriptionSession).toBe(0)
    expect(situation.resteScolariteSession).toBe(9499)
    expect(situation.echeances).toEqual([
      expect.objectContaining({ type: 'scolarite', montantPaye: 500, resteAPayer: 1500, statut: 'partiel' })
    ])
    expect(situation.echeancesTotales).toBe(1)
    expect(situation.echeancesPayees).toBe(0)
  })

  it('utilise les montants figés dans le snapshot de la session', () => {
    const situation = SituationFinanciereService.calculer({
      fraisScolarite: 9999,
      fraisScolariteSnapshot: JSON.stringify({
        montantInscription: 1250,
        montantScolarite: 8750,
        modaliteScolarite: '10x'
      }),
      echeances: []
    } as any)

    expect(situation.fraisInscriptionSession).toBe(1250)
    expect(situation.fraisScolariteSession).toBe(8750)
    expect(situation.sommeGlobale).toBe(10000)
  })
})
