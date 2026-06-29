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
import { PreInscription, EtatPreInscription } from "../models/PreInscription";
import fs from "fs";
import path from "path";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";

export default class DemandeInscriptionController {

    constructor() { }

    static async getAllDemandesInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, include: [{ association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeInscription.associations.reponseInscription, DemandeInscription.associations.parcoursChoisis, DemandeInscription.associations.session] }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = { include: [{ association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }, DemandeInscription.associations.reponseInscription, DemandeInscription.associations.parcoursChoisis, DemandeInscription.associations.session] }
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
                    DemandeInscription.associations.preInscription,
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
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = {
                where: { id: req.params.id },
                include: [
                    {
                        association: DemandeInscription.associations.utilisateur, include: [{
                            model: Apprenant, as: 'apprenant'
                        }]
                    },
                    { association: DemandeInscription.associations.session, include: [Session.associations.dossiersInscription, Session.associations.fraisInscription] },
                    DemandeInscription.associations.preInscription,
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

    static async getFichePaiement(req: Request, res: Response): Promise<void> {
        const demande = await DemandeInscription.findByPk(req.params.id, {
            include: [
                { association: DemandeInscription.associations.utilisateur },
                { association: DemandeInscription.associations.session, include: [Session.associations.fraisInscription] },
                { association: DemandeInscription.associations.coursChoisis, include: [{ association: DemandeInscriptionCours.associations.cours }] },
                { association: DemandeInscription.associations.paiementsInscription },
            ]
        })

        if (!demande) {
            res.status(404).json({ success: false, message: "Demande non trouvée" })
            return
        }

        const etudiantNom = demande.utilisateur ? `${demande.utilisateur.nom} ${demande.utilisateur.prenoms}` : 'Étudiant'
        const frais = demande.session?.fraisInscription || []
        const coursChoisis = demande.coursChoisis || []

        const filename = DocumentPDFGenerator.generateFichePaiement(
            demande.id!,
            etudiantNom,
            demande.matricule,
            frais.map(f => ({ titre: f.titre, montant: f.montant, fraisDesCours: f.fraisDesCours })),
            [],
            (demande.paiementsInscription || []).reduce((sum, p) => sum + (p.montant || 0), 0),
            "public/inscription/bordereaux/"
        )

        const filePath = path.resolve(process.cwd(), 'public/inscription/bordereaux/', filename)
        if (!fs.existsSync(filePath)) {
            res.status(500).json({ success: false, message: "Erreur lors de la génération du fichier" })
            return
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
        const stream = fs.createReadStream(filePath)
        stream.pipe(res)
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
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        const demande = await DemandeInscription.findByPk(req.params.id, {
            include: [{ association: DemandeInscription.associations.preInscription }]
        })
        if (!demande) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }
        if (!demande.preInscription || demande.preInscription.statut != EtatPreInscription.VALIDE) {
            return res.status(400).json({ success: false, message: "La préinscription doit d'abord être validée" })
        }

        let options: FindOptions<InferAttributes<DemandeInscriptionCours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { coursId: req.body.coursId, demandeInscriptionId: req.params.id } }
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
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        const demandeInscription = await DemandeInscription.findByPk(req.params.id, {
            include: [
                { association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
                { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                { association: DemandeInscription.associations.preInscription },
                { association: DemandeInscription.associations.session, include: [Session.associations.dossiersInscription, Session.associations.fraisInscription] },
                { association: DemandeInscription.associations.dossiersDemande },
                { association: DemandeInscription.associations.cours, include: [Cours.associations.classe] },
                { association: DemandeInscription.associations.coursChoisis },
                DemandeInscription.associations.paiementsInscription,
                DemandeInscription.associations.reponseInscription,
            ]
        })

        if (!demandeInscription) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        // Vérifier info personnelles
        if (!demandeInscription.utilisateur?.apprenant) {
            return res.status(400).json({ success: false, message: "Les informations personnelles ne sont pas complètes" })
        }

        // Vérifier parcours choisis + reponseInscription + choixFinal
        if (!demandeInscription.parcoursChoisis || demandeInscription.parcoursChoisis.length == 0) {
            return res.status(400).json({ success: false, message: "Aucun parcours choisi" })
        }
        if (!demandeInscription.reponseInscription) {
            return res.status(400).json({ success: false, message: "La réponse de l'institution n'a pas été envoyée" })
        }
        if (demandeInscription.parcoursChoisis.filter(pc => pc.choixFinal == true).length == 0) {
            return res.status(400).json({ success: false, message: "Aucun parcours final sélectionné" })
        }

        // Vérifier documents uploadés
        const dossiersRequis = demandeInscription.session?.dossiersInscription || []
        const dossiersUploades = demandeInscription.dossiersDemande || []
        if (dossiersRequis.length > 0 && dossiersUploades.length != dossiersRequis.length) {
            return res.status(400).json({ success: false, message: "Tous les documents requis doivent être téléversés" })
        }

        // Vérifier préinscription validée
        if (!demandeInscription.preInscription || demandeInscription.preInscription.statut != EtatPreInscription.VALIDE) {
            return res.status(400).json({ success: false, message: "La préinscription doit être validée" })
        }

        // Vérifier cours choisis
        const parcoursFinal = demandeInscription.parcoursChoisis.find(pc => pc.choixFinal == true)
        if (parcoursFinal && parcoursFinal.parcoursId) {
            const coursParcours = demandeInscription.cours || []
            const coursObligatoires = coursParcours.filter(c => c.estObligatoire)
            if (coursObligatoires.length > 0) {
                const coursChoisisIds = (demandeInscription.coursChoisis || []).map(cc => cc.coursId)
                const tousObligatoiresChoisis = coursObligatoires.every(c => coursChoisisIds.includes(c.id))
                if (!tousObligatoiresChoisis) {
                    return res.status(400).json({ success: false, message: "Tous les cours obligatoires doivent être choisis" })
                }
                if ((demandeInscription.coursChoisis || []).filter(cc => cc.etat == EtatsCoursChoisi.ENCOURS).length > 0) {
                    return res.status(400).json({ success: false, message: "Tous les cours choisis doivent être validés par l'institution" })
                }
            }
        }

        // Vérifier paiements
        const fraisTotal = (demandeInscription.session?.fraisInscription || []).reduce((sum, f) => sum + f.montant, 0)
        const fraisPayes = (demandeInscription.paiementsInscription || []).reduce((sum, p) => sum + (p.montant || 0), 0)
        if (fraisPayes < fraisTotal) {
            return res.status(400).json({ success: false, message: "Les frais d'inscription ne sont pas entièrement payés" })
        }

        // Tout est ok, valider
        await demandeInscription.update({
            dateValidation: req.body.dateValidation ?? new Date(),
        })

        if (demandeInscription.utilisateur) {
            const parcoursChoisiFinal = demandeInscription.parcoursChoisis.find(pc => pc.choixFinal == true)
            const cursusApprenant = new CursusApprenant()
            cursusApprenant.externe = false
            cursusApprenant.parcoursId = parcoursChoisiFinal?.parcoursId || req.body.cursusApprenant?.parcoursId
            cursusApprenant.classeId = req.body.cursusApprenant?.classeId
            cursusApprenant.anneeAcademiqueId = req.body.cursusApprenant?.anneeAcademiqueId
            cursusApprenant.niveauEtudeId = parcoursChoisiFinal?.parcours?.niveauEtudeId || req.body.cursusApprenant?.niveauEtudeId
            cursusApprenant.utilisateurId = demandeInscription.utilisateurId
            cursusApprenant.demandeInscriptionId = demandeInscription.id

            const savedCursus = await cursusApprenant.save()

            if (demandeInscription.coursChoisis) {
                for (const coursChoisi of demandeInscription.coursChoisis) {
                    if (coursChoisi.etat == EtatsCoursChoisi.VALIDE) {
                        const coursParticipant = new CoursParticipant()
                        coursParticipant.coursId = coursChoisi.coursId
                        coursParticipant.utilisateurId = demandeInscription.utilisateurId
                        coursParticipant.cursusApprenantId = savedCursus.id
                        await coursParticipant.save()
                    }
                }
            }

            EmailSender.getInstance().sendValidationDemandeInscription(
                demandeInscription.utilisateur.identifiant,
                demandeInscription.utilisateur.email
            )
        }

        return res.status(200).send(demandeInscription)
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