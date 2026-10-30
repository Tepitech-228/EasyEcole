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
                const passages = (pointage.scans || [])
                    .map((scan: any) => PointageController.heureCourte(scan.heure))
                    .filter((heure: string) => !!heure);
                return {
                    numero: index + 1,
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
            { width: 16 }, { width: 22 }, { width: 10 }, { width: 10 }, { width: 11 }, { width: 20 }, { width: 11 },
        ];

        const bordure: Partial<ExcelJS.Borders> = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        feuille.mergeCells('A1:L1');
        const titre = feuille.getCell('A1');
        titre.value = 'Historique des pointages';
        titre.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1F3C75' } };
        titre.alignment = { vertical: 'middle', horizontal: 'left' };
        feuille.getRow(1).height = 30;

        feuille.mergeCells('A2:L2');
        const sousTitre = feuille.getCell('A2');
        sousTitre.value = meta.periodeLabel;
        sousTitre.font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };

        feuille.mergeCells('A3:L3');
        const resume = feuille.getCell('A3');
        resume.value = meta.resumeLabel;
        resume.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };

        const entetes = ['N°', 'Date', 'Jour', 'Nom', 'Prénoms', 'Identifiant', 'Rôle', 'Arrivée', 'Départ', 'Durée', 'Passages', 'Statut'];
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
                ligne.role, ligne.arrivee, ligne.depart, ligne.duree, ligne.passages || '—', ligne.statut,
            ];
            valeurs.forEach((valeur, indexColonne) => {
                const cellule = feuille.getCell(numeroLigne, indexColonne + 1);
                cellule.value = valeur;
                cellule.font = {
                    name: 'Calibri',
                    size: 9,
                    bold: indexColonne === 9,
                    color: { argb: indexColonne === 11 && ligne.statut === 'En cours' ? 'FFB45309' : 'FF334155' },
                };
                cellule.alignment = {
                    vertical: 'middle',
                    horizontal: [3, 4, 6, 10].includes(indexColonne) ? 'left' : 'center',
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
        feuille.mergeCells(`A${ligneTotal}:L${ligneTotal}`);
        const total = feuille.getCell(`A${ligneTotal}`);
        total.value = `TOTAL — ${meta.resumeLabel}`;
        total.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F3C75' } };
        total.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
        total.alignment = { vertical: 'middle', horizontal: 'left' };
        total.border = bordure;
        feuille.getRow(ligneTotal).height = 22;

        feuille.autoFilter = {
            from: { row: ligneEntete, column: 1 },
            to: { row: ligneEntete + lignes.length, column: 12 },
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
