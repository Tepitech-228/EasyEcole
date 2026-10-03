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
import { Parcours } from "../models/Parcours";
import { BordereauDossierService } from "../services/BordereauDossierService";
import { EtatPreInscription, PreInscription } from "../models/PreInscription";
import { ComiteVote } from "../models/ComiteVote";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { CursusApprenant } from "../models/CursusApprenant";
import { NiveauEtude } from "../models/NiveauEtude";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { PdfMergeService } from "../../../core/services/PdfMergeService";
import { Quitus } from "../models/Quitus";
import { RecuCaisse } from "../../scolarite/models/RecuCaisse";
import { DemandeDocument } from "../../scolarite/models/DemandeDocument";
import { DocumentDelivre } from "../../scolarite/models/DocumentDelivre";
import { DocGenDocument } from "../../docgen/models/DocGenDocument";
import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier";
import path from "path";
import fs from "fs";

/**
 * Extrait le numéro de niveau depuis le libellé (ex: "LICENCE 1" → 1).
 */
function extraireNumeroNiveau(libelle: string): number | null {
    const match = libelle.match(/(\d+)\s*$/)
    return match ? parseInt(match[1], 10) : null
}

function incrementerLibelleNiveau(libelle: string): string {
    const match = libelle.match(/^(.*?)(\d+)(\s*)$/)
    if (match) {
        return `${match[1]}${parseInt(match[2], 10) + 1}${match[3] || ''}`
    }
    return `${libelle} (N+1)`
}

const STATUTS_COMITE = ['transmis_comite', 'authentifie']
const PIPELINE_COMITE = 'transmis_comite'

/** Valeurs acceptées pour le filtre « filière » (colonne Parcours.type). */
const FILIERES = ['LICENCE', 'MASTER', 'DOCTORAT', 'BTS', 'MBA']

/** Plafond de dossiers renvoyés par la liste du comité. */
const LISTER_DOSSIERS_MAX = 100

/**
 * Construit les includes du dossier.
 *
 * `opts` sert à transformer les LEFT JOIN en JOIN interne : sans `required`,
 * une condition `$parcoursChoisis.parcours.type$` n'écarterait rien, car le
 * where s'applique après la jointure externe. On ne rend donc obligatoires que
 * les associations réellement traversées par un filtre.
 *
 * Note : rendre `parcoursChoisis` obligatoire exclut les dossiers sans parcours
 * choisi. C'est le comportement voulu lorsqu'on filtre par filière/parcours/niveau.
 */
