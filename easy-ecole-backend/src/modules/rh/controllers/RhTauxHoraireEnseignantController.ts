import { Op } from "sequelize";
import { Request, Response } from "express";
import { RhTauxHoraireEnseignant } from "../models/RhTauxHoraireEnseignant";
import { RhEmploye } from "../models/RhEmploye";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { Cours } from "../../inscription/models/Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { Utilisateur } from "../../auth/models/Utilisateur";

export default class RhTauxHoraireEnseignantController {
  static async getAll(_req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).send(await RhTauxHoraireEnseignant.findAll({ order: [["niveauEtudeId", "ASC"], ["coursId", "ASC"]] }));
    } catch (error) {
      console.error("Erreur de lecture des taux enseignants:", error);
      return res.status(500).json({ success: false, message: "Les taux enseignants n’ont pas pu être chargés." });
    }
  }

  static async getOptions(_req: Request, res: Response): Promise<Response> {
    try {
      const [niveaux, cours, employes] = await Promise.all([
        NiveauEtude.findAll({ attributes: ["id", "libelle"], order: [["libelle", "ASC"]] }),
        Cours.findAll({ attributes: ["id", "code", "intitule"], order: [["intitule", "ASC"]] }),
        RhEmploye.findAll({ where: { statut: "actif" }, attributes: ["utilisateurId", "nom", "prenoms"] }),
      ]);
      const utilisateurIds = employes.map(employe => Number(employe.utilisateurId));
      const enseignants = utilisateurIds.length
        ? await Enseignant.findAll({ where: { utilisateurId: { [Op.in]: utilisateurIds } }, attributes: ["id", "utilisateurId", "matricule"] })
        : [];
      const utilisateurs = utilisateurIds.length
        ? await Utilisateur.findAll({ where: { id: { [Op.in]: utilisateurIds } }, attributes: ["id", "nom", "prenoms"] })
        : [];
      const noms = new Map(utilisateurs.map(utilisateur => [Number(utilisateur.id), `${utilisateur.prenoms} ${utilisateur.nom}`.trim()]));
      return res.status(200).json({
        niveaux,
        cours,
        enseignants: enseignants.map(enseignant => ({
          id: enseignant.id,
          utilisateurId: enseignant.utilisateurId,
          matricule: enseignant.matricule,
          nomComplet: noms.get(Number(enseignant.utilisateurId)) || enseignant.matricule || `Enseignant #${enseignant.id}`,
        })),
      });
    } catch (error) {
      console.error("Erreur de chargement des options de taux enseignants:", error);
      return res.status(500).json({ success: false, message: "Les options des taux enseignants n’ont pas pu être chargées." });
    }
  }

  static async save(req: Request, res: Response): Promise<Response> {
    const niveauEtudeId = Number(req.body.niveauEtudeId);
    const coursId = Number(req.body.coursId);
    const enseignantId = req.body.enseignantId === null || req.body.enseignantId === "" || req.body.enseignantId === undefined
      ? null
      : Number(req.body.enseignantId);
    const tauxHoraire = Number(req.body.tauxHoraire);
    if (
      !Number.isSafeInteger(niveauEtudeId) || niveauEtudeId <= 0
      || !Number.isSafeInteger(coursId) || coursId <= 0
      || (enseignantId !== null && (!Number.isSafeInteger(enseignantId) || enseignantId <= 0))
      || !Number.isFinite(tauxHoraire) || tauxHoraire < 0
    ) {
      return res.status(400).json({ success: false, message: "Le niveau, le cours, l’enseignant et le taux horaire sont invalides." });
    }
    try {
      const where = { niveauEtudeId, coursId, enseignantId };
      const existing = await RhTauxHoraireEnseignant.findOne({ where });
      if (existing) {
        await existing.update({ tauxHoraire });
        return res.status(200).send(existing);
      }
      return res.status(201).send(await RhTauxHoraireEnseignant.create({ ...where, tauxHoraire }));
    } catch (error) {
      console.error("Erreur d’enregistrement du taux enseignant:", error);
      return res.status(500).json({ success: false, message: "Le taux horaire n’a pas pu être enregistré." });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const taux = await RhTauxHoraireEnseignant.findByPk(req.params.id);
      if (!taux) return res.status(404).json({ success: false, message: "Taux horaire non trouvé." });
      await taux.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erreur de suppression du taux enseignant:", error);
      return res.status(500).json({ success: false, message: "Le taux horaire n’a pas pu être supprimé." });
    }
  }
}
