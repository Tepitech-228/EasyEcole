import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import fs from "fs";
import path from "path";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Quitus } from "../models/Quitus";
import { PaiementInscription } from "../models/PaiementInscription";
import { Session } from "../models/Session";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { CursusApprenant } from "../models/CursusApprenant";
import { CoursParticipant } from "../models/CoursParticipant";
import { Cours } from "../models/Cours";
import { EtatsCoursChoisi } from "../../../core/enums/EtatsCoursChoisi";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { creerEcritureComptable } from "../../comptabilite/helpers/ComptabiliteHelper";
import { PreInscription, EtatPreInscription } from "../models/PreInscription";
import { DossierStorageService } from "../services/DossierStorageService";
import { FolderAutoService } from "../../ged/services/FolderAutoService";
import { GenerateurCarteService } from "../services/GenerateurCarteService";

export default class BordereauController {

    constructor() { }

    static async getAllBordereaux(req: Request, res: Response): Promise<Response> {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const offset = (page - 1) * limit;

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
                return res.status(200).json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
            }

            options.where = { ...options.where, utilisateurId: utilisateurIds as any }
        }

        try {
            const { rows, count: total } = await Bordereau.findAndCountAll({ ...options, limit, offset });

            return res.status(200).json({
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
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
                            { association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
                            { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                            { association: DemandeInscription.associations.preInscription },
                            { association: DemandeInscription.associations.session, include: [Session.associations.dossiersInscription, Session.associations.fraisInscription, Session.associations.anneeAcademique] },
                            { association: DemandeInscription.associations.dossiersDemande },
                            { association: DemandeInscription.associations.cours, include: [Cours.associations.classe] },
                            { association: DemandeInscription.associations.coursChoisis },
                            DemandeInscription.associations.paiementsInscription,
                            DemandeInscription.associations.reponseInscription,
                        ],
                        order: [['createdAt', 'DESC']]
                    })

                    if (!demande) {
                        return res.status(400).json({ success: false, message: "Aucune demande d'inscription trouvée" })
                    }

                    // Validation checks
                    if (!demande.utilisateur?.apprenant) {
                        return res.status(400).json({ success: false, message: "Informations personnelles incomplètes" })
                    }
                    if (!demande.parcoursChoisis || demande.parcoursChoisis.length === 0) {
                        return res.status(400).json({ success: false, message: "Aucun parcours choisi" })
                    }
                    if (!demande.reponseInscription) {
                        return res.status(400).json({ success: false, message: "Réponse de l'institution manquante" })
                    }
                    if (demande.parcoursChoisis.filter(pc => pc.choixFinal === true).length === 0) {
                        return res.status(400).json({ success: false, message: "Aucun parcours final sélectionné" })
                    }
                    const dossiersRequis = demande.session?.dossiersInscription || []
                    const dossiersUploades = demande.dossiersDemande || []
                    if (dossiersRequis.length > 0 && dossiersUploades.length !== dossiersRequis.length) {
                        return res.status(400).json({ success: false, message: "Tous les documents requis doivent être téléversés" })
                    }
                    if (!demande.preInscription || demande.preInscription.statut !== EtatPreInscription.VALIDE) {
                        return res.status(400).json({ success: false, message: "La préinscription doit être validée" })
                    }
                    const parcoursFinal = demande.parcoursChoisis.find(pc => pc.choixFinal === true)
                    if (parcoursFinal && parcoursFinal.parcoursId) {
                        const coursParcours = demande.cours || []
                        const coursObligatoires = coursParcours.filter(c => c.estObligatoire)
                        if (coursObligatoires.length > 0) {
                            const coursChoisisIds = (demande.coursChoisis || []).map(cc => cc.coursId)
                            if (!coursObligatoires.every(c => coursChoisisIds.includes(c.id))) {
                                return res.status(400).json({ success: false, message: "Tous les cours obligatoires doivent être choisis" })
                            }
                            if ((demande.coursChoisis || []).filter(cc => cc.etat === EtatsCoursChoisi.ENCOURS).length > 0) {
                                return res.status(400).json({ success: false, message: "Tous les cours choisis doivent être validés par l'institution" })
                            }
                        }
                    }
                    const fraisTotal = (demande.session?.fraisInscription || []).reduce((sum, f) => sum + f.montant, 0)
                    const fraisPayes = (demande.paiementsInscription || []).reduce((sum, p) => sum + (p.montant || 0), 0)
                    if (fraisPayes < fraisTotal) {
                        return res.status(400).json({ success: false, message: "Les frais d'inscription ne sont pas entièrement payés" })
                    }

                    // Create CursusApprenant
                    const parcoursChoisiFinal = demande.parcoursChoisis.find(pc => pc.choixFinal === true)

                    // Generate matricule final: ESA-AAAA-PP-FFFF-CODE
                    const anneeLibelle = demande.session?.anneeAcademique?.libelle || new Date().getFullYear().toString()
                    const parcoursData = parcoursChoisiFinal?.parcours
                    const niveauEtude = parcoursData?.niveauEtudeId
                        ? await (await import('../models/NiveauEtude')).NiveauEtude.findByPk(parcoursData.niveauEtudeId)
                        : null
                    const parcoursNom = parcoursData?.type || parcoursData?.titre || 'PARCOURS'
                    const niveauNom = niveauEtude?.libelle || 'Niveau'
                    const classeNom = 'NON_DEFINI'
                    const anneeId = demande.session?.anneeAcademiqueId

                    const matricule = IDGenerator.getInstance().generateMatriculeFinal(
                        parcoursData!,
                        anneeLibelle,
                        null
                    )
                    await demande.update({ matricule, dateValidation: new Date() })

                    // Créer le dossier physique pour l'étudiant
                    try {
                        DossierStorageService.creerDossierEtudiant(
                            anneeLibelle,
                            parcoursNom,
                            classeNom,
                            niveauNom,
                            matricule,
                        );
                    } catch (dirError) {
                        console.error("Erreur création dossier étudiant:", dirError);
                    }

                    // Créer le dossier GED pour le matricule
                    try {
                        if (anneeId && parcoursData && niveauEtude) {
                            await FolderAutoService.creerDossierMatricule({
                                anneeAcademiqueId: Number(anneeId),
                                parcoursNom,
                                classeNom,
                                niveauNom,
                                matricule,
                                utilisateurId: Number((req as any).utilisateurId),
                            });
                        }
                    } catch (gedError) {
                        console.error("Erreur création dossier GED matricule:", gedError);
                    }

                    const cursusApprenant = new CursusApprenant()
                    cursusApprenant.externe = false
                    cursusApprenant.parcoursId = parcoursChoisiFinal?.parcoursId!
                    cursusApprenant.niveauEtudeId = parcoursChoisiFinal?.parcours?.niveauEtudeId!
                    cursusApprenant.utilisateurId = demande.utilisateurId
                    cursusApprenant.demandeInscriptionId = demande.id
                    const savedCursus = await cursusApprenant.save()

                    // Create DossierEtudiant
                    const codeQR = JSON.stringify({ matricule, utilisateurId: bordereau.utilisateurId })
                    const demarrage = parcoursChoisiFinal?.createdAt || demande.createdAt || new Date()
                    const dossier = new DossierEtudiant()
                    dossier.utilisateurId = bordereau.utilisateurId
                    dossier.matricule = matricule
                    dossier.codeQR = codeQR
                    dossier.statut = 'actif'
                    dossier.fraisScolarite = fraisTotal
                    dossier.modePaiement = 'mensuel'
                    dossier.nbMensualites = 10
                    dossier.demarrageParcours = demarrage
                    await dossier.save()

                    // Générer la carte étudiante
                    try {
                        const user = demande.utilisateur as any
                        const apprenant = user?.apprenant
                        const cartePath = await GenerateurCarteService.generer({
                            nom: user?.nom || '',
                            prenom: user?.prenoms || '',
                            matricule: matricule,
                            dateNaissance: String(apprenant?.dateNaissance || ''),
                            photo: dossier.photo || undefined,
                            classe: parcoursNom,
                            filiere: classeNom,
                            anneeAcademique: anneeLibelle,
                            email: user?.email || '',
                            utilisateurId: demande.utilisateurId,
                        })
                        await dossier.update({ cartePath, carteGeneree: true })

                        // Copier la carte dans le dossier étudiant
                        const carteSource = path.resolve(process.cwd(), 'public', cartePath)
                        if (fs.existsSync(carteSource)) {
                            DossierStorageService.copierFichier(
                                carteSource,
                                anneeLibelle, parcoursNom, classeNom, niveauNom, matricule, 'cartes'
                            )
                        }
                    } catch (cardError) {
                        console.error("Erreur génération carte étudiant:", cardError)
                    }

                    if (echeance) {
                        echeance.dossierEtudiantId = dossier.id
                    }

                    // Create CoursParticipant for validated courses
                    if (demande.coursChoisis) {
                        for (const coursChoisi of demande.coursChoisis) {
                            if (coursChoisi.etat === EtatsCoursChoisi.VALIDE) {
                                const cp = new CoursParticipant()
                                cp.coursId = coursChoisi.coursId
                                cp.utilisateurId = demande.utilisateurId
                                cp.cursusApprenantId = savedCursus.id
                                await cp.save()
                            }
                        }
                    }

                    // Create 10 échéances de scolarité
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

                    // Create PaiementInscription
                    const paiement = new PaiementInscription()
                    paiement.numero = 'PAY-' + IDGenerator.getInstance().generateNumeroPaiement()
                    paiement.datePaiement = new Date()
                    paiement.montant = bordereau.montant
                    paiement.matriculeInscription = matricule
                    paiement.type = TypesPaiement.EN_LIGNE
                    paiement.utilisateurId = bordereau.utilisateurId
                    paiement.description = `Paiement par bordereau #${bordereau.id} (${bordereauType})`
                    await paiement.save()

                    // Archive documents in GED
                    if (demande.dossiersDemande) {
                        for (const dossier of demande.dossiersDemande) {
                            await ArchiveGedService.archiverDocumentInscription(
                                Number(demande.id),
                                dossier.nomFichier,
                                {
                                    titre: `Dossier inscription - ${matricule}`,
                                    anneeAcademiqueId: Number(demande.session?.anneeAcademiqueId!),
                                    parcoursId: Number(parcoursChoisiFinal?.parcoursId!),
                                    niveauEtudeId: Number(parcoursChoisiFinal?.parcours?.niveauEtudeId!),
                                    classeId: undefined,
                                    cursusApprenantId: Number(savedCursus.id)
                                }
                            )
                        }
                    }

                    // Archive bordereau in GED
                    if (bordereau.fichier) {
                        await ArchiveGedService.archiverBordereau(
                            Number(bordereau.id),
                            bordereau.fichier,
                            {
                                titre: `Bordereau ${bordereau.type} - ${bordereau.referenceBancaire || bordereau.id}`,
                                anneeAcademiqueId: Number(demande.session?.anneeAcademiqueId!),
                                parcoursId: Number(parcoursChoisiFinal?.parcoursId!),
                                niveauEtudeId: Number(parcoursChoisiFinal?.parcours?.niveauEtudeId!)
                            }
                        )
                    }

                    // Déplacer les fichiers uploadés vers le dossier de l'étudiant
                    try {
                        const baseChemin = { annee: anneeLibelle, parcours: parcoursNom, classe: classeNom, niveau: niveauNom, matricule };

                        // Déplacer les dossiers d'inscription uploadés
                        if (demande.dossiersDemande) {
                            for (const doc of demande.dossiersDemande) {
                                const sourcePath = path.resolve(process.cwd(), 'public/inscription/dossiers', doc.nomFichier);
                                if (fs.existsSync(sourcePath)) {
                                    const newPath = DossierStorageService.deplacerFichier(
                                        sourcePath,
                                        baseChemin.annee, baseChemin.parcours, baseChemin.classe,
                                        baseChemin.niveau, baseChemin.matricule, 'dossiers'
                                    );
                                    doc.nomFichier = DossierStorageService.cheminRelatif(newPath);
                                    await doc.save();
                                }
                            }
                        }

                        // Déplacer l'autorisation provisoire
                        if (demande.preInscription?.autorisationPDF) {
                            const sourcePath = path.resolve(process.cwd(), 'public/inscription/autorisations', demande.preInscription.autorisationPDF);
                            if (fs.existsSync(sourcePath)) {
                                const newPath = DossierStorageService.deplacerFichier(
                                    sourcePath,
                                    baseChemin.annee, baseChemin.parcours, baseChemin.classe,
                                    baseChemin.niveau, baseChemin.matricule, 'autorisations'
                                );
                                demande.preInscription.autorisationPDF = DossierStorageService.cheminRelatif(newPath);
                                await demande.preInscription.save();
                            }
                        }

                        // Déplacer le bordereau uploadé
                        if (bordereau.fichier) {
                            const sourcePath = path.resolve(process.cwd(), 'public/inscription/bordereaux', bordereau.fichier);
                            if (fs.existsSync(sourcePath)) {
                                const newPath = DossierStorageService.deplacerFichier(
                                    sourcePath,
                                    baseChemin.annee, baseChemin.parcours, baseChemin.classe,
                                    baseChemin.niveau, baseChemin.matricule, 'bordereaux'
                                );
                                bordereau.fichier = DossierStorageService.cheminRelatif(newPath);
                                await bordereau.save();
                            }
                        }
                    } catch (moveError) {
                        console.error("Erreur déplacement fichiers:", moveError);
                    }

                    // Send email
                    if (demande.utilisateur) {
                        EmailSender.getInstance().sendQuitusEtMatricule(
                            demande.utilisateur.identifiant,
                            demande.utilisateur.email,
                            matricule
                        ).catch(err => console.error("Erreur envoi email matricule:", err))
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

                        ArchiveGedService.archiverDepuisFichier({
                            fichierSource: `public/inscription/quitus/${filename}`,
                            domaineCode: 'FIN',
                            typeDocumentCode: 'bordereau',
                            processusCode: 'BORDEREAU',
                            processusLibelle: 'Bordereau de paiement',
                            processusModule: 'finance',
                            titre: `Quitus scolarité - ${code}`,
                            dossierGed: 'Bordereaux de paiement',
                            sourceType: 'genere_application',
                            confidentialite: 'confidentiel',
                        }).catch(err => console.error("Erreur archivage quitus scolarite:", err))

                        // Copier le quitus dans le dossier étudiant
                        try {
                            if (dossier.matricule) {
                                const quitusSource = path.resolve(process.cwd(), 'public/inscription/quitus', filename)
                                if (fs.existsSync(quitusSource)) {
                                    const demandeQuitus = await DemandeInscription.findOne({
                                        where: { matricule: dossier.matricule },
                                        include: [
                                            { association: DemandeInscription.associations.session, include: [Session.associations.anneeAcademique] },
                                            { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                                        ]
                                    })
                                    if (demandeQuitus) {
                                        const pFinal = demandeQuitus.parcoursChoisis?.find(pc => pc.choixFinal === true)
                                        const pData = pFinal?.parcours
                                        const ne = pData?.niveauEtudeId
                                            ? await (await import('../models/NiveauEtude')).NiveauEtude.findByPk(pData.niveauEtudeId)
                                            : null
                                        const ann = demandeQuitus.session?.anneeAcademique?.libelle || ''
                                        const parc = pData?.type || pData?.titre || ''
                                        const niv = ne?.libelle || ''

                                        DossierStorageService.copierFichier(
                                            quitusSource,
                                            ann, parc, 'NON_DEFINI', niv, dossier.matricule, 'paiements'
                                        )
                                    }
                                }
                            }
                        } catch (quitusMoveError) {
                            console.error("Erreur copie quitus etudiant:", quitusMoveError)
                        }

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

    static async batchStatut(req: Request, res: Response): Promise<Response> {
        const { ids, statut, commentaire } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "IDs requis" });
        }

        if (!['valide', 'rejete'].includes(statut)) {
            return res.status(400).json({ success: false, message: "Statut invalide" });
        }

        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();

        try {
            let count = 0;
            for (const id of ids) {
                const bordereau = await Bordereau.findByPk(id, { transaction });
                if (!bordereau || bordereau.statut !== 'en_attente') continue;

                bordereau.statut = statut;
                bordereau.dateValidation = new Date();
                bordereau.valideParId = (req as any).utilisateurId;

                if (statut === 'rejete') {
                    bordereau.commentaire = commentaire || null;
                }

                await bordereau.save({ transaction });
                count++;
            }

            await transaction.commit();
            return res.status(200).json({ success: true, count });
        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({ success: false, error: error });
        }
    }

    static downloadBordereau(req: Request, res: Response): void {
        res.removeHeader('X-Frame-Options');
        Bordereau.findByPk(req.params.id).then((bordereau) => {
            if (!bordereau || !bordereau.fichier) {
                res.status(404).json({ success: false, message: "Fichier non trouvé" })
                return
            }

            // Chercher d'abord dans le nouveau chemin (dossier étudiant), puis dans l'ancien
            let filePath = path.resolve(process.cwd(), bordereau.fichier)
            if (!fs.existsSync(filePath)) {
                filePath = path.resolve(process.cwd(), 'public/inscription/bordereaux', bordereau.fichier)
            }
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
