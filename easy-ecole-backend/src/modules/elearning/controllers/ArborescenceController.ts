import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ArborescenceElearningService } from "../services/ArborescenceElearningService";

/**
 * Contrôleur de l'arborescence académique du e-learning.
 * Expose l'arbre Année → Parcours → Niveau → Classe → Cours → Cours en ligne
 * avec compteurs, ainsi que la rubrique « Non rattaché » (réservée à
 * l'administration).
 */
export default class ArborescenceController {

    static async getArborescence(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        const rolesAutorises = [
            RolesUtilisateur.ADMIN,
            RolesUtilisateur.INSTITUTION,
            RolesUtilisateur.ENSEIGNANT,
        ];
        if (!rolesAutorises.includes(role)) {
            return res.status(403).json({
                success: false,
                message: "Accès réservé à l'administration du e-learning",
            });
        }

        try {
            const arborescence = await ArborescenceElearningService.construireArborescence();
            return res.status(200).json(arborescence);
        } catch (error) {
            console.error("Erreur arborescence e-learning:", error);
            return res.status(500).json({
                success: false,
                message: "Erreur lors de la construction de l'arborescence e-learning",
            });
        }
    }
}
