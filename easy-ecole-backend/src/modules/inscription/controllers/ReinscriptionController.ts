import { Request, Response } from "express";
import { Op } from "sequelize";
import * as fs from "fs";
import * as path from "path";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { CursusApprenant } from "../models/CursusApprenant";
import { Session } from "../models/Session";
import { DemandeInscription } from "../models/DemandeInscription";
import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier";
import { DossierInscription } from "../models/DossierInscription";
import { Bordereau } from "../models/Bordereau";
import { TypeOperationBordereau } from "../models/TypeOperationBordereau";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

/**
 * Les 6 pièces obligatoires du dossier de réinscription (step 2 du wizard).
 * Réutilisées par getEligibilite pour guider l'étudiant et par le comité
 * pour les points de contrôle spécifiques.
 */
export const DOCUMENTS_REINSCRIPTION: Array<{ code: string; libelle: string; obligatoire: boolean }> = [
  { code: 'demande_dg', libelle: 'Demande adressée au Directeur Général', obligatoire: true },
  { code: 'autorisation_provisoire', libelle: 'Copie simple de l\u2019autorisation provisoire d\u2019inscription', obligatoire: true },
  { code: 'releves_notes', libelle: 'Copie des relevés de notes obtenus', obligatoire: true },
  { code: 'cni', libelle: 'Copie de la carte d\u2019identité nationale', obligatoire: true },
  { code: 'quitus_bordereaux_annee', libelle: 'Quitus définitif et bordereaux de l\u2019année écoulée', obligatoire: true },
  { code: 'bordereau_nouvelle_annee', libelle: 'Bordereau d\u2019inscription de la nouvelle année', obligatoire: true },
];

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

            // Session de réinscription ouverte : la session la plus récente (non passée)
            // rattachée à l'établissement du cursus, avec son année académique.
            // On exclut les sessions où l'utilisateur a déjà une demande,
            // et on privilégie une session dont l'année académique est postérieure
            // à celle du cursus courant.
            const demandes = await DemandeInscription.findAll({
                where: { utilisateurId: userId },
                attributes: ['sessionId'],
            })
            const sessionIdsUtilisees = demandes.map(d => d.sessionId)

            const sessionCible = await Session.findOne({
                where: {
                    ...(cursus?.anneeAcademiqueId ? {
                        [Op.and]: [
                            { dateFin: { [Op.gte]: new Date() } },
                            { anneeAcademiqueId: { [Op.gt]: cursus.anneeAcademiqueId } },
                            ...(cursus?.etablissementId ? [{ etablissementId: cursus.etablissementId }] : []),
                            ...(sessionIdsUtilisees.length ? [{ id: { [Op.notIn]: sessionIdsUtilisees } }] : []),
                        ]
                    } : {
                        dateFin: { [Op.gte]: new Date() },
                        ...(cursus?.etablissementId ? { etablissementId: cursus.etablissementId } : {}),
                        ...(sessionIdsUtilisees.length ? { id: { [Op.notIn]: sessionIdsUtilisees } } : {}),
                    }),
                },
                order: [['dateFin', 'ASC']],
                include: [Session.associations.anneeAcademique],
            })

            return res.status(200).json({
                success: true,
                dejaInscrit,
                estReinscription: !!dossier && (dossier.nombreInscriptions ?? 1) > 1,
                soldeDette: Math.round(soldeDette * 100) / 100,
                documentsRequis: DOCUMENTS_REINSCRIPTION,
                sessionCible: sessionCible ? {
                    id: sessionCible.id,
                    dateDebut: sessionCible.dateDebut,
                    dateFin: sessionCible.dateFin,
                    description: sessionCible.description,
                    anneeAcademique: sessionCible.anneeAcademique ? {
                        id: sessionCible.anneeAcademique.id,
                        libelle: sessionCible.anneeAcademique.libelle,
                    } : null,
                } : null,
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
     * Soumet un dossier de réinscription complet (wizard — étape 4 « confirmation »).
     *
     * Crée une `DemandeInscription` de type 'reinscription' positionnée sur le
     * pipeline (`statutPipeline = 'soumis'`), persist les 6 documents obligatoires
     * (GED), puis crée le bordereau de paiement REINSCRIPTION. Aucun nouveau
     * `DossierEtudiant` n'est créé : on réutilise l'existant (règle réinscription).
     *
     * Le pipeline (Cabinet → ESA Compta → Comité) fonctionne ensuite tel quel :
     * `BordereauController.validerBordereau` retrouve la dernière demande de
     * l'utilisateur (la notre) et la fait passer de 'soumis' à 'authentifie'.
     *
     * Corps multipart attendu :
     *   - fichiers documents, un par champ de code : demande_dg, autorisation_provisoire,
     *     releves_notes, cni, quitus_bordereaux_annee, bordereau_nouvelle_annee
     *   - champ 'bordereau' : fichier du bordereau de paiement réinscription
     *   - body : sessionId (obligatoire), classeId?, niveauEtudeId?, montant?,
     *     referenceBancaire?, modalite?, anneeEcoulee?
     */
    static async soumettre(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        const userId = (req as any).utilisateurId

        if (role !== RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false, message: "Accès réservé aux étudiants" })
        }

        const files: any = (req as any).files || {}
        const { sessionId, classeId, niveauEtudeId } = req.body

        try {
            // Précondition : être déjà un étudiant inscrit (DossierEtudiant existant)
            const dossier = await DossierEtudiant.findOne({ where: { utilisateurId: userId } })
            if (!dossier) {
                return res.status(400).json({ success: false, message: "Aucun dossier étudiant : la réinscription est réservée aux étudiants déjà inscrits." })
            }

            // Session cible requise
            const session = await Session.findByPk(sessionId)
            if (!session) {
                return res.status(400).json({ success: false, message: "Session de réinscription introuvable" })
            }

            // Toute demande existante (inscription ou réinscription) sur cette session
            // empêche la soumission d'une nouvelle demande (contrainte session-utilisateur).
            const dejaEnCours = await DemandeInscription.findOne({
                where: {
                    utilisateurId: userId,
                    sessionId,
                },
            })
            if (dejaEnCours) {
                return res.status(409).json({ success: false, message: "Vous avez déjà une demande (inscription ou réinscription) pour cette session. Il est impossible de soumettre une nouvelle demande sur la même session." })
            }

            // Le bordereau de paiement est obligatoire
            const bordereauFile = files['bordereau']?.[0] as Express.Multer.File | undefined
            if (!bordereauFile) {
                return res.status(400).json({ success: false, message: "Bordereau de paiement de réinscription requis" })
            }

            // Vérifier que les 6 documents obligatoires sont tous présents
            const docsManquants = DOCUMENTS_REINSCRIPTION
                .filter(d => d.obligatoire && !(files[d.code]?.[0]))
                .map(d => d.libelle)
            if (docsManquants.length > 0) {
                return res.status(400).json({ success: false, message: `Documents manquants : ${docsManquants.join(', ')}` })
            }

            const transaction = await DatabaseConnection.getInstance().sequelize.transaction()

            let demande: DemandeInscription
            try {
                // 1) Demande de réinscription (pipeline 'soumis')
                demande = await DemandeInscription.create({
                    matricule: IDGenerator.getInstance().generateInscriptionMatricule(),
                    typeDemande: 'reinscription',
                    statutPipeline: 'soumis',
                    soumissionComite: false,
                    dateDemande: new Date(),
                    sessionId: Number(sessionId),
                    utilisateurId: userId,
                    etablissementId: session.etablissementId,
                }, { transaction })

                // 2) Persister les 6 documents (déjà écrits par multer vers le disque).
                // On les rattache tous à un dossier documentaire « réinscription »
                // (créé idempotent pour la session cible). Le code du document est
                // préfixé dans le nom de fichier pour identification côté comité.
                const dossierReinscription = await DossierInscription.findOrCreate({
                    where: { titre: 'reinscription-6-pieces', sessionId: Number(sessionId) },
                    defaults: {
                        titre: 'reinscription-6-pieces',
                        description: 'Pièces obligatoires du dossier de réinscription (6 documents)',
                        tailleMax: 20,
                        sessionId: Number(sessionId),
                    },
                    transaction,
                }).then(([d]) => d)

                const UPLOAD_DIR = path.resolve('public', 'inscription', 'reinscription', 'dossiers')
                if (!fs.existsSync(UPLOAD_DIR)) {
                    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
                }
                for (const d of DOCUMENTS_REINSCRIPTION) {
                    const f = files[d.code]?.[0] as Express.Multer.File | undefined
                    if (!f) continue
                    const destName = `${d.code}_${f.filename}`
                    const destPath = path.join(UPLOAD_DIR, destName)
                    fs.renameSync(path.resolve(f.path), destPath)
                    // On stocke un chemin relatif dans nomFichier pour que
                    // DocumentDossierController.download (résolution #1) retrouve
                    // le fichier : path.resolve(cwd, nomFichier).
                    const relPath = path.join('public/inscription/reinscription/dossiers', destName).replace(/\\/g, '/')
                    await DemandeInscriptionDossier.findOrCreate({
                        where: { demandeId: demande.id, nomFichier: relPath },
                        defaults: { demandeId: demande.id, dossierId: dossierReinscription.id, nomFichier: relPath },
                        transaction,
                    })
                }

                // 3) Bordereau de paiement REINSCRIPTION
                const typeReinscription = await TypeOperationBordereau.findOne({ where: { code: 'REINSCRIPTION' } })
                const bordereau = await Bordereau.create({
                    type: 'inscription',
                    typeOperationId: typeReinscription?.id ?? null,
                    utilisateurId: userId,
                    fichier: bordereauFile.filename,
                    montant: req.body.montant ? Number(req.body.montant) : null,
                    referenceBancaire: req.body.referenceBancaire ?? null,
                    modalite: req.body.modalite ?? '1x',
                    statut: 'en_attente',
                    statutPaiement: 'pending',
                    dateSoumission: new Date(),
                }, { transaction })

                await transaction.commit()

                return res.status(201).json({
                    success: true,
                    demandeId: demande.id,
                    matricule: demande.matricule,
                    statutPipeline: 'soumis',
                    bordereauId: bordereau.id,
                    message: "Dossier de réinscription soumis avec succès. Il part à la validation du cabinet comptable.",
                })
            } catch (error) {
                await transaction.rollback()
                const err = error as any
                if (err?.name === 'SequelizeUniqueConstraintError' || err?.original?.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ success: false, message: 'Une demande existe déjà pour cette session (contrainte session-utilisateur).' })
                }
                throw error
            }
        } catch (error) {
            console.error('[soumettreReinscription]', error)
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
