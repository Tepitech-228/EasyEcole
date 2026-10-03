import { EMAIL_SENDER_NAME } from '../../../core/helpers/EmailSender'

describe('EmailSender branding', () => {
  it('utilise la marque ESA ECOLE dans les mails envoyés', () => {
    expect(EMAIL_SENDER_NAME).toBe('ESA ECOLE')
  })
})
