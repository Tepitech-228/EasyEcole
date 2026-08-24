import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { DemandeInscription } from "../models/DemandeInscription";
import { Bordereau } from "../models/Bordereau";
import { TypeOperationBordereau } from "../models/TypeOperationBordereau";
import { Echeance } from "../models/Echeance";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Apprenant } from "../../auth/models/Apprenant";
import { Session } from "../models/Session";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { BordereauDossierService } from "../services/BordereauDossierService";
import { EtatPreInscription, PreInscription } from "../models/PreInscription";

const PIPELINE_COMITE = 'transmis_comite'

const inclureTout = () => [
    {
        association: DemandeInscription.associations.utilisateur,
        include: [{ model: Apprenant, as: 'apprenant' }]
    },
    {
        association: DemandeInscription.associations.parcoursChoisis,
        include: [{ association: ParcoursChoisi.associations.parcours }]
    },
    {
        association: DemandeInscription.associations.session,
        include: [Session.associations.anneeAcademique]
    },
    { association: DemandeInscription.associations.preInscription },
    { association: DemandeInscription.associations.dossiersDemande },
    { association: DemandeInscription.associations.cours },
    { association: DemandeInscription.associations.reponseInscription },
]

export default class ComiteValidationController {

    /**
     * GET /comite-validations/dossiers
     * Liste les dossiers transmis au comité (statutPipeline = 'transmis_comite').
     * ?tous=true → retourne tous les dossiers du pipeline (historique).
     */
    static async listerDossiers(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole
            if (role != RolesUtilisateur.COMITE_ORIENTATION && role != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }

            const where: any = req.query.tous === 'true'
                ? { statutPipeline: { [Op.ne]: null } }
                : { statutPipeline: PIPELINE_COMITE }

            const demandes = await DemandeInscription.findAll({
                where,
                include: inclureTout(),
                order: [['createdAt', 'DESC']],
                limit: 100,
            })

            const utilisateurIds = demandes.map(d => d.utilisateurId)
            const bordereaux = utilisateurIds.length
                ? await Bordereau.findAll({
                    where: { utilisateurId: { [Op.in]: utilisateurIds as any } },
                    include: [Bordereau.associations.typeOperation],
                    order: [['dateSoumission', 'DESC']],
                })
                : []

            const data = demandes.map(demande => ({
                ...demande.get({ plain: true }),
                bordereaux: bordereaux
                    .filter((b: any) => Number(b.utilisateurId) === Number(demande.utilisateurId))
                    .map((b: any) => b.get({ plain: true })),
            }))

            return res.status(200).json({ data })
        } catch (error) {
            console.error('[Comite] listerDossiers:', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }

    /**
     * GET /comite-validations/dossiers/:id
     * Détail complet d'un dossier : identité, parcours, documents,
     * finances (bordereaux + échéances du dossier étudiant si créé).
     */
    static async detailDossier(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole
            if (role != RolesUtilisateur.COMITE_ORIENTATION && role != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }

            const demande = await DemandeInscription.findOne({
                where: { id: req.params.id },
                include: inclureTout(),
            })
            if (!demande) {
                return res.status(404).json({ success: false, message: "Dossier non trouvé" })
            }

            const bordereaux = await Bordereau.findAll({
                where: { utilisateurId: demande.utilisateurId },
                include: [Bordereau.associations.typeOperation],
                order: [['dateSoumission', 'DESC']],
            })

            const dossiersEtudiant = await DossierEtudiant.findAll({
                where: { utilisateurId: demande.utilisateurId },
            })

            let echeances: any[] = []
            if (dossiersEtudiant.length > 0) {
                echeances = await Echeance.findAll({
                    where: { dossierEtudiantId: { [Op.in]: dossiersEtudiant.map(d => d.id) as any } },
                    order: [['type', 'ASC'], ['dateLimite', 'ASC']],
                })
            }

            return res.status(200).json({
                data: {
                    ...demande.get({ plain: true }),
                    bordereaux: bordereaux.map((b: any) => b.get({ plain: true })),
                    dossierEtudiant: dossiersEtudiant[0]?.get({ plain: true }) ?? null,
                    echeances,
                }
            })
        } catch (error) {
            console.error('[Comite] detailDossier:', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }

    /**
     * POST /comite-validations/dossiers/:id/decider
     * Body : { decision: 'valide' | 'correction_demandee' | 'rejete', motif?: string }
     *
     * - valide   → FINALISATION de l'inscription (matricule définitif, cursus,
     *              cours, carte) puis pipeline='valide' + email officiel.
     * - correction_demandee / rejete → motif obligatoire + email à l'étudiant.
     */
    static async decider(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole
        if (role != RolesUtilisateur.COMITE_ORIENTATION && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const decision = req.body.decision
        if (!['valide', 'correction_demandee', 'rejete'].includes(decision)) {
            return res.status(400).json({ success: false, message: "Décision invalide" })
        }

        const motif = (req.body.motif || '').toString().trim()
        if (decision !== 'valide' && !motif) {
            return res.status(400).json({ success: false, message: "Motif requis pour une correction ou un rejet" })
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction()
        try {
            const demande = await DemandeInscription.findOne({
                where: { id: req.params.id },
                transaction,
                lock: transaction.LOCK.UPDATE,
            })
            if (!demande) {
                await transaction.rollback()
                return res.status(404).json({ success: false, message: "Dossier non trouvé" })
            }
            if (demande.statutPipeline !== PIPELINE_COMITE) {
                await transaction.rollback()
                return res.status(400).json({ success: false, message: "Ce dossier n'est pas en attente de validation du comité" })
            }

            // NOUVEAU FLUX : la saisie ESA-COMPTA se déroule EN PARALLÈLE de la
            // validation du comité ; elle n'est plus un prérequis. On récupère
            // simplement le bordereau d'inscription de l'étudiant : il servira à
            // créer le socle financier au moment de la validation (ci-dessous).
            const bordereau = await Bordereau.findOne({
                where: { utilisateurId: demande.utilisateurId },
                order: [['dateSoumission', 'ASC']],
                transaction,
            })

            let matriculeFinal: string | null = null

            if (decision === 'valide') {
                // Socle financier : si l'ESA-COMPTA n'a pas encore saisi le bordereau
                // (travail parallèle), on crée ici DossierEtudiant + échéanciers pour
                // que l'imputation FIFO future ait des échéances à lettrer.
                // pedagogieDifferee=true : la pédagogie est posée juste après par
                // finaliserAffectationPedagogique (matricule final, cursus, cours, carte).
                const dossierExistant = await DossierEtudiant.findOne({
                    where: { utilisateurId: demande.utilisateurId },
                    transaction,
                })
                if (!dossierExistant && bordereau) {
                    const preIns = await PreInscription.findOne({
                        where: { demandeInscriptionId: demande.id },
                        transaction,
                    })
                    if (!preIns) {
                        await PreInscription.create({
                            demandeInscriptionId: demande.id,
                            statut: EtatPreInscription.VALIDE,
                            commentaire: "Pré-inscription validée automatiquement par la décision du comité",
                        }, { transaction })
                    } else if (preIns.statut !== EtatPreInscription.VALIDE) {
                        preIns.statut = EtatPreInscription.VALIDE
                        await preIns.save({ transaction })
                    }
                    await BordereauDossierService.creerDossierEtudiantDepuisBordereau(
                        bordereau,
                        req,
                        transaction,
                        { ignorerVerifFrais: true, pedagogieDifferee: true }
                    )
                }

                const finalisation = await BordereauDossierService.finaliserAffectationPedagogique(
                    demande.utilisateurId,
                    req,
                    transaction
                )
                matriculeFinal = finalisation.matricule

                demande.statutPipeline = 'valide'
                demande.motifPipeline = null
            } else {
                demande.statutPipeline = decision
                demande.motifPipeline = motif
            }
            await demande.save({ transaction })

            await transaction.commit()

            // Emails (non bloquants)
            try {
                const utilisateur = await (await import('../../auth/models/Utilisateur')).Utilisateur.findByPk(demande.utilisateurId)
                if (utilisateur?.email) {
                    const nomComplet = `${utilisateur.prenoms || ''} ${utilisateur.nom || ''}`.trim() || 'étudiant(e)'
                    if (decision === 'valide') {
                        EmailSender.getInstance().sendPdf(
                            utilisateur.email,
                            nomComplet,
                            "Easy Ecole: Félicitations — Votre inscription a été validée",
                            `<p>Cher ${nomComplet},</p>
                             <p>Nous avons le plaisir de vous informer que votre dossier d'inscription a été examiné et <strong>validé par le comité</strong>.</p>
                             <p>Votre dossier étudiant a été officiellement créé.</p>
                             <p><strong>Matricule : ${matriculeFinal}</strong></p>
                             <p>Nous vous invitons à conserver précieusement votre matricule et à vous rendre au <strong>Secrétariat de l'établissement</strong> afin de retirer votre autorisation provisoire d'inscription.</p>
                             <p>Cordialement,<br>Le Secrétariat — Easy Ecole</p>`,
                            '', ''
                        )
                    } else if (decision === 'correction_demandee') {
                        EmailSender.getInstance().sendPdf(
                            utilisateur.email,
                            nomComplet,
                            "Easy Ecole: Correction requise sur votre dossier d'inscription",
                            `<p>Cher ${nomComplet},</p>
                             <p>Le comité d'inscription demande des <strong>corrections</strong> sur votre dossier.</p>
                             <p><strong>Motif :</strong> ${motif}</p>
                             <p>Merci de vous rapprocher du service des inscriptions pour régulariser votre situation.</p>
                             <p>Cordialement,<br>Service des inscriptions — Easy Ecole</p>`,
                            '', ''
                        )
                    } else {
                        EmailSender.getInstance().sendPdf(
                            utilisateur.email,
                            nomComplet,
                            "Easy Ecole: Décision du comité concernant votre inscription",
                            `<p>Cher ${nomComplet},</p>
                             <p>Après examen de votre dossier, le comité d'inscription a rendu une décision de <strong>rejet</strong>.</p>
                             <p><strong>Motif :</strong> ${motif}</p>
                             <p>Cordialement,<br>Service des inscriptions — Easy Ecole</p>`,
                            '', ''
                        )
                    }
                }
            } catch (emailError) {
                console.error("Erreur envoi email décision comité (non bloquante):", emailError)
            }

            return res.status(200).json({
                success: true,
                data: {
                    demandeId: demande.id,
                    decision,
                    statutPipeline: demande.statutPipeline,
                    matricule: matriculeFinal,
                }
            })
        } catch (error: any) {
            // Si le rollback lui-même échoue, la transaction reste ouverte (locks) :
            // c'est une alerte opérationnelle qui doit être visible immédiatement.
            await transaction.rollback().catch(rbErr => console.error('[COMITE][decider] ROLLBACK EN ÉCHEC — transaction possiblement orpheline:', rbErr))
            console.error('[Comite] decider:', error)
            return res.status(400).json({ success: false, message: error.message || 'Erreur interne' })
        }
    }
}
