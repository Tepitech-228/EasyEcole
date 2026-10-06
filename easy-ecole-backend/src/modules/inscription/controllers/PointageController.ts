import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Pointage } from "../models/Pointage";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { QrTokenService } from "../../../core/services/QrTokenService";
import { VerificationPaiementService } from "../services/VerificationPaiementService";
import { Enseignant } from "../../auth/models/Enseignant";
import { Apprenant } from "../../auth/models/Apprenant";
import { PersonnelAdministratif } from "../../auth/models/PersonnelAdministratif";

const ROLES_POINTAGE = [
  RolesUtilisateur.APPRENANT,
  RolesUtilisateur.ENSEIGNANT,
  RolesUtilisateur.INSTITUTION,
  RolesUtilisateur.ADMIN,
  RolesUtilisateur.RESSOURCES_HUMAINES,
  RolesUtilisateur.CAISSIER_BANQUE,
  RolesUtilisateur.CABINET_COMPTABLE,
  RolesUtilisateur.COMITE_ORIENTATION,
];

const ROLES_POINTAGE_SCAN = [
  RolesUtilisateur.ENSEIGNANT,
  RolesUtilisateur.INSTITUTION,
  RolesUtilisateur.ADMIN,
  RolesUtilisateur.RESSOURCES_HUMAINES,
  RolesUtilisateur.PERSONNEL_ADMINISTRATIF,
  RolesUtilisateur.SECRETAIRE,
  RolesUtilisateur.CAISSIER_BANQUE,
  RolesUtilisateur.SURVEILLANT,
  RolesUtilisateur.COMITE_ORIENTATION,
  RolesUtilisateur.CABINET_COMPTABLE,
  RolesUtilisateur.ESA_COMPTA,
];

export default class PointageController {

    constructor() { }

    private static async getPhotoPourPointage(utilisateur: Utilisateur, photoDossier?: string | null): Promise<{ photo: string; photoType: string }> {
        if (utilisateur.role === RolesUtilisateur.APPRENANT) {
            const apprenant = await Apprenant.findOne({
                where: { utilisateurId: utilisateur.id },
                attributes: ['photo']
            });
            return { photo: photoDossier || apprenant?.photo || '', photoType: 'apprenant' };
        }
        if (utilisateur.role === RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({
                where: { utilisateurId: utilisateur.id },
                attributes: ['photo']
            });
            return { photo: enseignant?.photo || '', photoType: 'enseignant' };
        }
        return { photo: utilisateur.photoDeProfil || '', photoType: 'profile' };
    }

    static async getAllPointages(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Pointage>> = {
            include: [
                Pointage.associations.utilisateur
            ],
            order: [['date', 'DESC'], ['heureArrivee', 'DESC']]
        }

        const role = (req as any).utilisateurRole;
        if (role == RolesUtilisateur.APPRENANT || role == RolesUtilisateur.ENSEIGNANT) {
            options.where = { utilisateurId: (req as any).utilisateurId }
        }

        try {
            let pointages: Pointage[];
            pointages = await Pointage.findAll(options);
            return res.status(200).send(pointages);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getTodayPointage(req: Request, res: Response): Promise<Response> {
        const today = new Date().toISOString().split('T')[0]

        try {
            const pointage: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: (req as any).utilisateurId,
                    date: today
                }
            });

            return res.status(200).send(pointage);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async pointerArrivee(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (!ROLES_POINTAGE.includes(role)) {
            return res.status(403).json({ success: false, message: "Rôle non autorisé" })
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const time = now.toTimeString().split(' ')[0]

        try {
            const existing: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: (req as any).utilisateurId,
                    date: today
                }
            });

            if (existing) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Pointage déjà effectué aujourd'hui" });
            }

            let pointage: Pointage = new Pointage();
            pointage.date = today as any
            pointage.heureArrivee = time as any
            pointage.utilisateurId = (req as any).utilisateurId

            await pointage.save()
                .then((pointage) => {
                    return res.status(201).send(pointage);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }

        return null
    }

    static async pointerDepart(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (!ROLES_POINTAGE.includes(role)) {
            return res.status(403).json({ success: false, message: "Rôle non autorisé" })
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const time = now.toTimeString().split(' ')[0]

        try {
            const pointage: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: (req as any).utilisateurId,
                    date: today
                }
            });

            if (!pointage) {
                return res.status(404).json({ success: false, message: "Aucun pointage trouvé pour aujourd'hui" });
            }

