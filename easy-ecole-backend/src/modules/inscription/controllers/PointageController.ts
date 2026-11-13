import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Pointage } from "../models/Pointage";
import { PointageScan } from "../models/PointageScan";
import { SeancePointage } from "../models/SeancePointage";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { QrTokenService } from "../../../core/services/QrTokenService";
import { VerificationPaiementService } from "../services/VerificationPaiementService";
import SituationFinanciereService from "../services/SituationFinanciereService";
import { SituationFinanciere } from "../services/SituationFinanciereService";
import { calculerDureesPointage, formaterDureePointage } from "../services/PointageDureeService";
import SeancePointageConfirmationService from "../services/SeancePointageConfirmationService";
import { Enseignant } from "../../auth/models/Enseignant";
import { Apprenant } from "../../auth/models/Apprenant";
import { PersonnelAdministratif } from "../../auth/models/PersonnelAdministratif";
import { DemandeInscription } from "../models/DemandeInscription";
import { Seance } from "../models/Seance";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import { getSurveillantSiteId } from "../../../core/helpers/SurveillantSiteScope";
import QRCode from 'qrcode';
import ExcelJS from "exceljs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../../../core/config/jwt";
import { AlignmentType, Document, PageOrientation, Packer, Paragraph, Table, TableCell, TableLayoutType, TableRow, TextRun, WidthType } from "docx";

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

function createDepartureConfirmation(userId: number, date: string, time: string): string {
    return jwt.sign({ purpose: "pointage-depart", userId, date, time }, JWT_SECRET, { expiresIn: "2m" });
}

function verifyDepartureConfirmation(token: unknown, userId: number, date: string): string | null {
    if (typeof token !== "string" || !token) return null;
    try {
        const claims = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return claims.purpose === "pointage-depart"
            && Number(claims.userId) === userId
            && claims.date === date
            && typeof claims.time === "string"
            && /^\d{2}:\d{2}:\d{2}$/.test(claims.time)
            ? claims.time
            : null;
    } catch {
        return null;
    }
}

function heurePointage(value: unknown): string {
    const text = value instanceof Date ? value.toISOString() : String(value ?? "");
    const match = text.match(/(?:^|T)(\d{2}):(\d{2})(?::(\d{2}))?/);
    return match ? `${match[1]}:${match[2]}:${match[3] || "00"}` : "";
}

function minutesHeure(value: unknown): number {
    const heure = heurePointage(value);
    return heure ? Number(heure.slice(0, 2)) * 60 + Number(heure.slice(3, 5)) : -1;
}

export default class PointageController {

    constructor() { }

