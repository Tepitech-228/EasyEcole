import crypto from 'crypto';

const QR_SECRET: string = process.env.DOCGEN_SECRET || process.env.JWT_SECRET || '';
if (!QR_SECRET) {
  throw new Error('DOCGEN_SECRET or JWT_SECRET environment variable is required for QrTokenService');
}

const QR_PREFIX = 'CARTE';
const QR_VERSION = 'v=1';

export class QrTokenService {
  /**
   * Signs a userId into a secure HMAC token.
   * Format: CARTE|v=1|{base64url(payload)}|{hmac_signature}
   * payload = userId:timestamp
   */
  static signer(userId: number): string {
    const timestamp = Date.now();
    const payload = `${userId}:${timestamp}`;
    const base64Payload = Buffer.from(payload).toString('base64url');
    const dataToSign = `${QR_PREFIX}|${QR_VERSION}|${base64Payload}`;
    const signature = crypto
      .createHmac('sha256', QR_SECRET)
      .update(dataToSign)
      .digest('hex');
    return `${dataToSign}|${signature}`;
  }

  /**
   * Verifies a token and returns the userId if valid.
   * Returns null if the token is invalid or expired.
   */
  static verifier(token: string): { userId: number; timestamp: number } | null {
    if (typeof token !== 'string' || token.length === 0) {
      return null;
    }

    const parts = token.split('|');
    if (parts.length !== 4) {
      return null;
    }

    const [prefix, version, base64Payload, signature] = parts;
    if (prefix !== QR_PREFIX || version !== QR_VERSION) {
      return null;
    }

    const dataToSign = `${prefix}|${version}|${base64Payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', QR_SECRET)
      .update(dataToSign)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    let decoded: string;
    try {
      decoded = Buffer.from(base64Payload, 'base64url').toString('utf8');
    } catch {
      // Justifié : token QR invalide → rejet (null). Aucun effet de bord possible :
      // c'est une validation d'entrée, pas une erreur système à propager.
      return null;
    }

    const [userIdStr, timestampStr] = decoded.split(':');
    if (!userIdStr || !timestampStr) {
      return null;
    }

    const userId = Number(userIdStr);
    const timestamp = Number(timestampStr);

    if (isNaN(userId) || isNaN(timestamp)) {
      return null;
    }

    // Optional: expire after 30 days
    const now = Date.now();
    if (now - timestamp > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return { userId, timestamp };
  }
}