            if (pointage.heureDepart) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Départ déjà pointé aujourd'hui" });
            }

            await pointage.update({ heureDepart: time as any })
                .then(async (pointage) => {
                    return res.status(200).send(pointage);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });

        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }

        return null
    }

    static async pointerArriveeByScan(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (!ROLES_POINTAGE_SCAN.includes(role)) {
            return res.status(403).json({ success: false, message: "Rôle non autorisé" })
        }

        const { userId } = req.body
        if (!userId) {
            return res.status(400).json({ success: false, message: "userId requis" });
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const time = now.toTimeString().split(' ')[0]

        try {
            const existing: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: userId,
                    date: today
                }
            });

            if (existing) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Pointage déjà effectué aujourd'hui pour cet utilisateur" });
            }

            const utilisateur = await Utilisateur.findByPk(userId)
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }

            let pointage: Pointage = new Pointage();
            pointage.date = today as any
            pointage.heureArrivee = time as any
            pointage.utilisateurId = userId

            await pointage.save()
                .then((pointage) => {
                    return res.status(201).send(pointage);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }

        return null
    }

    static async pointerDepartByScan(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (!ROLES_POINTAGE_SCAN.includes(role)) {
            return res.status(403).json({ success: false, message: "Rôle non autorisé" })
        }

        const { userId } = req.body
        if (!userId) {
            return res.status(400).json({ success: false, message: "userId requis" });
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const time = now.toTimeString().split(' ')[0]

        try {
            const pointage: Pointage | null = await Pointage.findOne({
                where: {
                    utilisateurId: userId,
                    date: today
                }
            });

            if (!pointage) {
                return res.status(404).json({ success: false, message: "Aucun pointage trouvé aujourd'hui pour cet utilisateur" });
            }

            if (pointage.heureDepart) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Départ déjà pointé pour cet utilisateur" });
            }

            await pointage.update({ heureDepart: time as any })
                .then((pointage) => {
                    return res.status(200).send(pointage);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });

        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }

        return null
    }

    static async verifierStatutByQR(req: Request, res: Response): Promise<Response> {
        const { codeQR } = req.params

        try {
            let userId: string | null = null;
            let dossier: DossierEtudiant | null = null;

            const verified = QrTokenService.verifier(codeQR);
            if (verified) {
                userId = String(verified.userId);
                dossier = await DossierEtudiant.findOne({
                    where: { utilisateurId: verified.userId },
                    include: [
                        { association: DossierEtudiant.associations.echeances },
                        { association: DossierEtudiant.associations.utilisateur, attributes: ['id', 'nom', 'prenoms', 'role', 'photoDeProfil'] }
                    ]
                });
            } else if (codeQR.startsWith('{')) {
                try {
                    const qrData = JSON.parse(codeQR)
                    userId = qrData.id || null;
                    dossier = await DossierEtudiant.findOne({
                        where: { matricule: qrData.matricule },
                        include: [
                            { association: DossierEtudiant.associations.echeances },
                            { association: DossierEtudiant.associations.utilisateur, attributes: ['id', 'nom', 'prenoms', 'role', 'photoDeProfil'] }
                        ]
                    })
                } catch (parseError) {
                    return res.status(400).json({ success: false, message: 'Code QR invalide' });
                }
            } else {
                // Saisie manuelle : matricule dossier étudiant, matricule prof/personnel
                // (auto-générés à la création) ou identifiant.
                userId = codeQR;
                dossier = await DossierEtudiant.findOne({
                    where: { matricule: codeQR },
                    include: [
                        { association: DossierEtudiant.associations.echeances },
                        { association: DossierEtudiant.associations.utilisateur, attributes: ['id', 'nom', 'prenoms', 'role', 'photoDeProfil'] }
                    ]
                })
                if (!dossier) {
                    const enseignant = await Enseignant.findOne({ where: { matricule: codeQR } });
                    const personnel = enseignant
                        ? null
                        : await PersonnelAdministratif.findOne({ where: { matricule: codeQR } });
                    const ownerId = enseignant?.utilisateurId || personnel?.utilisateurId || null;
                    if (ownerId) userId = String(ownerId);
                    else {
                        const byIdent = await Utilisateur.findOne({
                            where: { identifiant: codeQR },
                            attributes: ['id']
                        });
                        if (byIdent) userId = String(byIdent.id);
                    }
                }
            }

            if (dossier) {
                const paiement = VerificationPaiementService.verifierDossier(dossier);
                const utilisateur = dossier.utilisateur;
                if (!utilisateur) {
                    return res.status(500).json({ success: false, message: 'Utilisateur du dossier introuvable' });
                }
                const photoInfo = await this.getPhotoPourPointage(utilisateur, dossier.photo);

                // Calcul de la situation financière détaillée
                const situationFinanciere = this.calculerSituationFinanciere(dossier);

                if (paiement.statut == 'rouge') {
                    return res.status(200).json({
                        statut: 'rouge',
                        message: paiement.message,
                        utilisateurId: dossier.utilisateurId,
                        nom: dossier.utilisateur?.nom || '',
                        prenoms: dossier.utilisateur?.prenoms || '',
                        role: dossier.utilisateur?.role || 'apprenant',
                        ...photoInfo,
                        situationFinanciere,
                        ...(paiement.echeancesRestantes.length > 0 ? { echeancesRestantes: paiement.echeancesRestantes } : {})
                    });
                }

                return res.status(200).json({
                    statut: 'vert',
                    message: paiement.message,
                    utilisateurId: dossier.utilisateurId,
                    nom: dossier.utilisateur?.nom || '',
                    prenoms: dossier.utilisateur?.prenoms || '',
                    role: dossier.utilisateur?.role || 'apprenant',
                    ...photoInfo,
                    situationFinanciere
                });
            }

            if (userId) {
                const utilisateur = await Utilisateur.findByPk(userId)
                if (utilisateur) {
                    const photoInfo = await this.getPhotoPourPointage(utilisateur);
                    // Matricule du profil (prof / personnel) pour affichage au terminal
                    let matricule: string | null = null;
                    try {
                        const [ens, pers] = await Promise.all([
                            Enseignant.findOne({ where: { utilisateurId: userId } as any }),
                            PersonnelAdministratif.findOne({ where: { utilisateurId: userId } as any }),
                        ]);
                        matricule = (ens as any)?.matricule || (pers as any)?.matricule || null;
                    } catch (_) { /* non bloquant */ }
                    return res.status(200).json({
                        statut: 'vert',
                        message: 'Personnel autorisé',
                        utilisateurId: userId,
                        matricule,
                        nom: utilisateur.nom,
                        prenoms: utilisateur.prenoms,
                        role: utilisateur.role,
                        ...photoInfo
                    });
                }
            }

            return res.status(404).json({ statut: 'rouge', message: "Utilisateur non trouvé" });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    /**
     * Calcule la situation financière complète d'un étudiant pour l'affichage
     * lors du scan QR (pointage).
     */
    private static calculerSituationFinanciere(dossier: DossierEtudiant): any {
        const echeances = dossier.echeances || [];
        const now = new Date();

        // Somme globale = frais de scolarité + frais d'inscription
        const fraisScolarite = dossier.fraisScolarite || 0;
        const fraisInscription = echeances
            .filter(e => e.type === 'inscription')
            .reduce((sum, e) => sum + (e.montant || 0), 0);
        const sommeGlobale = fraisScolarite + fraisInscription;

        // Montant déjà payé
        const montantPaye = echeances
            .reduce((sum, e) => sum + (e.montantPaye || 0), 0);

        // Reste à payer
        const resteAPayer = Math.max(0, sommeGlobale - montantPaye);

        // Échéance du mois en cours
        const moisEnCours = now.toISOString().slice(0, 7); // "YYYY-MM"
        const echeanceMoisEnCours = echeances.find(e => {
            const dateLimite = new Date(e.dateLimite);
            return dateLimite.toISOString().slice(0, 7) === moisEnCours;
        });

        // À jour si l'échéance du mois en cours est payée ou n'existe pas
        const estAJour = !echeanceMoisEnCours ||
            echeanceMoisEnCours.statut === 'paye' ||
            echeanceMoisEnCours.statut === 'partiel';

        return {
            sommeGlobale,
            montantPaye,
            resteAPayer,
            estAJour,
            echeanceMoisEnCours: echeanceMoisEnCours ? {
                numeroEcheance: echeanceMoisEnCours.numeroEcheance,
                montant: echeanceMoisEnCours.montant,
                montantPaye: echeanceMoisEnCours.montantPaye,
                resteAPayer: Math.max(0, echeanceMoisEnCours.montant - (echeanceMoisEnCours.montantPaye || 0)),
                dateLimite: echeanceMoisEnCours.dateLimite,
                statut: echeanceMoisEnCours.statut
            } : null
        };
    }
}
