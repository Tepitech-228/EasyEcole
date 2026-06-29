import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Pointage } from "../models/Pointage";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";

export default class PointageController {

    constructor() { }

    static async getAllPointages(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Pointage>> = {
            include: [
                Pointage.associations.utilisateur
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { utilisateurId: (req as any).utilisateurId }
        } else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options.where = { utilisateurId: (req as any).utilisateurId }
        }

        try {
            let pointages: Pointage[];
            pointages = await Pointage.findAll(options);
            return res.status(200).send(pointages);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getTodayPointage(req: Request, res: Response): Promise<Response> {
        const today = new Date().toISOString().split('T')[0]

        try {
            const pointage: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: (req as any).utilisateurId,
                    date: today
                }
            });

            return res.status(200).send(pointage);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async pointerArrivee(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT &&
            (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const time = now.toTimeString().split(' ')[0]

        try {
            const existing: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: (req as any).utilisateurId,
                    date: today
                }
            });

            if (existing) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Pointage déjà effectué aujourd'hui" });
            }

            let pointage: Pointage = new Pointage();
            pointage.date = today as any
            pointage.heureArrivee = time as any
            pointage.utilisateurId = (req as any).utilisateurId

            await pointage.save()
                .then((pointage) => {
                    return res.status(201).send(pointage);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }

        return null
    }

    static async pointerDepart(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT &&
            (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const time = now.toTimeString().split(' ')[0]

        try {
            const pointage: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: (req as any).utilisateurId,
                    date: today
                }
            });

            if (!pointage) {
                return res.status(404).json({ success: false, message: "Aucun pointage trouvé pour aujourd'hui" });
            }

            if (pointage.heureDepart) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Départ déjà pointé aujourd'hui" });
            }

            await pointage.update({ heureDepart: time as any })
                .then(async (pointage) => {
                    return res.status(200).send(pointage);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });

        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }

        return null
    }

    static async pointerArriveeByScan(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT &&
            (req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        const { userId } = req.body
        if (!userId) {
            return res.status(400).json({ success: false, message: "userId requis" });
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const time = now.toTimeString().split(' ')[0]

        try {
            const existing: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: userId,
                    date: today
                }
            });

            if (existing) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Pointage déjà effectué aujourd'hui pour cet utilisateur" });
            }

            const utilisateur = await Utilisateur.findByPk(userId)
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }

            let pointage: Pointage = new Pointage();
            pointage.date = today as any
            pointage.heureArrivee = time as any
            pointage.utilisateurId = userId

            await pointage.save()
                .then((pointage) => {
                    return res.status(201).send(pointage);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }

        return null
    }

    static async verifierStatutByQR(req: Request, res: Response): Promise<Response> {
        const { codeQR } = req.params

        try {
            let dossier: DossierEtudiant | null = null

            if (codeQR.startsWith('{')) {
                const qrData = JSON.parse(codeQR)
                dossier = await DossierEtudiant.findOne({
                    where: { matricule: qrData.matricule },
                    include: [{
                        association: DossierEtudiant.associations.echeances
                    }]
                })
            }
            else {
                dossier = await DossierEtudiant.findOne({
                    where: { matricule: codeQR },
                    include: [{
                        association: DossierEtudiant.associations.echeances
                    }]
                })
            }

            if (dossier == null) {
                return res.status(404).json({ statut: 'rouge', message: "Dossier étudiant non trouvé" });
            }

            if (dossier.statut == 'suspendu' || dossier.statut == 'archive') {
                return res.status(200).json({
                    statut: 'rouge',
                    message: `Dossier ${dossier.statut}`
                });
            }

            const now = new Date()
            const echeancesImpayees = (dossier.echeances || []).filter(
                e => (e.statut == 'impaye' || e.statut == 'en_retard') && new Date(e.dateLimite) <= now
            )

            if (echeancesImpayees.length > 0) {
                const premiereImpayee = echeancesImpayees[0]
                return res.status(200).json({
                    statut: 'rouge',
                    message: `Échéance mois ${premiereImpayee.numeroEcheance} ${premiereImpayee.statut == 'en_retard' ? 'en retard' : 'impayée'}`,
                    echeancesRestantes: echeancesImpayees
                });
            }

            return res.status(200).json({ statut: 'vert', message: 'Accès autorisé' });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }
}
