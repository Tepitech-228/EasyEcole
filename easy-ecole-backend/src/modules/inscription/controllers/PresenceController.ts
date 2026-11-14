import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Presence } from "../models/Presence";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { CoursParticipant } from "../models/CoursParticipant";
import { ListePresence } from "../models/ListePresence";
import { Enseignant } from "../../auth/models/Enseignant";
import { Cours } from "../models/Cours";
import { Parcours } from "../models/Parcours";
import { QrTokenService } from "../../../core/services/QrTokenService";
import { VerificationPaiementService, VerificationPaiementResult } from "../services/VerificationPaiementService";
import CahierCohorteService from "../services/CahierCohorteService";
import * as fs from "fs"
import * as path from "path"
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";

export default class PresenceController {

    constructor() { }

    private static async enseignantPeutGererListePresence(req: Request, listePresenceId: number | string): Promise<boolean> {
        const [enseignant, listePresence] = await Promise.all([
            Enseignant.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                attributes: ["id"],
            }),
            ListePresence.findByPk(listePresenceId),
        ]);
        if (!enseignant || !listePresence) return false;
        return CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), listePresence);
    }

    static async getAllPresences(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        const utilisateurId = (req as any).utilisateurId;
        const where: any = {};

        // Un étudiant ne voit que les présences de SES cours
        if (role === RolesUtilisateur.APPRENANT) {
            const coursParticipants = await CoursParticipant.findAll({ where: { utilisateurId }, attributes: ['coursId'] });
            if (coursParticipants.length === 0) {
                return res.status(200).send([]);
            }
            // Filtrer via listePresence
            const listesPresences = await ListePresence.findAll({
                where: { coursId: { [Op.in]: coursParticipants.map(cp => cp.coursId) } },
                attributes: ['id']
            });
            where.listePresenceId = { [Op.in]: listesPresences.map(lp => lp.id) };
        }
        // Un enseignant ne voit que les présences de SES cours
        else if (role === RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
            if (enseignant) {
                const cohortes = await CahierCohorteService.trouverCohortes(undefined, Number(enseignant.id));
                const listesPresences = await ListePresence.findAll({
                    where: {
                        [Op.or]: [
                            { enseignantId: enseignant.id },
                            ...CahierCohorteService.conditionsPourCohortes(cohortes),
                        ],
                    },
                    attributes: ['id']
                });
                where.listePresenceId = { [Op.in]: listesPresences.map(lp => lp.id) };
                where.auteurEnseignantId = enseignant.id;
            } else {
                where.auteurEnseignantId = -1;
            }
        }
        else if (role === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            if (!etablissementId) {
                return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
            }
            const coursDuSite = await Cours.findAll({
                where: { etablissementId },
                attributes: ["id"],
            });
            const listesPresences = await ListePresence.findAll({
                where: {
                    [Op.or]: [
                        { etablissementId },
                        { coursId: { [Op.in]: coursDuSite.map(cours => cours.id) } },
                    ],
                },
                attributes: ["id"],
            });
            where.listePresenceId = { [Op.in]: listesPresences.map(liste => liste.id) };
        }

        let options: FindOptions<InferAttributes<Presence>> = {
            where,
            include: [
                Presence.associations.presencesCoursParticipants
            ]
        }

        try {
            let presences: Presence[];
            presences = await Presence.findAll(options);

            return res.status(200).send(presences);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
    static async getPresence(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Presence>> = {}
        options = {
            where: { id: req.params.id },
            include: [
                Presence.associations.presencesCoursParticipants,
                {
                    association: Presence.associations.listePresence,
                    include: [
                        { association: ListePresence.associations.cours, include: [Cours.associations.enseignant] },
                        ListePresence.associations.parcours,
                    ],
                },
            ],
        }

        try {
            const presence: Presence | null = await Presence.findOne(options);

            if (presence == null)
                return res.status(404).json({ success: false, message: "Presence non trouvée" });

            const role = (req as any).utilisateurRole;
            const utilisateurId = (req as any).utilisateurId;

            // Un étudiant ne voit que les présences de SES cours
            if (role === RolesUtilisateur.APPRENANT) {
                const coursParticipants = await CoursParticipant.findAll({ where: { utilisateurId }, attributes: ['coursId'] });
                const coursIds = coursParticipants.map(cp => cp.coursId);
                const listePresence = (presence as any).listePresence;
                const cohorteOk = listePresence?.parcoursId && listePresence?.niveauEtudeId && listePresence?.etablissementId
                    ? (await CahierCohorteService.trouverCoursIds({
                        parcoursId: Number(listePresence.parcoursId),
                        niveauEtudeId: Number(listePresence.niveauEtudeId),
                        etablissementId: Number(listePresence.etablissementId),
                    })).some(coursId => coursIds.includes(coursId))
                    : false;
                if (!listePresence || (!coursIds.includes(listePresence.coursId) && !cohorteOk)) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette présence" });
                }
            }
            // Un enseignant ne voit que les présences de SES cours
            else if (role === RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
                const listePresence = (presence as any).listePresence;
                const autorise = enseignant && listePresence &&
                    await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), listePresence);
                if (!autorise || Number(presence.auteurEnseignantId) !== Number(enseignant.id)) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette présence" });
                }
            } else if (role === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                const listePresence = (presence as any).listePresence;
                const cours = listePresence?.coursId
                    ? await Cours.findOne({ where: { id: listePresence.coursId, etablissementId }, attributes: ["id"] })
                    : null;
                if (!etablissementId || (Number(listePresence?.etablissementId) !== etablissementId && !cours)) {
                    return res.status(403).json({ success: false, message: "Vous n'avez pas accès à cette présence" });
                }
            }

            return res.status(200).send(presence);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createPresence(req: Request, res: Response): Promise<Response | null> {

        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.INSTITUTION && role !== RolesUtilisateur.ENSEIGNANT && role !== RolesUtilisateur.SURVEILLANT) {
            return res.status(403).json({ success: false })
        }

        if (role === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            const listePresence = etablissementId
                ? await ListePresence.findByPk(req.body.listePresenceId)
                : null;
            const cours = listePresence?.coursId
                ? await Cours.findOne({ where: { id: listePresence.coursId, etablissementId }, attributes: ["id"] })
                : null;
            if (!listePresence || (
                Number(listePresence.etablissementId) !== etablissementId && !cours
            )) {
                return res.status(403).json({ success: false, message: "Cette liste de présence n'appartient pas à votre site" });
            }
        }

        let auteurEnseignantId: number | null = null;
        if (role === RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                attributes: ["id"],
            });
            const listePresence = await ListePresence.findByPk(req.body.listePresenceId);
            if (!enseignant || !listePresence ||
                !await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), listePresence)) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à renseigner cette liste de présence" });
            }
            auteurEnseignantId = Number(enseignant.id);
        }

        let presence: Presence | null = await Presence.findOne({
            where: {
                listePresenceId: req.body.listePresenceId,
                date: req.body.date,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
            },
        });

        if (presence != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let presence: Presence = new Presence();
            presence.date = req.body.date
            presence.heureDebut = req.body.heureDebut
            presence.heureFin = req.body.heureFin
            presence.listePresenceId = req.body.listePresenceId
            presence.auteurEnseignantId = auteurEnseignantId

            await presence.save()
                .then((presence) => {
                    return res.status(201).send(presence);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updatePresence(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Presence>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let presence: Presence | null = await Presence.findOne(options);
        if (presence != null) {
            if ((req as any).utilisateurRole === RolesUtilisateur.ENSEIGNANT) {
                const accesListeActuelle = await PresenceController.enseignantPeutGererListePresence(req, presence.listePresenceId);
                const accesNouvelleListe = await PresenceController.enseignantPeutGererListePresence(req, req.body.listePresenceId);
                const enseignant = await Enseignant.findOne({
                    where: { utilisateurId: (req as any).utilisateurId },
                    attributes: ["id"],
                });
                if (!enseignant || Number(presence.auteurEnseignantId) !== Number(enseignant.id) ||
                    !accesListeActuelle || !accesNouvelleListe) {
                    return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à modifier cette présence" });
                }
            }
            // if (presence.titre != req.body.titre && await Presence.findOne({ where: { titre: req.body.titre } }) != null) {
            //     return res.status(400).json({ success: false, alreadyExists: true });
            // }
            // else {
            await presence.update({
                date: req.body.date,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
                listePresenceId: req.body.listePresenceId,
            })
                .then(async (presence) => {
                    return res.status(200).send(presence);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
            // }
        }
        else {
            return res.status(404).json({ success: false, message: "Presence non trouvée" });
        }

        return null
    }

    static async deletePresence(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Presence>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let presence: Presence | null = await Presence.findOne({ where: { id: req.params.id } });
        if (presence) {
            if ((req as any).utilisateurRole === RolesUtilisateur.ENSEIGNANT &&
                (!await PresenceController.enseignantPeutGererListePresence(req, presence.listePresenceId) ||
                    Number(presence.auteurEnseignantId) !== Number((await Enseignant.findOne({
                        where: { utilisateurId: (req as any).utilisateurId },
                        attributes: ["id"],
                    }))?.id))) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à supprimer cette présence" });
            }
            await presence.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Presence supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Presence non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Presence>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await Presence.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }

    static async scanPresence(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        const { presenceId, userId, codeQR } = req.body

        let resolvedUserId: string | number | null = userId || null;

        if (codeQR && typeof codeQR === 'string') {
            const verified = QrTokenService.verifier(codeQR);
            if (verified) {
                resolvedUserId = verified.userId;
            }
        }

        if (!presenceId || !resolvedUserId) {
            return res.status(400).json({ success: false, message: "presenceId et userId (ou codeQR valide) requis" })
        }

        try {
            const presence = await Presence.findByPk(presenceId, {
                include: [{
                    association: Presence.associations.listePresence,
                    include: [ListePresence.associations.cours]
                }]
            })

            if (!presence || !presence.listePresence) {
                return res.status(404).json({ success: false, message: "Présence ou cahier non trouvé" })
            }

            const listePresence = presence.listePresence;
            if ((req as any).utilisateurRole === RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({
                    where: { utilisateurId: (req as any).utilisateurId },
                    attributes: ["id"],
                });
                if (!enseignant ||
                    Number(presence.auteurEnseignantId) !== Number(enseignant.id) ||
                    !await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignant.id), listePresence)) {
                    return res.status(403).json({ success: false, message: "Vous n'êtes pas autorisé à renseigner cette liste de présence" });
                }
            }

            const coursIds = await CahierCohorteService.trouverCoursIdsPourCahier(listePresence);
            if (coursIds.length === 0) {
                return res.status(404).json({ success: false, message: "Aucun cours n'est associé à cette liste de présence" });
            }

            const coursParticipant = await CoursParticipant.findOne({
                where: {
                    utilisateurId: resolvedUserId,
                    coursId: { [Op.in]: coursIds }
                }
            })

            if (!coursParticipant) {
                return res.status(404).json({ success: false, message: "Participant non inscrit à ce cours" })
            }

            const existing = await PresenceCoursParticipant.findOne({
                where: {
                    presenceId: presenceId,
                    coursParticipantId: coursParticipant.id
                }
            })

            if (existing) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Présence déjà marquée pour cet étudiant" })
            }

            const presenceCoursParticipant = new PresenceCoursParticipant()
            presenceCoursParticipant.presenceId = presenceId
            presenceCoursParticipant.coursParticipantId = coursParticipant.id

            await presenceCoursParticipant.save()

            // Vérification du paiement : ne bloque JAMAIS l'enregistrement de la présence
            let paiement: VerificationPaiementResult = {
                statut: 'vert',
                echeancesEnRetard: 0,
                echeancesRestantes: [],
                message: 'Accès autorisé',
                avertissementPaiement: null
            }
            try {
                paiement = await VerificationPaiementService.verifierPaiement(resolvedUserId)
            } catch (error) {
                // Ne pas bloquer : la présence est déjà enregistrée
            }

            return res.status(201).json({
                success: true,
                data: presenceCoursParticipant,
                paiement: {
                    statut: paiement.statut,
                    echeancesEnRetard: paiement.echeancesEnRetard,
                    message: paiement.message,
                    avertissementPaiement: paiement.avertissementPaiement
                }
            })
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async signPresence(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false, message: "Seul un enseignant peut signer" })
        }

        const { signature } = req.body
        if (!signature) {
            return res.status(400).json({ success: false, message: "Signature requise" })
        }

        try {
            const presence = await Presence.findByPk(req.params.id, {
                include: [{
                    association: Presence.associations.listePresence,
                    include: [
                        {
                            association: ListePresence.associations.cours,
                            include: [Cours.associations.enseignant],
                        },
                        ListePresence.associations.parcours,
                    ],
                }]
            })

            if (!presence) {
                return res.status(404).json({ success: false, message: "Présence non trouvée" })
            }

            const listePresence = presence.listePresence as any;
            const enseignantProfil = await Enseignant.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                attributes: ["id"],
            });
            const autorise = enseignantProfil && listePresence &&
                Number(presence.auteurEnseignantId) === Number(enseignantProfil.id) &&
                await CahierCohorteService.enseignantAssocieAuCahier(Number(enseignantProfil.id), listePresence);
            if (!autorise) {
                return res.status(403).json({ success: false, message: "Vous n'êtes pas l'enseignant de ce cours" })
            }

            if (presence.signature) {
                return res.status(400).json({ success: false, message: "Cette présence est déjà signée" })
            }

            const base64Data = signature.replace(/^data:image\/png;base64,/, "")
            const dir = "public/inscription/presences/signatures/"
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
            const fileName = `${req.params.id}.png`
            const filePath = path.join(dir, fileName)
            fs.writeFileSync(filePath, base64Data, "base64")

            presence.signature = fileName
            presence.signedAt = new Date()
            await presence.save()

            return res.status(200).send(presence)
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}