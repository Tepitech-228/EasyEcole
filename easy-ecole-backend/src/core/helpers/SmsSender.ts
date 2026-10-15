import { Utilisateur } from '../../modules/auth/models/Utilisateur'
import { NotificationChannelService } from './NotificationChannelService'

/**
 * Envoi de SMS transactionnels aux etudiants (AfrikSMS, via NotificationChannelService).
 * Best-effort : une erreur d'envoi de SMS ne doit JAMAIS faire echouer le metier.
 */
export class SmsSender {
  /** Envoi direct a un numero (format libre : +228..., 00228..., 228...). */
  static async envoyer(telephone: string | null | undefined, message: string): Promise<void> {
    const tel = telephone?.trim()
    if (!tel) return
    try {
      await NotificationChannelService.envoyer({ contact: tel }, message)
    } catch (err) {
      console.error('[SmsSender] echec envoi SMS:', (err as Error)?.message || err)
    }
  }

  /** Envoi au numero (contact) de l'utilisateur identifie par son email. */
  static async envoyerParEmail(email: string, message: string): Promise<void> {
    try {
      const utilisateur = await Utilisateur.findOne({ where: { email }, attributes: ['contact'] })
      await this.envoyer(utilisateur?.contact, message)
    } catch (err) {
      console.error('[SmsSender] echec resolution du numero:', (err as Error)?.message || err)
    }
  }
}