    private static async getPhotoPourPointage(utilisateur: Utilisateur, photoDossier?: string | null): Promise<{ photo: string; photoType: string }> {
        if (utilisateur.role === RolesUtilisateur.APPRENANT) {
            const apprenant = await Apprenant.findOne({
                where: { utilisateurId: utilisateur.id },
                attributes: ['photo']
            });
            const photoApprenant = photoDossier || apprenant?.photo;
            return photoApprenant
                ? { photo: photoApprenant, photoType: 'apprenant' }
                : { photo: utilisateur.photoDeProfil || '', photoType: 'profile' };
        }
        if (utilisateur.role === RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({
                where: { utilisateurId: utilisateur.id },
                attributes: ['photo']
            });
            return enseignant?.photo
                ? { photo: enseignant.photo, photoType: 'enseignant' }
                : { photo: utilisateur.photoDeProfil || '', photoType: 'profile' };
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
                    utilisateurId: { [Op.in]: await PointageController.getUtilisateurIdsDuSite(etablissementId) }
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
                where.utilisateurId = { [Op.in]: await PointageController.getUtilisateurIdsDuSite(etablissementId) };
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

    // ========================================================================
    //  EXPORT DE L'HISTORIQUE (EXCEL / WORD)
    // ========================================================================

    private static readonly ROLE_LABELS_EXPORT: { [key: string]: string } = {
        [RolesUtilisateur.ADMIN]: 'Administrateur',
        [RolesUtilisateur.APPRENANT]: 'Apprenant',
        [RolesUtilisateur.INSTITUTION]: 'Institution',
        [RolesUtilisateur.ENSEIGNANT]: 'Enseignant',
        [RolesUtilisateur.CAISSIER_BANQUE]: 'Caissier banque',
        [RolesUtilisateur.RESSOURCES_HUMAINES]: 'Ressources humaines',
        [RolesUtilisateur.CABINET_COMPTABLE]: 'Cabinet comptable',
        [RolesUtilisateur.COMITE_ORIENTATION]: "Comité d'orientation",
        [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'Personnel administratif',
        [RolesUtilisateur.ESA_COMPTA]: 'ESA Compta',
        [RolesUtilisateur.PARENT]: 'Parent',
        [RolesUtilisateur.SECRETAIRE]: 'Secrétaire',
        [RolesUtilisateur.SURVEILLANT]: 'Surveillant',
        [RolesUtilisateur.SUPERVISEUR_GENERAL]: 'Superviseur général',
    };

    private static normaliserTexte(valeur: unknown): string {
        return String(valeur ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private static heureCourte(valeur: any): string {
        if (valeur === null || valeur === undefined || valeur === '') return '';
        if (valeur instanceof Date) {
            const heures = String(valeur.getHours()).padStart(2, '0');
            const minutes = String(valeur.getMinutes()).padStart(2, '0');
            return `${heures}:${minutes}`;
        }
        const correspondance = String(valeur).match(/(\d{1,2}):(\d{2})/);
        if (!correspondance) return '';
        return `${correspondance[1].padStart(2, '0')}:${correspondance[2]}`;
    }

    private static minutesDepuisHeure(valeur: any): number | null {
        const heure = PointageController.heureCourte(valeur);
        if (!heure) return null;
        const [heures, minutes] = heure.split(':').map(Number);
        return heures * 60 + minutes;
    }

    private static dureeMinutes(arrivee: any, depart: any): number | null {
        const debut = PointageController.minutesDepuisHeure(arrivee);
        const fin = PointageController.minutesDepuisHeure(depart);
        if (debut === null || fin === null) return null;
        return Math.max(0, fin - debut);
    }

    private static formatDuree(minutes: number | null): string {
        if (minutes === null) return '—';
        const heures = Math.floor(minutes / 60);
        const reste = minutes % 60;
        if (heures === 0) return `${reste} min`;
        return `${heures}h${reste > 0 ? String(reste).padStart(2, '0') : ''}`;
    }

    private static formatDateFr(valeur: any): string {
        const iso = String(valeur ?? '').slice(0, 10);
        const correspondance = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!correspondance) return iso || '—';
        return `${correspondance[3]}/${correspondance[2]}/${correspondance[1]}`;
    }

    private static formatJourFr(valeur: any): string {
        const iso = String(valeur ?? '').slice(0, 10);
        const correspondance = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!correspondance) return '';
        const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const date = new Date(Date.UTC(Number(correspondance[1]), Number(correspondance[2]) - 1, Number(correspondance[3])));
        return jours[date.getUTCDay()] || '';
    }

    private static formatHorodatage(date: Date): string {
        const pad = (valeur: number) => String(valeur).padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} à ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    /**
     * Exporte l'historique des pointages filtré (période, rôle, recherche, statut).
     * GET /inscription/pointages/export?format=xlsx|docx&debut=YYYY-MM-DD&fin=YYYY-MM-DD
     */
    static async exportPointages(req: Request, res: Response): Promise<Response> {
        const format = typeof req.query.format === 'string' ? req.query.format.toLowerCase() : 'xlsx';
        if (format !== 'xlsx' && format !== 'docx') {
            return res.status(400).json({ success: false, message: "Format d'export non pris en charge (xlsx ou docx)" });
        }

        const dateValide = (valeur: string) => /^\d{4}-\d{2}-\d{2}$/.test(valeur);
        if ((req.query.debut !== undefined && (typeof req.query.debut !== 'string' || !dateValide(req.query.debut))) ||
            (req.query.fin !== undefined && (typeof req.query.fin !== 'string' || !dateValide(req.query.fin)))) {
            return res.status(400).json({ success: false, message: 'Dates invalides (format attendu : YYYY-MM-DD)' });
        }
        const debut = typeof req.query.debut === 'string' ? req.query.debut : '';
        const fin = typeof req.query.fin === 'string' ? req.query.fin : '';
        if (debut && fin && debut > fin) {
            return res.status(400).json({ success: false, message: 'La date de début doit précéder la date de fin' });
        }

        const recherche = typeof req.query.search === 'string' ? PointageController.normaliserTexte(req.query.search) : '';
        const roleFiltre = typeof req.query.role === 'string' ? req.query.role : '';
        const statutFiltre = typeof req.query.statut === 'string' ? req.query.statut : '';

        const where: any = {};
        if (debut || fin) {
            where.date = {};
            if (debut) where.date[Op.gte] = debut;
            if (fin) where.date[Op.lte] = fin;
        }

        const role = (req as any).utilisateurRole;
        if (role == RolesUtilisateur.APPRENANT || role == RolesUtilisateur.ENSEIGNANT) {
            where.utilisateurId = (req as any).utilisateurId;
        } else if (role === RolesUtilisateur.SURVEILLANT) {
            const etablissementId = await getSurveillantSiteId(req);
            if (!etablissementId) {
                return res.status(403).json({ success: false, message: "Aucun site actif autorisé pour ce surveillant" });
            }
            where.utilisateurId = { [Op.in]: await PointageController.getUtilisateurIdsDuSite(etablissementId) };
        }

        try {
            const pointages = await Pointage.findAll({
                where,
                include: [
                    { association: Pointage.associations.utilisateur, attributes: ['id', 'nom', 'prenoms', 'identifiant', 'role'] },
                    Pointage.associations.scans,
                ],
                order: [
                    ['date', 'DESC'],
                    ['heureArrivee', 'DESC'],
                    [{ model: PointageScan, as: 'scans' }, 'heure', 'ASC'],
                    [{ model: PointageScan, as: 'scans' }, 'id', 'ASC'],
                ],
            });

            const pointagesFiltres = (pointages as any[]).filter(pointage => {
                const utilisateur = pointage.utilisateur || {};
                if (roleFiltre && utilisateur.role !== roleFiltre) return false;
                if (recherche) {
                    const contenu = PointageController.normaliserTexte(
                        `${utilisateur.nom || ''} ${utilisateur.prenoms || ''} ${utilisateur.identifiant || ''}`
                    );
                    if (!contenu.includes(recherche)) return false;
                }
                const complet = !!pointage.heureArrivee && !!pointage.heureDepart;
                if (statutFiltre === 'complet' && !complet) return false;
                if (statutFiltre === 'en_cours' && complet) return false;
                return true;
            });

            if (pointagesFiltres.length === 0) {
                return res.status(404).json({ success: false, message: 'Aucun pointage à exporter pour ces critères' });
            }

            const lignes = pointagesFiltres.map((pointage, index) => {
                const minutes = PointageController.dureeMinutes(pointage.heureArrivee, pointage.heureDepart);
                const estPersonnel = pointage.utilisateur?.role !== RolesUtilisateur.APPRENANT;
                const dureesPointage = estPersonnel
                    ? calculerDureesPointage(pointage.heureArrivee, pointage.heureDepart)
                    : { minutesNormales: null, minutesSupplementaires: null };
                const departManquant = !pointage.heureDepart;
                const passages = (pointage.scans || [])
                    .map((scan: any) => PointageController.heureCourte(scan.heure))
                    .filter((heure: string) => !!heure);
                return {
                    numero: index + 1,
                    utilisateurId: Number(pointage.utilisateurId),
                    estPersonnel,
                    date: PointageController.formatDateFr(pointage.date),
                    jour: PointageController.formatJourFr(pointage.date),
                    nom: pointage.utilisateur?.nom || '',
                    prenoms: pointage.utilisateur?.prenoms || '',
                    identifiant: pointage.utilisateur?.identifiant || '',
                    role: PointageController.ROLE_LABELS_EXPORT[pointage.utilisateur?.role] || pointage.utilisateur?.role || '—',
                    arrivee: PointageController.heureCourte(pointage.heureArrivee) || '—',
                    depart: PointageController.heureCourte(pointage.heureDepart) || '—',
                    duree: PointageController.formatDuree(minutes),
                    dureeMinutes: minutes,
                    heuresNormales: !estPersonnel
                        ? '—'
                        : departManquant
                            ? 'En cours'
                            : formaterDureePointage(dureesPointage.minutesNormales),
                    heuresNormalesMinutes: dureesPointage.minutesNormales,
                    heuresSupplementaires: !estPersonnel
                        ? '—'
                        : departManquant
                            ? 'En cours'
                            : formaterDureePointage(dureesPointage.minutesSupplementaires),
                    heuresSupplementairesMinutes: dureesPointage.minutesSupplementaires,
                    passages: passages.join(' · '),
                    statut: minutes !== null ? 'Complet' : 'En cours',
                };
            });

            const personnes = new Set(pointagesFiltres.map(pointage => Number(pointage.utilisateurId))).size;
            const totalMinutes = lignes.reduce((somme, ligne) => somme + (ligne.dureeMinutes || 0), 0);
            const complets = lignes.filter(ligne => ligne.dureeMinutes !== null).length;
            const taux = Math.round((complets / lignes.length) * 100);
            const periodeLabel = debut || fin
                ? `Période : ${debut ? PointageController.formatDateFr(debut) : 'début'} → ${fin ? PointageController.formatDateFr(fin) : "aujourd'hui"}`
                : 'Période : toutes les données disponibles';
            const resumeLabel = `${lignes.length} pointage(s) · ${personnes} personne(s) · ${PointageController.formatDuree(totalMinutes)} cumulées · ${taux} % de journées complètes`;
            const nomFichier = `pointages_${debut || 'debut'}_${fin || 'fin'}`;

            const meta = { periodeLabel, resumeLabel, nomFichier };
            return format === 'xlsx'
                ? PointageController.envoyerExportExcel(res, lignes, meta)
                : PointageController.envoyerExportWord(res, lignes, meta);
        } catch (error) {
            console.error('Erreur export pointages', error);
            return res.status(500).json({ success: false, message: "Erreur lors de la génération de l'export" });
        }
    }

    private static async envoyerExportExcel(
        res: Response,
        lignes: any[],
        meta: { periodeLabel: string; resumeLabel: string; nomFichier: string }
    ): Promise<Response> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'EasyEcole';
        workbook.created = new Date();

        const feuille = workbook.addWorksheet('Pointages', {
            views: [{ state: 'frozen', ySplit: 5 }],
            pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
        });
        feuille.columns = [
            { width: 6 }, { width: 12 }, { width: 12 }, { width: 22 }, { width: 24 },
            { width: 16 }, { width: 22 }, { width: 10 }, { width: 10 }, { width: 13 }, { width: 14 },
            { width: 14 }, { width: 20 }, { width: 11 },
        ];

        const bordure: Partial<ExcelJS.Borders> = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        feuille.mergeCells('A1:N1');
        const titre = feuille.getCell('A1');
        titre.value = 'Historique des pointages';
        titre.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1F3C75' } };
        titre.alignment = { vertical: 'middle', horizontal: 'left' };
        feuille.getRow(1).height = 30;

        feuille.mergeCells('A2:N2');
        const sousTitre = feuille.getCell('A2');
        sousTitre.value = meta.periodeLabel;
        sousTitre.font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };

        feuille.mergeCells('A3:N3');
        const resume = feuille.getCell('A3');
        resume.value = meta.resumeLabel;
        resume.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };

        feuille.mergeCells('A4:N4');
        feuille.getCell('A4').value = 'Pour le personnel : heures normales avant 18 h, heures supplémentaires à partir de 18 h. Un départ manquant reste « En cours ».';
        feuille.getCell('A4').font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
        feuille.getCell('A4').alignment = { vertical: 'middle', horizontal: 'left' };
        const entetes = [
            'N°', 'Date', 'Jour', 'Nom', 'Prénoms', 'Identifiant', 'Rôle', 'Arrivée', 'Départ',
            'Durée totale', 'Heures normales', 'Heures supplémentaires', 'Passages', 'Statut',
        ];
        const ligneEntete = 5;
        entetes.forEach((entete, indexColonne) => {
            const cellule = feuille.getCell(ligneEntete, indexColonne + 1);
            cellule.value = entete;
            cellule.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
            cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3C75' } };
            cellule.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cellule.border = bordure;
        });
        feuille.getRow(ligneEntete).height = 24;

        lignes.forEach((ligne, indexLigne) => {
            const numeroLigne = ligneEntete + 1 + indexLigne;
            const valeurs = [
                ligne.numero, ligne.date, ligne.jour, ligne.nom, ligne.prenoms, ligne.identifiant,
                ligne.role, ligne.arrivee, ligne.depart, ligne.duree,
                ligne.heuresNormalesMinutes === null ? ligne.heuresNormales : ligne.heuresNormalesMinutes / 1440,
                ligne.heuresSupplementairesMinutes === null
                    ? ligne.heuresSupplementaires
                    : ligne.heuresSupplementairesMinutes / 1440,
                ligne.passages || '—', ligne.statut,
            ];
            valeurs.forEach((valeur, indexColonne) => {
                const cellule = feuille.getCell(numeroLigne, indexColonne + 1);
                cellule.value = valeur;
                if ((indexColonne === 10 || indexColonne === 11) && typeof valeur === 'number') {
                    cellule.numFmt = '[h]:mm';
                }
                cellule.font = {
                    name: 'Calibri',
                    size: 9,
                    bold: indexColonne === 9 || indexColonne === 11,
                    color: { argb: indexColonne === 13 && ligne.statut === 'En cours' ? 'FFB45309' : 'FF334155' },
                };
                cellule.alignment = {
                    vertical: 'middle',
                    horizontal: [3, 4, 6, 12].includes(indexColonne) ? 'left' : 'center',
                    wrapText: true,
                };
                cellule.border = bordure;
                if (indexLigne % 2 === 1) {
                    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
            });
            feuille.getRow(numeroLigne).height = 18;
        });

        const ligneTotal = ligneEntete + lignes.length + 1;
        feuille.mergeCells(`A${ligneTotal}:N${ligneTotal}`);
        const total = feuille.getCell(`A${ligneTotal}`);
        total.value = `TOTAL — ${meta.resumeLabel}`;
        total.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F3C75' } };
        total.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
        total.alignment = { vertical: 'middle', horizontal: 'left' };
        total.border = bordure;
        feuille.getRow(ligneTotal).height = 22;

        feuille.autoFilter = {
            from: { row: ligneEntete, column: 1 },
            to: { row: ligneEntete + lignes.length, column: 14 },
        };

        const recapitulatif = workbook.addWorksheet('Par personne', {
            views: [{ state: 'frozen', ySplit: 5 }],
        });
        recapitulatif.columns = [
            { width: 6 }, { width: 24 }, { width: 24 }, { width: 18 }, { width: 28 },
            { width: 16 }, { width: 18 }, { width: 24 }, { width: 18 },
        ];
        recapitulatif.mergeCells('A1:I1');
        recapitulatif.getCell('A1').value = 'Récapitulatif des heures par personne';
        recapitulatif.getCell('A1').font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1F3C75' } };
        recapitulatif.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
        recapitulatif.getRow(1).height = 30;
        recapitulatif.mergeCells('A2:I2');
        recapitulatif.getCell('A2').value = meta.periodeLabel;
        recapitulatif.getCell('A2').font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
        recapitulatif.mergeCells('A3:I3');
        recapitulatif.getCell('A3').value = 'Les journées sans départ sont comptées comme « En cours » et exclues des totaux définitifs.';
        recapitulatif.getCell('A3').font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };

        const entetesRecapitulatif = [
            'N°', 'Nom', 'Prénoms', 'Identifiant', 'Rôle', 'Jours complets',
            'Heures normales', 'Heures supplémentaires', 'Départs manquants',
        ];
        entetesRecapitulatif.forEach((entete, indexColonne) => {
            const cellule = recapitulatif.getCell(5, indexColonne + 1);
            cellule.value = entete;
            cellule.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
            cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3C75' } };
            cellule.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cellule.border = bordure;
        });
        recapitulatif.getRow(5).height = 28;

        const totauxParPersonne = new Map<number, {
            nom: string;
            prenoms: string;
            identifiant: string;
            role: string;
            joursComplets: number;
            minutesNormales: number;
            minutesSupplementaires: number;
            departsManquants: number;
        }>();
        lignes.filter(ligne => ligne.estPersonnel).forEach(ligne => {
            let total = totauxParPersonne.get(ligne.utilisateurId);
            if (!total) {
                total = {
                    nom: ligne.nom,
                    prenoms: ligne.prenoms,
                    identifiant: ligne.identifiant,
                    role: ligne.role,
                    joursComplets: 0,
                    minutesNormales: 0,
                    minutesSupplementaires: 0,
                    departsManquants: 0,
                };
                totauxParPersonne.set(ligne.utilisateurId, total);
            }
            if (ligne.statut === 'En cours') {
                total.departsManquants += 1;
                return;
            }
            total.joursComplets += 1;
            total.minutesNormales += ligne.heuresNormalesMinutes || 0;
            total.minutesSupplementaires += ligne.heuresSupplementairesMinutes || 0;
        });

        const personnesTriees = Array.from(totauxParPersonne.values()).sort((a, b) =>
            `${a.nom} ${a.prenoms}`.localeCompare(`${b.nom} ${b.prenoms}`, 'fr')
        );
        personnesTriees.forEach((personne, indexLigne) => {
            const ligne = recapitulatif.getRow(6 + indexLigne);
            const valeurs = [
                indexLigne + 1, personne.nom, personne.prenoms, personne.identifiant, personne.role,
                personne.joursComplets, personne.minutesNormales / 1440,
                personne.minutesSupplementaires / 1440, personne.departsManquants,
            ];
            valeurs.forEach((valeur, indexColonne) => {
                const cellule = ligne.getCell(indexColonne + 1);
                cellule.value = valeur;
                cellule.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
                cellule.alignment = { vertical: 'middle', horizontal: [1, 2, 3, 4].includes(indexColonne) ? 'left' : 'center' };
                cellule.border = bordure;
                if (indexColonne === 6 || indexColonne === 7) cellule.numFmt = '[h]:mm';
                if (indexLigne % 2 === 1) {
                    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
            });
        });

        const ligneTotalRecap = 6 + personnesTriees.length;
        const totalNormal = personnesTriees.reduce((somme, personne) => somme + personne.minutesNormales, 0);
        const totalSupplementaire = personnesTriees.reduce((somme, personne) => somme + personne.minutesSupplementaires, 0);
        const totalDepartManquant = personnesTriees.reduce((somme, personne) => somme + personne.departsManquants, 0);
        recapitulatif.mergeCells(`A${ligneTotalRecap}:E${ligneTotalRecap}`);
        recapitulatif.getCell(`A${ligneTotalRecap}`).value = 'TOTAL GÉNÉRAL';
        recapitulatif.getCell(`F${ligneTotalRecap}`).value = personnesTriees.reduce((somme, personne) => somme + personne.joursComplets, 0);
        recapitulatif.getCell(`G${ligneTotalRecap}`).value = totalNormal / 1440;
        recapitulatif.getCell(`H${ligneTotalRecap}`).value = totalSupplementaire / 1440;
        recapitulatif.getCell(`I${ligneTotalRecap}`).value = totalDepartManquant;
        recapitulatif.getCell(`G${ligneTotalRecap}`).numFmt = '[h]:mm';
        recapitulatif.getCell(`H${ligneTotalRecap}`).numFmt = '[h]:mm';
        for (let indexColonne = 1; indexColonne <= 9; indexColonne++) {
            const cellule = recapitulatif.getCell(ligneTotalRecap, indexColonne);
            cellule.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F3C75' } };
            cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
            cellule.border = bordure;
        }

        recapitulatif.autoFilter = {
            from: { row: 5, column: 1 },
            to: { row: 5 + personnesTriees.length, column: 9 },
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${meta.nomFichier}.xlsx"`);
        const buffer = await workbook.xlsx.writeBuffer();
        return res.status(200).send(Buffer.from(buffer));
    }

    private static async envoyerExportWord(
        res: Response,
        lignes: any[],
        meta: { periodeLabel: string; resumeLabel: string; nomFichier: string }
    ): Promise<Response> {
        const entetes = ['Date', 'Nom & prénoms', 'Identifiant', 'Rôle', 'Arrivée', 'Départ', 'Durée', 'Passages', 'Statut'];
        const largeurs = [9, 21, 13, 16, 8, 8, 8, 9, 8];
        const bordure = {
            top: { style: 'single' as const, size: 4, color: 'E2E8F0' },
            bottom: { style: 'single' as const, size: 4, color: 'E2E8F0' },
            left: { style: 'single' as const, size: 4, color: 'E2E8F0' },
            right: { style: 'single' as const, size: 4, color: 'E2E8F0' },
        };

        const creerCellule = (valeur: string, indexColonne: number, ombre: boolean) => new TableCell({
            width: { size: largeurs[indexColonne], type: WidthType.PERCENTAGE },
            shading: ombre ? { fill: 'F8FAFC' } : undefined,
            margins: { top: 40, bottom: 40, left: 70, right: 70 },
            borders: bordure,
            children: [new Paragraph({
                alignment: [1, 2, 3, 7].includes(indexColonne) ? AlignmentType.LEFT : AlignmentType.CENTER,
                children: [new TextRun({
                    text: valeur,
                    size: 16,
                    font: 'Calibri',
                    color: indexColonne === 4 && valeur !== '—'
                        ? '047857'
                        : indexColonne === 8 && valeur === 'En cours'
                            ? 'B45309'
                            : '334155',
                })],
            })],
        });

        const ligneEntete = new TableRow({
            tableHeader: true,
            children: entetes.map((entete, indexColonne) => new TableCell({
                width: { size: largeurs[indexColonne], type: WidthType.PERCENTAGE },
                shading: { fill: '1F3C75' },
                margins: { top: 50, bottom: 50, left: 70, right: 70 },
                borders: bordure,
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: entete, bold: true, size: 16, font: 'Calibri', color: 'FFFFFF' })],
                })],
            })),
        });

        const lignesTable = lignes.map((ligne, indexLigne) => {
            const valeurs = [
                ligne.date,
                `${ligne.nom} ${ligne.prenoms}`.trim() || ligne.identifiant || '—',
                ligne.identifiant || '—',
                ligne.role,
                ligne.arrivee,
                ligne.depart,
                ligne.duree,
                ligne.passages || '—',
                ligne.statut,
            ];
            return new TableRow({
                cantSplit: true,
                children: valeurs.map((valeur, indexColonne) =>
                    creerCellule(String(valeur), indexColonne, indexLigne % 2 === 1)
                ),
            });
        });

        const document = new Document({
            creator: 'EasyEcole',
            title: 'Historique des pointages',
            sections: [{
                properties: {
                    page: {
                        size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE },
                        margin: { top: 720, right: 720, bottom: 720, left: 720 },
                    },
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 80 },
                        children: [new TextRun({ text: 'Historique des pointages', bold: true, size: 30, font: 'Calibri', color: '1F3C75' })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [new TextRun({ text: meta.periodeLabel, size: 18, font: 'Calibri', color: '64748B' })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                        children: [new TextRun({ text: meta.resumeLabel, bold: true, size: 18, font: 'Calibri', color: '334155' })],
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        layout: TableLayoutType.FIXED,
                        rows: [ligneEntete, ...lignesTable],
                    }),
                    new Paragraph({
                        spacing: { before: 200 },
                        children: [new TextRun({
                            text: `Document généré le ${PointageController.formatHorodatage(new Date())} — EasyEcole`,
                            italics: true,
                            size: 14,
                            font: 'Calibri',
                            color: '94A3B8',
                        })],
                    }),
                ],
            }],
        });

        const buffer = await Packer.toBuffer(document);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${meta.nomFichier}.docx"`);
        return res.status(200).send(buffer);
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
        const userId = Number((req as any).utilisateurId)
        const confirmedTime = verifyDepartureConfirmation(req.body?.confirmationToken, userId, today)
        if (req.body?.confirmationToken && !confirmedTime) {
            return res.status(400).json({ success: false, code: 'INVALID_DEPARTURE_CONFIRMATION', message: 'La confirmation du départ a expiré. Recommencez le pointage.' })
        }
        const time = confirmedTime || now.toTimeString().split(' ')[0]

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

            if (!confirmedTime) {
                return res.status(200).json({
                    success: true,
                    requiresConfirmation: true,
                    mode: 'depart',
                    heureDepart: time,
                    confirmationToken: createDepartureConfirmation(userId, today, time)
                });
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

        const userId = Number(req.body?.userId)
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: "userId requis" });
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date()
        const confirmedTime = verifyDepartureConfirmation(req.body?.confirmationToken, userId, today)
        if (req.body?.confirmationToken && !confirmedTime) {
            return res.status(400).json({ success: false, code: 'INVALID_DEPARTURE_CONFIRMATION', message: 'La confirmation du départ a expiré. Recommencez le pointage.' })
        }
        const time = confirmedTime || now.toTimeString().split(' ')[0]

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

            if (!confirmedTime) {
                return res.status(200).json({
                    success: true,
                    requiresConfirmation: true,
                    mode: 'depart',
                    utilisateurId: Number(userId),
                    heureDepart: time,
                    confirmationToken: createDepartureConfirmation(Number(userId), today, time)
                });
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

    static async pointerFinCoursByScan(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (!ROLES_POINTAGE_SCAN.includes(role)) {
            return res.status(403).json({ success: false, message: "Rôle non autorisé" })
        }

        const confirmation = SeancePointageConfirmationService.verifier(req.body?.confirmationToken);
        if (!confirmation) {
            return res.status(400).json({
                success: false,
                code: "INVALID_COURSE_END_CONFIRMATION",
                message: "La confirmation de fin de cours a expiré. Recommencez le pointage."
            });
        }

        const transaction = await Pointage.sequelize!.transaction();
        try {
            const pointageSeance = await SeancePointage.findOne({
                where: {
                    id: confirmation.seancePointageId,
                    utilisateurId: confirmation.utilisateurId,
                    etablissementId: confirmation.etablissementId,
                    date: confirmation.date,
                    heureDebutReelle: { [Op.ne]: null },
                    heureFinReelle: null
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!pointageSeance?.heureDebutReelle || confirmation.heureFin < pointageSeance.heureDebutReelle) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    code: "COURSE_END_NOT_AVAILABLE",
                    message: "Ce cours n’est plus en attente de confirmation."
                });
            }

            const pointage = await Pointage.findOne({
                where: { utilisateurId: confirmation.utilisateurId, date: confirmation.date },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!pointage) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    code: "DAILY_ATTENDANCE_NOT_FOUND",
                    message: "Le pointage journalier associé à ce cours est introuvable."
                });
            }
            if (pointage.heureDepart) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    code: "DAILY_DEPARTURE_ALREADY_RECORDED",
                    message: "Un départ est déjà enregistré pour cette journée."
                });
            }

            await pointageSeance.update({ heureFinReelle: confirmation.heureFin }, { transaction });
            await pointage.update({ heureDepart: confirmation.heureFin }, { transaction });
            await transaction.commit();
            return res.status(200).send(pointage);
        } catch (error) {
            await transaction.rollback();
            console.error("[Pointage] échec de la confirmation de fin de cours", error);
            return res.status(500).json({ success: false, message: "Erreur interne lors de la confirmation de fin de cours" });
        }
    }

    private static async pointerEnseignantParQR(
        req: Request,
        res: Response,
        utilisateur: Utilisateur,
        date: string,
        heure: string
    ): Promise<Response> {
        const etablissementId = Number(req.etablissementId);
        if (!Number.isSafeInteger(etablissementId) || etablissementId <= 0) {
            return res.status(409).json({
                success: false,
                code: "SITE_REQUIRED",
                message: "Sélectionnez le site prévu pour cette séance avant de pointer."
            });
        }

        const enseignant = await Enseignant.findOne({
            where: { utilisateurId: utilisateur.id },
            attributes: ["id"]
        });
        if (!enseignant) {
            return res.status(403).json({
                success: false,
                code: "NOT_PROGRAMMED",
                message: "Aucun planning de cours n’est associé à ce compte enseignant."
            });
        }

        const heureEnMinutes = minutesHeure(heure);
        const dateValue = new Date(`${date}T00:00:00.000Z`);
        const jour = String(dateValue.getUTCDay() || 7);
        const transaction = await Pointage.sequelize!.transaction();

        try {
            const seancesActives = await SeancePointage.findAll({
                where: {
                    utilisateurId: Number(utilisateur.id),
                    enseignantId: Number(enseignant.id),
                    etablissementId,
                    date,
                    heureDebutReelle: { [Op.ne]: null },
                    heureFinReelle: null
                },
                order: [["heureDebutReelle", "ASC"]],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (seancesActives.length > 1) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    code: "MULTIPLE_ACTIVE_SESSIONS",
                    message: "Plusieurs cours sont déjà en cours. Aucun pointage n’a été enregistré."
                });
            }

            if (seancesActives.length === 1) {
                const pointageSeance = seancesActives[0];
                const seance = await Seance.findOne({
                    where: {
                        id: pointageSeance.seanceId,
                        enseignantId: Number(enseignant.id),
                        etablissementId
                    },
                    include: [{ association: Seance.associations.cours, required: true }],
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!seance) {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        code: "SESSION_NOT_FOUND",
                        message: "Le cours en cours n’a pas pu être retrouvé. Aucun pointage n’a été enregistré."
                    });
                }

                const heureDebutReelle = heurePointage(pointageSeance.heureDebutReelle);
                const confirmationToken = SeancePointageConfirmationService.creer({
                    seancePointageId: Number(pointageSeance.id),
                    utilisateurId: Number(utilisateur.id),
                    etablissementId,
                    date,
                    heureFin: heure
                });
                await transaction.rollback();
                return res.status(200).json({
                    success: true,
                    requiresConfirmation: true,
                    mode: "depart",
                    utilisateurId: Number(utilisateur.id),
                    heureDepart: heure,
                    confirmationToken,
                    seancePointage: {
                        action: "fin",
                        seanceId: Number(seance.id),
                        cours: String((seance as any).cours?.intitule || seance.titre || "Cours planifié"),
                        heureDebutPrevue: heurePointage(seance.heureDebut),
                        heureFinPrevue: heurePointage(seance.heureFin),
                        heureDebutReelle,
                        heureFinReelle: null,
                        heureReelle: heure,
                        confirmationToken
                    }
                });
            }

            const seances = await Seance.findAll({
                where: {
                    enseignantId: Number(enseignant.id),
                    etablissementId,
                    jourSemaine: jour,
                    dateDebut: { [Op.lte]: date },
                    dateFin: { [Op.gte]: date },
                    publieeLe: { [Op.ne]: null }
                },
                include: [{ association: Seance.associations.cours, required: true }],
                order: [["heureDebut", "ASC"]],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            const seancesEnCours = seances.filter(seance => {
                const debut = minutesHeure(seance.heureDebut);
                const fin = minutesHeure(seance.heureFin);
                return debut >= 0 && fin > debut && heureEnMinutes >= debut && heureEnMinutes < fin;
            });

            if (seancesEnCours.length === 0) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    code: "NOT_PROGRAMMED",
                    message: "Vous n’êtes pas programmé à cette heure. Aucun pointage n’a été enregistré."
                });
            }
            if (seancesEnCours.length > 1) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    code: "MULTIPLE_SCHEDULED_SESSIONS",
                    message: "Plusieurs cours sont programmés à cette heure. Aucun pointage n’a été enregistré."
                });
            }

            const seance = seancesEnCours[0];
            const pointageSeance = await SeancePointage.findOne({
                where: { seanceId: Number(seance.id), date },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (pointageSeance?.heureDebutReelle || pointageSeance?.heureFinReelle) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    code: "SESSION_ALREADY_RECORDED",
                    message: "Ce cours a déjà été pointé aujourd’hui. Aucun nouveau pointage n’a été enregistré."
                });
            }

            if (pointageSeance) {
                await pointageSeance.update({ heureDebutReelle: heure }, { transaction });
            } else {
                await SeancePointage.create({
                    seanceId: Number(seance.id),
                    date,
                    enseignantId: String(enseignant.id),
                    utilisateurId: Number(utilisateur.id),
                    etablissementId,
                    heureDebutReelle: heure,
                    heureFinReelle: null
                }, { transaction });
            }

            let pointage = await Pointage.findOne({
                where: { utilisateurId: Number(utilisateur.id), date },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!pointage) {
                pointage = await Pointage.create({
                    utilisateurId: Number(utilisateur.id),
                    date,
                    heureArrivee: heure,
                    heureDepart: null
                }, { transaction });
            } else if (pointage.heureDepart) {
                await pointage.update({ heureDepart: null }, { transaction });
            }

            await transaction.commit();
            return res.status(200).json({
                success: true,
                mode: "arrivee",
                pointage,
                heureEvenement: heure,
                seancePointage: {
                    action: "debut",
                    seanceId: Number(seance.id),
                    cours: String((seance as any).cours?.intitule || seance.titre || "Cours planifié"),
                    heureDebutPrevue: heurePointage(seance.heureDebut),
                    heureFinPrevue: heurePointage(seance.heureFin),
                    heureDebutReelle: heure,
                    heureFinReelle: null,
                    heureReelle: heure
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error("[Pointage] échec du pointage de séance par QR", error);
            return res.status(500).json({
                success: false,
                code: "INTERNAL_ERROR",
                message: "Erreur interne lors de l’enregistrement du pointage"
            });
        }
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

        let avertissementPaiement: string | null = null
        let situationFinanciere: SituationFinanciere | null = null
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
                situationFinanciere = SituationFinanciereService.calculer(dossier)
                const paiement = VerificationPaiementService.verifierDossier(dossier);
                if (paiement.statut === 'rouge') {
                    return res.status(403).json({
                        success: false,
                        code: 'ATTENDANCE_NOT_ALLOWED',
                        statut: 'rouge',
                        message: paiement.message
                    })
                }
                avertissementPaiement = paiement.avertissementPaiement || null
            }

            const isStudent = utilisateur.role === RolesUtilisateur.APPRENANT;
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const time = now.toISOString().slice(11, 19);
            if (utilisateur.role === RolesUtilisateur.ENSEIGNANT) {
                return await PointageController.pointerEnseignantParQR(req, res, utilisateur, today, time);
            }
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

                        const confirmedTime = verifyDepartureConfirmation(req.body?.confirmationToken, utilisateur.id, today);
                        if (req.body?.confirmationToken && !confirmedTime) {
                            await transaction.rollback();
                            return res.status(400).json({ success: false, code: 'INVALID_DEPARTURE_CONFIRMATION', message: 'La confirmation du départ a expiré. Recommencez le pointage.' });
                        }
                        const departureTime = confirmedTime || time;
                        if (!confirmedTime) {
                            await transaction.rollback();
                            return res.status(200).json({
                                success: true,
                                requiresConfirmation: true,
                                mode: 'depart',
                                heureDepart: departureTime,
                                confirmationToken: createDepartureConfirmation(utilisateur.id, today, departureTime)
                            });
                        }

                        actualMode = 'depart';
                        await pointage.update({ heureDepart: departureTime }, { transaction });
                        updated = pointage;
                    }

                    if (isStudent) {
                        await PointageScan.create({ pointageId: updated.id, heure: time }, { transaction });
                    }
                    await transaction.commit();
                    return res.status(actualMode === 'arrivee' ? 201 : 200).json({
                        success: true,
                        mode: actualMode,
                        pointage: updated,
                        heureEvenement: time,
                        ...(avertissementPaiement ? { avertissementPaiement } : {}),
                        ...(situationFinanciere ? { situationFinanciere } : {})
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
                const situationFinanciere = SituationFinanciereService.calculer(dossier);

                if (paiement.statut == 'rouge') {
                    return res.status(200).json({
                        statut: 'rouge',
                        message: paiement.message,
                        utilisateurId: dossier.utilisateurId,
                        matricule: dossier.matricule,
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
                    ...(paiement.avertissementPaiement ? { avertissementPaiement: paiement.avertissementPaiement } : {}),
                    utilisateurId: dossier.utilisateurId,
                    matricule: dossier.matricule,
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
