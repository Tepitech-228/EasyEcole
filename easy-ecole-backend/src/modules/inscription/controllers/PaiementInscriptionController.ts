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
import { creerEcritureComptable, lettrerEcritures411 } from "../../comptabilite/helpers/ComptabiliteHelper";
import { MobileMoneyCinetpay } from "../../../core/helpers/MobileMoneyCinetpay";

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
            options = {}
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
                    // INSC-1.2: Écriture paiement (Débit 512 / Crédit 411)
                    await creerEcritureComptable({
                        req,
                        journalCode: 'VEN',
                        compteDebitNumero: '512',
                        compteCreditNumero: '411',
                        montant: paiementInscription.montant,
                        libelle: paiementInscription.description || `Paiement inscription #${paiementInscription.numero}`,
                        reference: paiementInscription.numero,
                        moduleSource: 'inscription',
                        referenceModuleId: String(paiementInscription.id)
                    })

                    // INSC-1.3: Lettrage automatique des créances 411
                    await lettrerEcritures411({
                        referenceModuleId: String(demandeInscription!.id),
                        paiementId: String(paiementInscription.id),
                        montant: paiementInscription.montant
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

    static async createMobileMoneyPayment(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT &&
            (req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { matricule: req.body.matriculeInscription, utilisateurId: (req as any).utilisateurId } }
        } else {
            options = { where: { matricule: req.body.matriculeInscription } }
        }

        const demandeInscription = await DemandeInscription.findOne(options)
        if (demandeInscription == null) {
            return res.status(404).json({ matriculeNotExists: true })
        }

        const cinetpay = MobileMoneyCinetpay.getInstance()
        if (!cinetpay.isInitialized()) {
            return res.status(503).json({ success: false, message: 'Mobile money non configuré' })
        }

        const transactionId = cinetpay.generateTransactionId('INSC')

        const paiementInscription = new PaiementInscription()
        paiementInscription.numero = IDGenerator.getInstance().generateNumeroPaiement()
        paiementInscription.matriculeInscription = req.body.matriculeInscription
        paiementInscription.montant = req.body.montant
        paiementInscription.description = req.body.description || `Paiement mobile money inscription`
        paiementInscription.datePaiement = new Date()
        paiementInscription.type = TypesPaiement.MOBILE_MONEY
        paiementInscription.utilisateurId = (req as any).utilisateurId

        try {
            await paiementInscription.save()

            const paymentResult = await cinetpay.createPayment({
                transactionId,
                amount: paiementInscription.montant,
                description: paiementInscription.description,
                customerName: `${demandeInscription.utilisateur?.nom || ''} ${demandeInscription.utilisateur?.prenoms || ''}`,
                customerEmail: demandeInscription.utilisateur?.email,
                customerPhone: req.body.customerPhone,
                redirectUrl: req.body.redirectUrl,
                callbackUrl: req.body.callbackUrl,
            })

            if (!paymentResult.success) {
                return res.status(400).json({ success: false, message: paymentResult.message })
            }

            await creerEcritureComptable({
                req,
                journalCode: 'VEN',
                compteDebitNumero: '512',
                compteCreditNumero: '411',
                montant: paiementInscription.montant,
                libelle: paiementInscription.description || `Paiement mobile money #${paiementInscription.numero}`,
                reference: paiementInscription.numero,
                moduleSource: 'inscription',
                referenceModuleId: String(paiementInscription.id)
            })

            await lettrerEcritures411({
                referenceModuleId: String(demandeInscription.id),
                paiementId: String(paiementInscription.id),
                montant: paiementInscription.montant
            })

            return res.status(201).json({
                ...paiementInscription.toJSON(),
                transactionId,
                paymentUrl: paymentResult.data?.paymentUrl,
                status: paymentResult.data?.status,
            })
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async checkMobileMoneyPayment(req: Request, res: Response): Promise<Response> {
        const { transactionId } = req.params

        const cinetpay = MobileMoneyCinetpay.getInstance()
        if (!cinetpay.isInitialized()) {
            return res.status(503).json({ success: false, message: 'Mobile money non configuré' })
        }

        try {
            const result = await cinetpay.checkPayment(transactionId)

            if (result.success && result.status === 'accepted') {
                const paiement = await PaiementInscription.findOne({
                    where: { numero: transactionId }
                })
                if (paiement && !paiement.dateValidation) {
                    await paiement.update({ dateValidation: new Date() })
                }
            }

            return res.status(200).json(result)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }
}