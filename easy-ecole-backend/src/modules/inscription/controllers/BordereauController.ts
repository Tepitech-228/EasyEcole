import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import fs from "fs";
import path from "path";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Quitus } from "../models/Quitus";
import { PaiementInscription } from "../models/PaiementInscription";
import { Session } from "../models/Session";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { CursusApprenant } from "../models/CursusApprenant";
import { CoursParticipant } from "../models/CoursParticipant";
import { EtatsCoursChoisi } from "../../../core/enums/EtatsCoursChoisi";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";

export default class BordereauController {

    constructor() { }

    static async getAllBordereaux(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Bordereau>> = {
            include: [
                { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
                Bordereau.associations.utilisateur,
                Bordereau.associations.validePar,
                Bordereau.associations.quitus
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { utilisateurId: (req as any).utilisateurId }
        }

        if (req.query.statut) {
            options.where = { ...options.where, statut: req.query.statut as string }
        }

        if (req.query.echeanceId) {
            options.where = { ...options.where, echeanceId: req.query.echeanceId as string }
        }

        if (req.query.type) {
            options.where = { ...options.where, type: req.query.type as string }
        }

        // Filters par année, niveau, parcours
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
            let bordereaux: Bordereau[];
            bordereaux = await Bordereau.findAll(options);

            return res.status(200).send(bordereaux);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getBordereau(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Bordereau>> = {
            where: { id: req.params.id },
            include: [
                { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
                Bordereau.associations.utilisateur,
                Bordereau.associations.validePar,
                Bordereau.associations.quitus
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { ...options.where, utilisateurId: (req as any).utilisateurId }
        }

        try {
            const bordereau: Bordereau | null = await Bordereau.findOne(options);

            if (bordereau == null)
                return res.status(404).json({ success: false, message: "Bordereau non trouvé" });

            return res.status(200).send(bordereau);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createBordereau(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        if (!req.body.type || !['inscription', 'scolarite'].includes(req.body.type)) {
            return res.status(400).json({ success: false, message: "Type de bordereau requis (inscription ou scolarite)" });
        }

        if (req.body.type === 'scolarite') {
            const echeance = await Echeance.findByPk(req.body.echeanceId)
            if (echeance == null) {
                return res.status(404).json({ success: false, message: "Échéance non trouvée" });
            }
        }

        let fichier: string | null = null
        let files: any = req.files
        if (files && files['fichier']) {
            let fichierFile: Express.Multer.File | undefined = (files['fichier'])[0] as Express.Multer.File | undefined
            if (fichierFile) {
                fichier = fichierFile.filename
            }
        }

        if (fichier == null) {
            return res.status(400).json({ success: false, message: "Fichier bordereau requis" });
        }

        let bordereau: Bordereau = new Bordereau();
        bordereau.type = req.body.type
        bordereau.echeanceId = req.body.type === 'scolarite' ? req.body.echeanceId : null
        bordereau.utilisateurId = (req as any).utilisateurId
        bordereau.fichier = fichier
        bordereau.montant = req.body.montant
        bordereau.referenceBancaire = req.body.referenceBancaire ?? null
        bordereau.statut = 'en_attente'
        bordereau.dateSoumission = new Date()

        await bordereau.save()
            .then(async (bordereau) => {
                return res.status(201).send(bordereau);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async validerBordereau(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.CABINET_COMPTABLE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let bordereau: Bordereau | null = await Bordereau.findByPk(req.params.id, {
            include: [
                { association: Bordereau.associations.echeance, include: [Echeance.associations.dossierEtudiant] },
                Bordereau.associations.utilisateur
            ]
        });

        if (bordereau == null) {
            return res.status(404).json({ success: false, message: "Bordereau non trouvé" });
        }

        if (bordereau.statut != 'en_attente') {
            return res.status(400).json({ success: false, message: "Bordereau déjà traité" });
        }

        const bordereauType = bordereau.type

        if (bordereauType === 'scolarite' && !bordereau.echeance) {
            return res.status(400).json({ success: false, message: "Échéance associée introuvable" });
        }

        bordereau.statut = 'valide'
        bordereau.dateValidation = new Date()
        bordereau.valideParId = (req as any).utilisateurId
        bordereau.commentaire = req.body.commentaire ?? null

        const echeance = bordereau.echeance

        try {
            if (bordereauType === 'inscription') {
                const existingDossier = await DossierEtudiant.findOne({
                    where: { utilisateurId: bordereau.utilisateurId }
                })

                if (!existingDossier) {
                    const demande = await DemandeInscription.findOne({
                        where: { utilisateurId: bordereau.utilisateurId },
                        include: [
                            { association: DemandeInscription.associations.session, include: [Session.associations.fraisInscription] },
                            { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] }
                        ],
                        order: [['createdAt', 'DESC']]
                    })

                    if (demande) {
                        const fraisTotal = demande.session?.fraisInscription?.reduce((sum, f) => sum + f.montant, 0) || 0
                        const parcoursChoisi = demande.parcoursChoisis?.find(pc => pc.choixFinal == true)
                        const demarrage = parcoursChoisi?.createdAt || demande.createdAt || new Date()

                        let dossier = new DossierEtudiant()
                        dossier.utilisateurId = bordereau.utilisateurId
                        dossier.matricule = demande.matricule
                        dossier.codeQR = JSON.stringify({ matricule: demande.matricule, utilisateurId: bordereau.utilisateurId })
                        dossier.statut = 'actif'
                        dossier.fraisScolarite = fraisTotal
                        dossier.modePaiement = 'mensuel'
                        dossier.nbMensualites = 10
                        dossier.demarrageParcours = demarrage

                        await dossier.save()

                        if (echeance) {
                            echeance.dossierEtudiantId = dossier.id
                        }

                        const montantParMois = fraisTotal / 10
                        const debut = new Date(demarrage)
                        for (let i = 0; i < 10; i++) {
                            const dateLimite = new Date(debut.getFullYear(), debut.getMonth() + i, 5)
                            const moisConcerne = debut.getFullYear() + '-' + String(debut.getMonth() + i + 1).padStart(2, '0')

                            let echeanceScolarite = new Echeance()
                            echeanceScolarite.dossierEtudiantId = dossier.id
                            echeanceScolarite.type = 'scolarite'
                            echeanceScolarite.numeroEcheance = i + 1
                            echeanceScolarite.montant = montantParMois
                            echeanceScolarite.dateLimite = dateLimite
                            echeanceScolarite.statut = 'impaye'
                            echeanceScolarite.moisConcerne = moisConcerne

                            await echeanceScolarite.save()
                        }

                        if (bordereau.utilisateur) {
                            EmailSender.getInstance().sendQuitusEtMatricule(
                                bordereau.utilisateur.identifiant,
                                bordereau.utilisateur.email,
                                demande.matricule
                            ).catch(err => console.error("Erreur envoi email matricule:", err))
                        }
                    }
                }
            }
            else if (bordereauType === 'scolarite' && echeance) {
                const existingQuitus = await Quitus.findOne({ where: { bordereauId: bordereau.id } })
                if (!existingQuitus) {
                    const dossier = await DossierEtudiant.findByPk(echeance.dossierEtudiantId, {
                        include: [DossierEtudiant.associations.utilisateur]
                    })

                    if (dossier) {
                        const code = 'QTS-' + IDGenerator.getInstance().generateNumeroPaiement()
                        const etudiantNom = dossier.utilisateur ? dossier.utilisateur.nom + ' ' + dossier.utilisateur.prenoms : 'Étudiant'

                        const filename = DocumentPDFGenerator.generateQuitus(
                            bordereau.id,
                            code,
                            etudiantNom,
                            dossier.matricule,
                            bordereau.montant,
                            new Date(),
                            "public/inscription/quitus/"
                        )

                        let quitus = new Quitus()
                        quitus.bordereauId = bordereau.id
                        quitus.code = code
                        quitus.fichierPDF = filename
                        quitus.statut = 'genere'

                        await quitus.save()

                        if (dossier.utilisateur) {
                            EmailSender.getInstance().sendQuitusEtMatricule(
                                dossier.utilisateur.identifiant,
                                dossier.utilisateur.email,
                                dossier.matricule
                            ).catch(err => console.error("Erreur envoi email quitus:", err))
                        }
                    }
                }
            }

            if (echeance) {
                echeance.statut = 'paye'
                echeance.datePaiement = new Date()
                await echeance.save()
            }
            await bordereau.save()

            try {
                const compteCreditNumero = bordereauType === 'scolarite' ? '701' : '702'
                await creerEcritureComptable({
                    req,
                    journalCode: 'VEN',
                    compteDebitNumero: '512',
                    compteCreditNumero,
                    montant: bordereau.montant,
                    libelle: `Paiement bordereau #${bordereau.id} - ${bordereauType}`,
                    reference: bordereau.referenceBancaire ?? `bordereau-${bordereau.id}`,
                    moduleSource: 'inscription',
                    referenceModuleId: String(bordereau.id)
                })
            } catch (comptaError) {
                console.error("Erreur écriture comptable (non bloquante):", comptaError)
            }

            try {
                const demande = await DemandeInscription.findOne({
                    where: { utilisateurId: bordereau.utilisateurId },
                    order: [['createdAt', 'DESC']]
                })
                if (demande?.matricule) {
                    const paiement = new PaiementInscription()
                    paiement.numero = 'PAY-' + IDGenerator.getInstance().generateNumeroPaiement()
                    paiement.datePaiement = new Date()
                    paiement.montant = bordereau.montant
                    paiement.matriculeInscription = demande.matricule
                    paiement.type = TypesPaiement.EN_LIGNE
                    paiement.utilisateurId = bordereau.utilisateurId
                    paiement.description = `Paiement par bordereau #${bordereau.id} (${bordereauType})`
                    await paiement.save()
                }
            } catch (paiementError) {
                console.error("Erreur création PaiementInscription (non bloquante):", paiementError)
            }

            // Finaliser la demande d'inscription si bordereau de type inscription
            if (bordereauType === 'inscription') {
                try {
                    const demandeToValidate = await DemandeInscription.findOne({
                        where: { utilisateurId: bordereau.utilisateurId },
                        include: [
                            { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                            { association: DemandeInscription.associations.coursChoisis },
                            DemandeInscription.associations.utilisateur,
                        ],
                        order: [['createdAt', 'DESC']]
                    })

                    if (demandeToValidate && !demandeToValidate.dateValidation) {
                        await demandeToValidate.update({ dateValidation: new Date() })

                        if (demandeToValidate.utilisateur) {
                            const parcoursChoisiFinal = demandeToValidate.parcoursChoisis?.find(pc => pc.choixFinal == true)
                            const cursusApprenant = new CursusApprenant()
                            cursusApprenant.externe = false
                            cursusApprenant.parcoursId = parcoursChoisiFinal?.parcoursId!
                            cursusApprenant.niveauEtudeId = parcoursChoisiFinal?.parcours?.niveauEtudeId!
                            cursusApprenant.utilisateurId = demandeToValidate.utilisateurId
                            cursusApprenant.demandeInscriptionId = demandeToValidate.id

                            const savedCursus = await cursusApprenant.save()

                            if (demandeToValidate.coursChoisis) {
                                for (const coursChoisi of demandeToValidate.coursChoisis) {
                                    if (coursChoisi.etat == EtatsCoursChoisi.VALIDE) {
                                        const cp = new CoursParticipant()
                                        cp.coursId = coursChoisi.coursId
                                        cp.utilisateurId = demandeToValidate.utilisateurId
                                        cp.cursusApprenantId = savedCursus.id
                                        await cp.save()
                                    }
                                }
                            }

                            EmailSender.getInstance().sendValidationDemandeInscription(
                                demandeToValidate.utilisateur.identifiant,
                                demandeToValidate.utilisateur.email
                            ).catch(err => console.error("Erreur envoi email validation:", err))
                        }
                    }
                } catch (finalizeError) {
                    console.error("Erreur finalisation demande (non bloquante):", finalizeError)
                }
            }

            return res.status(200).send(bordereau);
        } catch (error) {
            console.error("Erreur validation bordereau:", error);
            return res.status(400).json({ success: false, message: (error as Error).message || "Erreur inconnue" });
        }
    }

    static async rejeterBordereau(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.CABINET_COMPTABLE && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let bordereau: Bordereau | null = await Bordereau.findByPk(req.params.id);

        if (bordereau == null) {
            return res.status(404).json({ success: false, message: "Bordereau non trouvé" });
        }

        if (bordereau.statut != 'en_attente') {
            return res.status(400).json({ success: false, message: "Bordereau déjà traité" });
        }

        if (!req.body.commentaire) {
            return res.status(400).json({ success: false, message: "Commentaire requis pour le rejet" });
        }

        bordereau.statut = 'rejete'
        bordereau.dateValidation = new Date()
        bordereau.valideParId = (req as any).utilisateurId
        bordereau.commentaire = req.body.commentaire

        await bordereau.save()
            .then(async (bordereau) => {
                return res.status(200).send(bordereau);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static downloadBordereau(req: Request, res: Response): void {
        res.removeHeader('X-Frame-Options');
        Bordereau.findByPk(req.params.id).then((bordereau) => {
            if (!bordereau || !bordereau.fichier) {
                res.status(404).json({ success: false, message: "Fichier non trouvé" })
                return
            }

            const uploadDir = path.resolve(process.cwd(), 'public/inscription/bordereaux')
            const filePath = path.join(uploadDir, bordereau.fichier)

            if (!fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier introuvable sur le serveur" })
                return
            }

            const ext = path.extname(bordereau.fichier) || '.pdf'
            const mimeTypes: Record<string, string> = {
                '.pdf': 'application/pdf',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
            }
            const contentType = mimeTypes[ext] || 'application/octet-stream'

            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', 'inline; filename="bordereau' + ext + '"')

            const stream = fs.createReadStream(filePath)
            stream.on('error', () => {
                res.status(500).json({ success: false, message: "Erreur lors de la lecture du fichier" })
            })
            stream.pipe(res)
        }).catch(() => {
            res.status(500).json({ success: false, error: "Erreur lors de la récupération du bordereau" })
        })
    }
}
