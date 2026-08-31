import { Request, Response } from "express";
import { DocGenDocument } from "../models/DocGenDocument";
import crypto from "crypto";

const DOCGEN_SECRET: string = process.env.DOCGEN_SECRET || '';
if (!DOCGEN_SECRET) {
  throw new Error('DOCGEN_SECRET environment variable is required');
}

export default class VerificationController {
  static async verifier(req: Request, res: Response): Promise<Response> {
    try {
      const { matricule, reference } = req.params;
      const { token } = req.query;

      if (!matricule || !reference) {
        return res.status(400).json({ success: false, message: 'Matricule et référence requis' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const verificationUrl = `${baseUrl}/api/v1/verification/document/${matricule}/${reference}`;
      const expectedHmac = crypto.createHmac('sha256', DOCGEN_SECRET).update(verificationUrl).digest('hex');

      if (typeof token !== 'string' || token.length === 0) {
        return res.status(403).json({ success: false, message: 'Token de vérification invalide' });
      }

      const tokenBuffer = Buffer.from(token, 'hex');
      const expectedBuffer = Buffer.from(expectedHmac, 'hex');

      if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
        return res.status(403).json({ success: false, message: 'Token de vérification invalide' });
      }

      const document = await DocGenDocument.findOne({
        where: { reference },
        include: [{ association: 'type' }]
      });

      if (!document) {
        return res.status(404).json({ success: false, message: 'Document non trouvé', valid: false });
      }

      return res.status(200).json({
        success: true,
        valid: true,
        data: {
          reference: document.reference,
          statut: document.statut,
          hash: document.hash,
          type: (document as any).type?.libelle || '',
          dateCreation: document.createdAt,
          version: document.version,
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
    }
  }
}
