import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Session } from "../models/Session";
import { DemandeInscription } from "../models/DemandeInscription";
import { Apprenant } from "../../auth/models/Apprenant";
import { FraisInscription } from "../models/FraisInscription";
import { FraisScolarite, estModaliteScolarite } from "../models/FraisScolarite";
import { DossierInscription } from "../models/DossierInscription";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { DossierStorageService } from "../services/DossierStorageService";

export default class SessionController {

    constructor() { }

    static async getAllSessions(req: Request, res: Response): Promise<Response> {
        const where: any = {};

        if (req.query.anneeAcademiqueId) {
            where.anneeAcademiqueId = req.query.anneeAcademiqueId;
        }
        if (req.query.niveauEtudeId) {
            where.niveauEtudeId = req.query.niveauEtudeId;
        }

        const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;

        if (hasPagination) {
            const page: number = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit: number = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
            const offset: number = (page - 1) * limit;

            try {
                const { rows, count } = await Session.findAndCountAll({
                    where,
                    include: [Session.associations.niveauEtude, Session.associations.anneeAcademique],
                    limit,
                    offset,
                    order: [['createdAt', 'DESC']],
                    distinct: true,
                });

                return res.status(200).send({
                    data: rows,
                    pagination: {
                        page,
                        limit,
                        total: count,
                        totalPages: Math.ceil(count / limit),
                    },
                });
            } catch (error) {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            }
        }

        try {
            let sessions: Session[];
            sessions = await Session.findAll({
                where,
                include: [Session.associations.niveauEtude, Session.associations.anneeAcademique],
                order: [['createdAt', 'DESC']],
            });

            return res.status(200).send(sessions);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
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
                        // Une ligne supprimée logiquement conserve la contrainte d'unicité (titre, session) :
                        // on la met à jour et on la restaure au lieu d'échouer.
                        const existant = await FraisInscription.findOne({
                            where: { titre: fraisData.titre, sessionId: session.id },
                            paranoid: false,
                            transaction: t,
                        });
                        if (existant) {
                            await existant.update({
                                montant: fraisData.montant,
                                description: fraisData.description,
                                fraisDesCours: fraisData.fraisDesCours ?? true,
                            }, { transaction: t });
                            if (existant.deletedAt != null) {
                                await existant.restore({ transaction: t });
                            }
                        }
                        else {
                            await FraisInscription.create({
                                titre: fraisData.titre,
                                montant: fraisData.montant,
                                description: fraisData.description,
                                fraisDesCours: fraisData.fraisDesCours ?? true,
                                sessionId: session.id,
                            }, { transaction: t });
                        }
                    }
                }

                if (req.body.dossiers && Array.isArray(req.body.dossiers)) {
                    for (const dossierData of req.body.dossiers) {
                        const existant = await DossierInscription.findOne({
                            where: { titre: dossierData.titre, sessionId: session.id },
                            paranoid: false,
                            transaction: t,
                        });
                        if (existant) {
                            await existant.update({
                                description: dossierData.description,
                                tailleMax: dossierData.tailleMax,
                            }, { transaction: t });
                            if (existant.deletedAt != null) {
                                await existant.restore({ transaction: t });
                            }
                        }
                        else {
                            await DossierInscription.create({
                                titre: dossierData.titre,
                                description: dossierData.description,
                                tailleMax: dossierData.tailleMax,
                                sessionId: session.id,
                            }, { transaction: t });
                        }
                    }
                }

                // Frais de scolarité (upsert unique par session)
                if (req.body.fraisScolarite && typeof req.body.fraisScolarite === 'object') {
                    const { montant, modalite } = req.body.fraisScolarite;
                    if (montant !== undefined && montant !== null && Number(montant) > 0) {
                        const existing = await FraisScolarite.findOne({ where: { sessionId: session.id }, transaction: t });
                        if (existing) {
                            await existing.update({
                                montant: Number(montant),
                                modalite: estModaliteScolarite(modalite) ? modalite : existing.modalite,
                                actif: true,
                            }, { transaction: t });
                        } else {
                            await FraisScolarite.create({
                                sessionId: session.id,
                                montant: Number(montant),
                                modalite: estModaliteScolarite(modalite) ? modalite : '10x',
                                actif: true,
                            }, { transaction: t });
                        }
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

            // Créer le squelette de dossier pour l'année académique
            if (session?.anneeAcademique) {
                try {
                    DossierStorageService.creerSqueletteAnnee(session.anneeAcademique);
                } catch (dirError) {
                    console.error("Erreur création dossier année:", dirError);
                }
            }

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
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
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
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }
}