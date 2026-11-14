import { Request, Response } from "express";
import { Op } from "sequelize";
import { Seance } from "../models/Seance";
import { SeancePointage } from "../models/SeancePointage";
import { Enseignant } from "../../auth/models/Enseignant";
import { depasseDelaiGraceDepart, estDepartAnticipe, validerMotifDepart } from "../services/SeancePointageRulesService";
import SeancePointagePlanningService from "../services/SeancePointagePlanningService";

function dateIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function minutes(value: unknown): number {
  const [hours, mins] = String(value).slice(0, 5).split(":").map(Number);
  return hours * 60 + mins;
}

function heureUtc(date: Date): string {
  return date.toISOString().slice(11, 19);
}

export default class SeancePointageController {
  private static async contexte(
    req: Request,
    res: Response,
  ): Promise<{ seance: Seance; date: string; enseignantId: string; utilisateurId: number; etablissementId: number } | null> {
    const utilisateurId = Number((req as any).utilisateurId);
    const date = String(req.body?.date || "");
    if (!Number.isSafeInteger(utilisateurId) || utilisateurId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ success: false, code: "INVALID_INPUT", message: "La date de la séance est invalide." });
      return null;
    }

    const dateValue = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(dateValue.getTime()) || dateValue.toISOString().slice(0, 10) !== date) {
      res.status(400).json({ success: false, code: "INVALID_INPUT", message: "La date de la séance est invalide." });
      return null;
    }
    if (date !== new Date().toISOString().slice(0, 10)) {
      res.status(409).json({ success: false, code: "NOT_TODAY", message: "Le pointage est possible uniquement le jour de la séance." });
      return null;
    }

    const [seance, enseignant] = await Promise.all([
      Seance.findByPk(req.params.id, { include: [{ association: Seance.associations.cours }] }),
      Enseignant.findOne({ where: { utilisateurId }, attributes: ["id"] }),
    ]);
    if (!seance || !seance.publieeLe) {
      res.status(404).json({ success: false, code: "NOT_PROGRAMMED", message: "Vous n'êtes pas programmé sur ce site pour cette période." });
      return null;
    }
    if (!enseignant || Number(seance.enseignantId) !== Number(enseignant.id)) {
      res.status(404).json({ success: false, code: "NOT_PROGRAMMED", message: "Vous n'êtes pas programmé sur ce site pour cette période." });
      return null;
    }

    const weekday = dateValue.getUTCDay() || 7;
    const startDate = dateIso(seance.dateDebut);
    const endDate = dateIso(seance.dateFin);
    if (
      date < startDate
      || date > endDate
      || String(seance.jourSemaine) !== String(weekday)
    ) {
      res.status(404).json({ success: false, code: "NOT_PROGRAMMED", message: "Vous n'êtes pas programmé sur ce site pour cette période." });
      return null;
    }

    const etablissementId = Number((seance as any).etablissementId ?? (seance as any).cours?.etablissementId);
    if (!Number.isSafeInteger(etablissementId) || etablissementId <= 0) {
      res.status(409).json({ success: false, code: "SITE_UNCONFIGURED", message: "Le site de cette séance n'est pas renseigné." });
      return null;
    }
    if (Number((req as any).etablissementId) !== etablissementId) {
      res.status(403).json({ success: false, code: "WRONG_SITE", message: "Sélectionnez le site prévu pour cette séance avant de pointer." });
      return null;
    }

    return { seance, date, enseignantId: String(enseignant.id), utilisateurId, etablissementId };
  }

  static async pointerDebut(req: Request, res: Response): Promise<Response> {
    try {
      const context = await SeancePointageController.contexte(req, res);
      if (!context) return res;

      const maintenant = new Date();
      const heure = heureUtc(maintenant);
      const debutPrevu = minutes(context.seance.heureDebut);
      const finPrevue = minutes(context.seance.heureFin);
      const heureActuelle = minutes(heure);
      if (heureActuelle < debutPrevu) {
        const minutesRestantes = debutPrevu - heureActuelle;
        return res.status(409).json({
          success: false,
          code: "TOO_EARLY",
          minutesRestantes,
          cours: (context.seance as any).cours?.intitule || context.seance.titre,
          message: `Votre prochain cours débute dans ${minutesRestantes} minutes.`,
        });
      }
      if (heureActuelle >= finPrevue) {
        return res.status(409).json({
          success: false,
          code: "SESSION_ENDED",
          message: "L'heure prévue de cette séance est dépassée; son début ne peut plus être pointé.",
        });
      }

      const [pointage] = await SeancePointage.findOrCreate({
        where: { seanceId: context.seance.id, date: context.date },
        defaults: {
          seanceId: context.seance.id,
          date: context.date,
          enseignantId: context.enseignantId,
          utilisateurId: context.utilisateurId,
          etablissementId: context.etablissementId,
          heureDebutReelle: null,
          heureFinReelle: null,
        },
      });
      const [updated] = await SeancePointage.update(
        { heureDebutReelle: heure },
        { where: { id: pointage.id, heureDebutReelle: null } },
      );
      if (!updated) {
        return res.status(409).json({ success: false, code: "ALREADY_STARTED", message: "Le début de cette séance a déjà été pointé." });
      }

      return res.status(201).json({
        success: true,
        statut: "en_cours",
        heureDebutReelle: heure,
        retardMinutes: Math.max(0, heureActuelle - debutPrevu),
        message: "Début de séance enregistré.",
      });
    } catch (error) {
      console.error("[SeancePointageController.pointerDebut]", error);
      return res.status(500).json({ success: false, message: "Impossible d'enregistrer le début de la séance." });
    }
  }

  static async pointerFin(req: Request, res: Response): Promise<Response> {
    try {
      const context = await SeancePointageController.contexte(req, res);
      if (!context) return res;

      const pointage = await SeancePointage.findOne({
        where: { seanceId: context.seance.id, date: context.date, utilisateurId: context.utilisateurId },
      });
      if (!pointage || !pointage.heureDebutReelle) {
        return res.status(409).json({ success: false, code: "START_REQUIRED", message: "Pointez le début de cette séance avant sa fin." });
      }
      if (pointage.heureFinReelle) {
        return res.status(409).json({ success: false, code: "ALREADY_FINISHED", message: "La fin de cette séance a déjà été pointée." });
      }

      const heure = heureUtc(new Date());
      const departHorsDelai = depasseDelaiGraceDepart(heure, context.seance.heureFin);
      if (departHorsDelai === null) {
        return res.status(409).json({ success: false, code: "INVALID_SCHEDULE", message: "L’horaire de fin du cours est invalide." });
      }
      if (departHorsDelai) {
        return res.status(409).json({
          success: false,
          code: "DEPARTURE_WINDOW_EXPIRED",
          message: "Le délai de 15 minutes après la fin prévue du cours est dépassé. Aucun départ n’a été enregistré."
        });
      }
      const departAnticipe = estDepartAnticipe(heure, context.seance.heureFin);
      if (departAnticipe === null) {
        return res.status(409).json({ success: false, code: "INVALID_SCHEDULE", message: "L’horaire de fin du cours est invalide." });
      }
      const motifDepart = req.body?.motifDepart === undefined
        ? null
        : validerMotifDepart(req.body.motifDepart);
      if (departAnticipe && !motifDepart) {
        return res.status(400).json({
          success: false,
          code: "EARLY_DEPARTURE_REASON_REQUIRED",
          message: "Un motif de départ est obligatoire avant l’heure de fin prévue du cours (500 caractères maximum)."
        });
      }
      if (req.body?.motifDepart !== undefined && !motifDepart) {
        return res.status(400).json({
          success: false,
          code: "INVALID_DEPARTURE_REASON",
          message: "Le motif de départ doit contenir au maximum 500 caractères."
        });
      }
      const navigationCours = await SeancePointagePlanningService.trouverCoursSuivant(
        Number(context.enseignantId),
        context.etablissementId,
        context.date,
        heure,
        Number(context.seance.id)
      );
      const [updated] = await SeancePointage.update(
        { heureFinReelle: heure, motifDepart },
        { where: { id: pointage.id, heureFinReelle: null } },
      );
      if (!updated) {
        return res.status(409).json({ success: false, code: "ALREADY_FINISHED", message: "La fin de cette séance a déjà été pointée." });
      }

      const debutReel = minutes(pointage.heureDebutReelle);
      const finReelle = minutes(heure);
      const finPrevue = minutes(context.seance.heureFin);
      return res.status(200).json({
        success: true,
        statut: finReelle < finPrevue ? "termine_en_avance" : "termine",
        heureDebutReelle: pointage.heureDebutReelle,
        heureFinReelle: heure,
        motifDepart,
        navigationCours,
        dureeMinutes: Math.max(0, finReelle - debutReel),
        departAnticipeMinutes: Math.max(0, finPrevue - finReelle),
        message: "Fin de séance enregistrée.",
      });
    } catch (error) {
      console.error("[SeancePointageController.pointerFin]", error);
      return res.status(500).json({ success: false, message: "Impossible d'enregistrer la fin de la séance." });
    }
  }
}
