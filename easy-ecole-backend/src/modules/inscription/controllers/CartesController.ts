import { Request, Response } from "express";
import { QrTokenService } from "../../../core/services/QrTokenService";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";

export default class CartesController {
  static async verifier(req: Request, res: Response): Promise<Response> {
    const { code } = req.params;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Code requis' });
    }

    const verified = QrTokenService.verifier(code);
    if (!verified) {
      return res.status(403).json({ success: false, message: 'Code invalide ou expiré' });
    }

    try {
      const dossier = await DossierEtudiant.findOne({
        where: { utilisateurId: verified.userId },
        include: [{
          model: Utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenoms', 'email', 'photo'],
        }],
      });

      if (!dossier) {
        return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
      }

      return res.status(200).json({
        success: true,
        valid: true,
        data: {
          utilisateurId: dossier.utilisateurId,
          matricule: dossier.matricule,
          statut: dossier.statut,
          nom: (dossier as any).utilisateur?.nom || '',
          prenoms: (dossier as any).utilisateur?.prenoms || '',
          email: (dossier as any).utilisateur?.email || '',
          photo: (dossier as any).utilisateur?.photo || '',
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Erreur interne serveur' });
    }
  }
}
