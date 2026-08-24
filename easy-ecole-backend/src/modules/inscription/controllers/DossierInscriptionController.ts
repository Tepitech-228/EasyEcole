import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DossierInscription } from "../models/DossierInscription";
import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier";
import { DemandeInscription } from "../models/DemandeInscription";

export default class DossierInscriptionController {

    constructor() { }

    static async getAllDossiersInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}

        try {
            let dossiersInscription: DossierInscription[];
            dossiersInscription = await DossierInscription.findAll(options);

            return res.status(200).send(dossiersInscription);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getDossierInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        options = { where: { id: req.params.id } }

        try {
            const dossierInscription: DossierInscription | null = await DossierInscription.findOne(options);

            if (dossierInscription == null)
                return res.status(404).json({ success: false, message: "Dossier non trouvée" });

            return res.status(200).send(dossierInscription);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createDossierInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { titre: req.body.titre, sessionId: req.body.sessionId } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let dossierInscription: DossierInscription | null = await DossierInscription.findOne(options);
        if (dossierInscription == null) {
            let dossierInscription: DossierInscription = new DossierInscription();
            dossierInscription.titre = req.body.titre
            dossierInscription.description = req.body.description
            dossierInscription.tailleMax = req.body.tailleMax
            dossierInscription.sessionId = req.body.sessionId

            await dossierInscription.save()
                .then(async (dossierInscription) => {
                    return res.status(201).send(dossierInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(400).json({ alreadyExists: true });
        }

        return null
    }

    static async uploadDossierInscription(req: Request, res: Response): Promise<Response | null> {
        let fichiers: Express.Multer.File[] = (req as any).files || [];
        if (fichiers.length === 0) {
            return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
        }

        const { demandeId, dossierId } = req.body;
        if (!demandeId || !dossierId) {
            return res.status(400).json({ success: false, message: 'demandeId et dossierId sont requis' });
        }

        const UPLOAD_DIR = path.resolve('public', 'inscription', 'dossiers');
        const includes = [
            { association: DemandeInscription.associations.cours },
            { association: DemandeInscription.associations.coursChoisis },
            { association: DemandeInscription.associations.session },
            { association: DemandeInscription.associations.etapeInscription },
            { association: DemandeInscription.associations.dossiersDemande },
            { association: DemandeInscription.associations.paiementsInscription },
            { association: DemandeInscription.associations.reponseInscription },
        ];

        try {
            const demandeExiste = await DemandeInscription.findByPk(demandeId);
            if (demandeExiste == null) {
                return res.status(404).json({ success: false, message: "Demande d'inscription introuvable" });
            }

            // Remplacement propre : on supprime les anciens fichiers de CE dossier
            // pour éviter les doublons qui cassent le comptage front/back.
            const anciens = await DemandeInscriptionDossier.findAll({ where: { demandeId, dossierId } });
            for (const ancien of anciens) {
                await ancien.destroy();
                const oldPath = path.join(UPLOAD_DIR, ancien.nomFichier);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (_) { /* fichier déjà supprimé */ }
                }
            }

            for (const fichier of fichiers) {
                await DemandeInscriptionDossier.create({
                    nomFichier: fichier.filename,
                    dossierId,
                    demandeId,
                });
            }

            const demande = await DemandeInscription.findByPk(demandeId, { include: includes });
            return res.status(201).json(demande);
        } catch (error) {
            // Nettoyage des fichiers déjà écrits par multer pour ne pas laisser d'orphelins
            for (const fichier of fichiers) {
                const writtenPath = path.join(UPLOAD_DIR, fichier.filename);
                if (fs.existsSync(writtenPath)) {
                    try { fs.unlinkSync(writtenPath); } catch (unlinkErr) {
                        // Nettoyage best-effort : l'erreur principale prime, mais un fichier
                        // orphelin non supprimable doit rester traçable.
                        console.warn(`[DOSSIER][upload] fichier orphelin non supprimé: ${writtenPath}`,
                            unlinkErr instanceof Error ? unlinkErr.message : unlinkErr);
                    }
                }
            }
            console.error('[uploadDossierInscription]', error);
            return res.status(500).json({ success: false, message: "Erreur lors du téléversement des documents" });
        }
    }

    static async updateDossierInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let dossierInscription: DossierInscription | null = await DossierInscription.findOne(options);
        if (dossierInscription != null) {

            if (dossierInscription.titre != req.body.titre && await DossierInscription.findOne({ where: { titre: req.body.titre, sessionId: req.body.sessionId } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {

                await dossierInscription.update({
                    titre: req.body.titre,
                    tailleMax: req.body.tailleMax,
                    description: req.body.description,
                })
                    .then(async (dossierInscription) => {
                        return res.status(200).send(dossierInscription);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Dossier d'inscription non trouvé" });
        }

        return null
    }

    static async deleteDossierInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let dossierInscription: DossierInscription | null = await DossierInscription.findOne({ where: { id: req.params.id } });
        if (dossierInscription) {
            await dossierInscription.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Dossier supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Dossier non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<DossierInscription>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DossierInscription.count(options)
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