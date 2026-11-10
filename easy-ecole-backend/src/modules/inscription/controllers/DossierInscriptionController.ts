import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ComiteVote } from "../models/ComiteVote";
import { DossierInscription, normaliserEtapeDossier, normaliserProfilRequis } from "../models/DossierInscription";
import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier";
import { DemandeInscription } from "../models/DemandeInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { EtudiantUploadStorageService } from "../services/EtudiantUploadStorageService";

const getSiteScope = (req: Request): number | null | undefined => {
    if (req.utilisateurRole === RolesUtilisateur.ADMIN) return null;
    const etablissementId = Number(req.etablissementId);
    return Number.isSafeInteger(etablissementId) && etablissementId > 0 ? etablissementId : undefined;
};

/** '' / undefined / non numérique -> null (colonne DOUBLE nullable). */
const normaliserTailleMax = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

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
        const siteScope = getSiteScope(req);
        if (siteScope === undefined) {
            return res.status(403).json({ success: false, message: "Aucun site actif sélectionné" });
        }

        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        options = {
            where: { id: req.params.id },
            ...(siteScope !== null ? {
                include: [{
                    association: DossierInscription.associations.session,
                    where: { etablissementId: siteScope },
                    attributes: [],
                    required: true
                }]
            } : {})
        }

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
        const role = req.utilisateurRole;
        if (role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const options: FindOptions<InferAttributes<DossierInscription>> = {
            where: { titre: req.body.titre, sessionId: req.body.sessionId }
        };
        let dossierInscription: DossierInscription | null = await DossierInscription.findOne(options);
        if (dossierInscription == null) {
            let dossierInscription: DossierInscription = new DossierInscription();
            dossierInscription.titre = req.body.titre
            dossierInscription.description = req.body.description
            dossierInscription.profilRequis = normaliserProfilRequis(req.body.profilRequis, req.body.titre)
            dossierInscription.etape = normaliserEtapeDossier(req.body.etape, req.body.titre)
            dossierInscription.tailleMax = normaliserTailleMax(req.body.tailleMax) as any
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

        const nettoyerFichiersUpload = (): void => {
            for (const fichier of fichiers) {
                try { EtudiantUploadStorageService.removeTemporaryUpload(fichier); }
                catch (error) { console.error('[uploadDossierInscription] Échec du nettoyage du téléversement:', error); }
            }
        };
        const nouveauxFichiers: string[] = [];
        const { demandeId, dossierId } = req.body;
        if (!demandeId || !dossierId) {
            nettoyerFichiersUpload();
            return res.status(400).json({ success: false, message: 'demandeId et dossierId sont requis' });
        }
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

            const utilisateur = await Utilisateur.findByPk(req.utilisateurId, {
                attributes: ['id', 'nom', 'prenoms'],
            });
            if (!utilisateur) {
                nettoyerFichiersUpload();
                return res.status(404).json({ success: false, message: "Compte étudiant introuvable" });
            }

            const statutPipeline = demandeExiste.statutPipeline as string
            const correctionEnCours = ['correction_demandee', 'rejete'].includes(statutPipeline);

            // Dossier en correction comité : la réintégration au comité
            // ('transmis_comite') n'a lieu que si des pièces sont réellement
            // signalées — jamais pour un rejet Audit (qui ne passe QUE par le
            // bordereau via BordereauController, sans finalisation ici).
            const correctionComiteEnCours = correctionEnCours && (await DemandeInscriptionDossier.count({
                where: { demandeId, correctionDemandee: true }
            })) > 0;

            if (correctionEnCours) {
                const pieceAReposer = await DemandeInscriptionDossier.findOne({ where: { demandeId, dossierId } });
                if (statutPipeline === 'correction_demandee') {
                    // Correction comité (souple) : uniquement les pièces signalées.
                    if (!pieceAReposer?.correctionDemandee) {
                        nettoyerFichiersUpload();
                        return res.status(403).json({ success: false, message: "Cette pièce n'a pas été demandée en correction" });
                    }
                } else {
                    // statut 'rejete' :
                    //  - rejet comité     → seules les pièces signalées (correctionDemandee) ;
                    //  - rejet Audit      → seul le bordereau (pièce rattachée à la demade,
                    //    identifiée par son intitulé) est re-téléversable via ce contrôleur.
                    const requis = pieceAReposer
                        ? await DossierInscription.findByPk(pieceAReposer.dossierId)
                        : null;
                    const estBordereauDoc = !!requis && /bordereau/i.test(requis.titre || '');
                    if (!pieceAReposer?.correctionDemandee && !estBordereauDoc) {
                        nettoyerFichiersUpload();
                        return res.status(403).json({ success: false, message: "Cette pièce n'a pas été demandée en correction" });
                    }
                }
            }

            const dossierRequis = await DossierInscription.findByPk(dossierId)
            if (!dossierRequis
                || (Number(dossierRequis.sessionId) !== Number(demandeExiste.sessionId)
                    && !/bordereau/i.test(dossierRequis.titre || ''))) {
                nettoyerFichiersUpload();
                return res.status(400).json({
                    success: false,
                    message: "Cette pi��ce ne correspond pas aux documents requis pour cette inscription"
                });
            }

            const etapeDossier = (dossierRequis as any).etape || 'premiere'
            const profilRequis = (dossierRequis as any).profilRequis || 'tous'
            if (etapeDossier === 'complementaire'
                && !['saisie_validee', 'correction_demandee', 'rejete'].includes(statutPipeline)) {
                nettoyerFichiersUpload();
                return res.status(403).json({
                    success: false,
                    message: "Les documents complémentaires seront disponibles après la validation du paiement.",
                });
            }
            if (profilRequis !== 'tous') {
                const apprenant = await Apprenant.findOne({
                    where: { utilisateurId: req.utilisateurId },
                    attributes: ['statutEtudiant'],
                })
                const profilEtudiant = apprenant?.statutEtudiant === 'ancien' ? 'ancien' : 'nouveau'
                if (profilRequis !== profilEtudiant) {
                    nettoyerFichiersUpload();
                    return res.status(403).json({
                        success: false,
                        message: "Cette pièce n'est pas requise pour votre profil.",
                    });
                }
            }
            if (etapeDossier === 'premiere'
                && ['saisie_validee', 'transmis_comite', 'valide'].includes(statutPipeline)
                && !correctionEnCours) {
                nettoyerFichiersUpload();
                return res.status(403).json({
                    success: false,
                    message: "Cette pièce ne peut plus être modifiée à cette étape.",
                });
            }

            const treeFolders = await EtudiantUploadStorageService.resolveTreeFolders({
                sessionId: demandeExiste.sessionId,
                etablissementId: demandeExiste.etablissementId,
                demandeId,
                utilisateurId: demandeExiste.utilisateurId,
                typeDemande: demandeExiste.typeDemande,
            });
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
            const estBordereau = /bordereau/i.test(dossierRequis.titre || '');
            for (const fichier of fichiers) {
                nouveauxFichiers.push(EtudiantUploadStorageService.store(fichier, {
                    id: Number(utilisateur.id),
                    nom: utilisateur.nom,
                    prenoms: utilisateur.prenoms,
                    matricule: demandeExiste.matriculeEtudiant || demandeExiste.matricule,
                }, treeFolders, estBordereau ? 'Bordereaux' : 'Dossiers', [
                    demandeExiste.typeDemande === 'reinscription' ? 'REINSCRIPTION' : 'INSCRIPTION',
                    `DEMANDE_${demandeId}`,
                    ...(estBordereau ? [] : ['PIECES']),
                    `${dossierId}_${dossierRequis.titre}`,
                ]));
            }

            for (const ancien of anciens) {
                await ancien.destroy({ force: true });
                const ancienChemin = ancien.nomFichier?.replace(/\\/g, '/');
                if (!ancienChemin?.startsWith('public/dossiers/')) {
                    try {
                        EtudiantUploadStorageService.removeStoredFile(
                            ancien.nomFichier,
                            'public/inscription/dossiers',
                        );
                    } catch (error) {
                        console.error('[uploadDossierInscription] Échec de suppression de l’ancienne pièce:', error);
                    }
                }
            }

            for (let index = 0; index < fichiers.length; index += 1) {
                await DemandeInscriptionDossier.create({
                    nomFichier: nouveauxFichiers[index],
                    dossierId,
                    demandeId,
                    correctionDemandee: false,
                });
            }

            if (correctionComiteEnCours) {
                const piecesRestantes = await DemandeInscriptionDossier.count({
                    where: { demandeId, correctionDemandee: true }
                });
                if (piecesRestantes === 0) {
                    // Toutes les pièces signalées ont été re-téléversées : le dossier
                    // repart au comité (les votes précédents sont remis à zéro).
                    await ComiteVote.destroy({ where: { demandeInscriptionId: demandeId } });
                    await demandeExiste.update({
                        statutPipeline: 'transmis_comite',
                        motifPipeline: null,
                        soumissionComite: true,
                    });
                }
            }

            const demande = await DemandeInscription.findByPk(demandeId, { include: includes });
            return res.status(201).json(demande);
        } catch (error) {
            // Nettoyage des fichiers déjà écrits par multer pour ne pas laisser d'orphelins
            nettoyerFichiersUpload();
            for (const fichier of nouveauxFichiers) {
                try { EtudiantUploadStorageService.removeStoredFile(fichier); }
                catch (cleanupError) {
                    console.error('[uploadDossierInscription] Échec du nettoyage de la nouvelle pièce:', cleanupError);
                }
            }
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
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
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
                    tailleMax: normaliserTailleMax(req.body.tailleMax) as any,
                    description: req.body.description,
                    profilRequis: normaliserProfilRequis(req.body.profilRequis, req.body.titre),
                    etape: normaliserEtapeDossier(req.body.etape, req.body.titre),
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
        const role = req.utilisateurRole;
        if (role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.ADMIN) {
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