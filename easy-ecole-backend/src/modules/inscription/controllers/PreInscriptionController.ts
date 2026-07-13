import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import fs from "fs";
import path from "path";
import { PreInscription, EtatPreInscription } from "../models/PreInscription";
import { DemandeInscription } from "../models/DemandeInscription";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Session } from "../models/Session";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";

export default class PreInscriptionController {

    constructor() { }

    static async soumettre(req: Request, res: Response): Promise<Response | null> {
        const demandeId = req.params.demandeId

        const demande = await DemandeInscription.findOne({
            where: { id: demandeId, utilisateurId: (req as any).utilisateurId },
            include: [
                { association: DemandeInscription.associations.parcoursChoisis },
                { association: DemandeInscription.associations.session, include: [Session.associations.dossiersInscription] },
                { association: DemandeInscription.associations.dossiersDemande }
            ]
        })

        if (!demande) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        if (!demande.parcoursChoisis || demande.parcoursChoisis.length == 0) {
            return res.status(400).json({ success: false, message: "Veuillez d'abord choisir un parcours" })
        }

        if (demande.session && demande.session.dossiersInscription && demande.session.dossiersInscription.length > 0) {
            const dossiersRequis = demande.session.dossiersInscription.length
            const dossiersUploades = demande.dossiersDemande ? demande.dossiersDemande.length : 0
            if (dossiersUploades < dossiersRequis) {
                return res.status(400).json({ success: false, message: "Veuillez d'abord téléverser tous les documents requis" })
            }
        }

        let preInscription = await PreInscription.findOne({ where: { demandeInscriptionId: demandeId } })
        if (preInscription) {
            if (preInscription.statut == EtatPreInscription.EN_ATTENTE) {
                return res.status(400).json({ success: false, message: "Déjà soumis, en attente d'évaluation" })
            }
            if (preInscription.statut == EtatPreInscription.VALIDE) {
                return res.status(400).json({ success: false, message: "Déjà validé par le comité" })
            }
            await preInscription.update({ statut: EtatPreInscription.EN_ATTENTE, commentaire: null as any, dateTraitement: null as any, traiteParId: null as any })
        } else {
            preInscription = await PreInscription.create({
                demandeInscriptionId: demandeId,
                statut: EtatPreInscription.EN_ATTENTE
            })
        }

        return res.status(201).send(preInscription)
    }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PreInscription>> = {
            include: [
                {
                    association: PreInscription.associations.demandeInscription,
                    include: [
                        { association: DemandeInscription.associations.utilisateur }
                    ]
                },
                { association: PreInscription.associations.traitePar }
            ]
        }

