import { Request, Response } from "express";
import { Transaction, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { CursusApprenant } from "../models/CursusApprenant";
import { Session } from "../models/Session";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

export interface PeutSeReinscrireResponse {
    autorise: boolean
    bloquante: boolean
    soldeDette: number
    details: {
        dossierId: number
        matricule: string
        nbEcheancesImpayees: number
        nbEcheancesPartielles: number
        nbEcheancesEnRetard: number
        lignes: Array<{
            id: number
            type: string
            numero: number
            montant: number
            montantPaye: number
            reste: number
            dateLimite: string
            statut: string
        }>
    } | null
}

/**
 * Contrôleur de réinscription.
 *
 * Règles métier (LMD) :
 *  - La dette est AFFICHÉE à l'étudiant mais elle NE BLOQUE PAS la réinscription
 *    d'année en année (L1 -> L2 -> L3, etc.).
 *  - Le solde de la totalité des crédits / frais est exigé uniquement à la
 *    validation du diplôme (Licence L3, Master M, Doctorat D).
 *
 * Le workflow de planification réutilise `CursusApprenant` (via les champs
 * `statutReinscription` / `dateReinscription`) sans créer de double dossier.
 */
export default class ReinscriptionController {

    static async peutSeReinscrire(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        const userId = (req as any).utilisateurId

        if (role !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Accès réservé aux étudiants" })
        }

        const sequelize = DatabaseConnection.getInstance().sequelize
        const transaction = await sequelize.transaction()

        try {
            const dossiers = await DossierEtudiant.findAll({
                where: { utilisateurId: userId },
                transaction,
            })

            if (dossiers.length === 0) {
                await transaction.commit()
                return res.status(200).json({
                    autorise: true,
                    bloquante: false,
                    soldeDette: 0,
                    details: null,
                } as PeutSeReinscrireResponse)
            }

            const echeances = await Echeance.findAll({
                where: {
                    dossierEtudiantId: { [Op.in]: dossiers.map(d => d.id) },
                    statut: ['impaye', 'partiel', 'en_retard'],
                },
                order: [['dateLimite', 'ASC']],
                transaction,
            })

            const soldeDette = echeances.reduce((s, e) => s + (e.montant - (e.montantPaye || 0)), 0)

            const lignes = echeances.map(e => ({
                id: e.id,
                type: e.type,
                numero: e.numeroEcheance,
                montant: e.montant,
                montantPaye: e.montantPaye || 0,
                reste: e.montant - (e.montantPaye || 0),
                dateLimite: String(e.dateLimite),
                statut: e.statut,
                dossierId: e.dossierEtudiantId,
            }))

            await transaction.commit()

            return res.status(200).json({
                // La dette n'est PAS bloquante pour la réinscription (règle LMD).
                // `autorise` reste un indicateur de solvabilité (info affichée à
                // l'étudiant), mais la planification n'est pas refusée pour dette.
                autorise: soldeDette <= 0,
                bloquante: false,
                soldeDette: Math.round(soldeDette * 100) / 100,
                details: {
                    dossierId: dossiers[0].id,
                    matricule: dossiers[0].matricule,
                    nbDossiers: dossiers.length,
                    nbEcheancesImpayees: echeances.filter(e => e.statut === 'impaye').length,
                    nbEcheancesPartielles: echeances.filter(e => e.statut === 'partiel').length,
                    nbEcheancesEnRetard: echeances.filter(e => e.statut === 'en_retard').length,
                    lignes,
                },
            } as PeutSeReinscrireResponse)
        } catch (error) {
            await transaction.rollback()
            console.error('[peutSeReinscrire]', error)
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
        }
    }

    /**
     * Éligibilité à la réinscription planifiée.
     * Retourne le cursus actuel (parcours / niveau / classe / année), le dossier
     * et le solde de dette — sans bloquer. Indique aussi si l'étudiant est déjà
     * inscrit (un non-étudiant n'a pas accès au menu / workflow).
     */
    static async getEligibilite(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        const userId = (req as any).utilisateurId

        if (role !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Accès réservé aux étudiants" })
        }

        try {
            const cursus = await CursusApprenant.findOne({
                where: { utilisateurId: userId },
                order: [['createdAt', 'DESC']],
                include: [
                    CursusApprenant.associations.parcours,
                    CursusApprenant.associations.niveauEtude,
                    CursusApprenant.associations.classe,
                    CursusApprenant.associations.anneeAcademique,
                ],
            })

            const dossier = await DossierEtudiant.findOne({ where: { utilisateurId: userId } })

            // Solde de dette (réutilise la même logique qu'au-dessus)
            const echeances = dossier ? await Echeance.findAll({
                where: { dossierEtudiantId: dossier.id, statut: ['impaye', 'partiel', 'en_retard'] },
            }) : []
            const soldeDette = echeances.reduce((s, e) => s + (e.montant - (e.montantPaye || 0)), 0)

            // Est-il déjà inscrit ? Un non-étudiant n'est pas éligible.
            const dejaInscrit = !!cursus

            return res.status(200).json({
                success: true,
                dejaInscrit,
                soldeDette: Math.round(soldeDette * 100) / 100,
                cursus: cursus ? {
                    id: cursus.id,
                    statutReinscription: cursus.statutReinscription,
                    dateReinscription: cursus.dateReinscription,
                    parcours: cursus.parcours,
                    niveauEtude: cursus.niveauEtude,
                    classe: cursus.classe,
                    anneeAcademique: cursus.anneeAcademique,
                } : null,
                dossier: dossier ? {
                    id: dossier.id,
                    matricule: dossier.matricule,
                    nombreInscriptions: dossier.nombreInscriptions,
                } : null,
            })
        } catch (error) {
            console.error('[getEligibilite]', error)
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
        }
    }

    /**
     * Crée une planification de réinscription.
     * Crée un nouveau `CursusApprenant` en `en_attente` pour la session / classe /
     * niveau / année cibles, en réutilisant le parcours et l'utilisateur du cursus
     * actuel (aucune ressaisie des infos perso). Non destructif : l'ancien cursus
     * est conservé.
     */
    static async creerPlanification(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        const userId = (req as any).utilisateurId

        if (role !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Accès réservé aux étudiants" })
        }

        const { sessionId, classeId, niveauEtudeId, anneeAcademiqueId } = req.body

        try {
            const cursusActuel = await CursusApprenant.findOne({
                where: { utilisateurId: userId },
                order: [['createdAt', 'DESC']],
            })

            if (!cursusActuel) {
                return res.status(400).json({ success: false, message: "Aucun cursus : ce compte n'est pas un étudiant déjà inscrit." })
            }

            // Vérifier la session cible
            const session = await Session.findByPk(sessionId)
            if (!session) {
                return res.status(400).json({ success: false, message: "Session de réinscription introuvable" })
            }

            // Pas de planification dupliquée sur la même session cible
            const doublon = await CursusApprenant.findOne({
                where: {
                    utilisateurId: userId,
                    anneeAcademiqueId: anneeAcademiqueId || session.anneeAcademiqueId,
                    statutReinscription: { [Op.in]: ['en_attente', 'confirme'] },
                },
            })
            if (doublon) {
                return res.status(409).json({ success: false, message: "Une planification de réinscription existe déjà pour cette session." })
            }

            const planification = await CursusApprenant.create({
                externe: cursusActuel.externe,
                etablissementId: cursusActuel.etablissementId,
                intituleParcours: cursusActuel.intituleParcours,
                parcoursId: cursusActuel.parcoursId,
                classeId: classeId || cursusActuel.classeId,
                niveauEtudeId: niveauEtudeId || cursusActuel.niveauEtudeId,
                anneeAcademiqueId: anneeAcademiqueId || session.anneeAcademiqueId,
                utilisateurId: userId,
                statutReinscription: 'en_attente',
                dateReinscription: new Date(),
            })

            return res.status(201).json({ success: true, planification })
        } catch (error) {
            console.error('[creerPlanification]', error)
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
        }
    }

    /**
     * Liste les planifications de réinscription de l'apprenant connecté (suivi du statut).
     */
    static async getMesPlanifications(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        const userId = (req as any).utilisateurId

        if (role !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Accès réservé aux étudiants" })
        }

        try {
            const planifications = await CursusApprenant.findAll({
                where: { utilisateurId: userId, statutReinscription: { [Op.in]: ['en_attente', 'confirme', 'abandon', 'desactive'] } },
                order: [['createdAt', 'DESC']],
                include: [
                    CursusApprenant.associations.parcours,
                    CursusApprenant.associations.niveauEtude,
                    CursusApprenant.associations.classe,
                    CursusApprenant.associations.anneeAcademique,
                ],
            })

            return res.status(200).json({ success: true, planifications })
        } catch (error) {
            console.error('[getMesPlanifications]', error)
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
        }
    }

    /**
     * Annule une planification de réinscription (réservé à l'apprenant propriétaire
     * ou à l'admin/institution). Pose statutReinscription = 'abandon'.
     */
    static async annulerPlanification(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        const userId = (req as any).utilisateurId
        const id = req.params.id

        const isGestionnaire = role !== RolesUtilisateur.APPRENANT

        try {
            const where: any = { id, statutReinscription: 'en_attente' }
            if (!isGestionnaire) where.utilisateurId = userId

            const planification = await CursusApprenant.findOne({ where })
            if (!planification) {
                return res.status(404).json({ success: false, message: "Planification introuvable ou non annulable" })
            }

            await planification.update({ statutReinscription: 'abandon' })
            return res.status(200).json({ success: true, message: "Planification annulée" })
        } catch (error) {
            console.error('[annulerPlanification]', error)
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
        }
    }

    /**
     * Confirme une planification (réservé admin / institution).
     * Pose statutReinscription = 'confirme'.
     */
    static async confirmerPlanification(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Réservé à l'administration" })
        }

        const id = req.params.id
        try {
            const planification = await CursusApprenant.findOne({ where: { id, statutReinscription: 'en_attente' } })
            if (!planification) {
                return res.status(404).json({ success: false, message: "Planification introuvable ou déjà traitée" })
            }
            await planification.update({ statutReinscription: 'confirme' })
            return res.status(200).json({ success: true, message: "Planification confirmée" })
        } catch (error) {
            console.error('[confirmerPlanification]', error)
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
        }
    }
}
