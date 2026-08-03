import { Request, Response } from "express";
import { RhEmploye } from "../models/RhEmploye";
import { RhDepartement } from "../models/RhDepartement";
import { RhCandidature } from "../models/RhCandidature";
import { RhFormation } from "../models/RhFormation";
import { RhBulletinPaie } from "../models/RhBulletinPaie";

export default class RhDashboardController {
  static async getDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const [totalEmployes, totalCandidatures, totalFormations, totalBulletins, departements] = await Promise.all([
        RhEmploye.count(),
        RhCandidature.count(),
        RhFormation.count(),
        RhBulletinPaie.count(),
        RhDepartement.findAll({ attributes: ['nom'] })
      ]);

      const recentActivities = [
        { action: 'Employés enregistrés', detail: `${totalEmployes} personne(s) actives`, time: 'Maintenant' },
        { action: 'Candidatures en cours', detail: `${totalCandidatures} dossier(s) à traiter`, time: 'Aujourd’hui' },
        { action: 'Formations disponibles', detail: `${totalFormations} formation(s) planifiée(s)`, time: 'Cette semaine' },
        { action: 'Bulletins de paie', detail: `${totalBulletins} période(s) traitée(s)`, time: 'Ce mois' }
      ];

      return res.status(200).json({
        success: true,
        data: {
          totalEmployes,
          totalCandidatures,
          totalFormations,
          totalBulletins,
          departements,
          recentActivities
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
}
