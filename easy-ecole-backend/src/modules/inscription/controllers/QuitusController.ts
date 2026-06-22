import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Quitus } from "../models/Quitus";
import { PaiementInscription } from "../models/PaiementInscription";
import { DemandeInscription } from "../models/DemandeInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { IDGenerator } from "../../../core/helpers/IDGenerator";

export default class QuitusController {

    constructor() { }

    static async getAllQuitus(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Quitus>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                include: [{
                    association: Quitus.associations.paiementInscription,
                    include: [{
                        association: PaiementInscription.associations.demandeInscription,
                        where: { utilisateurId: (req as any).utilisateurId }
                    }]
                }]
            }
        }

        try {
            let quitusList: Quitus[];
            quitusList = await Quitus.findAll(options);

            return res.status(200).send(quitusList);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getQuitus(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Quitus>> = {
            where: { id: req.params.id },
            include: [{ association: Quitus.associations.paiementInscription }]
        }

        try {
            const quitus: Quitus | null = await Quitus.findOne(options);

            if (quitus == null)
                return res.status(404).json({ success: false, message: "Quitus non trouvé" });

            return res.status(200).send(quitus);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async generateQuitus(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false })
        }

        let paiement: PaiementInscription | null = await PaiementInscription.findOne({
            where: { id: req.body.paiementInscriptionId },
            include: [
                { association: PaiementInscription.associations.utilisateur },
                { association: PaiementInscription.associations.demandeInscription }
            ]
        });

        if (paiement == null) {
            return res.status(404).json({ success: false, message: "Paiement non trouvé" });
        }

        let existingQuitus = await Quitus.findOne({ where: { paiementInscriptionId: paiement.id } });
        if (existingQuitus) {
            return res.status(400).json({ success: false, message: "Un quitus existe déjà pour ce paiement" });
        }

        const etudiant = paiement.utilisateur
        const demande = paiement.demandeInscription
        const code = 'QTS-' + IDGenerator.getInstance().generateNumeroPaiement()

        const filename = DocumentPDFGenerator.generateQuitus(
            paiement.id,
            code,
            etudiant?.identifiant || 'Étudiant',
            demande?.matricule || '',
            paiement.montant,
            paiement.datePaiement,
            "public/inscription/quitus/"
        )

        let quitus: Quitus = new Quitus();
        quitus.paiementInscriptionId = paiement.id
        quitus.code = code
        quitus.fichierPDF = filename
        quitus.statut = 'genere'

        await quitus.save()
            .then(async (quitus) => {
                return res.status(201).send(quitus);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async validerQuitus(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let quitus: Quitus | null = await Quitus.findOne({ where: { id: req.params.id } });
        if (quitus != null) {
            await quitus.update({ statut: 'valide' })
                .then(async (quitus) => {
                    return res.status(200).send(quitus);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Quitus non trouvé" });
        }

        return null
    }

    static async deleteQuitus(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let quitus: Quitus | null = await Quitus.findOne({ where: { id: req.params.id } });
        if (quitus) {
            await quitus.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Quitus supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Quitus non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Quitus.count()
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
