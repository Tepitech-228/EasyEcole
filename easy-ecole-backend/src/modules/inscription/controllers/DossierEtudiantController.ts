import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { IdentiteApprenant } from "../../auth/models/IdentiteApprenant";
import { AdresseApprenant } from "../../auth/models/AdresseApprenant";
import { InformationsParentsApprenant } from "../../auth/models/InformationsParentsApprenant";
import { InformationsSalarieApprenant } from "../../auth/models/InformationsSalarieApprenant";
import { PersonnePrevenirApprenant } from "../../auth/models/PersonnePrevenirApprenant";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { Echeance } from "../models/Echeance";
import { DemandeInscription } from "../models/DemandeInscription";
import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier";
import { DossierInscription } from "../models/DossierInscription";
import { Session } from "../models/Session";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { CoursParticipant } from "../models/CoursParticipant";
import { CursusApprenant } from "../models/CursusApprenant";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { Parcours } from "../models/Parcours";
import { NiveauEtude } from "../models/NiveauEtude";
import { Classe } from "../models/Classe";
import { SalleDeClasse } from "../models/SalleDeClasse";
import { Bordereau } from "../models/Bordereau";
import { GenerateurCarteService } from "../services/GenerateurCarteService";
import fs from "fs";
import path from "path";

export default class DossierEtudiantController {

    constructor() { }

