import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DemandeInscription } from "../models/DemandeInscription";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Parcours } from "../models/Parcours";
import { PrerequisParcoursChoisi } from "../models/PrerequisParcoursChoisi";
import { PrerequisParcours } from "../models/PrerequisParcours";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { DemandeInscriptionCours } from "../models/DemandeInscriptionCours";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { Session } from "../models/Session";
import { Cours } from "../models/Cours";
import { CursusApprenant } from "../models/CursusApprenant";
import { EtatsCoursChoisi } from "../../../core/enums/EtatsCoursChoisi";
import { CoursParticipant } from "../models/CoursParticipant";

export default class DemandeInscriptionController {

    constructor() { }

    static async getAllDemandesInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, include: [{ association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeInscription.associations.reponseInscription, DemandeInscription.associations.parcoursChoisis] }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { include: [{ association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeInscription.associations.reponseInscription, DemandeInscription.associations.parcoursChoisis] }
        }

        try {
            let demandesInscription: DemandeInscription[];
            demandesInscription = await DemandeInscription.findAll(options);

            return res.status(200).send(demandesInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDemandeInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                where: { id: req.params.id, utilisateurId: (req as any).utilisateurId },
                include: [
                    {
                        association: DemandeInscription.associations.utilisateur, include: [{
                            model: Apprenant, as: 'apprenant'
                        }]
                    },
                    { association: DemandeInscription.associations.session, include: [Session.associations.dossiersInscription, Session.associations.fraisInscription] },
                    DemandeInscription.associations.reponseInscription,
                    { association: DemandeInscription.associations.cours, include: [Cours.associations.classe] },
                    {
                        association: DemandeInscription.associations.coursChoisis, include: [
                            { association: DemandeInscriptionCours.associations.cours, include: [Cours.associations.classe] }
                        ]
                    },
                    DemandeInscription.associations.paiementsInscription,
                    DemandeInscription.associations.dossiersDemande, {
                        model: ParcoursChoisi, as: 'parcoursChoisis', include: [
                            { model: Parcours, as: 'parcours', include: [Parcours.associations.niveauEtude, Parcours.associations.cours, { model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude] }] },
                            { model: PrerequisParcoursChoisi, as: 'prerequisParcoursChoisis', include: [{ model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude] }] }
                        ]
                    }]
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = {
                where: { id: req.params.id },
                include: [
                    {
                        association: DemandeInscription.associations.utilisateur, include: [{
                            model: Apprenant, as: 'apprenant'
                        }]
                    },
                    { association: DemandeInscription.associations.session, include: [Session.associations.dossiersInscription, Session.associations.fraisInscription] },
                    DemandeInscription.associations.reponseInscription,
                    { association: DemandeInscription.associations.cours, include: [Cours.associations.classe] },
                    {
                        association: DemandeInscription.associations.coursChoisis, include: [
                            { association: DemandeInscriptionCours.associations.cours, include: [Cours.associations.classe] }
                        ]
                    },
                    DemandeInscription.associations.paiementsInscription,
                    DemandeInscription.associations.dossiersDemande, {
                        model: ParcoursChoisi, as: 'parcoursChoisis', include: [
                            { model: Parcours, as: 'parcours', include: [Parcours.associations.niveauEtude, Parcours.associations.cours, { model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude] }] },
                            { model: PrerequisParcoursChoisi, as: 'prerequisParcoursChoisis', include: [{ model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.parcours, PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude] }] }
                        ]
                    }]
            }
        }

        try {
            const demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);

            if (demandeInscription == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            return res.status(200).send(demandeInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDemandeInscriptionFromPaiement(req: Request, res: Response): Promise<Response> {
        // console.log(req.params)
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                where: { matricule: req.params.matricule, utilisateurId: (req as any).utilisateurId },
                include: [
                    {
                        association: DemandeInscription.associations.utilisateur, include: [{
                            model: Apprenant, as: 'apprenant'
                        }]
                    },]
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = {
                where: { matricule: req.params.matricule },
                include: [
                    {
                        association: DemandeInscription.associations.utilisateur, include: [{
                            model: Apprenant, as: 'apprenant'
                        }]
                    },
                ]
            }
        }

        try {
            const demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);

            if (demandeInscription == null)
                return res.status(404).json({ success: false, message: "Demande non trouvée" });

            return res.status(200).send(demandeInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getFichePaiement(req: Request, res: Response): Promise<Response | null> {
        return null
    }

    static async createDemandeInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { sessionId: req.body.sessionId, utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);
        if (demandeInscription == null) {
            let demandeInscription: DemandeInscription = new DemandeInscription();
            demandeInscription.dateDemande = req.body.dateDemande
            demandeInscription.sessionId = req.body.sessionId
            demandeInscription.matricule = IDGenerator.getInstance().generateInscriptionMatricule()
            demandeInscription.utilisateurId = (req as any).utilisateurId

            await demandeInscription.save()
                .then(async (demandeInscription) => {
                    EmailSender.getInstance().sendConfirmationDemandeInscription((req as any).utilisateurIdentifiant, (req as any).utilisateurEmail)
                    // .then(async () => {
                    //     return res.status(201).send({success: true});
                    // })
                    // .catch((error) => {
                    //     return res.status(400).json({ success: false, error: error });
                    // });
                    return res.status(201).send(demandeInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(400).json({ alreadySignUp: true });
        }

        return null
    }

    static async createDemandeInscriptionCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscriptionCours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { coursId: req.body.coursId, demandeInscriptionId: req.params.id } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let demandeInscriptionCours: DemandeInscriptionCours | null = await DemandeInscriptionCours.findOne(options);
        if (demandeInscriptionCours == null) {
            let demandeInscriptionCours: DemandeInscriptionCours = new DemandeInscriptionCours();
            demandeInscriptionCours.coursId = req.body.coursId
            demandeInscriptionCours.demandeInscriptionId = req.params.id
            demandeInscriptionCours.etat = EtatsCoursChoisi.REJETE

            await demandeInscriptionCours.save()
                .then(async () => {
                    return res.status(201).send({ success: true });
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(400).json({ alreadySignUp: true });
        }

        return null
    }

    static async updateDemandeInscriptionCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscriptionCours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { coursId: req.body.coursId, demandeInscriptionId: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let demandeInscriptionCours: DemandeInscriptionCours | null = await DemandeInscriptionCours.findOne(options);
        if (demandeInscriptionCours != null) {
            await demandeInscriptionCours.update({
                etat: req.body.etat ?? EtatsCoursChoisi.ENCOURS
            })
                .then(async () => {
                    return res.status(200).send(demandeInscriptionCours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: 'DemandeInscriptionCours non trouvé' });
        }

        return null
    }

    static async validerDemandeInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id }, include: [DemandeInscription.associations.utilisateur, DemandeInscription.associations.coursChoisis] }
        }

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);
        if (demandeInscription != null) {
            await demandeInscription.update({
                dateValidation: req.body.dateValidation ?? new Date(),
            })
                .then(async () => {
                    if (demandeInscription && demandeInscription.utilisateur) {
                        let cursusApprenant: CursusApprenant = new CursusApprenant()
                        cursusApprenant.externe = false
                        cursusApprenant.parcoursId = req.body.cursusApprenant.parcoursId
                        cursusApprenant.classeId = req.body.cursusApprenant.classeId
                        cursusApprenant.anneeAcademiqueId = req.body.cursusApprenant.anneeAcademiqueId
                        cursusApprenant.niveauEtudeId = req.body.cursusApprenant.niveauEtudeId
                        cursusApprenant.utilisateurId = demandeInscription.utilisateurId
                        cursusApprenant.demandeInscriptionId = demandeInscription.id

                        await cursusApprenant.save()
                            .then(async (res: CursusApprenant) => {
                                if(demandeInscription && demandeInscription.coursChoisis) {
                                    for (let index = 0; index < demandeInscription.coursChoisis.length; index++) {
                                        const coursChoisi: DemandeInscriptionCours = demandeInscription.coursChoisis[index];
                                        
                                        if(coursChoisi.etat == EtatsCoursChoisi.VALIDE) {
                                            let coursParticipant: CoursParticipant = new CoursParticipant()
                                            coursParticipant.coursId = coursChoisi.coursId
                                            coursParticipant.utilisateurId = demandeInscription.utilisateurId!
                                            coursParticipant.cursusApprenantId = res.id

                                            await coursParticipant.save()
                                        }
                                    }
                                }
                            })

                        EmailSender.getInstance().sendValidationDemandeInscription(demandeInscription.utilisateur.identifiant, demandeInscription.utilisateur.email)
                    }

                    return res.status(200).send(demandeInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Demande non trouvée" });
        }

        return null
    }

    static async deleteDemandeInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne({ where: { id: req.params.id } });
        if (demandeInscription) {
            await demandeInscription.destroy()
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
        let options: CountOptions<InferAttributes<DemandeInscription>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DemandeInscription.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}