import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { Enseignant } from "../../auth/models/Enseignant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { CoursParticipant } from "../models/CoursParticipant";
import { ListePresence } from "../models/ListePresence";
import { Presence } from "../models/Presence";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";

export default class CoursController {

    constructor() { }

    static async getAllCours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Cours>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            if (req.query.parcoursId) {
                options = {
                    include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ],
                    where: { parcoursId: req.query.parcoursId as string }
                }
            }
            else {
                options = {
                    include: [
                        Cours.associations.classe,
                        { association: Cours.associations.enseignant, include: [Enseignant.associations.utilisateur] },
                        { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                    ],
                }
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = {
                include: [
                    Cours.associations.classe,
                    { association: Cours.associations.enseignant, where: { utilisateurId: (req as any).utilisateurId } },
                    { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                ],
            }
        }
        else {
            return res.status(403).json({ success: false })
        }

        try {
            let cours: Cours[];
            cours = await Cours.findAll(options);

            return res.status(200).send(cours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        options = { include: [Cours.associations.classe], where: { id: req.params.id } }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT || (req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = {
                where: { id: req.params.id },
                include: [
                    Cours.associations.classe,
                    Cours.associations.chapitresCours,
                    Cours.associations.seances,
                    Cours.associations.enseignant,
                    { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                ],
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = {
                where: { id: req.params.id },
                include: [
                    Cours.associations.classe,
                    Cours.associations.chapitresCours,
                    Cours.associations.seances,
                    { association: Cours.associations.enseignant, where: { utilisateurId: (req as any).utilisateurId } },
                    { association: Cours.associations.parcours, include: [Parcours.associations.niveauEtude] }
                ],
            }
        }
        else {
            return res.status(403).json({ success: false })
        }

        try {
            const cours: Cours | null = await Cours.findOne(options);

            if (cours == null)
                return res.status(404).json({ success: false, message: "Cours non trouvé" });

            return res.status(200).send(cours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCoursParticipants(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<CoursParticipant>> = {}

        // if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
        //     return res.status(403).json({ success: false })
        // }
        // else {
        options = {
            where: { coursId: req.params.id },
            include: [
                { 
                    association: CoursParticipant.associations.utilisateur,
                    attributes: ['nom', 'prenoms', 'identifiant', 'email', 'contact', 'photoDeProfil'],
                    include: [Utilisateur.associations.apprenant],
                    required: true,
                },
                CoursParticipant.associations.cours,
                CoursParticipant.associations.cursusApprenant
            ]
        }
        // options = {
        //     attributes: [],
        //     where: { id: req.params.id },
        //     include: [
        //         {
        //             association: Cours.associations.demandesInscription,
        //             where: { dateValidation: { [Op.not]: null, } },
        //             required: true,
        //             include: [
        //                 { association: DemandeInscription.associations.cursusApprenant, required: true, },
        //                 { association: DemandeInscription.associations.utilisateur, required: true, }
        //             ]
        //         }
        //     ]
        // }
        // }

        try {
            let coursParticipants: CoursParticipant[];
            coursParticipants = await CoursParticipant.findAll(options);

            return res.status(200).send(coursParticipants);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createCours(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let cours: Cours | null = await Cours.findOne({ where: { code: req.body.code, parcoursId: req.body.parcoursId } });

        if (cours != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let cours: Cours = new Cours();
            cours.code = req.body.code
            cours.intitule = req.body.intitule
            cours.credit = req.body.credit
            cours.estObligatoire = req.body.estObligatoire
            cours.description = req.body.description
            cours.semestre = req.body.semestre
            cours.classeId = req.body.classeId
            cours.parcoursId = req.body.parcoursId

            await cours.save()
                .then((cours) => {
                    return res.status(201).send(cours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        return null
    }

    static async updateCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let cours: Cours | null = await Cours.findOne(options);
        if (cours != null) {

            if (cours.code != req.body.code && await Cours.findOne({ where: { code: req.body.code, parcoursId: req.body.parcoursId } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {

                await cours.update({
                    code: req.body.code,
                    intitule: req.body.intitule,
                    credit: req.body.credit,
                    estObligatoire: req.body.estObligatoire,
                    description: req.body.description,
                    semestre: req.body.semestre,
                    classeId: req.body.classeId,
                    parcoursId: req.body.parcoursId,
                })
                    .then(async (cours) => {
                        return res.status(200).send(cours);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Cours non trouvé" });
        }

        return null
    }

    static async assignerCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let cours: Cours | null = await Cours.findOne(options);
        if (cours != null) {
            await cours.update({
                enseignantId: req.body.enseignantId,
            })
                .then(async (cours) => {
                    return res.status(200).send(cours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Cours non trouvé" });
        }

        return null
    }

    static async revoquerAssignationCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let cours: Cours | null = await Cours.findOne(options);
        if (cours != null) {
            await cours.update({
                enseignantId: null,
            })
                .then(async (cours) => {
                    return res.status(200).send(cours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Cours non trouvé" });
        }

        return null
    }

    static async deleteCours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Cours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let cours: Cours | null = await Cours.findOne({ where: { id: req.params.id } });
        if (cours) {
            await cours.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Cours supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Cours non trouvé" });
        }

        return null
    }

    static async getMesPresences(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        try {
            const coursList = await Cours.findAll({
                include: [{
                    association: Cours.associations.enseignant,
                    where: { utilisateurId: (req as any).utilisateurId },
                    required: true
                }, {
                    association: 'listesPresences' as any,
                    include: [{
                        association: 'presences' as any,
                        include: [{
                            association: 'presencesCoursParticipants' as any
                        }]
                    }]
                }, {
                    association: Cours.associations.classe
                }, {
                    association: Cours.associations.parcours,
                    include: [Parcours.associations.niveauEtude]
                }]
            })

            return res.status(200).send(coursList)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Cours>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Cours.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}