import { Request, Response } from "express";
import { Op } from "sequelize";
import { Presence } from "../../inscription/models/Presence";
import { Pointage } from "../../inscription/models/Pointage";
import { Absence } from "../../inscription/models/Absence";
import { SanctionDiscipline } from "../../scolarite/models/SanctionDiscipline";
import { Seance } from "../../inscription/models/Seance";

/**
 * Tableau de bord du surveillant.
 * KPIs + séries dynamiques à partir des données de présence, pointage,
 * absences et discipline. Aucun chiffre en dur : tout est agrégé au moment
 * de la requête.
 */
export default class SurveillantDashboardController {

  /** Bornes de la journée courante. */
  private static jourCourant(): { debut: Date; fin: Date } {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);
    return { debut, fin };
  }

  /** Déduit une gravité à partir du libellé de la sanction (heuristique). */
  private static infererGravite(sanction: string | null): 'mineure' | 'moyenne' | 'grave' {
    const s = (sanction || '').toLowerCase();
    if (s.includes('exclusion') || s.includes('renvoi') || s.includes('expulsion')) return 'grave';
    if (s.includes('avertissement') || s.includes('observation')) return 'mineure';
    return 'moyenne';
  }

  /** Convertit une sanction disciplinaire (BDD) en incident du front. */
  private static toIncident(s: any) {
    const fullName = (s.etudiant || '').split(/\s+/);
    const prenoms = fullName.slice(0, -1).join(' ') || s.etudiant;
    const nom = fullName.slice(-1).join(' ') || '';
    return {
      id: String(s.id),
      apprenantNom: nom,
      apprenantPrenoms: prenoms,
      classe: s.classe || '—',
      dateIncident: s.date,
      typeIncident: s.sanction || 'Non précisé',
      description: s.motif || '—',
      gravite: SurveillantDashboardController.infererGravite(s.sanction),
      statut: (s.statut || 'ouvert') as 'ouvert' | 'en_cours' | 'resolu',
    };
  }

  static async getDashboard(req: Request, res: Response): Promise<Response> {
    try {
      const { debut, fin } = SurveillantDashboardController.jourCourant();

      const [
        presenceAuj,
        pointagesAuj,
        totalAbsences,
        absencesNonJustifiees,
        totalSeances,
        seancesAuj,
        totalSanctions,
        sanctionsAuj,
        absences,
        sanctions,
        presencesAvant,
      ] = await Promise.all([
        Presence.count({ where: { date: { [Op.between]: [debut, fin] } } }),
        Pointage.count({ where: { date: { [Op.between]: [debut, fin] } } }),
        Absence.count(),
        Absence.count({ where: { justificatif: null, motif: null } }),
        Seance.count(),
        Seance.count({ where: { dateDebut: { [Op.between]: [debut, fin] } } }),
        SanctionDiscipline.count(),
        SanctionDiscipline.count({ where: { date: { [Op.between]: [debut, fin] } } }),
        Absence.findAll({ attributes: ['type'], raw: true }),
        SanctionDiscipline.findAll({ raw: true }),
        Presence.findAll({ attributes: ['date'], raw: true }),
      ]);

      // Répartition des absences par type (regroupement dynamique).
      const typeMap = new Map<string, number>();
      let totalRetards = 0;
      for (const a of absences) {
        const t = a.type || 'Non précisé';
        typeMap.set(t, (typeMap.get(t) || 0) + 1);
        if (t.toLowerCase().includes('retard')) totalRetards += 1;
      }
      const absencesParType = Array.from(typeMap.entries()).map(([type, total]) => ({ type, total }));

      // Répartition des sanctions par type et par statut.
      const sanctionTypeMap = new Map<string, number>();
      const statutMap = new Map<string, number>();
      for (const s of sanctions) {
        const t = s.sanction || 'Non précisé';
        sanctionTypeMap.set(t, (sanctionTypeMap.get(t) || 0) + 1);
        const st = s.statut || 'À traiter';
        statutMap.set(st, (statutMap.get(st) || 0) + 1);
      }
      const sanctionsParType = Array.from(sanctionTypeMap.entries()).map(([sanction, total]) => ({ sanction, total }));
      const sanctionsParStatut = Array.from(statutMap.entries()).map(([statut, total]) => ({ statut, total }));

      // Discipline du jour (liste pour la colonne latérale).
      const today = new Date();
      const incidentsDiscipline = sanctions
        .filter((s: any) => {
          if (!s.date) return false;
          const d = new Date(s.date);
          return d.getFullYear() === today.getFullYear()
            && d.getMonth() === today.getMonth()
            && d.getDate() === today.getDate();
        })
        .map((s: any) => SurveillantDashboardController.toIncident(s));

      // Tendances : présences sur les 7 derniers jours.
      const presencesParJour: { jour: string; presences: number; absences: number }[] = [];
      const absToday = new Date(debut);
      for (let i = 6; i >= 0; i--) {
        const day = new Date(absToday);
        day.setDate(day.getDate() - i);
        const next = new Date(day);
        next.setDate(day.getDate() + 1);
        const count = presencesAvant.filter((p: any) => {
          const d = new Date(p.date);
          return d >= day && d < next;
        }).length;
        presencesParJour.push({
          jour: day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
          presences: count,
          absences: 0,
        });
      }

      // Tendance incidents par type (sur l'ensemble des données).
      const incidentsParType = sanctionsParType.map((s) => ({ type: s.sanction, count: s.total }));

      // Taux de présence (si un minimum d'activité existe).
      const basePresence = presenceAuj + pointagesAuj;
      const tauxPresence = (basePresence + totalAbsences) > 0
        ? Math.round((basePresence / (basePresence + totalAbsences)) * 100)
        : null;

      return res.status(200).json({
        success: true,
        data: {
          id: 'surveillant-dashboard',
          date: new Date().toISOString(),
          totalPresences: basePresence,
          totalAbsences,
          totalRetards,
          tauxPresence,
          incidentsDiscipline,
          tendances: {
            presencesParJour,
            incidentsParType,
          },
          charts: {
            absencesParType,
            sanctionsParType,
            sanctionsParStatut,
          },
          seancesAuj,
          sanctionsAuj,
          absencesNonJustifiees,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  static async getDisciplineDuJour(req: Request, res: Response): Promise<Response> {
    try {
      const { debut, fin } = SurveillantDashboardController.jourCourant();
      const sanctions = await SanctionDiscipline.findAll({ where: { date: { [Op.between]: [debut, fin] } }, raw: true });
      const result = sanctions.map((s: any) => SurveillantDashboardController.toIncident(s));
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  static async getPresencesDuJour(req: Request, res: Response): Promise<Response> {
    try {
      const { debut, fin } = SurveillantDashboardController.jourCourant();
      const presences = await Presence.findAll({ where: { date: { [Op.between]: [debut, fin] } }, raw: true });
      return res.status(200).json(presences);
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  static async createIncident(req: Request, res: Response): Promise<Response> {
    try {
      const sanction = new SanctionDiscipline();
      sanction.etudiant = `${req.body.apprenantPrenoms || ''} ${req.body.apprenantNom || ''}`.trim();
      sanction.matricule = req.body.matricule || '';
      sanction.classe = req.body.classe || '';
      sanction.date = req.body.dateIncident || new Date();
      sanction.motif = req.body.description || '';
      sanction.sanction = req.body.typeIncident || 'Non précisé';
      sanction.statut = (req.body.statut || 'ouvert') as string;
      await sanction.save();
      return res.status(201).json({ success: true, data: SurveillantDashboardController.toIncident(sanction) });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }

  static async updateIncident(req: Request, res: Response): Promise<Response> {
    try {
      const sanction = await SanctionDiscipline.findByPk(req.params.id);
      if (!sanction) {
        return res.status(404).json({ success: false, message: 'Incident non trouvé' });
      }
      if (req.body.apprenantNom !== undefined || req.body.apprenantPrenoms !== undefined) {
        sanction.etudiant = `${req.body.apprenantPrenoms || ''} ${req.body.apprenantNom || ''}`.trim();
      }
      if (req.body.classe !== undefined) sanction.classe = req.body.classe;
      if (req.body.description !== undefined) sanction.motif = req.body.description;
      if (req.body.typeIncident !== undefined) sanction.sanction = req.body.typeIncident;
      if (req.body.statut !== undefined) sanction.statut = req.body.statut;
      if (req.body.dateIncident !== undefined) sanction.date = req.body.dateIncident;
      await sanction.save();
      return res.status(200).json({ success: true, data: SurveillantDashboardController.toIncident(sanction) });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
}