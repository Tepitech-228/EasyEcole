import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PaiementInscription } from "../models/PaiementInscription";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { DemandeInscription } from "../models/DemandeInscription";
import { Banque } from "../../auth/models/Banque";
import { CaissierBanque } from "../../auth/models/CaissierBanque";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { MobileMoneyCinetpay } from "../../../core/helpers/MobileMoneyCinetpay";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";

export default class PaiementInscriptionController {

    constructor() { }

    static async getAllPaiementsInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PaiementInscription>> = {}
        // if(req.query.matricule) {
        //     options = {
        //         where: {matriculeInscription: req.query.matricule as string}
        //     }
        // }
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { include: [{ association: PaiementInscription.associations.demandeInscription, where: { utilisateurId: (req as any).utilisateurId } }] }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            let banque: Banque | null = await Banque.findOne({
                include: [{ association: Banque.associations.caissiers, where: { utilisateurId: (req as any).utilisateurId } }]
            })

            if (banque == null) {
                return res.status(500).json({ success: false });
            }
            options = { include: [{ association: PaiementInscription.associations.utilisateur, where: {role: RolesUtilisateur.CAISSIER_BANQUE}, include: [{ association: Utilisateur.associations.caissierBanque, where: { banqueId: banque.id } }] }] }
        }

        try {
            let paiementsInscription: PaiementInscription[];
            paiementsInscription = await PaiementInscription.findAll(options);

            return res.status(200).send(paiementsInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getPaiementInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PaiementInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                where: { id: req.params.id }, include: [
                    { association: PaiementInscription.associations.demandeInscription, where: { utilisateurId: (req as any).utilisateurId } }
                ]
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        try {
            const paiementInscription: PaiementInscription | null = await PaiementInscription.findOne(options);

            if (paiementInscription == null)
                return res.status(404).json({ success: false, message: "Paiement non trouvé" });

            return res.status(200).send(paiementInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }


    static async createPaiementInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { matricule: req.body.matriculeInscription } }
            req.body.type = TypesPaiement.ESPECE
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { matricule: req.body.matriculeInscription } }
            req.body.type = TypesPaiement.EN_LIGNE
        }
        else {
            return res.status(403).json({ success: false })
        }

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);
        if (demandeInscription != null) {
            let paiementInscription: PaiementInscription = new PaiementInscription();
            paiementInscription.numero = IDGenerator.getInstance().generateNumeroPaiement()
            paiementInscription.matriculeInscription = req.body.matriculeInscription
            paiementInscription.montant = req.body.montant
            paiementInscription.description = req.body.description
            paiementInscription.datePaiement = req.body.datePaiement ?? new Date()
            paiementInscription.type = req.body.type ?? TypesPaiement.ESPECE
            paiementInscription.utilisateurId = (req as any).utilisateurId

            await paiementInscription.save()
                .then(async (paiementInscription) => {
                    await creerEcritureComptable({
                        req,
                        journalCode: 'VEN',
                        compteDebitNumero: '512',
                        compteCreditNumero: '702',
                        montant: paiementInscription.montant,
                        libelle: paiementInscription.description || `Paiement inscription #${paiementInscription.numero}`,
                        reference: paiementInscription.numero,
                        moduleSource: 'inscription',
                        referenceModuleId: String(paiementInscription.id)
                    })

                    return res.status(201).send(paiementInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ matriculeNotExists: true });
        }

        return null
    }

    static async createMobileMoneyPaiementInscription(req: Request, res: Response): Promise<Response> {
        try {
            const { matriculeInscription, montant, description } = req.body;

            if (!matriculeInscription || !montant) {
                return res.status(400).json({ success: false, message: "matriculeInscription et montant requis" });
            }

            const demande = await DemandeInscription.findOne({ where: { matricule: matriculeInscription } });
            if (!demande) {
                return res.status(404).json({ success: false, message: "Inscription non trouvée" });
            }

            // Créer le paiement
            const paiementInscription = new PaiementInscription();
            paiementInscription.matriculeInscription = matriculeInscription;
            paiementInscription.montant = montant;
            paiementInscription.type = TypesPaiement.EN_LIGNE;
            paiementInscription.description = description || 'Paiement mobile money';
            paiementInscription.utilisateurId = (req as any).utilisateurId;
            await paiementInscription.save();

            // Créer l'écriture comptable
            try {
                await creerEcritureComptable({
                    req,
                    journalCode: 'VEN',
                    compteDebitNumero: '512',
                    compteCreditNumero: '702',
                    montant: paiementInscription.montant,
                    libelle: description || `Paiement mobile money #${paiementInscription.numero}`,
                    reference: paiementInscription.numero,
                    moduleSource: 'inscription',
                    referenceModuleId: String(paiementInscription.id)
                });
            } catch (err) {
                console.error("Erreur création écriture comptable:", err);
            }

            return res.status(201).json({ success: true, paiement: paiementInscription });
        } catch (error) {
            console.error("Erreur paiement mobile money:", error);
            return res.status(500).json({ success: false, message: "Erreur lors du paiement mobile" });
        }
    }

    static async updatePaiementInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PaiementInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { id: req.params.id } }
        }

        let paiementInscription: PaiementInscription | null = await PaiementInscription.findOne(options);
        if (paiementInscription != null) {

            // if (paiementInscription.titre != req.body.titre && await PaiementInscription.findOne({ where: { titre: req.body.titre, sessionId: req.body.sessionId } }) != null) {
            //     return res.status(400).json({ success: false, alreadyExists: true });
            // }
            // else {

            await paiementInscription.update({
                matriculeInscription: req.body.matriculeInscription,
                montant: req.body.montant,
                description: req.body.description,
                type: req.body.type,
            })
                .then(async (paiementInscription) => {
                    return res.status(200).send(paiementInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
            // }
        }
        else {
            return res.status(404).json({ success: false, message: "Paiement d'inscription non trouvé" });
        }

        return null
    }

    static async deletePaiementInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PaiementInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let paiementInscription: PaiementInscription | null = await PaiementInscription.findOne({ where: { id: req.params.id } });
        if (paiementInscription) {
            await paiementInscription.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Paiement supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Paiement non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<PaiementInscription>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await PaiementInscription.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}