import cron, { ScheduledTask } from 'node-cron'
import { Op } from 'sequelize'
import { Notification } from '../../modules/elearning/models/Notification'
import { Utilisateur } from '../../modules/auth/models/Utilisateur'
import { Enseignant } from '../../modules/auth/models/Enseignant'
import { RolesUtilisateur } from '../enums/RolesUtilisateur'
import { EtatsDePresence } from '../enums/EtatsDePresence'
import { BlocCahierDeTexte } from '../../modules/inscription/models/BlocCahierDeTexte'
import { CahierDeTexte } from '../../modules/inscription/models/CahierDeTexte'
import { CoursParticipant } from '../../modules/inscription/models/CoursParticipant'
import { ListePresence } from '../../modules/inscription/models/ListePresence'
import { Presence } from '../../modules/inscription/models/Presence'
import { PresenceCoursParticipant } from '../../modules/inscription/models/PresenceCoursParticipant'
import { Seance } from '../../modules/inscription/models/Seance'
import { NotificationHelper } from '../helpers/NotificationHelper'

const NOTIFICATION_TYPE = 'rappel_saisie_seance'
const LOOKBACK_DAYS = 30

function dateTexte(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

function heureTexte(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 8)
  return value.toISOString().slice(11, 19)
}

function heuresEgales(left: Date | string, right: Date | string): boolean {
  return heureTexte(left).slice(0, 5) === heureTexte(right).slice(0, 5)
}

function jourSemaine(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return String(weekday === 0 ? 7 : weekday)
}

function notificationLien(seanceId: number, date: string): string {
  return `/cours/presences?seanceId=${seanceId}&date=${date}`
}

export class RappelSeanceSaisieCron {
  private static task: ScheduledTask | null = null

  static start(): void {
    this.task = cron.schedule('*/10 * * * *', () => void this.executer(), { timezone: 'UTC' })
    console.log('[RappelSeanceSaisieCron] Vérification des saisies après séance toutes les 10 minutes')
    setTimeout(() => void this.executer(), 30_000)
  }

  static stop(): void {
    this.task?.stop()
  }

  static async executer(): Promise<void> {
    try {
      const maintenant = new Date()
      const aujourdhui = dateTexte(maintenant)
      const debutFenetre = new Date(maintenant)
      debutFenetre.setUTCDate(debutFenetre.getUTCDate() - LOOKBACK_DAYS)
      const depuis = dateTexte(debutFenetre)

      const seances = await Seance.findAll({
        where: {
          dateDebut: { [Op.lte]: aujourdhui },
          dateFin: { [Op.gte]: depuis }
        },
        include: [{ association: Seance.associations.cours, attributes: ['id', 'intitule'] }]
      })
      const superviseurs = await Utilisateur.findAll({
        where: { role: RolesUtilisateur.SUPERVISEUR_GENERAL, deletedAt: null },
        attributes: ['id']
      })
      const effectifsParCours = new Map<number, number>()

      for (const seance of seances) {
        const enseignant = await Enseignant.findByPk(seance.enseignantId)
        if (!enseignant?.utilisateurId) continue

        const dateDebut = dateTexte(seance.dateDebut)
        const dateFin = dateTexte(seance.dateFin)
        const premiereDate = dateDebut > depuis ? dateDebut : depuis
        const dateCourante = new Date(`${premiereDate}T00:00:00Z`)
        const derniereDate = new Date(`${aujourdhui}T00:00:00Z`)

        while (dateCourante <= derniereDate) {
          const occurrence = dateTexte(dateCourante)
          if (
            occurrence >= dateDebut
            && occurrence <= dateFin
            && jourSemaine(occurrence) === String(seance.jourSemaine)
          ) {
            const fin = new Date(`${occurrence}T${heureTexte(seance.heureFin)}Z`)
            if (fin <= maintenant) {
              const [presenceComplete, texteComplet] = await Promise.all([
                this.presenceComplete(seance, occurrence, effectifsParCours),
                this.texteComplet(seance, occurrence)
              ])

              const lien = notificationLien(Number(seance.id), occurrence)
              if (presenceComplete && texteComplet) {
                await Notification.destroy({ where: { type: NOTIFICATION_TYPE, lien } })
              } else {
                const elementsManquants = [
                  ...(!presenceComplete ? ['le cahier de présence'] : []),
                  ...(!texteComplet ? ['le compte rendu du cours'] : [])
                ]
                const cours = seance.cours as any
                const coursNom = cours?.intitule || `Cours ${seance.coursId}`
                const titre = 'Saisie de fin de cours à compléter'
                const message = `La séance de « ${coursNom} » du ${occurrence} est terminée. Merci de saisir ${elementsManquants.join(' et ')}.`
                const destinataires = [
                  Number(enseignant.utilisateurId),
                  ...superviseurs.map(user => Number(user.id))
                ]

                for (const utilisateurId of new Set(destinataires)) {
                  const existante = await Notification.findOne({
                    where: { utilisateurId, type: NOTIFICATION_TYPE, lien }
                  })
                  if (existante) {
                    if (existante.message !== message || existante.titre !== titre) {
                      await existante.update({ titre, message })
                    }
                  } else {
                    await NotificationHelper.envoyerNotification(
                      utilisateurId,
                      NOTIFICATION_TYPE,
                      titre,
                      message,
                      lien
                    )
                  }
                }
              }
            }
          }
          dateCourante.setUTCDate(dateCourante.getUTCDate() + 1)
        }
      }
    } catch (error) {
      console.error('[RappelSeanceSaisieCron] Erreur pendant la vérification des saisies:', error)
    }
  }

  private static async presenceComplete(
    seance: Seance,
    date: string,
    effectifsParCours: Map<number, number>
  ): Promise<boolean> {
    const presences = await Presence.findAll({
      where: { date: date as any },
      include: [
        {
          association: Presence.associations.listePresence,
          where: { coursId: seance.coursId, enseignantId: seance.enseignantId },
          required: true
        },
        { association: Presence.associations.presencesCoursParticipants, required: false }
      ]
    })
    const presence = presences.find(item =>
      heuresEgales(item.heureDebut, seance.heureDebut) && heuresEgales(item.heureFin, seance.heureFin)
    )
    if (!presence) return false

    let effectif = effectifsParCours.get(Number(seance.coursId))
    if (effectif === undefined) {
      effectif = await CoursParticipant.count({ where: { coursId: seance.coursId } })
      effectifsParCours.set(Number(seance.coursId), effectif)
    }
    const saisies = (presence.presencesCoursParticipants || []) as PresenceCoursParticipant[]
    return saisies.length >= effectif
      && saisies.every(saisie => saisie.etatDePresence !== EtatsDePresence.NON_RENSEIGNE)
  }

  private static async texteComplet(seance: Seance, date: string): Promise<boolean> {
    const blocs = await BlocCahierDeTexte.findAll({
      where: { date: date as any },
      include: [{
        association: BlocCahierDeTexte.associations.cahierDeTexte,
        where: { coursId: seance.coursId, enseignantId: seance.enseignantId },
        required: true
      }]
    })
    return blocs.some(bloc =>
      heuresEgales(bloc.heureDebut, seance.heureDebut)
      && heuresEgales(bloc.heureFin, seance.heureFin)
      && typeof bloc.contenu === 'string'
      && bloc.contenu.trim().length > 0
    )
  }
}
