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
    const BATCH_SIZE = 500
    const NOTIFICATION_CONCURRENCY = 20
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = toDateOnlyString(today)

    // (a) Échéances impayées dont dateLimite < aujourd'hui
    let totalEcheances = 0
    let nbNotifications = 0
    let batch: Echeance[] = []

    do {
      batch = await Echeance.findAll({
        where: {
          statut: 'impaye',
          dateLimite: { [Op.lt]: todayStr },
        },
        order: [['id', 'ASC']],
        limit: BATCH_SIZE,
      })

      if (batch.length === 0) break

      const echeanceIds = batch.map((e) => e.id)
      await Echeance.update(
        { statut: 'en_retard' },
        { where: { id: { [Op.in]: echeanceIds }, statut: 'impaye' } }
      )
      totalEcheances += batch.length

      const echeancesParDossier = new Map<number, Echeance[]>()
      for (const echeance of batch) {
        if (echeance.dossierEtudiantId == null) continue
        const dossierEcheances = echeancesParDossier.get(echeance.dossierEtudiantId) || []
        dossierEcheances.push(echeance)
        echeancesParDossier.set(echeance.dossierEtudiantId, dossierEcheances)
      }

      const dossierIds = [...echeancesParDossier.keys()]
      const dossiers = await DossierEtudiant.findAll({
        where: { id: { [Op.in]: dossierIds } },
        attributes: ['id', 'utilisateurId'],
      })

      const notifications = dossiers
        .filter((dossier) => dossier.utilisateurId)
        .map((dossier) => {
          const echeancesDossier = echeancesParDossier.get(dossier.id) || []
          const montantTotal = echeancesDossier.reduce((sum, e) => sum + (e.montant || 0), 0)
          const derniereDateStr = echeancesDossier
            .map((e) => dateOnlyToString(e.dateLimite))
            .sort()
            .pop() || todayStr
          return {
            utilisateurId: dossier.utilisateurId as number,
            message: `Échéance de ${montantTotal} FCFA arrivée à échéance le ${formatDateFr(derniereDateStr)}`,
          }
        })

      for (let index = 0; index < notifications.length; index += NOTIFICATION_CONCURRENCY) {
        const groupe = notifications.slice(index, index + NOTIFICATION_CONCURRENCY)
        await Promise.all(groupe.map((notification) => NotificationHelper.envoyerNotification(
          notification.utilisateurId,
          'echeance_retard',
          'Échéance arrivée à échéance',
          notification.message,
          undefined,
          false
        )))
        nbNotifications += groupe.length
      }
    } while (batch.length === BATCH_SIZE)

    if (totalEcheances === 0) {
      console.log('[RappelEcheanceCron] Aucune échéance impayée arrivée à échéance ce jour')
      return
    }

    console.log(
      `[RappelEcheanceCron] ${totalEcheances} échéance(s) passée(s) en 'en_retard', ${nbNotifications} notification(s) envoyée(s)`
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
