import {
  genererEcheancesSession,
  validerBordereauPaiement,
  echeanceEstEnRetard,
  datePremiereEcheanceDepuisSession,
} from '../../../modules/inscription/services/GenerateurEcheancierSessionService'

describe('GenerateurEcheancierSessionService', () => {
  it('démarre les paiements au mois suivant la date de début de session', () => {
    const dateDebut = new Date('2026-08-15T00:00:00Z')
    const echeances = genererEcheancesSession({
      dateDebut,
      montantTotal: 3000,
      modalite: '3x',
      type: 'inscription',
    })

    const premiere = echeances[0]
    expect(premiere.numeroEcheance).toBe(1)
    expect(datePremiereEcheanceDepuisSession(dateDebut).getMonth()).toBe(8)
    expect(premiere.dateLimite.getMonth()).toBe(8)
    expect(premiere.montant).toBe(1000)
  })

  it('valide un bordereau de paiement en fonction de son type et de son montant', () => {
    const ok = validerBordereauPaiement(
      { type: 'scolarite', montant: 150000, statut: 'valide' },
      'scolarite',
      150000,
    )

    expect(ok).toBe(true)
  })

  it('marque une échéance comme en retard si elle est dépassée et impayée', () => {
    const echeance = {
      numeroEcheance: 1,
      type: 'inscription' as const,
      montant: 1000,
      dateLimite: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5),
      statut: 'impaye' as const,
    }

    expect(echeanceEstEnRetard(echeance.dateLimite, echeance.statut)).toBe(true)
  })
})
