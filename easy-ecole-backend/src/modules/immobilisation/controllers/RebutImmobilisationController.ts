import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { RebutImmobilisation } from "../models/RebutImmobilisation";
import { Immobilisation } from "../models/Immobilisation";
import { creerEcritureAutomatique } from "../../comptabilite/helpers/ComptabiliteHelper";

export default class RebutImmobilisationController {
    static async getAll(req: Request, res: Response): Promise<Response> {
        try { return res.status(200).send(await RebutImmobilisation.findAll()); }
        catch (error) { return res.status(500).json({ success: false, error }); }
    }
    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const item = await RebutImmobilisation.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouve" });
            return res.status(200).send(item);
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }
    static async create(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await RebutImmobilisation.create(req.body);
            const immobilisation = await Immobilisation.findByPk(item.immobilisationId);
            if (immobilisation) {
                await immobilisation.update({ etat: 'reforme' });
                await creerEcritureAutomatique({
                    journalCode: 'OD',
                    compteDebit: '462',
                    compteCredit: '281',
                    montant: item.montant || immobilisation.valeurAcquisition,
                    libelle: `Rebuttement ${immobilisation.nom}`,
                    moduleSource: 'immobilisation',
                    referenceModuleId: item.id
                });
            }
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ success: false, alreadyExists: true });
            return res.status(500).json({ success: false, error });
        }
    }
    static async update(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await RebutImmobilisation.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouve" });
            await item.update(req.body);
            return res.status(200).send(item);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ success: false, alreadyExists: true });
            return res.status(500).json({ success: false, error });
        }
    }
    static async delete(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false });
        }
        try {
            const item = await RebutImmobilisation.findByPk(req.params.id);
            if (item == null) return res.status(404).json({ success: false, message: "Non trouve" });
            await item.destroy();
            return res.status(200).json({ success: true, message: "Supprime" });
        } catch (error) { return res.status(500).json({ success: false, error }); }
    }
}