const inclureTout = (opts: { sessionInterne?: boolean; parcoursInterne?: boolean } = {}) => [
    {
        association: DemandeInscription.associations.utilisateur,
        include: [{ model: Apprenant, as: 'apprenant' }]
    },
    {
        association: DemandeInscription.associations.parcoursChoisis,
        required: !!opts.parcoursInterne,
        include: [{
            association: ParcoursChoisi.associations.parcours,
            required: !!opts.parcoursInterne,
            include: [Parcours.associations.niveauEtude]
        }]
    },
    {
        association: DemandeInscription.associations.session,
        required: !!opts.sessionInterne,
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
     * Liste les dossiers transmis au comité (statutPipeline = 'transmis_comite' ou 'authentifie').
     * ?tous=true → retourne tous les dossiers du pipeline (historique).
     *
     * Filtres combinables (ET) : anneeId, filiere, parcoursId, niveauId.
     * Réponse : { data: [...], meta: { total, tronque } } — `total` = nombre de
     * dossiers correspondant au filtre, `tronque` signale que la liste affichée
     * est incomplète (la requête est plafonnée à LISTER_DOSSIERS_MAX).
     */
    static async listerDossiers(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole
            if (role != RolesUtilisateur.COMITE_ORIENTATION && role != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }

            const where: any = req.query.tous === 'true'
                ? { statutPipeline: { [Op.ne]: null } }
                : { statutPipeline: { [Op.in]: STATUTS_COMITE } }

            // ── Filtres ──
            // Un paramètre vide ou non valide est simplement ignoré : on préfère
            // un filtre sans effet à une erreur sur une saisie partielle.
            const conditions: any[] = []
            let sessionInterne = false
            let parcoursInterne = false

            const anneeId = Number(req.query.anneeId)
            if (Number.isInteger(anneeId) && anneeId > 0) {
                conditions.push({ '$session.anneeAcademiqueId$': anneeId })
                sessionInterne = true
            }

            const filiere = String(req.query.filiere || '').trim().toUpperCase()
            if (FILIERES.includes(filiere)) {
                conditions.push({ '$parcoursChoisis.parcours.type$': filiere })
                parcoursInterne = true
            }

            const parcoursId = Number(req.query.parcoursId)
            if (Number.isInteger(parcoursId) && parcoursId > 0) {
                conditions.push({ '$parcoursChoisis.parcours.id$': parcoursId })
                parcoursInterne = true
            }

            const niveauId = Number(req.query.niveauId)
            if (Number.isInteger(niveauId) && niveauId > 0) {
                conditions.push({ '$parcoursChoisis.parcours.niveauEtudeId$': niveauId })
                parcoursInterne = true
            }

            if (conditions.length > 0) where[Op.and] = conditions

            const include = inclureTout({ sessionInterne, parcoursInterne })

            const demandes = await DemandeInscription.findAll({
                where,
                include,
                order: [['createdAt', 'DESC']],
                limit: LISTER_DOSSIERS_MAX,
            })

            // Nombre total correspondant au filtre, hors plafond d'affichage.
            const total = await DemandeInscription.count({
                where,
                include,
                distinct: true,
            })

            const utilisateurIds = demandes.map(d => d.utilisateurId)
            const bordereaux = utilisateurIds.length
                ? await Bordereau.findAll({
                    where: { utilisateurId: { [Op.in]: utilisateurIds as any } },
                    include: [Bordereau.associations.typeOperation],
                    order: [['dateSoumission', 'DESC']],
                })
                : []

            // nombreInscriptions par utilisateur → badge 1ère/réinscription
            const dossiersEtudiant = utilisateurIds.length
                ? await DossierEtudiant.findAll({ where: { utilisateurId: { [Op.in]: utilisateurIds as any } } })
                : []
            const nombreInscriptionsParUser = new Map<number, number>()
            for (const d of dossiersEtudiant) {
                nombreInscriptionsParUser.set(Number(d.utilisateurId), d.nombreInscriptions ?? 1)
            }

            // Calcul du quorum global (membres actifs du comité)
            const totalMembres = await Utilisateur.count({
                where: {
                    role: RolesUtilisateur.COMITE_ORIENTATION,
                    deletedAt: null
                }
            })

            const data = demandes.map(async (demande) => {
                const votes = await ComiteVote.findAll({
                    where: { demandeInscriptionId: demande.id }
                })
                const votesPlain = votes.map(v => v.get({ plain: true }))
                const valides = votes.filter((v: any) => v.decision === 'valide').length
                const aRejete = votes.some((v: any) => v.decision === 'rejete')
                const aCorrection = votes.some((v: any) => v.decision === 'correction_demandee')
                const restants = totalMembres - Number(votes.length)
                const currentUserId = req.utilisateurId as number
                const aVote = votes.some((v: any) => v.membreId === currentUserId)

                const estUnanime = votes.length > 0 && !aRejete && !aCorrection && valides === totalMembres
                const estRejete = aRejete || demande.statutPipeline === 'rejete'

                return {
                    ...demande.get({ plain: true }),
                    estReinscription: (demande.typeDemande === 'reinscription') ||
                        (nombreInscriptionsParUser.get(Number(demande.utilisateurId)) ?? 1) > 1,
                    nombreInscriptions: nombreInscriptionsParUser.get(Number(demande.utilisateurId)) ?? 1,
                    bordereaux: bordereaux
                        .filter((b: any) => Number(b.utilisateurId) === Number(demande.utilisateurId))
                        .map((b: any) => b.get({ plain: true })),
                    quorum: {
                        totalMembres,
                        votesCount: votes.length,
                        valides,
                        restants,
                        aVote,
                        estUnanime,
                        estRejete,
                    },
                    votes: votesPlain,
                }
            })

            // Attendre la résolution de tous les promesses de carte
            const resolvedData = await Promise.all(data)

            return res.status(200).json({
                data: resolvedData,
                meta: { total, tronque: total > resolvedData.length }
            })
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

            // Calcul du quorum et des votes
            const totalMembres = await Utilisateur.count({
                where: {
                    role: RolesUtilisateur.COMITE_ORIENTATION,
                    deletedAt: null
                }
            })

            const votes = await ComiteVote.findAll({
                where: { demandeInscriptionId: demande.id }
            })
            const votesArr = votes
            const votesPlain = votesArr.map(v => v.get({ plain: true }))
            const valides = votesArr.filter((v: any) => v.decision === 'valide').length
            const aRejete = votesArr.some((v: any) => v.decision === 'rejete')
            const aCorrection = votesArr.some((v: any) => v.decision === 'correction_demandee')
            const restants = totalMembres - Number(votesArr.length)
            const currentUserId = req.utilisateurId as number
            const aVote = votesArr.some((v: any) => v.membreId === currentUserId)

            const estUnanime = votesArr.length > 0 && !aRejete && !aCorrection && valides === totalMembres
            const estRejete = aRejete || demande.statutPipeline === 'rejete'

            // Liste des membres actifs du comité avec leur vote
            const membres = await Utilisateur.findAll({
                where: {
                    role: RolesUtilisateur.COMITE_ORIENTATION,
                    deletedAt: null
                },
                attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email']
            })
            const membresPlain = membres.map(m => {
                const vote = votes.find((v: any) => v.membreId === m.id)
                return {
                    ...m.get({ plain: true }),
                    vote: vote ? vote.get({ plain: true }) : null
                }
            })

            return res.status(200).json({
                data: {
                    ...demande.get({ plain: true }),
                    estReinscription: (demande.typeDemande === 'reinscription') ||
                        (dossiersEtudiant[0]?.nombreInscriptions ?? 1) > 1,
                    nombreInscriptions: dossiersEtudiant[0]?.nombreInscriptions ?? 1,
                    bordereaux: bordereaux.map((b: any) => b.get({ plain: true })),
                    dossierEtudiant: dossiersEtudiant[0]?.get({ plain: true }) ?? null,
                    echeances,
                    quorum: {
                        totalMembres,
                        votesCount: votes.length,
                        valides,
                        restants,
                        aVote,
                        estUnanime,
                        estRejete,
                    },
                    votes: votesPlain,
                    membres: membresPlain,
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
     * Validation collégiale : unanimité requise pour 'valide'.
     * Un seul rejet suffit pour bloquer le dossier.
     * Chaque membre ne peut voter qu'une seule fois (contrainte UNIQUE).
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
        const idsPiecesFournis = Array.isArray(req.body.dossierIdsAReposer)
        const dossierIdsAReposer: number[] = idsPiecesFournis
            ? Array.from(new Set<number>((req.body.dossierIdsAReposer as unknown[])
                .map((value: unknown) => Number(value))
                .filter((id: number) => Number.isInteger(id) && id > 0)))
            : []
        if (idsPiecesFournis && dossierIdsAReposer.length === 0) {
            return res.status(400).json({ success: false, message: "Sélectionnez au moins une pièce à corriger" })
        }

        const currentUserId = req.utilisateurId as number

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

            // Vérifier que le dossier est dans un statut autorisé pour le vote
            if (!STATUTS_COMITE.includes(demande.statutPipeline as string)) {
                await transaction.rollback()
                return res.status(400).json({ success: false, message: "Ce dossier n'est pas en attente de validation du comité" })
            }

            // Vérifier qu'il existe des membres du comité
            const totalMembres = await Utilisateur.count({
                where: {
                    role: RolesUtilisateur.COMITE_ORIENTATION,
                    deletedAt: null
                },
                transaction,
            })
            if (totalMembres === 0) {
                await transaction.rollback()
                return res.status(400).json({ success: false, message: "Aucun membre du comité configuré" })
            }

            if (decision === 'correction_demandee' && idsPiecesFournis) {
                const piecesExistantes = await DemandeInscriptionDossier.findAll({
                    where: { demandeId: demande.id, dossierId: { [Op.in]: dossierIdsAReposer } },
                    transaction,
                })
                if (piecesExistantes.length !== dossierIdsAReposer.length) {
                    await transaction.rollback()
                    return res.status(400).json({ success: false, message: "Une pièce sélectionnée n'appartient pas à cette demande" })
                }
                await DemandeInscriptionDossier.update(
                    { correctionDemandee: false },
                    { where: { demandeId: demande.id }, transaction }
                )
                await DemandeInscriptionDossier.update(
                    { correctionDemandee: true },
                    { where: { demandeId: demande.id, dossierId: { [Op.in]: dossierIdsAReposer } }, transaction }
                )
            }

            // Vérifier que le membre n'a pas déjà voté sur ce dossier (UNIQUE)
            const voteExistant = await ComiteVote.findOne({
                where: {
                    demandeInscriptionId: demande.id,
                    membreId: currentUserId,
                },
                transaction,
            })
            if (voteExistant) {
                await transaction.rollback()
                return res.status(400).json({ success: false, message: "Vous avez déjà voté" })
            }

            // Créer le vote
            const vote = await ComiteVote.create({
                demandeInscriptionId: demande.id,
                membreId: currentUserId,
                decision,
                motif: decision === 'valide' ? null : motif,
            }, { transaction })

            // Si rejet immédiat → dossier rejeté
            if (decision === 'rejete') {
                demande.statutPipeline = 'rejete'
                demande.motifPipeline = motif
                await demande.save({ transaction })
                await transaction.commit()

                // Email de rejet (non bloquant)
                ComiteValidationController.envoyerEmailRejet(demande.utilisateurId, motif)

                return res.status(200).json({
                    success: true,
                    data: {
                        demandeId: demande.id,
                        decision,
                        statutPipeline: demande.statutPipeline,
                        quorum: {
                            totalMembres,
                            votesCount: 1,
                            valides: 0,
                            restants: totalMembres - 1,
                            aVote: true,
                            estUnanime: false,
                            estRejete: true,
                        }
                    }
                })
            }

            // Si correction demandée → dossier en correction
            if (decision === 'correction_demandee') {
                demande.statutPipeline = 'correction_demandee'
                demande.motifPipeline = motif
                await demande.save({ transaction })
                await transaction.commit()

                // Email de correction (non bloquant)
                ComiteValidationController.envoyerEmailCorrection(demande.utilisateurId, motif)

                return res.status(200).json({
                    success: true,
                    data: {
                        demandeId: demande.id,
                        decision,
                        statutPipeline: demande.statutPipeline,
                        quorum: {
                            totalMembres,
                            votesCount: 1,
                            valides: 0,
                            restants: totalMembres - 1,
                            aVote: true,
                            estUnanime: false,
                            estRejete: false,
                        }
                    }
                })
            }

            // Décision = 'valide' → vérifier l'unanimité
            const votesValides = await ComiteVote.count({
                where: {
                    demandeInscriptionId: demande.id,
                    decision: 'valide',
                },
                transaction,
            })

            if (votesValides === totalMembres) {
                // Unanimité atteinte → finalisation
                let matriculeFinal: string | null = null

                const bordereau = await Bordereau.findOne({
                    where: { utilisateurId: demande.utilisateurId },
                    order: [['dateSoumission', 'ASC']],
                    transaction,
                })

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
                await demande.save({ transaction })

                // ══════════════════════════════════════════════════════════════
                // CRÉATION DU CURSUS N+1 POUR RÉINSCRIPTION
                // Si la demande est de type 'reinscription', après validation
                // unanime du comité, on crée automatiquement un nouveau
                // CursusApprenant pour le niveau supérieur (N+1), même parcours,
                // année académique +1, classeId=null (à affecter plus tard).
                // L'ancien cursus (niveau N) est conservé (historisation).
                // ══════════════════════════════════════════════════════════════
                if (demande.typeDemande === 'reinscription') {
                    const cursusActuel = await CursusApprenant.findOne({
                        where: { demandeInscriptionId: demande.id },
                        include: [
                            CursusApprenant.associations.parcours,
                            CursusApprenant.associations.niveauEtude,
                            CursusApprenant.associations.anneeAcademique,
                        ],
                        transaction,
                    })

                    if (cursusActuel && cursusActuel.parcours && cursusActuel.niveauEtude && cursusActuel.anneeAcademique) {
                        const nouveauNiveauLibelle = incrementerLibelleNiveau(cursusActuel.niveauEtude.libelle)
                        const anneeActuelleLibelle = cursusActuel.anneeAcademique.libelle
                        const anneeMatch = anneeActuelleLibelle.match(/^(\d{4})-(\d{4})$/)
                        const anneeSupLibelle = anneeMatch
                            ? `${Number(anneeMatch[2]) + 1}-${Number(anneeMatch[1]) + 1}`
                            : `${Number(anneeActuelleLibelle.slice(0, 4)) + 1}-${Number(anneeActuelleLibelle.slice(5)) + 1}`

                        // Recherche ou création du NiveauEtude N+1
                        let niveauSup = await NiveauEtude.findOne({ where: { libelle: nouveauNiveauLibelle }, transaction })
                        if (!niveauSup) {
                            // Si le niveau N+1 n'existe pas encore, on le crée
                            niveauSup = await NiveauEtude.create({
                                libelle: nouveauNiveauLibelle,
                            }, { transaction })
                        }

                        // Recherche ou création de l'AnnéeAcadémique N+1
                        let anneeSup = await AnneeAcademique.findOne({ where: { libelle: anneeSupLibelle }, transaction })
                        if (!anneeSup) {
                            anneeSup = await AnneeAcademique.create({
                                libelle: anneeSupLibelle,
                                description: `Année académique ${anneeSupLibelle}`,
                            }, { transaction })
                        }

                        // Vérification qu'aucun CursusApprenant N+1 n'existe déjà
                        const doublonNPlus1 = await CursusApprenant.findOne({
                            where: {
                                utilisateurId: demande.utilisateurId,
                                parcoursId: cursusActuel.parcoursId,
                                niveauEtudeId: niveauSup.id,
                                anneeAcademiqueId: anneeSup.id,
                            },
                            transaction,
                        })

                        if (!doublonNPlus1) {
                            await CursusApprenant.create({
                                externe: cursusActuel.externe,
                                etablissementId: cursusActuel.etablissementId,
                                intituleParcours: cursusActuel.intituleParcours,
                                parcoursId: cursusActuel.parcoursId,
                                niveauEtudeId: niveauSup.id,
                                classeId: null, // Classe à affecter ultérieurement
                                anneeAcademiqueId: anneeSup.id,
                                demandeInscriptionId: demande.id,
                                utilisateurId: demande.utilisateurId,
                                statutReinscription: 'confirme',
                                dateReinscription: new Date(),
                            }, { transaction })
                        }
                        // Incrémente nombreInscriptions du dossier étudiant (BUG 2)
                        const dossierReins = await DossierEtudiant.findOne({ where: { utilisateurId: demande.utilisateurId }, transaction })
                        if (dossierReins) {
                            await dossierReins.update({ nombreInscriptions: (dossierReins.nombreInscriptions ?? 1) + 1 }, { transaction })
                        }
                    }
                }

                await transaction.commit()

                // Email de validation UNIQUEMENT à l'unanimité
                ComiteValidationController.envoyerEmailValidation(demande.utilisateurId, matriculeFinal)

                return res.status(200).json({
                    success: true,
                    data: {
                        demandeId: demande.id,
                        decision,
                        statutPipeline: demande.statutPipeline,
                        matricule: matriculeFinal,
                        quorum: {
                            totalMembres,
                            votesCount: votesValides,
                            valides: votesValides,
                            restants: 0,
                            aVote: true,
                            estUnanime: true,
                            estRejete: false,
                        }
                    }
                })
            } else {
                // Pas encore unanimité → laisser en attente
                await transaction.commit()

                return res.status(200).json({
                    success: true,
                    data: {
                        demandeId: demande.id,
                        decision,
                        statutPipeline: demande.statutPipeline,
                        quorum: {
                            totalMembres,
                            votesCount: votesValides + 1,
                            valides: votesValides + 1,
                            restants: totalMembres - votesValides - 1,
                            aVote: true,
                            estUnanime: false,
                            estRejete: false,
                        }
                    }
                })
            }
        } catch (error: any) {
            await transaction.rollback().catch(rbErr => console.error('[COMITE][decider] ROLLBACK EN ÉCHEC — transaction possiblement orpheline:', rbErr))
            console.error('[Comite] decider:', error)
            return res.status(400).json({ success: false, message: error.message || 'Erreur interne' })
        }
    }

    /**
     * GET /comite-validations/dossiers/:id/pdf-fusionne
     * Télécharge un PDF multipages contenant tous les documents de l'étudiant.
     */
    static async telechargerPdfFusionne(req: Request, res: Response): Promise<Response> {
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

            // ── Collecter tous les chemins PDF de l'étudiant ──
            const filePaths: string[] = []

            // 1. Bordereaux (fichiers uploadés)
            const bordereaux = await Bordereau.findAll({
                where: { utilisateurId: demande.utilisateurId },
                order: [['dateSoumission', 'ASC']],
            })
            for (const b of bordereaux) {
                if (b.fichier) {
                    const p = path.isAbsolute(b.fichier) ? b.fichier : path.join(process.cwd(), b.fichier)
                    if (fs.existsSync(p)) filePaths.push(p)
                }
            }

            // 2. Quitus
            const quitus = await Quitus.findAll({
                where: { bordereauId: bordereaux.map(b => b.id) },
            })
            for (const q of quitus) {
                if (q.fichierPDF) {
                    const p = path.isAbsolute(q.fichierPDF) ? q.fichierPDF : path.join(process.cwd(), q.fichierPDF)
                    if (fs.existsSync(p)) filePaths.push(p)
                }
            }

            // 3. Reçus de caisse (via DemandeDocument)
            const demandesDocuments = await DemandeDocument.findAll({
                where: { etudiantId: demande.utilisateurId },
                attributes: ['id'],
            })
            const demandeDocIds = demandesDocuments.map(d => d.id)
            if (demandeDocIds.length > 0) {
                const recusCaisse = await RecuCaisse.findAll({
                    where: { demandeDocumentId: { [Op.in]: demandeDocIds } },
                    order: [['datePaiement', 'ASC']],
                })
                for (const r of recusCaisse) {
                    if (r.fichierPDF) {
                        const p = path.isAbsolute(r.fichierPDF) ? r.fichierPDF : path.join(process.cwd(), r.fichierPDF)
                        if (fs.existsSync(p)) filePaths.push(p)
                    }
                }

                // 4. Documents délivrés (via DemandeDocument)
                const documentsDelivres = await DocumentDelivre.findAll({
                    where: { demandeId: { [Op.in]: demandeDocIds } },
                    order: [['dateDelivrance', 'ASC']],
                })
                for (const d of documentsDelivres) {
                    if (d.fichierPDF) {
                        const p = path.isAbsolute(d.fichierPDF) ? d.fichierPDF : path.join(process.cwd(), d.fichierPDF)
                        if (fs.existsSync(p)) filePaths.push(p)
                    }
                }
            }

            // 5. Documents docgen
            const docGenDocs = await DocGenDocument.findAll({
                where: { sourceId: demande.utilisateurId.toString(), sourceType: 'etudiant' },
                order: [['createdAt', 'ASC']],
            })
            for (const d of docGenDocs) {
                if (d.filePath) {
                    const p = path.isAbsolute(d.filePath) ? d.filePath : path.join(process.cwd(), d.filePath)
                    if (fs.existsSync(p)) filePaths.push(p)
                }
            }

            // 6. Pièces justificatives déposées au wizard (table ins_dossiers_demandes)
            // C'est la source principale : sans elle, le PDF ne contenait ni CNI,
            // ni photo d'identité, ni justificatif de scolarité — les pièces que
            // le comité voit pourtant dans le dossier affiché à l'écran.
            const piecesJustificatives = await DemandeInscriptionDossier.findAll({
                where: { demandeId: demande.id },
                attributes: { exclude: ['id'] },
                order: [['dossierId', 'ASC']],
            })
            for (const piece of piecesJustificatives) {
                if (!piece.nomFichier) continue
                // Même résolution que DocumentDossierController : chemin relatif
                // complet en base (nouvelle arborescence) sinon dépôt plat.
                let p = path.resolve(process.cwd(), piece.nomFichier)
                if (!fs.existsSync(p)) {
                    p = path.resolve(process.cwd(), 'public/inscription/dossiers', path.basename(piece.nomFichier))
                }
                if (fs.existsSync(p)) filePaths.push(p)
            }

            if (filePaths.length === 0) {
                return res.status(404).json({ success: false, message: "Aucun document trouvé pour cet étudiant" })
            }

            // ── Fusionner les pièces ──
            const matricule = demande.matricule || `etudiant_${demande.utilisateurId}`
            const fusion = await PdfMergeService.mergeStudentPdfs(matricule, filePaths)

            if (fusion.ignores.length > 0) {
                console.warn(
                    `[Comite] ${fusion.ignores.length} pièce(s) écartée(s) pour ${matricule}:`,
                    fusion.ignores.join(', ')
                )
            }

            // ── Envoyer le fichier ──
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', `attachment; filename="dossier_${matricule}.pdf"`)
            fs.createReadStream(fusion.outputPath).pipe(res)

            // Nettoyer le fichier temporaire après envoi
            res.on('finish', () => {
                try { fs.unlinkSync(fusion.outputPath) } catch (e) { /* ignore */ }
            })

            return res
        } catch (error) {
            console.error('[Comite] telechargerPdfFusionne:', error)
            return res.status(500).json({ success: false, message: 'Erreur lors de la génération du PDF' })
        }
    }

    /**
     * GET /comite-validations/dossiers/:id/votes
     * Liste les votes d'un dossier.
     */
    static async listerVotes(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole
            if (role != RolesUtilisateur.COMITE_ORIENTATION && role != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }

            const demande = await DemandeInscription.findByPk(req.params.id)
            if (!demande) {
                return res.status(404).json({ success: false, message: "Dossier non trouvé" })
            }

            const votes = await ComiteVote.findAll({
                where: { demandeInscriptionId: req.params.id },
                include: [
                    {
                        association: ComiteVote.associations.membre,
                        attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email']
                    }
                ],
                order: [['createdAt', 'DESC']],
            })

            const votesPlain = votes.map(v => {
                const plain: any = v.get({ plain: true })
                return {
                    ...plain,
                    membre: plain.membre ? plain.membre.get({ plain: true }) : null
                }
            })

            return res.status(200).json({ data: votesPlain })
        } catch (error) {
            console.error('[Comite] listerVotes:', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }

    // ── Méthodes privées d'envoi d'emails ──

    private static async envoyerEmailValidation(utilisateurId: number, matricule: string | null) {
        try {
            const utilisateur = await Utilisateur.findByPk(utilisateurId)
            if (utilisateur?.email) {
                const nomComplet = `${utilisateur.prenoms || ''} ${utilisateur.nom || ''}`.trim() || 'étudiant(e)'
                EmailSender.getInstance().sendPdf(
                    utilisateur.email,
                    nomComplet,
                    "ESA ECOLE: Félicitations — Votre inscription a été validée",
                    `<p>Cher ${nomComplet},</p>
                     <p>Nous avons le plaisir de vous informer que votre dossier d'inscription a été examiné et <strong>validé par le comité</strong>.</p>
                     <p>Votre dossier étudiant a été officiellement créé.</p>
                     <p><strong>Matricule : ${matricule}</strong></p>
                     <p>Nous vous invitons à conserver précieusement votre matricule et à vous rendre au <strong>Secrétariat de l'établissement</strong> afin de retirer votre autorisation provisoire d'inscription.</p>
                     <p>Cordialement,<br>Le Secrétariat — ESA ECOLE</p>`,
                    '', ''
                )
            }
        } catch (emailError) {
            console.error("Erreur envoi email validation:", emailError)
        }
    }

    private static async envoyerEmailRejet(utilisateurId: number, motif: string) {
        try {
            const utilisateur = await Utilisateur.findByPk(utilisateurId)
            if (utilisateur?.email) {
                const nomComplet = `${utilisateur.prenoms || ''} ${utilisateur.nom || ''}`.trim() || 'étudiant(e)'
                EmailSender.getInstance().sendPdf(
                    utilisateur.email,
                    nomComplet,
                    "ESA ECOLE: Décision du comité concernant votre inscription",
                    `<p>Cher ${nomComplet},</p>
                     <p>Après examen de votre dossier, le comité d'inscription a rendu une décision de <strong>rejet</strong>.</p>
                     <p><strong>Motif :</strong> ${motif}</p>
                     <p>Cordialement,<br>Service des inscriptions — ESA ECOLE</p>`,
                    '', ''
                )
            }
        } catch (emailError) {
            console.error("Erreur envoi email rejet:", emailError)
        }
    }

    private static async envoyerEmailCorrection(utilisateurId: number, motif: string) {
        try {
            const utilisateur = await Utilisateur.findByPk(utilisateurId)
            if (utilisateur?.email) {
                const nomComplet = `${utilisateur.prenoms || ''} ${utilisateur.nom || ''}`.trim() || 'étudiant(e)'
                EmailSender.getInstance().sendPdf(
                    utilisateur.email,
                    nomComplet,
                    "ESA ECOLE: Correction requise sur votre dossier d'inscription",
                    `<p>Cher ${nomComplet},</p>
                     <p>Le comité d'inscription demande des <strong>corrections</strong> sur votre dossier.</p>
                     <p><strong>Motif :</strong> ${motif}</p>
                     <p>Merci de vous rapprocher du service des inscriptions pour régulariser votre situation.</p>
                     <p>Cordialement,<br>Service des inscriptions — ESA ECOLE</p>`,
                    '', ''
                )
            }
        } catch (emailError) {
            console.error("Erreur envoi email correction:", emailError)
        }
    }
}
