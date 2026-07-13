import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandeOrientation } from "../models/DemandeOrientation";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Parcours } from "../models/Parcours";
import { PrerequisParcoursChoisi } from "../models/PrerequisParcoursChoisi";
import { PrerequisParcours } from "../models/PrerequisParcours";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { Apprenant } from "../../auth/models/Apprenant";

export default class DemandeOrientationController {

    constructor() { }

    static async getAllDemandesOrientation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeOrientation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, include: [{ association: DemandeOrientation.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeOrientation.associations.reponseOrientation, DemandeOrientation.associations.parcoursChoisis] }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = { include: [{ association: DemandeOrientation.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeOrientation.associations.reponseOrientation, DemandeOrientation.associations.parcoursChoisis] }
        }

        try {
            let demandesOrientation: DemandeOrientation[];
            demandesOrientation = await DemandeOrientation.findAll(options);

            return res.status(200).send(demandesOrientation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDemandeOrientation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeOrientation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                where: { id: req.params.id, utilisateurId: (req as any).utilisateurId },
                include: [{ association: DemandeOrientation.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeOrientation.associations.reponseOrientation, { model: ParcoursChoisi, as: 'parcoursChoisis', include: [
                    { model: Parcours, as: 'parcours', include: [Parcours.associations.categorie, Parcours.associations.niveauEtude, {model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] },
                    { model: PrerequisParcoursChoisi, as: 'prerequisParcoursChoisis', include: [{model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] }
                ] }]
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = {
                where: { id: req.params.id },
                include: [{ association: DemandeOrientation.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeOrientation.associations.reponseOrientation, { model: ParcoursChoisi, as: 'parcoursChoisis', include: [
                    { model: Parcours, as: 'parcours', include: [Parcours.associations.categorie, Parcours.associations.niveauEtude, {model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] },
                    { model: PrerequisParcoursChoisi, as: 'prerequisParcoursChoisis', include: [{model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] }
                ] }]
            }
        }

        try {
            const demandeOrientation: DemandeOrientation | null = await DemandeOrientation.findOne(options);

            if (demandeOrientation == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            return res.status(200).send(demandeOrientation);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createDemandeOrientation(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let demandeOrientation: DemandeOrientation = new DemandeOrientation();
        demandeOrientation.dateDemande = req.body.dateDemande
        demandeOrientation.utilisateurId = (req as any).utilisateurId

        await demandeOrientation.save()
            .then(async (demandeOrientation) => {
                EmailSender.getInstance().sendConfirmationDemandeOrientation((req as any).utilisateurIdentifiant, (req as any).utilisateurEmail)
                    // .then(async () => {
                    //     return res.status(201).send({success: true});
                    // })
                    // .catch((error) => {
                    //     return res.status(400).json({ success: false, error: error });
                    // });
                return res.status(201).send(demandeOrientation);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    // static async updateDemandeOrientation(req: Request, res: Response): Promise<Response | null> {
    //     let options: FindOptions<InferAttributes<DemandeOrientation>> = {}
    //     if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
    //         return res.status(403).json({success: false})
    //     }
    //     else if((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
    //         options = { where: {id: req.params.id} }
    //     }

    //     let demandeOrientation: DemandeOrientation | null = await DemandeOrientation.findOne(options);
    //     if(demandeOrientation != null) {            
    //         await demandeOrientation.update({
    //             libelle: req.body.name,
    //         })
    //             .then(async (demandeOrientation) => {
    //                 return res.status(200).send(demandeOrientation);
    //             })
    //             .catch((error) => {
    //                 return res.status(400).json({ success: false, error: error });
    //             });
    //     }
    //     else {
    //         return res.status(404).json({ success: false, message: "Demande non trouvée" });
    //     }

    //     return null
    // }

    static async deleteDemandeOrientation(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeOrientation>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let demandeOrientation: DemandeOrientation | null = await DemandeOrientation.findOne({ where: { id: req.params.id } });
        if (demandeOrientation) {
            await demandeOrientation.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Demande supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<DemandeOrientation>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DemandeOrientation.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}