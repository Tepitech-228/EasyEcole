import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import fs from "fs";
import path from "path";
import { PreInscription, EtatPreInscription } from "../models/PreInscription";
import { DemandeInscription } from "../models/DemandeInscription";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Session } from "../models/Session";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { DocGenGeneratorService } from "../../docgen/services/DocGenGeneratorService";

export default class PreInscriptionController {

    constructor() { }

    static async soumettre(req: Request, res: Response): Promise<Response | null> {
        const demandeId = req.params.demandeId

        // L'apprenant soumet SA demande ; l'institution peut soumettre toute demande de sa session
        const whereDemande: any = { id: demandeId };
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            whereDemande.utilisateurId = (req as any).utilisateurId;
        }

        const demande = await DemandeInscription.findOne({
            where: whereDemande,
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
                demandeInscriptionId: Number(demandeId),
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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async valider(req: Request, res: Response): Promise<Response | null> {
        const demandeId = req.params.demandeId
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

        const preInscription = await PreInscription.findOne({ where: { demandeInscriptionId: demandeId } })

        if (!preInscription) {
            return res.status(400).json({ success: false, message: "La demande n'a pas été soumise" })
        }

        if (preInscription.statut != EtatPreInscription.EN_ATTENTE) {
            return res.status(400).json({ success: false, message: "Cette demande a déjà été traitée" })
        }

        await preInscription.update({
            statut: EtatPreInscription.VALIDE,
            commentaire: commentaire,
            dateTraitement: new Date(),
            traiteParId: (req as any).utilisateurId
        })

        // Générer l'autorisation provisoire d'inscription PDF via docgen
        let autorisationReference: string | undefined;
        try {
            const result = await DocGenGeneratorService.generer({
                typeCode: 'API001',
                sourceType: 'pre_inscription',
                sourceId: Number(demandeId),
                utilisateurId: (req as any).utilisateurId,
                params: {
                    cursusApprenantId: demande.utilisateur?.apprenant?.id,
                    etudiantId: demande.utilisateurId,
                }
            }, req);

            autorisationReference = result.reference;
            await preInscription.update({ autorisationPDF: result.reference })
        } catch (err) {
            console.error("Erreur génération autorisation provisoire PDF (docgen):", err)
        }

        if (demande.utilisateur) {
            const attachmentPath = autorisationReference
                ? path.resolve('storage', 'docgen', `${autorisationReference}.pdf`)
                : undefined;
            EmailSender.getInstance().sendPreInscriptionValidee(
                demande.utilisateur.identifiant,
                demande.utilisateur.email,
                attachmentPath
            ).catch(err => console.error("Erreur envoi email validation:", err))
        }

        return res.status(200).send(preInscription)
    }

    static async rejeter(req: Request, res: Response): Promise<Response | null> {
        const demandeId = req.params.demandeId
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

        const preInscription = await PreInscription.findOne({ where: { demandeInscriptionId: demandeId } })

        if (!preInscription) {
            return res.status(400).json({ success: false, message: "La demande n'a pas été soumise" })
        }

        if (preInscription.statut != EtatPreInscription.EN_ATTENTE) {
            return res.status(400).json({ success: false, message: "Cette demande a déjà été traitée" })
        }

        await preInscription.update({
            statut: EtatPreInscription.REJETE,
            commentaire: commentaire,
            dateTraitement: new Date(),
            traiteParId: (req as any).utilisateurId
        })

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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
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
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async telechargerAutorisation(req: Request, res: Response): Promise<void> {
        const preInscription = await PreInscription.findByPk(req.params.id)

        if (!preInscription || !preInscription.autorisationPDF) {
            res.status(404).json({ success: false, message: "Autorisation non trouvée" })
            return
        }

        // L'autorisation générée par docgen est stockée dans storage/docgen/{reference}.pdf
        // mais peut aussi avoir été déplacée dans public/dossiers/... (après validation bordereau)
        // ou exister encore dans l'ancien emplacement (public/inscription/autorisations/)
        const valeur = preInscription.autorisationPDF
        const nomFichier = valeur.endsWith('.pdf') ? valeur : `${valeur}.pdf`
        const candidats = [
            path.resolve(process.cwd(), 'storage', 'docgen', nomFichier),
            path.resolve(process.cwd(), valeur),
            path.resolve(process.cwd(), 'public/inscription/autorisations', nomFichier),
        ]
        const filePath = candidats.find(c => fs.existsSync(c))
        if (!filePath) {
            res.status(404).json({ success: false, message: "Fichier introuvable sur le serveur" })
            return
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${nomFichier}"`)

        const stream = fs.createReadStream(filePath)
        stream.on('error', () => {
            res.status(500).json({ success: false, message: "Erreur lors de la lecture du fichier" })
        })
        stream.pipe(res)
    }
}