        try {
            const preInscriptions = await PreInscription.findAll(options);
            return res.status(200).send(preInscriptions);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDemandesEnAttente(req: Request, res: Response): Promise<Response> {
        try {
            const demandes = await DemandeInscription.findAll({
                include: [
                    { association: DemandeInscription.associations.utilisateur },
                    { association: DemandeInscription.associations.preInscription },
                    {
                        association: DemandeInscription.associations.parcoursChoisis,
                        include: [{ association: ParcoursChoisi.associations.parcours }]
                    }
                ]
            })

            const enAttente = demandes.filter(d =>
                !d.preInscription || d.preInscription.statut == EtatPreInscription.EN_ATTENTE
            )

            return res.status(200).send(enAttente)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async valider(req: Request, res: Response): Promise<Response | null> {
        const demandeId = req.params.id
        const commentaire = req.body.commentaire

        const demande = await DemandeInscription.findOne({
            where: { id: demandeId },
            include: [
                { association: DemandeInscription.associations.utilisateur },
                { association: DemandeInscription.associations.session, include: [Session.associations.fraisInscription] },
                { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] }
            ]
        })

        if (!demande) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        let preInscription = await PreInscription.findOne({ where: { demandeInscriptionId: demandeId } })

        if (preInscription) {
            if (preInscription.statut != EtatPreInscription.EN_ATTENTE) {
                return res.status(400).json({ success: false, message: "Cette demande a déjà été traitée" })
            }
            await preInscription.update({
                statut: EtatPreInscription.VALIDE,
                commentaire: commentaire,
                dateTraitement: new Date(),
                traiteParId: (req as any).utilisateurId
            })
        } else {
            preInscription = await PreInscription.create({
                demandeInscriptionId: demandeId,
                statut: EtatPreInscription.VALIDE,
                commentaire: commentaire,
                dateTraitement: new Date(),
                traiteParId: (req as any).utilisateurId
            })
        }

        // Générer l'autorisation provisoire d'inscription PDF
        try {
            const etudiantNom = demande.utilisateur ? `${demande.utilisateur.nom} ${demande.utilisateur.prenoms}` : 'Étudiant'
            const parcoursTitres = demande.parcoursChoisis
                ?.filter(pc => pc.parcours)
                .map(pc => ({ titre: pc.parcours!.titre })) || []
            const fraisTotal = demande.session?.fraisInscription?.reduce((sum, f) => sum + f.montant, 0) || 0

            const filename = DocumentPDFGenerator.generateAutorisationProvisoire(
                demandeId,
                etudiantNom,
                demande.matricule,
                parcoursTitres,
                fraisTotal,
                "public/inscription/autorisations/"
            )

            await preInscription.update({ autorisationPDF: filename })
        } catch (err) {
            console.error("Erreur génération autorisation provisoire PDF:", err)
        }

        if (demande.utilisateur) {
            EmailSender.getInstance().sendPreInscriptionValidee(
                demande.utilisateur.identifiant,
                demande.utilisateur.email
            ).catch(err => console.error("Erreur envoi email validation:", err))
        }

        return res.status(200).send(preInscription)
    }

    static async rejeter(req: Request, res: Response): Promise<Response | null> {
        const demandeId = req.params.id
        const commentaire = req.body.commentaire

        if (!commentaire || !commentaire.trim()) {
            return res.status(400).json({ success: false, message: "Un motif de rejet est requis" })
        }

        const demande = await DemandeInscription.findOne({
            where: { id: demandeId },
            include: [{ association: DemandeInscription.associations.utilisateur }]
        })

        if (!demande) {
            return res.status(404).json({ success: false, message: "Demande non trouvée" })
        }

        let preInscription = await PreInscription.findOne({ where: { demandeInscriptionId: demandeId } })

        if (preInscription) {
            if (preInscription.statut != EtatPreInscription.EN_ATTENTE) {
                return res.status(400).json({ success: false, message: "Cette demande a déjà été traitée" })
            }
            await preInscription.update({
                statut: EtatPreInscription.REJETE,
                commentaire: commentaire,
                dateTraitement: new Date(),
                traiteParId: (req as any).utilisateurId
            })
        } else {
            preInscription = await PreInscription.create({
                demandeInscriptionId: demandeId,
                statut: EtatPreInscription.REJETE,
                commentaire: commentaire,
                dateTraitement: new Date(),
                traiteParId: (req as any).utilisateurId
            })
        }

        if (demande.utilisateur) {
            EmailSender.getInstance().sendPreInscriptionRejetee(
                demande.utilisateur.identifiant,
                demande.utilisateur.email,
                commentaire
            ).catch(err => console.error("Erreur envoi email rejet:", err))
        }

        return res.status(200).send(preInscription)
    }

    static async getAllDemandes(req: Request, res: Response): Promise<Response> {
        try {
            const demandes = await DemandeInscription.findAll({
                include: [
                    { association: DemandeInscription.associations.utilisateur },
                    { association: DemandeInscription.associations.preInscription },
                    {
                        association: DemandeInscription.associations.parcoursChoisis,
                        include: [{ association: ParcoursChoisi.associations.parcours }]
                    }
                ],
                order: [['createdAt', 'DESC']]
            })
            return res.status(200).send(demandes)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async getDemandeDetails(req: Request, res: Response): Promise<Response> {
        try {
            const demande = await DemandeInscription.findByPk(req.params.id, {
                include: [
                    { association: DemandeInscription.associations.utilisateur },
                    { association: DemandeInscription.associations.preInscription },
                    {
                        association: DemandeInscription.associations.parcoursChoisis,
                        include: [{ association: ParcoursChoisi.associations.parcours }]
                    },
                    { association: DemandeInscription.associations.session },
                    { association: DemandeInscription.associations.dossiersDemande }
                ]
            })

            if (!demande) {
                return res.status(404).json({ success: false, message: "Demande non trouvée" })
            }

            return res.status(200).send(demande)
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async telechargerAutorisation(req: Request, res: Response): Promise<void> {
        const preInscription = await PreInscription.findByPk(req.params.id)

        if (!preInscription || !preInscription.autorisationPDF) {
            res.status(404).json({ success: false, message: "Autorisation non trouvée" })
            return
        }

        const filePath = path.resolve(process.cwd(), 'public/inscription/autorisations', preInscription.autorisationPDF)
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, message: "Fichier introuvable sur le serveur" })
            return
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${preInscription.autorisationPDF}"`)

        const stream = fs.createReadStream(filePath)
        stream.on('error', () => {
            res.status(500).json({ success: false, message: "Erreur lors de la lecture du fichier" })
        })
        stream.pipe(res)
    }
}
