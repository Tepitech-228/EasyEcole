import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../../../core/config/jwt";
import { CursusApprenant } from "../models/CursusApprenant";
import { Seance } from "../models/Seance";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { Op } from "sequelize";

export default class ReinscriptionController {

    /**
     * Envoie les emails de réinscription à tous les étudiants d'une année académique
     * POST /reinscription/envoyer-emails
     */
    static async envoyerEmailsReinscription(req: Request, res: Response): Promise<Response> {
        try {
            const { anneeAcademiqueId, etablissementId } = req.body;
            
            if (!anneeAcademiqueId) {
                return res.status(400).json({ success: false, message: "annéeAcademiqueId requis" });
            }

            const where: any = { anneeAcademiqueId };
            if (etablissementId) where.etablissementId = etablissementId;

            // Trouver tous les cursus de l'année
            const cursusList = await CursusApprenant.findAll({
                where,
                include: [{ association: 'utilisateur' }]
            });

            let envoye = 0;
            let errors = 0;

            for (const cursus of cursusList) {
                const user = (cursus as any).utilisateur;
                if (!user || !user.email) continue;

                // Générer un token de réinscription (valide 30 jours)
                const token = jwt.sign(
                    {
                        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
                        data: { cursusApprenantId: cursus.id, email: user.email }
                    },
                    JWT_SECRET
                );

                try {
                    await EmailSender.getInstance().sendMail({
                        to: user.email,
                        subject: "Réinscription - Conservez votre place",
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #1e40af;">Réinscription</h2>
                            <p>Bonjour <b>${user.prenoms || ''} ${user.nom || ''}</b>,</p>
                            <p>La nouvelle année académique démarre bientôt. Pour conserver votre place, 
                               veuillez cliquer sur le bouton ci-dessous :</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/reinscription/confirmer?token=${token}"
                                   style="background-color: #1e40af; color: white; padding: 14px 28px; 
                                          text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                    ✅ Je confirme ma réinscription
                                </a>
                            </div>
                            <p style="color: #6b7280; font-size: 12px;">
                                Ce lien expire dans 30 jours. Si vous ne confirmez pas avant la rentrée, 
                                votre place pourrait être libérée.
                            </p>
                            <p>Merci,<br>L'équipe pédagogique</p>
                        </div>`
                    });

                    await cursus.update({
                        emailReinscriptionEnvoyeLe: new Date(),
                        statutReinscription: 'en_attente'
                    });
                    envoye++;
                } catch {
                    errors++;
                }
            }

            return res.status(200).json({
                success: true,
                message: `Emails envoyés : ${envoye}, erreurs : ${errors}`,
                envoye,
                errors,
                total: cursusList.length
            });
        } catch (error) {
            console.error('[Reinscription] Erreur:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi des emails', error });
        }
    }

    /**
     * Confirme une réinscription via token
     * GET /reinscription/confirmer
     */
    static async confirmerReinscription(req: Request, res: Response): Promise<Response> {
        try {
            const { token } = req.query;

            if (!token) {
                return res.status(400).json({ success: false, message: "Token requis" });
            }

            let decoded: any;
            try {
                decoded = jwt.verify(token as string, JWT_SECRET);
            } catch {
                return res.status(400).json({ success: false, message: "Token invalide ou expiré" });
            }

            const cursus = await CursusApprenant.findByPk(decoded.data.cursusApprenantId);
            if (!cursus) {
                return res.status(404).json({ success: false, message: "Cursus non trouvé" });
            }

            await cursus.update({
                statutReinscription: 'confirme',
                dateReinscription: new Date()
            });

            return res.status(200).json({
                success: true,
                message: "Réinscription confirmée ! Votre place est réservée pour la prochaine année académique."
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur', error });
        }
    }

    /**
     * Liste les réinscriptions filtrées
     * GET /reinscription
     */
    static async lister(req: Request, res: Response): Promise<Response> {
        try {
            const where: any = {};
            const { statut, anneeAcademiqueId, etablissementId } = req.query;

            if (statut) where.statutReinscription = statut;
            if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
            if (etablissementId) where.etablissementId = etablissementId;

            // Filtrer par établissement de l'utilisateur si non-admin
            const role = (req as any).utilisateurRole;
            if (role !== 'admin' && (req as any).etablissementId) {
                where.etablissementId = (req as any).etablissementId;
            }

            const list = await CursusApprenant.findAll({
                where,
                include: [
                    { association: 'utilisateur', attributes: ['id', 'nom', 'prenoms', 'email'] },
                    { association: 'classe' },
                    { association: 'niveauEtude' },
                    { association: 'parcours' },
                    { association: 'anneeAcademique' }
                ],
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).send(list);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}
