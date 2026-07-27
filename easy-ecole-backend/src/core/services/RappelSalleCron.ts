import cron from 'node-cron'
import { Op } from 'sequelize'
import { Seance } from '../../modules/inscription/models/Seance'
import { Cours } from '../../modules/inscription/models/Cours'
import { Enseignant } from '../../modules/auth/models/Enseignant'
import { Classe } from '../../modules/inscription/models/Classe'
import { JoursSemaine } from '../enums/JoursSemaine'
import { NotificationHelper } from '../helpers/NotificationHelper'

const DAY_MAP: Record<number, JoursSemaine> = {
  0: JoursSemaine.DIMANCHE,
  1: JoursSemaine.LUNDI,
  2: JoursSemaine.MARDI,
  3: JoursSemaine.MERCREDI,
  4: JoursSemaine.JEUDI,
  5: JoursSemaine.VENDREDI,
  6: JoursSemaine.SAMEDI,
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function todayDay(): JoursSemaine {
  return DAY_MAP[new Date().getDay()]
}

function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export class RappelSalleCron {
  static start(): void {
    cron.schedule('* * * * *', async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const seances = await Seance.findAll({
          where: {
            jourSemaine: todayDay(),
            dateDebut: { [Op.lte]: today },
            dateFin: { [Op.gte]: today },
          },
          include: [
            {
              model: Cours,
              as: 'cours',
              include: [
                {
                  model: Classe,
                  as: 'classe',
                },
              ],
            },
            {
              model: Enseignant,
              as: 'enseignant',
            },
          ],
        })

        const in9min = toTimeString(new Date(Date.now() + 9 * 60 * 1000))
        const in11min = toTimeString(new Date(Date.now() + 11 * 60 * 1000))

        for (const seance of seances) {
          const heureDebut = seance.heureDebut as unknown as string

          if (heureDebut >= in9min && heureDebut <= in11min) {
            const enseignant = seance.enseignant
            const cours = seance.cours

            if (!enseignant || !cours) continue

            const utilisateurId = enseignant.utilisateurId
            if (!utilisateurId) continue

            const classeNom = cours.classe?.libelle || ''
            const message = `Rappel : votre cours ${cours.intitule} commence à ${heureDebut.slice(0, 5)} en salle ${seance.salle}${classeNom ? ` — Classe ${classeNom}` : ''}`

            await NotificationHelper.envoyerNotification(
              utilisateurId,
              'rappel_salle',
              'Rappel de cours',
              message,
              undefined,
              false
            )
          }
        }
      } catch (error) {
        console.error('[RappelSalleCron] Erreur lors du traitement:', error)
      }
    })

    console.log('[RappelSalleCron] Cron de rappel démarré (chaque minute, fenêtre H-10min)')
  }
}
