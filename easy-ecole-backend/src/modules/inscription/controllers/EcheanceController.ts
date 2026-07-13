import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Echeance } from "../models/Echeance";
import { DossierEtudiant } from "../models/DossierEtudiant";

export default class EcheanceController {

    constructor() { }

    static async getAllEcheances(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Echeance>> = {
            include: [Echeance.associations.dossierEtudiant]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.include = [{
                association: Echeance.associations.dossierEtudiant,
                where: { utilisateurId: (req as any).utilisateurId }
            }]
        }

        if (req.query.dossierEtudiantId) {
            options.where = { dossierEtudiantId: req.query.dossierEtudiantId as string }
        }

        if (req.query.statut) {
            options.where = { ...options.where, statut: req.query.statut as string }
        }

        try {
            let echeances: Echeance[];
            echeances = await Echeance.findAll(options);

            return res.status(200).send(echeances);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getEcheance(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Echeance>> = {
            where: { id: req.params.id },
            include: [Echeance.associations.dossierEtudiant]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.include = [{
                association: Echeance.associations.dossierEtudiant,
                where: { utilisateurId: (req as any).utilisateurId }
            }]
        }

        try {
            const echeance: Echeance | null = await Echeance.findOne(options);

            if (echeance == null)
                return res.status(404).json({ success: false, message: "Échéance non trouvée" });

            return res.status(200).send(echeance);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createEcheance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        const dossier = await DossierEtudiant.findByPk(req.body.dossierEtudiantId)
        if (dossier == null) {
            return res.status(404).json({ success: false, message: "Dossier étudiant non trouvé" });
        }

        let echeance: Echeance = new Echeance();
        echeance.dossierEtudiantId = req.body.dossierEtudiantId
        echeance.type = req.body.type
        echeance.numeroEcheance = req.body.numeroEcheance
        echeance.montant = req.body.montant
        echeance.devise = req.body.devise ?? 'XAF'
        echeance.dateLimite = req.body.dateLimite
        echeance.datePaiement = req.body.datePaiement ?? null
        echeance.statut = req.body.statut ?? 'impaye'
        echeance.moisConcerne = req.body.moisConcerne ?? null

        await echeance.save()
            .then(async (echeance) => {
                return res.status(201).send(echeance);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateEcheance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let echeance: Echeance | null = await Echeance.findByPk(req.params.id);
        if (echeance != null) {
            await echeance.update({
                type: req.body.type ?? echeance.type,
                montant: req.body.montant ?? echeance.montant,
                dateLimite: req.body.dateLimite ?? echeance.dateLimite,
                statut: req.body.statut ?? echeance.statut,
                moisConcerne: req.body.moisConcerne ?? echeance.moisConcerne,
            })
                .then(async (echeance) => {
                    return res.status(200).send(echeance);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Échéance non trouvée" });
        }

        return null
    }

    static async deleteEcheance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let echeance: Echeance | null = await Echeance.findByPk(req.params.id);
        if (echeance) {
            await echeance.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Échéance supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Échéance non trouvée" });
        }

        return null
    }

    static async genererEcheances(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        const dossier: DossierEtudiant | null = await DossierEtudiant.findByPk(req.params.dossierEtudiantId)
        if (dossier == null) {
            return res.status(404).json({ success: false, message: "Dossier étudiant non trouvé" });
        }

        const montantParMois = dossier.fraisScolarite / dossier.nbMensualites
        const debut = new Date(dossier.demarrageParcours)
        let echeances = []

        for (let i = 0; i < dossier.nbMensualites; i++) {
            const dateLimite = new Date(debut.getFullYear(), debut.getMonth() + i, 5)
            const moisConcerne = debut.getFullYear() + '-' + String(debut.getMonth() + i + 1).padStart(2, '0')

            let echeance = new Echeance();
            echeance.dossierEtudiantId = dossier.id
            echeance.type = 'scolarite'
            echeance.numeroEcheance = i + 1
            echeance.montant = montantParMois
            echeance.dateLimite = dateLimite
            echeance.statut = 'impaye'
            echeance.moisConcerne = moisConcerne

            echeances.push(await echeance.save())
        }

        return res.status(201).json({ success: true, echeances });
    }
}
