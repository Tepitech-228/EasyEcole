import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Session } from "../models/Session";
import { DemandeInscription } from "../models/DemandeInscription";
import { Apprenant } from "../../auth/models/Apprenant";
import { FraisInscription } from "../models/FraisInscription";
import { DossierInscription } from "../models/DossierInscription";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

export default class SessionController {

    constructor() { }

    static async getAllSessions(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Session>> = {include: [Session.associations.niveauEtude, Session.associations.anneeAcademique]}

        try {
            let sessions: Session[];
            sessions = await Session.findAll(options);

            return res.status(200).send(sessions);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getSession(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Session>> = {}
        options = { where: { id: req.params.id }, include: [Session.associations.niveauEtude, Session.associations.anneeAcademique, Session.associations.fraisInscription, Session.associations.dossiersInscription, { association: Session.associations.demandesInscription, include: [{ association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeInscription.associations.reponseInscription, DemandeInscription.associations.parcoursChoisis] }]}

        try {
            const session: Session | null = await Session.findOne(options);

            if (session == null)
                return res.status(404).json({ success: false, message: "Session non trouvée" });

            return res.status(200).send(session);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createSession(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        const sequelize = DatabaseConnection.getInstance().sequelize;

        try {
            const result = await sequelize.transaction(async (t) => {
                const session = await Session.create({
                    dateDebut: req.body.dateDebut,
                    dateFin: req.body.dateFin,
                    anneeAcademiqueId: req.body.anneeAcademiqueId,
                    niveauEtudeId: req.body.niveauEtudeId,
                    description: req.body.description,
                }, { transaction: t });

                if (req.body.frais && Array.isArray(req.body.frais)) {
                    for (const fraisData of req.body.frais) {
                        await FraisInscription.create({
                            titre: fraisData.titre,
                            montant: fraisData.montant,
                            description: fraisData.description,
                            fraisDesCours: fraisData.fraisDesCours ?? true,
                            sessionId: session.id,
                        }, { transaction: t });
                    }
                }

                if (req.body.dossiers && Array.isArray(req.body.dossiers)) {
                    for (const dossierData of req.body.dossiers) {
                        await DossierInscription.create({
                            titre: dossierData.titre,
                            description: dossierData.description,
                            tailleMax: dossierData.tailleMax,
                            sessionId: session.id,
                        }, { transaction: t });
                    }
                }

                return session;
            });

            const session = await Session.findByPk(result.id, {
                include: [
                    Session.associations.niveauEtude,
                    Session.associations.anneeAcademique,
                    Session.associations.fraisInscription,
                    Session.associations.dossiersInscription,
                ]
            });

            return res.status(201).send(session);
        } catch (error) {
            return res.status(400).json({ success: false, error: error });
        }
    }

    static async updateSession(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Session>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        //TODO:: Vérifier s'il n'y a pas d'inscription en cours pour cette session

        let session: Session | null = await Session.findOne(options);
        if (session != null) {

            await session.update({
                dateDebut: req.body.dateDebut,
                dateFin: req.body.dateFin,
                anneeAcademiqueId: req.body.anneeAcademiqueId,
                niveauEtudeId: req.body.niveauEtudeId,
            })
                .then(async (session) => {
                    return res.status(200).send(session);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Session non trouvée" });
        }

        return null
    }

    static async deleteSession(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Session>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let session: Session | null = await Session.findOne({ where: { id: req.params.id } });
        if (session) {
            await session.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Session supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Session non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Session>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Session.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}