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
import QRCode from 'qrcode';

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

    /**
     * Rapport de pointage sur une période (défaut : mois en cours).
     * GET /pointages/rapport?debut=YYYY-MM-DD&fin=YYYY-MM-DD
     * Apprenants/enseignants : périmètre restreint à soi-même (comme l'historique).
     */
    static async getRapport(req: Request, res: Response): Promise<Response> {
        const toISODate = (d: Date) => d.toISOString().split('T')[0]
        const now = new Date()
        const debutDefaut = toISODate(now).slice(0, 7) + '-01'
        const debut = typeof req.query.debut === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.debut)
            ? req.query.debut : debutDefaut
        const fin = typeof req.query.fin === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.fin)
            ? req.query.fin : toISODate(now)
        if (debut > fin) {
            return res.status(400).json({ success: false, message: 'La date de début doit précéder la date de fin' })
        }

        try {
            const where: any = { date: { [Op.between]: [debut, fin] } }
            const role = (req as any).utilisateurRole;
            if (role == RolesUtilisateur.APPRENANT || role == RolesUtilisateur.ENSEIGNANT) {
                where.utilisateurId = (req as any).utilisateurId
            }
            const pointages = await Pointage.findAll({
                where,
                include: [
                    { association: Pointage.associations.utilisateur, attributes: ['id', 'nom', 'prenoms', 'identifiant', 'role'] }
                ],
                order: [['date', 'DESC']]
            });

            const minutes = (t: any): number | null => {
                const m = String(t || '').match(/^(\d{2}):(\d{2})/)
                return m ? Number(m[1]) * 60 + Number(m[2]) : null
            }
            const today = toISODate(now)
            const parUtilisateur = new Map<number, any>()
            let presentsAujourdhui = 0
            let completsAujourdhui = 0

            for (const p of pointages as any[]) {
                const uid = Number(p.utilisateurId)
                let e = parUtilisateur.get(uid)
                if (!e) {
                    e = {
                        utilisateurId: uid,
                        nom: p.utilisateur?.nom || '',
                        prenoms: p.utilisateur?.prenoms || '',
                        identifiant: p.utilisateur?.identifiant || '',
                        role: p.utilisateur?.role || '',
                        presences: 0,
                        minutesTotales: 0,
                        sansDepart: 0,
                    }
                    parUtilisateur.set(uid, e)
                }
                e.presences += 1
                const deb = minutes(p.heureArrivee)
                const finH = minutes(p.heureDepart)
                if (deb !== null && finH !== null && finH >= deb) {
                    e.minutesTotales += (finH - deb)
                } else {
                    e.sansDepart += 1
                }
                if (String(p.date).slice(0, 10) === today) {
                    presentsAujourdhui += 1
                    if (deb !== null && finH !== null && finH >= deb) completsAujourdhui += 1
                }
            }

            const entries = [...parUtilisateur.values()].map(e => ({
                ...e,
                heuresTotales: Math.round((e.minutesTotales / 60) * 100) / 100,
            })).sort((a, b) => b.presences - a.presences)
            const total = pointages.length
            const complets = entries.reduce((s, e) => s + (e.presences - e.sansDepart), 0)

            return res.status(200).json({
                periode: { debut, fin },
                summary: {
                    pointages: total,
                    personnes: entries.length,
                    presentsAujourdhui,
                    completsAujourdhui,
                    enCoursAujourdhui: Math.max(0, presentsAujourdhui - completsAujourdhui),
                    tauxCompletude: total > 0 ? Math.round((complets / total) * 100) : 0,
                },
                entries,
            });
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
                const photoInfo = await PointageController.getPhotoPourPointage(utilisateur, dossier.photo);

                // Calcul de la situation financière détaillée
                const situationFinanciere = PointageController.calculerSituationFinanciere(dossier);

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
                    const photoInfo = await PointageController.getPhotoPourPointage(utilisateur);
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
        now.setHours(0, 0, 0, 0);

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

        // Délai de paiement : le 5 du mois concerné par l'échéance.
        // Une échéance non soldée après le 5 de son mois est en retard.
        const moisDe = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const dateLimiteEffective = (e: Echeance): Date => {
            const d = new Date(e.dateLimite as any);
            return new Date(d.getFullYear(), d.getMonth(), 5);
        };

        const moisActuel = moisDe(now);

        const lignes = [...echeances]
            .sort((a, b) => new Date(a.dateLimite as any).getTime() - new Date(b.dateLimite as any).getTime())
            .map(e => {
                const montant = e.montant || 0;
                const paye = Math.min(e.montantPaye || 0, montant);
                const reste = Math.max(0, montant - paye);
                const dateLimite = dateLimiteEffective(e);
                const estPaye = reste <= 0;
                const enRetard = !estPaye && dateLimite.getTime() < now.getTime();
                const mois = (e.moisConcerne && String(e.moisConcerne)) || moisDe(dateLimite);
                return {
                    id: e.id,
                    numeroEcheance: e.numeroEcheance,
                    type: e.type,
                    mois,
                    montant,
                    montantPaye: paye,
                    resteAPayer: reste,
                    devise: e.devise,
                    dateLimite,
                    statut: e.statut,
                    estPaye,
                    enRetard,
                };
            });

        const echeancesEnRetard = lignes.filter(l => l.enRetard);
        const estAJour = echeancesEnRetard.length === 0;

        const moisEnCours = lignes.find(l => moisDe(new Date(l.dateLimite)) === moisActuel) || null;

        return {
            sommeGlobale,
            montantPaye,
            resteAPayer,
            estAJour,
            echeancesEnRetard: echeancesEnRetard.length,
            echeancesPayees: lignes.filter(l => l.estPaye).length,
            echeancesTotales: lignes.length,
            moisEnCours: moisEnCours ? {
                mois: moisEnCours.mois,
                numeroEcheance: moisEnCours.numeroEcheance,
                montant: moisEnCours.montant,
                montantPaye: moisEnCours.montantPaye,
                resteAPayer: moisEnCours.resteAPayer,
                dateLimite: moisEnCours.dateLimite,
                statut: moisEnCours.statut,
                estPaye: moisEnCours.estPaye,
                enRetard: moisEnCours.enRetard,
            } : null,
            echeances: lignes
        };
    }

    /**
     * Génère à la volée le QR code de pointage personnel de l'utilisateur
     * connecté (token signé court, format identique aux badges/cartes : lisible
     * par webcam). Toujours frais, aucune dépendance à un service externe
     * (api.qrserver.com), aucune expiration liée à un fichier stocké.
     */
    static async getMonQr(req: Request, res: Response): Promise<Response> {
        try {
            const userId = Number(req.utilisateurId);
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }
            const token = QrTokenService.signer(userId);
            const qrDataUrl = await QRCode.toDataURL(token, {
                width: 400,
                margin: 4,
                errorCorrectionLevel: 'M'
            });
            return res.status(200).json({ success: true, qrDataUrl });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
