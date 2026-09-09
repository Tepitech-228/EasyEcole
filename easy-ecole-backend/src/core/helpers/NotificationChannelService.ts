import axios from 'axios'

/** Canaux externes optionnels. Les erreurs de fournisseur ne bloquent jamais le métier. */
export class NotificationChannelService {
  static async envoyer(utilisateur: { contact?: string | null }, message: string): Promise<void> {
    const telephone = utilisateur.contact?.trim()
    if (!telephone) return

    await Promise.allSettled([
      this.envoyerSms(telephone, message),
      this.envoyerWhatsApp(telephone, message),
    ])
  }

  private static async envoyerSms(telephone: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_SMS_FROM
    if (!accountSid || !authToken || !from) return

    const params = new URLSearchParams({ To: telephone, From: from, Body: message })
    await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, params.toString(), {
      auth: { username: accountSid, password: authToken },
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
