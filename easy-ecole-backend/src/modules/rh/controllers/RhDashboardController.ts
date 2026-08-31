import { Request, Response } from "express";
import { RhEmploye } from "../models/RhEmploye";
import { RhDepartement } from "../models/RhDepartement";
import { RhCandidature } from "../models/RhCandidature";
import { RhFormation } from "../models/RhFormation";
import { RhBulletinPaie } from "../models/RhBulletinPaie";

export default class RhDashboardController {
  static async getDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const [totalEmployes, totalCandidatures, totalFormations, totalBulletins, departements, employes] = await Promise.all([
        RhEmploye.count(),
        RhCandidature.count(),
        RhFormation.count(),
        RhBulletinPaie.count(),
        RhDepartement.findAll({ attributes: ['id', 'nom'] }),
        RhEmploye.findAll({ attributes: ['statut', 'departementId'], raw: true }),
      ]);

      // Répartition des employés par département (pour graphiques dynamiques).
      const deptMap = new Map<string, number>();
      for (const e of employes) {
        if (e.departementId == null) continue;
        const nom = departements.find((d: any) => String(d.id) === String(e.departementId))?.nom || `Dept. ${e.departementId}`;
        deptMap.set(nom, (deptMap.get(nom) || 0) + 1);
      }
      const employesParDepartement = Array.from(deptMap.entries()).map(([departement, total]) => ({ departement, total }));

      // Répartition des employés par statut.
      const statutMap = new Map<string, number>();
      for (const e of employes) {
        const s = e.statut || 'Actif';
        statutMap.set(s, (statutMap.get(s) || 0) + 1);
      }
      const employesParStatut = Array.from(statutMap.entries()).map(([statut, total]) => ({ statut, total }));

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
          recentActivities,
          charts: {
            employesParDepartement,
            employesParStatut,
          }
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
}
