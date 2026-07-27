import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const InscriptionComplete = async (req: Request, res: Response, next: Function) => {
    if ((req as any).utilisateurRole !== RolesUtilisateur.APPRENANT) {
        return next();
    }

    try {
        const utilisateurId = (req as any).utilisateurId;

        const { DossierEtudiant } = require('../../modules/inscription/models/DossierEtudiant');
        const { CursusApprenant } = require('../../modules/inscription/models/CursusApprenant');

        const [dossier, cursus] = await Promise.all([
            DossierEtudiant.findOne({ where: { utilisateurId, statut: 'actif' } }),
            CursusApprenant.findOne({ where: { utilisateurId } }),
        ]);

        if (!dossier || !cursus) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Vous devez d\'abord finaliser votre inscription.',
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification de votre inscription.',
        });
    }
};
