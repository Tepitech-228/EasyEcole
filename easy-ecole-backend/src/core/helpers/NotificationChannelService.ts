import axios from 'axios'

/** Canaux externes optionnels. Les erreurs de fournisseur ne bloquent jamais le métier. */
export class NotificationChannelService {
  static async envoyer(utilisateur: { contact?: string | null }, message: string): Promise<void> {
    const telephone = utilisateur.contact?.trim()
    if (!telephone) return

    await Promise.allSettled([
      this.envoyerAfrikSms(telephone, message),
      this.envoyerWhatsApp(telephone, message),
    ])
  }

  /** Normalise un numero au format AfrikSMS : chiffres seuls, code pays inclus, sans + ni 00. */
  private static normaliserNumero(telephone: string): string {
    const chiffres = telephone.replace(/\D/g, '')
    return chiffres.startsWith('00') ? chiffres.slice(2) : chiffres
  }

  private static async envoyerAfrikSms(telephone: string, message: string): Promise<void> {
    const clientId = process.env.SMS_AFRIKSMS_CLIENT_ID
    const apiKey = process.env.SMS_AFRIKSMS_API_KEY
    const senderId = process.env.SMS_AFRIKSMS_SENDER_ID
    if (!clientId || !apiKey || !senderId) return

    const baseUrl = process.env.SMS_AFRIKSMS_BASE_URL || 'https://api.afriksms.com'
    const params = new URLSearchParams({
      ClientId: clientId,
      ApiKey: apiKey,
      SenderId: senderId,
      Message: message,
      MobileNumbers: this.normaliserNumero(telephone),
    })
    await axios.post(`${baseUrl}/api/web/web_v1/outbounds/send`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    })
  }

  private static async envoyerWhatsApp(telephone: string, message: string): Promise<void> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!token || !phoneNumberId) return

    await axios.post(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: telephone,
      type: 'text',
      text: { body: message },
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    })
  }
}
