import { Request, Response } from "express";
import { Op } from "sequelize";
import { RhDemandeConge } from "../models/RhDemandeConge";
import { RhSoldeConge } from "../models/RhSoldeConge";
import { RhEmploye } from "../models/RhEmploye";

export default class RhDemandeCongeController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.employeId) where.employeId = req.query.employeId;
      if (req.query.statut) where.statut = req.query.statut;
      if (req.query.typeConge) where.typeConge = req.query.typeConge;
      const data = await RhDemandeConge.findAll({ where, include: [{ model: RhEmploye, as: 'employe' }], order: [['createdAt', 'DESC']] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async get(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDemandeConge.findByPk(req.params.id, { include: [{ model: RhEmploye, as: 'employe' }] });
      if (!data) return res.status(404).json({ success: false, message: "Demande de congé non trouvée" });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const body = { ...req.body };
      const debut = new Date(body.dateDebut);
      const fin = new Date(body.dateFin);
      body.duree = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const data = await RhDemandeConge.create(body);
      return res.status(201).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDemandeConge.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Demande de congé non trouvée" });
      if (['validee_rh', 'validee_superieur', 'refusee', 'annulee'].includes(data.statut)) {
        return res.status(400).json({ success: false, message: "Impossible de modifier une demande déjà traitée" });
      }
      await data.update(req.body);
      return res.status(200).send(data);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDemandeConge.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Demande de congé non trouvée" });
      if (data.statut !== 'soumise') return res.status(400).json({ success: false, message: "Seules les demandes soumises peuvent être supprimées" });
      await data.destroy();
      return res.status(200).json({ success: true, message: "Demande de congé supprimée" });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async valider(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDemandeConge.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Demande de congé non trouvée" });
      if (data.statut !== 'soumise') return res.status(400).json({ success: false, message: "Seules les demandes soumises peuvent être validées" });

      const nouveauStatut = req.body.validationNiveau || 'validee_rh';
      await data.update({ statut: nouveauStatut, valideePar: (req as any).utilisateurId, commentaireValidation: req.body.commentaire || null });

      if (['validee_rh', 'validee_superieur'].includes(nouveauStatut)) {
        await RhDemandeCongeController.mettreAJourSolde(data);
      }

      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async refuser(req: Request, res: Response): Promise<Response> {
    try {
      const data = await RhDemandeConge.findByPk(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Demande de congé non trouvée" });
      if (data.statut !== 'soumise') return res.status(400).json({ success: false, message: "Seules les demandes soumises peuvent être refusées" });
      await data.update({ statut: 'refusee', valideePar: (req as any).utilisateurId, commentaireValidation: req.body.commentaire || null });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getSolde(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = { employeId: req.params.employeId };
      if (req.query.annee) where.annee = req.query.annee;
      const data = await RhSoldeConge.findAll({ where });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getCount(req: Request, res: Response): Promise<Response> {
    try {
      const count = await RhDemandeConge.count();
      return res.status(200).json({ success: true, count });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  private static async mettreAJourSolde(demande: RhDemandeConge): Promise<void> {
    if (demande.typeConge === 'maladie' || demande.typeConge === 'sans_solde') return;

    const typeSolde = demande.typeConge as 'annuel' | 'exceptionnel';
    const annee = demande.dateDebut.getFullYear();
    const [solde] = await RhSoldeConge.findOrCreate({
      where: { employeId: demande.employeId, annee, typeConge: typeSolde },
      defaults: { employeId: demande.employeId, annee, typeConge: typeSolde, total: typeSolde === 'annuel' ? 30 : 5, pris: 0, reste: 0 }
    });
    const nouveauPris = (Number(solde.pris) || 0) + (demande.duree || 0);
    await solde.update({ pris: nouveauPris, reste: (Number(solde.total) || 0) - nouveauPris });
  }

  static async initialiserSolde(req: Request, res: Response): Promise<Response> {
    try {
      const { employeId, annee, typeConge, total } = req.body;
      const [solde] = await RhSoldeConge.findOrCreate({
        where: { employeId, annee, typeConge },
        defaults: { employeId, annee, typeConge, total, pris: 0, reste: total }
      });
      if (solde) await solde.update({ total, reste: Number(total) - Number(solde.pris) });
      return res.status(200).send(solde);
    } catch (error) {
      return res.status(400).json({ success: false, error });
    }
  }

  static async getSoldesAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.annee) where.annee = req.query.annee;
      if (req.query.employeId) where.employeId = req.query.employeId;
      const data = await RhSoldeConge.findAll({ where, include: [{ model: RhEmploye, as: 'employe' }] });
      return res.status(200).send(data);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
