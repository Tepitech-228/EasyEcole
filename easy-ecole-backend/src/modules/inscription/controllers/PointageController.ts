import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Pointage } from "../models/Pointage";
import { PointageScan } from "../models/PointageScan";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { QrTokenService } from "../../../core/services/QrTokenService";
import { VerificationPaiementService } from "../services/VerificationPaiementService";
import { Enseignant } from "../../auth/models/Enseignant";
import { Apprenant } from "../../auth/models/Apprenant";
import { PersonnelAdministratif } from "../../auth/models/PersonnelAdministratif";
import { DemandeInscription } from "../models/DemandeInscription";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";
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

    private static async getUtilisateurIdsDuSite(etablissementId: number): Promise<number[]> {
        const affectations = await SiteUtilisateur.findAll({
            where: { etablissementId },
            attributes: ['utilisateurId'],
        });
        const affectationIds = affectations.map(item => Number(item.utilisateurId));
        const utilisateurs = await Utilisateur.findAll({
            where: {
                [Op.or]: [
                    { etablissementId },
                    { id: { [Op.in]: affectationIds } },
                ],
            },
            attributes: ['id'],
        });
        return utilisateurs.map(utilisateur => Number(utilisateur.id));
    }

    static async getAllPointages(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Pointage>> = {
            include: [
                {
                    association: Pointage.associations.utilisateur,
                    attributes: ['id', 'nom', 'prenoms', 'identifiant', 'role', 'photoDeProfil']
                },
                Pointage.associations.scans
            ],
            order: [['date', 'DESC'], ['heureArrivee', 'DESC'], [{ model: PointageScan, as: 'scans' }, 'heure', 'ASC'], [{ model: PointageScan, as: 'scans' }, 'id', 'ASC']]
        }

        const role = (req as any).utilisateurRole;

        try {
            if (role == RolesUtilisateur.APPRENANT || role == RolesUtilisateur.ENSEIGNANT) {
                options.where = { utilisateurId: (req as any).utilisateurId }
            } else if (role === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                if (!etablissementId) {
                    return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
                }
                options.where = {
                    utilisateurId: { [Op.in]: await this.getUtilisateurIdsDuSite(etablissementId) }
                } as any;
            }
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
            } else if (role === RolesUtilisateur.SURVEILLANT) {
                const etablissementId = await getSurveillantSiteId(req);
                if (!etablissementId) {
                    return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
                }
                where.utilisateurId = { [Op.in]: await this.getUtilisateurIdsDuSite(etablissementId) };
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

            const created = await Pointage.create({
                date: today,
                heureArrivee: time,
                utilisateurId: (req as any).utilisateurId
            } as any)

            return res.status(201).send(created)
        } catch (error) {
            // Une violation d'unicité (uq_ins_pointages_utilisateur_date) signifie
            // qu'un scan concurrent a créé le pointage entre le findOne et le create :
            // on la traite comme un doublon (400), pas comme une erreur serveur.
            return PointageController.repondreErreurPointage(res, error, "Pointage déjà effectué aujourd'hui");
        }
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

            const updated = await PointageController.enregistrerDepart(pointage, time)
            if (!updated) {
                return res.status(400).json({ success: false, alreadyExists: true, message: "Départ déjà pointé aujourd'hui" })
            }
            return res.status(200).send(updated)

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

            const created = await Pointage.create({
                date: today,
                heureArrivee: time,
                utilisateurId: userId
            } as any)

            return res.status(201).send(created)
        } catch (error) {
            // Course entre le findOne ci-dessus et ce create : l'index unique
            // (utilisateurId, date) rejette le doublon, qu'on renvoie en 400.
            return PointageController.repondreErreurPointage(res, error, "Pointage déjà effectué aujourd'hui pour cet utilisateur");
        }
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

            const updated = await PointageController.enregistrerDepart(pointage, time)
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    alreadyExists: true,
                    message: "Départ déjà pointé pour cet utilisateur"
                })
            }
            return res.status(200).send(updated)

        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }

        return null
    }

    static async pointerParQR(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (!ROLES_POINTAGE_SCAN.includes(role)) {
            return res.status(403).json({ success: false, code: 'FORBIDDEN', message: "Rôle non autorisé" })
        }

        const codeQR = typeof req.body?.codeQR === 'string' ? req.body.codeQR.trim() : '';
        const requestedMode = req.body?.mode;
        if (!codeQR || codeQR.length > 2048 || (requestedMode !== undefined && requestedMode !== 'arrivee' && requestedMode !== 'depart')) {
            return res.status(400).json({ success: false, code: 'INVALID_REQUEST', message: 'Code QR ou mode de pointage invalide' })
        }

        const verified = QrTokenService.verifier(codeQR);
        if (!verified || !Number.isSafeInteger(verified.userId) || verified.userId <= 0) {
            return res.status(400).json({ success: false, code: 'INVALID_QR', message: 'Code QR invalide' })
        }

        try {
            const utilisateur = await Utilisateur.findByPk(verified.userId);
            if (!utilisateur) {
                return res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'Utilisateur non trouvé' })
            }

            if (utilisateur.role === RolesUtilisateur.APPRENANT) {
                const dossier = await DossierEtudiant.findOne({
                    where: { utilisateurId: utilisateur.id },
                    include: [{ association: DossierEtudiant.associations.echeances }]
                });
                if (!dossier) {
                    return res.status(403).json({
                        success: false,
                        code: 'ATTENDANCE_NOT_ALLOWED',
                        statut: 'rouge',
                        message: "Aucun dossier d'inscription actif pour cet étudiant"
                    })
                }
                const paiement = VerificationPaiementService.verifierDossier(dossier);
                if (paiement.statut === 'rouge') {
                    return res.status(403).json({
                        success: false,
                        code: 'ATTENDANCE_NOT_ALLOWED',
                        statut: 'rouge',
                        message: paiement.message
                    })
                }
            }

            const isStudent = utilisateur.role === RolesUtilisateur.APPRENANT;
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const time = now.toTimeString().split(' ')[0];
            const maxAttempts = isStudent ? 2 : 1;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const transaction = await Pointage.sequelize!.transaction();
                try {
                    const pointage = await Pointage.findOne({
                        where: { utilisateurId: utilisateur.id, date: today },
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });

                    let actualMode: 'arrivee' | 'depart' | 'passage';
                    let updated: Pointage;

                    if (!pointage) {
                        updated = await Pointage.create({
                            date: today,
                            heureArrivee: time,
                            utilisateurId: utilisateur.id
                        }, { transaction });
                        actualMode = isStudent ? 'passage' : 'arrivee';
                    } else if (isStudent) {
                        // Étudiant : chaque scan est un passage, jamais un départ.
                        actualMode = 'passage';
                        updated = pointage;
                    } else {
                        if (pointage.heureDepart) {
                            await transaction.rollback();
                            return res.status(400).json({
                                success: false,
                                alreadyExists: true,
                                code: 'ALREADY_EXISTS',
                                message: "Départ déjà pointé aujourd'hui pour cet utilisateur"
                            });
                        }

                        actualMode = 'depart';
                        await pointage.update({ heureDepart: time }, { transaction });
                        updated = pointage;
                    }

                    if (isStudent) {
                        await PointageScan.create({ pointageId: updated.id, heure: time }, { transaction });
                    }
                    await transaction.commit();
                    return res.status(actualMode === 'arrivee' ? 201 : 200).json({
                        success: true,
                        mode: actualMode,
                        pointage: updated
                    });
                } catch (error) {
                    await transaction.rollback();
                    if (isStudent && (error as any)?.name === 'SequelizeUniqueConstraintError' && attempt + 1 < maxAttempts) {
                        continue;
                    }
                    throw error;
                }
            }

            throw new Error('Impossible d’enregistrer le pointage après une collision concurrente');
        } catch (error) {
            if ((error as any)?.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    alreadyExists: true,
                    code: 'ALREADY_EXISTS',
                    message: "Arrivée déjà pointée aujourd'hui pour cet utilisateur"
                })
            }
            console.error('[Pointage] échec de l’enregistrement par QR', error);
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Erreur interne lors de l’enregistrement du pointage' })
        }
    }

    static async verifierStatutByQR(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (!ROLES_POINTAGE_SCAN.includes(role)) {
            return res.status(403).json({ success: false, message: "Rôle non autorisé" })
        }

        const { codeQR } = req.params

        try {
            let userId: string | null = null;
            let dossier: DossierEtudiant | null = null;

            // Résolution unifiée, partagée par le scan QR (token OU JSON) et la
            // saisie manuelle du matricule : on extrait les mêmes clés candidates
            // puis on cherche le dossier étudiant de la même façon. Objectif : le
            // QR d'un apprenant renvoie EXACTEMENT la réponse de son matricule.
            const dossierIncludes: any[] = [
                { association: DossierEtudiant.associations.echeances },
                { association: DossierEtudiant.associations.utilisateur, attributes: ['id', 'nom', 'prenoms', 'role', 'photoDeProfil'] }
            ];

            let candidatUtilisateurId: number | null = null;
            let candidatMatricule: string | null = null;

            const verified = QrTokenService.verifier(codeQR);
            if (verified) {
                // QR carte étudiant/personnel = token signé -> utilisateurId.
                candidatUtilisateurId = verified.userId;
                userId = String(verified.userId);
            } else if (codeQR.startsWith('{')) {
                // QR JSON (codeQR de dossier) = { utilisateurId, matricule }.
                let qrData: any;
                try {
                    qrData = JSON.parse(codeQR);
                } catch (parseError) {
                    return res.status(400).json({ success: false, message: 'Code QR invalide' });
                }
                const rawId = qrData.utilisateurId ?? qrData.id;
                candidatUtilisateurId = rawId != null && Number.isFinite(Number(rawId)) ? Number(rawId) : null;
                candidatMatricule = typeof qrData.matricule === 'string' && qrData.matricule ? qrData.matricule : null;
                if (candidatUtilisateurId != null) userId = String(candidatUtilisateurId);
            } else {
                // Saisie manuelle : matricule dossier étudiant, matricule prof/personnel
                // (auto-générés à la création) ou identifiant.
                candidatMatricule = codeQR;
                userId = codeQR;
            }

            // Dossier étudiant : par utilisateurId d'abord, puis par matricule.
            if (candidatUtilisateurId != null) {
                dossier = await DossierEtudiant.findOne({
                    where: { utilisateurId: candidatUtilisateurId },
                    include: dossierIncludes
                });
            }
            if (!dossier && candidatMatricule) {
                dossier = await DossierEtudiant.findOne({
                    where: { matricule: candidatMatricule },
                    include: dossierIncludes
                });
            }

            // Repli non-dossier (personnel / enseignant) — comportement inchangé :
            // un personnel n'a pas de dossier étudiant, il reste résolu par identité.
            if (!dossier && candidatMatricule) {
                const enseignant = await Enseignant.findOne({ where: { matricule: candidatMatricule } });
                const personnel = enseignant
                    ? null
                    : await PersonnelAdministratif.findOne({ where: { matricule: candidatMatricule } });
                const ownerId = enseignant?.utilisateurId || personnel?.utilisateurId || null;
                if (ownerId) userId = String(ownerId);
                else {
                    const byIdent = await Utilisateur.findOne({
                        where: { identifiant: candidatMatricule },
                        attributes: ['id']
                    });
                    if (byIdent) userId = String(byIdent.id);
                    else if (!userId) {
                        // Dernier recours : apprenant en cours d'inscription (demande
                        // matriculée) mais sans dossier étudiant encore créé. On le
                        // résout via le matricule de sa demande afin de renvoyer le
                        // message explicite « aucun dossier actif » au lieu d'un 404.
                        const demande = await DemandeInscription.findOne({
                            where: { matricule: candidatMatricule },
                            attributes: ['utilisateurId']
                        });
                        if (demande) userId = String(demande.utilisateurId);
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

                    // Un apprenant SANS dossier étudiant n'est PAS du personnel :
                    // on ne doit jamais l'annoncer comme « Personnel autorisé ».
                    // On signale explicitement l'absence de dossier d'inscription
                    // (blocage pointage) en conservant l'identité affichée.
                    if (utilisateur.role === RolesUtilisateur.APPRENANT) {
                        return res.status(200).json({
                            statut: 'rouge',
                            message: "Aucun dossier d'inscription actif pour cet étudiant",
                            utilisateurId: userId,
                            // Utilisateur n'a pas de champ `matricule` : on expose
                            // l'identifiant pour que le terminal n'affiche pas `null`.
                            matricule: utilisateur.identifiant,
                            nom: utilisateur.nom,
                            prenoms: utilisateur.prenoms,
                            role: utilisateur.role,
                            ...photoInfo,
                            situationFinanciere: null
                        });
                    }

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

        // Somme globale = total réel facturé (échéances d'inscription + de scolarité).
        // On s'appuie sur la somme des échéances, qui reflète exactement le dû.
        // Additionner `dossier.fraisScolarite` aux échéances d'inscription
        // provoquait un DOUBLE COMPTAGE des frais d'inscription lorsque
        // `fraisScolarite` portait encore le total d'inscription (aucune
        // scolarité configurée). Repli sur `fraisScolarite` si aucune échéance.
        const totalEcheances = echeances.reduce((sum, e) => sum + (e.montant || 0), 0);
        const sommeGlobale = totalEcheances > 0 ? totalEcheances : (dossier.fraisScolarite || 0);

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

    /**
     * Traduit une violation d'unicité de `ins_pointages (utilisateurId, date)`
     * en réponse 400 « déjà pointé » (cas d'un scan concurrent), sans exposer
     * l'erreur Sequelize brute. Toute autre erreur reste un 500 générique
     * (loggée côté serveur).
     */
    private static repondreErreurPointage(res: Response, error: unknown, messageDoublon: string): Response {
        if ((error as any)?.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, alreadyExists: true, message: messageDoublon })
        }
        console.error('Erreur', error)
        return res.status(500).json({ success: false, message: 'Erreur interne' })
    }

    private static async enregistrerDepart(pointage: Pointage, heureDepart: string): Promise<Pointage | null> {
        // Une condition SQL atomique évite que deux scans lisent NULL puis
        // écrivent chacun leur heure de départ sur la même ligne.
        const [updatedCount] = await Pointage.update(
            { heureDepart: heureDepart as any },
            { where: { id: pointage.id, heureDepart: null } }
        );
        if (updatedCount === 0) return null

        const updated = await Pointage.findByPk(pointage.id);
        if (!updated) throw new Error('Le pointage mis à jour est introuvable')
        return updated
    }
}
