import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ComiteVote } from "../models/ComiteVote";
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
        const nettoyerFichiersUpload = (): void => {
            for (const fichier of fichiers) {
                const fichierEcrit = path.join(UPLOAD_DIR, fichier.filename);
                if (fs.existsSync(fichierEcrit)) {
                    try { fs.unlinkSync(fichierEcrit); } catch (_) { /* nettoyage best-effort */ }
                }
            }
        };
        if (req.utilisateurRole !== RolesUtilisateur.APPRENANT) {
            nettoyerFichiersUpload();
            return res.status(403).json({ success: false, message: "L'envoi des pièces est réservé aux apprenants" });
        }
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
                nettoyerFichiersUpload();
                return res.status(404).json({ success: false, message: "Demande d'inscription introuvable" });
            }

            if (Number(demandeExiste.utilisateurId) !== Number(req.utilisateurId)) {
                nettoyerFichiersUpload();
                return res.status(403).json({ success: false, message: "Cette demande ne vous appartient pas" });
            }

            const correctionEnCours = demandeExiste.statutPipeline === 'correction_demandee';
            if (correctionEnCours) {
                const pieceAReposer = await DemandeInscriptionDossier.findOne({ where: { demandeId, dossierId } });
                if (!pieceAReposer?.correctionDemandee) {
                    nettoyerFichiersUpload();
                    return res.status(403).json({ success: false, message: "Cette pièce n'a pas été demandée en correction" });
                }
            }

            // Remplacement propre : on supprime les anciens fichiers de CE dossier
            // pour éviter les doublons qui cassent le comptage front/back.
            //
            // Suppression PHYSIQUE et CIBLÉE sur la paire (demandeId, dossierId).
            // Le modèle est `paranoid` : un destroy() classique ne ferait qu'un soft
            // delete, la ligne physique resterait, et la contrainte UNIQUE
            // (demandeId, dossierId) rejeterait ensuite le nouvel envoi.
            //
            // ⚠️ Le `where` DOIT rester cette paire. Cette table n'a pas d'identifiant
            // de ligne ; une suppression non ciblée viderait toute la table.
            const anciens = await DemandeInscriptionDossier.findAll({
                where: { demandeId, dossierId },
                paranoid: false
            });
            for (const ancien of anciens) {
                await ancien.destroy({ force: true });
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
                    correctionDemandee: false,
                });
            }

            if (correctionEnCours) {
                const piecesRestantes = await DemandeInscriptionDossier.count({
                    where: { demandeId, correctionDemandee: true }
                });
                if (piecesRestantes === 0) {
                    await ComiteVote.destroy({ where: { demandeInscriptionId: demandeId } });
                    await demandeExiste.update({ statutPipeline: 'transmis_comite', motifPipeline: null });
                }
            }

            const demande = await DemandeInscription.findByPk(demandeId, { include: includes });
            return res.status(201).json(demande);
        } catch (error) {
            // Nettoyage des fichiers déjà écrits par multer pour ne pas laisser d'orphelins
            nettoyerFichiersUpload();
            console.error('[uploadDossierInscription]', error);

            // Distinguer un refus de format (actionnable par l'étudiant) d'une panne
            // technique. Un refus renvoyé en 500 conduisait l'utilisateur à réessayer
            // indéfiniment, alors qu'aucune tentative ne pouvait aboutir.
            const errMsg = error instanceof Error ? error.message : String(error);
            if (errMsg.includes('LIMIT_UNEXPECTED_FILE')
                || errMsg.includes('LIMIT_FILE_SIZE')
                || errMsg.includes('format')) {
                return res.status(400).json({
                    success: false,
                    message: errMsg.includes('LIMIT_FILE_SIZE')
                        ? 'Fichier trop volumineux : la taille maximale est de 20 Mo.'
                        : 'Format non accepté. Formats autorisés : PDF, JPG, JPEG, PNG.'
                });
            }

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