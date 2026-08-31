import cron from 'node-cron'
import { Op } from 'sequelize'
import { Echeance } from '../../modules/inscription/models/Echeance'
import { DossierEtudiant } from '../../modules/inscription/models/DossierEtudiant'
import { NotificationHelper } from '../helpers/NotificationHelper'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function toDateOnlyString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dateOnlyToString(dateLimite: Date | string): string {
  return typeof dateLimite === 'string' ? dateLimite : toDateOnlyString(dateLimite)
}

function formatDateFr(dateOnly: string): string {
  const parts = dateOnly.split('-')
  if (parts.length !== 3) return dateOnly
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/**
 * Cron quotidien (06:00) : marque comme 'en_retard' les échéances 'impaye'
 * dont la date limite est passée, puis notifie le dossier étudiant concerné.
 */
let running = false

async function run(): Promise<void> {
  if (running) return
  running = true
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = toDateOnlyString(today)

    // (a) Échéances impayées dont dateLimite < aujourd'hui
    const echeancesImpayees = await Echeance.findAll({
      where: {
        statut: 'impaye',
        dateLimite: { [Op.lt]: todayStr },
      },
    })

    if (echeancesImpayees.length === 0) {
      console.log('[RappelEcheanceCron] Aucune échéance impayée arrivée à échéance ce jour')
      return
    }

    // Passage en 'en_retard'
    const echeanceIds = echeancesImpayees.map((e) => e.id)
    await Echeance.update(
      { statut: 'en_retard' },
      { where: { id: { [Op.in]: echeanceIds } } }
    )

    // (b) Notification par dossier étudiant concerné
    const dossierIds: number[] = [
      ...new Set(
        echeancesImpayees
          .map((e) => e.dossierEtudiantId)
          .filter((id): id is number => id != null)
      ),
    ]

    let nbNotifications = 0
    if (dossierIds.length > 0) {
      const dossiers = await DossierEtudiant.findAll({
        where: { id: { [Op.in]: dossierIds } },
        attributes: ['id', 'utilisateurId'],
      })

      for (const dossier of dossiers) {
        if (!dossier.utilisateurId) continue

        const echeancesDossier = echeancesImpayees.filter(
          (e) => e.dossierEtudiantId === dossier.id
        )
        const montantTotal = echeancesDossier.reduce(
          (sum, e) => sum + (e.montant || 0),
          0
        )
        // Date limite la plus récente parmi les échéances du dossier
        const derniereDateStr =
          echeancesDossier.map((e) => dateOnlyToString(e.dateLimite)).sort().pop() ||
          todayStr

        const message = `Échéance de ${montantTotal} FCFA arrivée à échéance le ${formatDateFr(derniereDateStr)}`

        await NotificationHelper.envoyerNotification(
          dossier.utilisateurId,
          'echeance_retard',
          'Échéance arrivée à échéance',
          message,
          undefined,
          false
        )
        nbNotifications += 1
      }
    }

    console.log(
      `[RappelEcheanceCron] ${echeancesImpayees.length} échéance(s) passée(s) en 'en_retard', ${nbNotifications} notification(s) envoyée(s)`
    )
  } catch (error) {
    console.error('[RappelEcheanceCron] Erreur lors du traitement:', error)
  } finally {
    running = false
  }
}

export class RappelEcheanceCron {
  static start(): void {
    cron.schedule('0 6 * * *', () => {
      void run()
    })

    console.log("[RappelEcheanceCron] Cron de rappel d'échéances démarré (quotidien à 06:00)")
  }
}