    static async getAllDossiers(req: Request, res: Response): Promise<Response> {
        const hasPagination = req.query.page !== undefined || req.query.limit !== undefined
        const page = Math.max(1, parseInt(String(req.query.page)) || 1)
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 20))
        const offset = hasPagination ? (page - 1) * limit : undefined

        let where: any = {}
        let include: any[] = [
            { association: DossierEtudiant.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
            DossierEtudiant.associations.echeances,
            { association: DossierEtudiant.associations.coursParticipants, include: [CoursParticipant.associations.cours] }
        ]

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            where.utilisateurId = (req as any).utilisateurId
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
                const emptyResult = hasPagination
                    ? { data: [], pagination: { page, limit, total: 0, totalPages: 0 } }
                    : []
                return res.status(200).json(emptyResult)
            }

            where.utilisateurId = utilisateurIds as any
        }

        if (req.query.statut) {
            where.statut = req.query.statut
        }

        if (req.query.search) {
            const searchTerm = String(req.query.search)
            where[Op.or] = [
                { matricule: { [Op.substring]: searchTerm } },
                { '$utilisateur.nom$': { [Op.substring]: searchTerm } },
                { '$utilisateur.prenoms$': { [Op.substring]: searchTerm } }
            ]
        }

        try {
            if (hasPagination) {
                const { count, rows } = await DossierEtudiant.findAndCountAll({
                    where,
                    include,
                    limit,
                    offset,
                    distinct: true,
                    subQuery: false
                })

                return res.status(200).json({
                    data: rows,
                    pagination: {
                        page,
                        limit,
                        total: count,
                        totalPages: Math.ceil(count / limit)
                    }
                })
            } else {
                const rows = await DossierEtudiant.findAll({ where, include })
                return res.status(200).send(rows)
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
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

        // Get parcours & classe from the user's demande inscription
        const demande = await DemandeInscription.findOne({
            where: { utilisateurId: req.body.utilisateurId },
            include: [
                { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                { association: DemandeInscription.associations.session, include: [Session.associations.anneeAcademique] },
            ]
        })
        const parcoursChoisiFinal = demande?.parcoursChoisis?.find(pc => pc.choixFinal === true)
        const classeMatricule = req.body.classeId ? await Classe.findByPk(req.body.classeId) : null
        const anneeLibelle = demande?.session?.anneeAcademique?.libelle || new Date().getFullYear().toString()

        const matricule = IDGenerator.getInstance().generateMatriculeFinal(
            parcoursChoisiFinal?.parcours!,
            anneeLibelle,
            classeMatricule
        )
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

    static async getDossierComplet(req: Request, res: Response): Promise<Response> {
        try {
            const dossier = await DossierEtudiant.findByPk(req.params.id, {
                include: [
                    {
                        association: DossierEtudiant.associations.utilisateur,
                        include: [{
                            model: Apprenant, as: 'apprenant',
                            include: [
                                { model: IdentiteApprenant, as: 'identite' },
                                { model: AdresseApprenant, as: 'adresse' },
                                { model: InformationsParentsApprenant, as: 'informationsParents' },
                                { model: InformationsSalarieApprenant, as: 'informationsSalarie' },
                                { model: PersonnePrevenirApprenant, as: 'personnePrevenir' },
                            ]
                        }]
                    },
                    DossierEtudiant.associations.echeances,
                ]
            });

            if (!dossier) {
                return res.status(404).json({ success: false, message: "Dossier non trouvé" });
            }

            const demande = await DemandeInscription.findOne({
                where: { utilisateurId: dossier.utilisateurId },
                order: [['dateDemande', 'DESC']],
                include: [
                    {
                        association: DemandeInscription.associations.dossiersDemande,
                        include: [{ model: DossierInscription, as: 'dossierInscription' }]
                    },
                    {
                        association: DemandeInscription.associations.cursusApprenant,
                        include: [
                            { model: AnneeAcademique, as: 'anneeAcademique' },
                            { model: Parcours, as: 'parcours' },
                            { model: NiveauEtude, as: 'niveauEtude' },
                            { model: Classe, as: 'classe', include: [{ model: SalleDeClasse, as: 'sallesDeClasse' }] }
                        ]
                    },
                    {
                        association: DemandeInscription.associations.session,
                        include: [
                            { model: AnneeAcademique, as: 'anneeAcademique' },
                            { model: NiveauEtude, as: 'niveauEtude' }
                        ]
                    }
                ]
            });

            const bordereaux = await Bordereau.findAll({
                where: { utilisateurId: dossier.utilisateurId },
                include: [Bordereau.associations.echeance]
            });

            return res.status(200).json({ dossier, demande, bordereaux });
        } catch (error) {
            console.error('Erreur getDossierComplet:', error);
            return res.status(500).json({ success: false, error });
        }
    }

    static async telechargerCarte(req: Request, res: Response): Promise<void> {
        try {
            const dossier = await DossierEtudiant.findByPk(req.params.id, {
                include: [{ association: DossierEtudiant.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }]
            })
            if (!dossier || !dossier.cartePath) {
                res.status(404).json({ success: false, message: "Carte étudiante non trouvée" })
                return
            }

            const filePath = path.resolve(process.cwd(), 'public', dossier.cartePath)
            if (!fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier carte introuvable" })
                return
            }

            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', `inline; filename="carte_${dossier.matricule}.pdf"`)
            const stream = fs.createReadStream(filePath)
            stream.pipe(res)
        } catch (error) {
            res.status(500).json({ success: false, error })
        }
    }

    static async regenererCarte(req: Request, res: Response): Promise<Response> {
        try {
            const dossier = await DossierEtudiant.findByPk(req.params.id, {
                include: [
                    {
                        association: DossierEtudiant.associations.utilisateur,
                        include: [{ model: Apprenant, as: 'apprenant' }]
                    }
                ]
            })
            if (!dossier) {
                return res.status(404).json({ success: false, message: "Dossier non trouvé" })
            }

            const demande = await DemandeInscription.findOne({
                where: { utilisateurId: dossier.utilisateurId },
                order: [['dateDemande', 'DESC']],
                include: [{
                    association: 'cursusApprenant' as any,
                    include: [
                        { model: require('../models/AnneeAcademique').AnneeAcademique, as: 'anneeAcademique' },
                        { model: require('../models/Parcours').Parcours, as: 'parcours' },
                        { model: require('../models/Classe').Classe, as: 'classe' }
                    ]
                }]
            })

            const cursus = (demande as any)?.cursusApprenant
            const apprenant = (dossier.utilisateur as any)?.apprenant
            const user = dossier.utilisateur as any

            const cartePath = await GenerateurCarteService.generer({
                nom: user.nom,
                prenom: user.prenoms,
                matricule: dossier.matricule,
                dateNaissance: apprenant?.dateNaissance || '',
                photo: dossier.photo || undefined,
                classe: (cursus as any)?.classe?.libelle || '',
                filiere: (cursus as any)?.parcours?.titre || '',
                anneeAcademique: (cursus as any)?.anneeAcademique?.libelle || '',
                email: user.email,
                utilisateurId: dossier.utilisateurId,
            })

            await dossier.update({ cartePath, carteGeneree: true })
            return res.status(200).json({ success: true, cartePath })
        } catch (error) {
            return res.status(500).json({ success: false, error })
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
