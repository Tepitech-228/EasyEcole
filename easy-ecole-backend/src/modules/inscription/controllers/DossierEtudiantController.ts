import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { Echeance } from "../models/Echeance";
import { DemandeInscription } from "../models/DemandeInscription";
import { Session } from "../models/Session";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { CoursParticipant } from "../models/CoursParticipant";

export default class DossierEtudiantController {

    constructor() { }

    static async getAllDossiers(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DossierEtudiant>> = {
            include: [
                { association: DossierEtudiant.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
                DossierEtudiant.associations.echeances,
                { association: DossierEtudiant.associations.coursParticipants, include: [CoursParticipant.associations.cours] }
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { utilisateurId: (req as any).utilisateurId }
        }

        if (req.query.anneeAcademiqueId || req.query.niveauEtudeId || req.query.parcoursId) {
            const demandeWhere: any = { include: [] as any[] }
            const sessionWhere: any = {}

            if (req.query.anneeAcademiqueId) sessionWhere.anneeAcademiqueId = req.query.anneeAcademiqueId
            if (req.query.niveauEtudeId) sessionWhere.niveauEtudeId = req.query.niveauEtudeId

            if (Object.keys(sessionWhere).length > 0) {
                demandeWhere.include.push({
                    association: DemandeInscription.associations.session,
                    where: sessionWhere
                })
            }

            if (req.query.parcoursId) {
                demandeWhere.include.push({
                    association: DemandeInscription.associations.parcoursChoisis,
                    where: { choixFinal: true, parcoursId: req.query.parcoursId }
                })
            }

            const matchingDemandes = await DemandeInscription.findAll(demandeWhere)
            const utilisateurIds = [...new Set(matchingDemandes.map(d => d.utilisateurId))]

            if (utilisateurIds.length === 0) {
                return res.status(200).send([])
            }

            options.where = { ...options.where, utilisateurId: utilisateurIds as any }
        }

        try {
            let dossiers: DossierEtudiant[];
            dossiers = await DossierEtudiant.findAll(options);

            return res.status(200).send(dossiers);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDossier(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DossierEtudiant>> = {
            where: { id: req.params.id },
            include: [
                { association: DossierEtudiant.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
                DossierEtudiant.associations.echeances,
                { association: DossierEtudiant.associations.coursParticipants, include: [CoursParticipant.associations.cours] }
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { ...options.where, utilisateurId: (req as any).utilisateurId }
        }

        try {
            const dossier: DossierEtudiant | null = await DossierEtudiant.findOne(options);

            if (dossier == null)
                return res.status(404).json({ success: false, message: "Dossier étudiant non trouvé" });

            return res.status(200).send(dossier);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getMonDossier(req: Request, res: Response): Promise<Response> {
        try {
            const dossier: DossierEtudiant | null = await DossierEtudiant.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                include: [
                    { association: DossierEtudiant.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
                    DossierEtudiant.associations.echeances,
                    { association: DossierEtudiant.associations.coursParticipants, include: [CoursParticipant.associations.cours] }
                ]
            });

            if (dossier == null)
                return res.status(404).json({ success: false, message: "Dossier étudiant non trouvé" });

            return res.status(200).send(dossier);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async genererDossier(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const utilisateur = await Utilisateur.findByPk(req.body.utilisateurId)
        if (utilisateur == null) {
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }

        const existing = await DossierEtudiant.findOne({ where: { utilisateurId: req.body.utilisateurId } })
        if (existing != null) {
            return res.status(400).json({ success: false, alreadyExists: true, message: "Dossier déjà existant pour cet étudiant" });
        }

        const matricule = IDGenerator.getInstance().generateInscriptionMatricule()
        const codeQR = JSON.stringify({ matricule, utilisateurId: req.body.utilisateurId })

        let dossier: DossierEtudiant = new DossierEtudiant();
        dossier.utilisateurId = req.body.utilisateurId
        dossier.matricule = matricule
        dossier.codeQR = codeQR
        dossier.photo = req.body.photo ?? null
        dossier.statut = 'actif'
        dossier.fraisScolarite = req.body.fraisScolarite
        dossier.modePaiement = req.body.modePaiement ?? 'mensuel'
        dossier.nbMensualites = req.body.nbMensualites ?? 10
        dossier.demarrageParcours = req.body.demarrageParcours

        await dossier.save()
            .then(async (dossier) => {
                return res.status(201).send(dossier);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async getStatutByMatricule(req: Request, res: Response): Promise<Response> {
        const { matricule } = req.params

        try {
            const dossier: DossierEtudiant | null = await DossierEtudiant.findOne({
                where: { matricule: matricule },
                include: [{
                    association: DossierEtudiant.associations.echeances,
                    where: { statut: ['impaye', 'en_retard'] },
                    required: false
                }]
            });

            if (dossier == null) {
                return res.status(404).json({ statut: 'rouge', message: "Dossier étudiant non trouvé" });
            }

            const echeancesImpayees = (dossier.echeances || []).filter(
                e => e.statut == 'impaye' || e.statut == 'en_retard'
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

    static async updateStatut(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let dossier: DossierEtudiant | null = await DossierEtudiant.findByPk(req.params.id);
        if (dossier != null) {
            await dossier.update({
                statut: req.body.statut ?? dossier.statut,
                photo: req.body.photo ?? dossier.photo,
            })
                .then(async (dossier) => {
                    return res.status(200).send(dossier);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Dossier non trouvé" });
        }

        return null
    }
}
