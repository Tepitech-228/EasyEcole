import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import os from "os";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { EtatsDePresence } from "../../../core/enums/EtatsDePresence";
import { Apprenant } from "../../auth/models/Apprenant";
import { Enseignant } from "../../auth/models/Enseignant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { CursusApprenant } from "../models/CursusApprenant";
import { DemandeInscription } from "../models/DemandeInscription";
import { PreInscription } from "../models/PreInscription";
import { Seance } from "../models/Seance";
import { Cours } from "../models/Cours";
import { Classe } from "../models/Classe";
import { CoursParticipant } from "../models/CoursParticipant";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { RhPlanningPersonnel } from "../../rh/models/RhPlanningPersonnel";
import { Notification } from "../../elearning/models/Notification";
import { Echeance } from "../models/Echeance";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Bordereau } from "../models/Bordereau";
import { Session } from "../models/Session";
import { PaiementInscription } from "../models/PaiementInscription";
import { SemestreProgressionService } from "../../../core/services/SemestreProgressionService";

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function echeanceDateStr(dateLimite: Date | string): string {
  return typeof dateLimite === 'string' ? dateLimite : toDateOnlyString(dateLimite);
}

function buildLibelleEcheance(e: Echeance): string {
  if (e.moisConcerne) return `Échéance ${e.moisConcerne}`;
  return `Échéance n°${e.numeroEcheance} (${e.type === 'scolarite' ? 'Scolarité' : 'Inscription'})`;
}

class DashboardController {

    static async getDashboard(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = req.utilisateurId!;
            const role = req.utilisateurRole as RolesUtilisateur;

            switch (role) {
                case RolesUtilisateur.ADMIN:
                    return res.json(await DashboardController.getAdminDashboard());
                case RolesUtilisateur.INSTITUTION:
                    return res.json(await DashboardController.getInstitutionDashboard());
                case RolesUtilisateur.ENSEIGNANT:
                    return res.json(await DashboardController.getEnseignantDashboard(utilisateurId));
                case RolesUtilisateur.APPRENANT:
                    return res.json(await DashboardController.getApprenantDashboard(utilisateurId));
                case RolesUtilisateur.CAISSIER_BANQUE:
                    return res.json(await DashboardController.getCaissierDashboard());
                case RolesUtilisateur.CABINET_COMPTABLE:
                    return res.json(await DashboardController.getComptableDashboard());
                case RolesUtilisateur.ESA_COMPTA:
                    return res.json(await DashboardController.getEsacomptaDashboard());
                case RolesUtilisateur.COMITE_ORIENTATION:
                    return res.json(await DashboardController.getOrientationDashboard());
                case RolesUtilisateur.RESSOURCES_HUMAINES:
                    return res.json(await DashboardController.getRHDashboard());
                default:
                    return res.json(await DashboardController.getDefaultDashboard(utilisateurId));
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur dashboard', error });
        }
    }

    private static async getAdminDashboard() {
        const annee = new Date().getFullYear();
        const debutAnnee = new Date(annee, 0, 1);
        const finAnnee = new Date(annee, 11, 31, 23, 59, 59);

        const [totalApprenants, totalEnseignants, sessions, preInscriptions, recentDemandes, demandesParMois, cursusActifs, totalClasses, totalCours, totalPaiements, echeancesImpayees] = await Promise.all([
            Apprenant.count(),
            Enseignant.count(),
            DemandeInscription.findAll({ attributes: ['id', 'dateDemande', 'sessionId', 'matricule'] }),
            PreInscription.findAll({ where: { statut: 'en_attente' }, attributes: ['id'] }),
            DemandeInscription.findAll({
                order: [['dateDemande', 'DESC']],
                limit: 5,
                include: [{ association: 'preInscription', attributes: ['statut'] }],
                attributes: ['id', 'dateDemande', 'matricule'],
            }),
            DemandeInscription.count({
                where: { dateDemande: { [Op.between]: [debutAnnee, finAnnee] } },
                group: [fn('MONTH', col('dateDemande'))],
            }),
            CursusApprenant.findAll({
                attributes: ['parcoursId'],
                include: [{ association: CursusApprenant.associations.parcours, attributes: ['titre'] }],
            }),
            Classe.count(),
            Cours.count(),
            PaiementInscription.count(),
            Echeance.count({ where: { statut: { [Op.in]: ['impaye', 'partiel'] } } }),
        ]);

        // 12 valeurs (Jan → Déc) pour le graphique "Pré-inscriptions" du dashboard admin
        const moisCounts: number[] = Array(12).fill(0);
        for (const g of (demandesParMois as any[])) {
            const mois = Number(g.dateDemande);
            if (mois >= 1 && mois <= 12) moisCounts[mois - 1] = g.count;
        }

        const etudiantsParFiliereMap = new Map<string, number>();
        for (const cursus of cursusActifs) {
            const libelle = cursus.parcours?.titre || cursus.intituleParcours || `Filière ${cursus.parcoursId}`;
            etudiantsParFiliereMap.set(libelle, (etudiantsParFiliereMap.get(libelle) || 0) + 1);
        }
        const etudiantsParFiliere = Array.from(etudiantsParFiliereMap.entries())
            .map(([filiere, total]) => ({ filiere, total }))
            .sort((a, b) => b.total - a.total);

        // Métriques système (CPU, RAM)
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsagePercent = Math.round((usedMem / totalMem) * 100);
        const cpus = os.cpus();
        const cpuCount = cpus.length;
        const loadAvg = os.loadavg();

        return {
            success: true,
            role: 'admin',
            data: {
                totalApprenants,
                totalEnseignants,
                totalClasses,
                totalCours,
                totalPaiements,
                echeancesImpayees,
                totalSessions: sessions.length,
                demandesEnAttente: preInscriptions.length,
                sessionsOuvertes: sessions.length,
                demandesParMois: moisCounts,
                etudiantsParFiliere,
                recentDemandes: await Promise.all(recentDemandes.map(async (d) => {
                    const u = d.utilisateur;
                    return {
                        id: d.id,
                        dateDemande: d.dateDemande,
                        matricule: d.matricule,
                        utilisateur: u ? { nom: u.nom, prenoms: u.prenoms } : null,
                        preInscription: d.preInscription ? { statut: d.preInscription.statut } : null,
                    };
                })),
                // Métriques système
                system: {
                    cpuCount,
                    cpuModel: cpus[0]?.model || 'N/A',
                    loadAvg1m: loadAvg[0]?.toFixed(2) || 0,
                    loadAvg5m: loadAvg[1]?.toFixed(2) || 0,
                    loadAvg15m: loadAvg[2]?.toFixed(2) || 0,
                    memTotal: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100, // GB
                    memUsed: Math.round(usedMem / (1024 * 1024 * 1024) * 100) / 100, // GB
                    memFree: Math.round(freeMem / (1024 * 1024 * 1024) * 100) / 100, // GB
                    memUsagePercent,
                    platform: os.platform(),
                    uptime: Math.round(os.uptime() / 3600 * 10) / 10, // hours
                },
            }
        };
    }

    private static async getEnseignantDashboard(utilisateurId: number) {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const todayName = DAYS[today.getDay()];

        const seances = await Seance.findAll({
            where: { enseignantId: utilisateurId, jourSemaine: todayName },
            include: [
                { association: 'cours', attributes: ['id', 'intitule'] },
                { association: 'salleDeClasse', attributes: ['id', 'libelle'] },
            ],
            order: [['heureDebut', 'ASC']],
        });

        const nextSeance = seances.find(s => {
            const debut = new Date(`${todayStr}T${s.heureDebut}`);
            return debut.getTime() > today.getTime();
        });

        const listeNotes: any[] = await ListeNoteEvaluation.findAll({
            include: [{ association: 'cours', attributes: ['id', 'intitule'] }],
            limit: 5,
        });

        const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
        const totalCours = enseignant ? await Cours.count({ where: { enseignantId: enseignant.id } }) : 0;
        const totalApprenants = enseignant ? await CoursParticipant.count({
            include: [{ association: 'cours', where: { enseignantId: enseignant.id } }]
        }) : 0;

        return {
            success: true,
            role: 'enseignant',
            data: {
                agenda: seances.map(s => ({
                    id: s.id,
                    titre: s.titre || s.cours?.intitule || 'Séance',
                    heureDebut: s.heureDebut,
                    heureFin: s.heureFin,
                    salle: s.salleDeClasse?.libelle || s.salle || '',
                })),
                prochainCours: nextSeance ? {
                    id: nextSeance.id,
                    titre: nextSeance.titre || nextSeance.cours?.intitule || 'Cours',
                    heureDebut: nextSeance.heureDebut,
                    salle: nextSeance.salleDeClasse?.libelle || nextSeance.salle || '',
                } : null,
                notesASaisir: listeNotes.map((l: any) => ({
                    id: l.id,
                    cours: l.cours?.intitule || 'Cours',
                })),
                totalCours,
                totalApprenants,
            }
        };
    }

    private static async getApprenantDashboard(utilisateurId: number) {
        const today = new Date();
        const todayName = DAYS[today.getDay()];

        const cursus = await CursusApprenant.findOne({
            where: { utilisateurId },
            include: [
                { association: 'demandeInscription', include: [{ association: 'cours' }] },
                { association: CursusApprenant.associations.niveauEtude },
                { association: CursusApprenant.associations.parcours }
            ],
        });
        const dossierActif = await DossierEtudiant.findOne({ where: { utilisateurId, statut: 'actif' } });

        let agenda: any[] = [];
        let coursIds: number[] = [];
        let progression = null;
        if (cursus) {
            progression = await SemestreProgressionService.getProgression(Number(cursus.id));
            const coursData = (cursus as any).demandeInscription?.cours || [];
            coursIds = coursData.map((c: any) => c.id).filter(Boolean);
            if (coursIds.length > 0) {
                const seances = await Seance.findAll({
                    where: { coursId: { [Op.in]: coursIds }, jourSemaine: todayName },
                    include: [
                        { association: 'cours', attributes: ['id', 'intitule'] },
                        { association: 'salleDeClasse', attributes: ['id', 'libelle'] },
                    ],
                    order: [['heureDebut', 'ASC']],
                });
                agenda = seances.map(s => ({
                    id: s.id,
                    titre: s.titre || s.cours?.intitule || 'Séance',
                    heureDebut: s.heureDebut,
                    heureFin: s.heureFin,
                    salle: s.salleDeClasse?.libelle || s.salle || '',
                }));
            }
        }

        const notesRecentes = await DashboardController.getNotesRecentes(utilisateurId);

        const moyenne = notesRecentes.length > 0
            ? (notesRecentes.reduce((sum: number, n: any) => sum + (n.note || 0), 0) / notesRecentes.length).toFixed(1)
            : null;

        // Présences réellement renseignées (present / absence_justifiee) des cours participants de l'utilisateur.
        // On compte uniquement les états effectifs, jamais 'non_renseigne' ni les simples inscriptions aux cours.
        const totalPresences = await PresenceCoursParticipant.count({
            include: [{ association: 'coursParticipant', where: { utilisateurId } }],
            where: { etatDePresence: { [Op.in]: [EtatsDePresence.PRESENT, EtatsDePresence.ABSENCE_JUSTIFIEE] } }
        });

        const totalCours = coursIds.length;

        const echeances = await DashboardController.getEcheancesApprenant(utilisateurId);

        // ── Données graphiques dynamiques (Étudiant) ─────────────────────────
        // construit des séries prêtes à l'emploi pour les « chart-panel » du
        // dashboard apprenant (personnel // scope own). Aucun chiffre en dur.
        const charts = await DashboardController.getApprenantCharts(notesRecentes, totalPresences, progression);

        return { success: true, role: 'apprenant', data: { agenda, notesRecentes, moyenne, totalPresences, totalCours, progression, echeances, inscriptionComplete: Boolean(cursus && dossierActif), charts } };
    }

    /**
     * Séries dynamiques pour les graphiques du dashboard étudiant.
     * - notesRepartition : comptage des notes validées (>= 10) vs non validées.
     * - moyenneParCours   : moyenne obtenue par cours (pour barres).
     * - presenceRepartition: présents vs absents (depuis les compteurs).
     * - credits           : ECTS validés vs totaux par semestre (progression).
     */
    private static async getApprenantCharts(notesRecentes: any[], totalPresences: number, progression: any): Promise<any> {
        // Répartition des notes par seuil
        const validees = notesRecentes.filter((n: any) => (n.note || 0) >= 10).length;
        const nonValidees = notesRecentes.filter((n: any) => (n.note || 0) < 10).length;

        // Moyenne par cours (top 6)
        const parCours = new Map<string, { tot: number; n: number }>();
        for (const n of notesRecentes) {
            const lib = n.cours || 'Matière';
            const cur = parCours.get(lib) || { tot: 0, n: 0 };
            cur.tot += n.note || 0;
            cur.n += 1;
            parCours.set(lib, cur);
        }
        const moyenneParCours = Array.from(parCours.entries())
            .map(([cours, v]) => ({ cours, moyenne: Math.round((v.tot / v.n) * 10) / 10 }))
            .sort((a, b) => b.moyenne - a.moyenne)
            .slice(0, 6);

        // ECTS par semestre (depuis la progression pédagogique)
        const semestres = (progression?.semestres || []) as any[];
        const credits = semestres.map((s: any) => ({
            libelle: s.libelle,
            valides: s.ectsValides || 0,
            total: s.totalEcts || 0,
        }));

        return {
            notesRepartition: { validees, nonValidees },
            moyenneParCours,
            presenceRepartition: { presents: Number(totalPresences) || 0, absents: 0 },
            credits,
            totalNotes: notesRecentes.length,
        };
    }

    /**
     * Agrégation des échéances d'un apprenant pour le dashboard :
     * totalImpayees (impaye + en_retard), enRetard, et la prochaine échéance
     * (la plus proche à venir, sinon la plus récente échue).
     */
    private static async getEcheancesApprenant(utilisateurId: number): Promise<{
        totalImpayees: number;
        enRetard: number;
        prochaineEcheance: { libelle: string; montant: number; dateLimite: string } | null;
    }> {
        try {
            const dossier = await DossierEtudiant.findOne({
                where: { utilisateurId },
                include: [{ association: DossierEtudiant.associations.echeances }],
            });

            const echeances = (dossier?.echeances || []) as Echeance[];
            if (echeances.length === 0) {
                return { totalImpayees: 0, enRetard: 0, prochaineEcheance: null };
            }

            const impayees = echeances.filter(e => e.statut === 'impaye' || e.statut === 'en_retard');
            const enRetard = echeances.filter(e => e.statut === 'en_retard').length;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = toDateOnlyString(today);

            let prochaineEcheance: { libelle: string; montant: number; dateLimite: string } | null = null;
            if (impayees.length > 0) {
                const triees = impayees
                    .map(e => ({ echeance: e, dateStr: echeanceDateStr(e.dateLimite) }))
                    .sort((a, b) => (a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0));

                const cible = triees.find(t => t.dateStr >= todayStr) || triees[triees.length - 1];
                prochaineEcheance = {
                    libelle: buildLibelleEcheance(cible.echeance),
                    montant: cible.echeance.montant,
                    dateLimite: cible.dateStr,
                };
            }

            return { totalImpayees: impayees.length, enRetard, prochaineEcheance };
        } catch (error) {
            console.error('[DashboardController] Erreur récupération échéances apprenant:', error);
            return { totalImpayees: 0, enRetard: 0, prochaineEcheance: null };
        }
    }

    private static async getNotesRecentes(utilisateurId: number): Promise<any[]> {
        try {
            const cursusList = await CursusApprenant.findAll({ where: { utilisateurId } });
            const cursusIds = cursusList.map(c => c.id).filter(Boolean);
            if (cursusIds.length === 0) return [];

            const participants = await CoursParticipant.findAll({
                where: { cursusApprenantId: { [Op.in]: cursusIds } },
                attributes: ['id'],
            });
            const participantIds = participants.map(p => p.id);
            if (participantIds.length === 0) return [];

            const notes = await NoteEvaluation.findAll({
                where: { coursParticipantId: { [Op.in]: participantIds }, statut: 'publie' },
                include: [
                    { association: 'listeNoteEvaluation', include: [
                        { association: 'cours', attributes: ['id', 'intitule'] },
                        { association: 'typeNoteEvaluation', attributes: ['id', 'libelle'] },
                    ]},
                ],
                order: [['createdAt', 'DESC']],
                limit: 5,
            });
            return notes.map(n => ({
                note: n.note,
                cours: (n as any).listeNoteEvaluation?.cours?.intitule || '',
                type: (n as any).listeNoteEvaluation?.typeNoteEvaluation?.libelle || '',
                date: n.createdAt,
            }));
        } catch (error) {
            // Le dashboard ne doit pas planter pour un widget, mais une panne DB
            // affichée comme « aucune note » est un faux succès : elle doit être tracée.
            console.error('[DashboardController] Erreur récupération notes récentes:', error);
            return [];
        }
    }

    private static async getInstitutionDashboard() {
        const [totalApprenants, totalEnseignants, totalClasses, totalCours, sessions, enAttente] = await Promise.all([
            Apprenant.count(),
            Enseignant.count(),
            Classe.count(),
            Cours.count(),
            Session.findAll({ attributes: ['id', 'dateDebut', 'dateFin', 'description'] }),
            PreInscription.findAll({ where: { statut: 'en_attente' }, attributes: ['id'] }),
        ]);

        return {
            success: true,
            role: 'institution',
            data: {
                totalApprenants,
                totalEnseignants,
                totalClasses,
                totalCours,
                totalSessions: sessions.length,
                sessionsOuvertes: sessions.filter((s: any) => { const now = new Date(); return new Date(s.dateDebut) <= now && new Date(s.dateFin) >= now; }).length,
                demandesEnAttente: enAttente.length,
            }
        };
    }

    private static async getCaissierDashboard() {
        const [totalPaiements, totalBordereaux, echeancesImpayees, paiementsRecents] = await Promise.all([
            PaiementInscription.count(),
            Bordereau.count(),
            Echeance.count({ where: { statut: 'impaye' } }),
            PaiementInscription.findAll({
                order: [['createdAt', 'DESC']],
                limit: 10,
                attributes: ['id', 'montant', 'type', 'datePaiement', 'numero'],
            }),
        ]);

        return {
            success: true,
            role: 'caissier',
            data: {
                totalPaiements,
                totalBordereaux,
                echeancesImpayees,
                paiementsRecents: paiementsRecents.map(p => ({
                    id: p.id,
                    montant: p.montant,
                    mode: p.type,
                    numero: p.numero,
                    date: p.datePaiement,
                })),
            }
        };
    }

    private static async getComptableDashboard() {
        const [totalPaiements, totalBordereaux, totalEcheances, echeancesImpayees, montantTotal] = await Promise.all([
            PaiementInscription.count(),
            Bordereau.count(),
            Echeance.count(),
            Echeance.count({ where: { statut: 'impaye' } }),
            PaiementInscription.sum('montant'),
        ]);

        // ── Données graphiques « type finance » (CABINET_COMPTABLE) ─────────
        const charts = await DashboardController.getComptableFinanceCharts();

        return {
            success: true,
            role: 'comptable',
            data: {
                totalPaiements,
                totalBordereaux,
                totalEcheances,
                echeancesImpayees,
                montantTotal: montantTotal || 0,
                charts,
            }
        };
    }

    /**
     * Séries « type finance » pour le dashboard CABINET_COMPTABLE.
     * - encaissementsParMois : montant encaissé par mois (courbe de trésorerie / finance).
     * - repartitionModes    : montants par moyen de paiement (doughnut).
     * - fluxRecettesDepenses : recettes encaissées vs échéances impayées par mois (barres).
     */
    private static async getComptableFinanceCharts(): Promise<any> {
        const annee = new Date().getFullYear();
        const debut = new Date(annee, 0, 1);
        const fin = new Date(annee, 11, 31, 23, 59, 59);

        const encaisseParMois = await PaiementInscription.findAll({
            where: { datePaiement: { [Op.between]: [debut, fin] } },
            attributes: ['datePaiement', 'montant'],
            raw: true,
        });

        const parMois: number[] = Array(12).fill(0);
        for (const p of encaisseParMois as any[]) {
            const d = new Date(p.datePaiement);
            const m = d.getMonth();
            if (m >= 0 && m <= 11) parMois[m] += Number(p.montant) || 0;
        }

        const impayeesParMois = await Echeance.findAll({
            where: { statut: { [Op.in]: ['impaye', 'en_retard'] } },
            attributes: ['dateLimite', 'montant'],
            raw: true,
        });
        const depensesParMois: number[] = Array(12).fill(0);
        for (const e of impayeesParMois as any[]) {
            const d = new Date(String(e.dateLimite).slice(0, 10));
            const m = d.getMonth();
            if (!isNaN(m) && m >= 0 && m <= 11) depensesParMois[m] += Number(e.montant) || 0;
        }

        // Répartition par moyen de paiement (bordereaux)
        const parMode = await Bordereau.findAll({
            where: { moyenPaiement: { [Op.ne]: null } },
            attributes: ['moyenPaiement', 'montant'],
            raw: true,
        });
        const modeMap = new Map<string, number>();
        for (const b of parMode as any[]) {
            const k = b.moyenPaiement || 'Autre';
            modeMap.set(k, (modeMap.get(k) || 0) + (Number(b.montant) || 0));
        }
        const repartitionModes = Array.from(modeMap.entries()).map(([mode, montant]) => ({ mode, montant }));

        return {
            encaissementsParMois: parMois,
            depensesParMois: impayeesParMois.length ? depensesParMois : [],
            moisLabels: ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'],
            repartitionModes,
        };
    }

    /**
     * Dashboard ESA-COMPTA : suivi financier des bordereaux (validation, montants,
     * doublons de références bancaires). Spécifique au pôle ESA-COMPTA (finance).
     */
    private static async getEsacomptaDashboard() {
        const [totalBordereaux, enAttente, valides, rejetes, lus, montantTotal, doublons, parBanque, parMois, moyPaiement, echeances] = await Promise.all([
            Bordereau.count(),
            Bordereau.count({ where: { statut: 'en_attente' } }),
            Bordereau.count({ where: { statut: 'valide' } }),
            Bordereau.count({ where: { statut: 'rejete' } }),
            Bordereau.count({ where: { statut: 'en_saisie_comptable' } }),
            Bordereau.sum('montant'),
            DashboardController.getDoublonsReferences(),
            DashboardController.getBordereauxParBanque(),
            DashboardController.getBordereauxParMois(),
            DashboardController.getMontantsParMoyenPaiement(),
            Echeance.count({ where: { statut: 'impaye' } }),
        ]);

        const montantValide = (await Bordereau.sum('montant', { where: { statut: 'valide' } })) || 0;
        const montantAttente = (await Bordereau.sum('montant', { where: { statut: 'en_attente' } })) || 0;
        const montantRejete = (await Bordereau.sum('montant', { where: { statut: 'rejete' } })) || 0;

        const aTraiter = (await Bordereau.count({
            where: { statut: { [Op.in]: ['en_attente', 'en_saisie_comptable'] } },
        }));

        return {
            success: true,
            role: 'esa-compta',
            data: {
                totalBordereaux,
                bordereauxATraiter: aTraiter,
                bordereauxLus: lus,
                bordereauxEnAttente: enAttente,
                bordereauxValides: valides,
                bordereauxRejetes: rejetes,
                montantTotal: montantTotal || 0,
                montantValide,
                montantEnAttente: montantAttente,
                montantRejete,
                doublonsReferences: doublons,
                echeancesImpayees: echeances,
                tauxTraitement: totalBordereaux > 0 ? Math.round(((valides + enAttente + rejetes + lus) / totalBordereaux) * 100) : 0,
                charts: {
                    montantsParStatut: {
                        valide: montantValide,
                        attente: montantAttente,
                        rejete: montantRejete,
                    },
                    parBanque,
                    parMois,
                    repartitionModes: moyPaiement,
                },
            }
        };
    }

    /** Compte les références bancaires dupliquées (>= 2 bordereaux sur la même référence). */
    private static async getDoublonsReferences(): Promise<number> {
        try {
            // Agrégation sur la volumétrie des références (faible) : on compte en JS
            // à partir d'une sélection déjà réduite — pas de findAll massif.
            const refs = await Bordereau.findAll({
                attributes: ['referenceBancaire'],
                raw: true,
            });
            const countMap = new Map<string, number>();
            for (const r of refs as any[]) {
                const v = r.referenceBancaire;
                if (!v) continue;
                countMap.set(v, (countMap.get(v) || 0) + 1);
            }
            return Array.from(countMap.values()).filter((c) => c > 1).length;
        } catch (error) {
            console.error('[getDoublonsReferences]', error);
            return 0;
        }
    }

    /** Montant + nombre de bordereaux par « banque » (moyen de paiement bancaire). */
    private static async getBordereauxParBanque(): Promise<any[]> {
        const rows = await Bordereau.findAll({
            where: { moyenPaiement: { [Op.in]: ['virement', 'cheque', 'mobile_money', 'especes'] } },
            attributes: ['moyenPaiement', 'montant'],
            raw: true,
        });
        const map = new Map<string, { montant: number; nb: number }>();
        for (const r of rows as any[]) {
            const k = r.moyenPaiement || 'Autre';
            const cur = map.get(k) || { montant: 0, nb: 0 };
            cur.montant += Number(r.montant) || 0;
            cur.nb += 1;
            map.set(k, cur);
        }
        return Array.from(map.entries()).map(([mode, v]) => ({ banque: mode, montant: v.montant, nb: v.nb }));
    }

    /** Évolution mensuelle (montant) des bordereaux sur l'année courante. */
    private static async getBordereauxParMois(): Promise<number[]> {
        const annee = new Date().getFullYear();
        const debut = new Date(annee, 0, 1);
        const fin = new Date(annee, 11, 31, 23, 59, 59);
        const rows = await Bordereau.findAll({
            where: { dateSoumission: { [Op.between]: [debut, fin] } },
            attributes: ['dateSoumission', 'montant'],
            raw: true,
        });
        const parMois: number[] = Array(12).fill(0);
        for (const r of rows as any[]) {
            const d = new Date(r.dateSoumission);
            const m = d.getMonth();
            if (m >= 0 && m <= 11) parMois[m] += Number(r.montant) || 0;
        }
        return parMois;
    }

    /** Montants cumulés par moyen de paiement. */
    private static async getMontantsParMoyenPaiement(): Promise<any[]> {
        const rows = await Bordereau.findAll({
            where: { moyenPaiement: { [Op.ne]: null } },
            attributes: ['moyenPaiement', 'montant'],
            raw: true,
        });
        const map = new Map<string, number>();
        for (const r of rows as any[]) {
            const k = r.moyenPaiement || 'Autre';
            map.set(k, (map.get(k) || 0) + (Number(r.montant) || 0));
        }
        return Array.from(map.entries()).map(([mode, montant]) => ({ mode, montant }));
    }

    private static async getOrientationDashboard() {
        const [totalDemandes, enAttente, validees, rejetees, demandesRecentes] = await Promise.all([
            DemandeInscription.count(),
            PreInscription.count({ where: { statut: 'en_attente' } }),
            PreInscription.count({ where: { statut: 'valide' } }),
            PreInscription.count({ where: { statut: 'rejete' } }),
            DemandeInscription.findAll({
                order: [['dateDemande', 'DESC']],
                limit: 10,
                attributes: ['id', 'dateDemande', 'matricule'],
            }),
        ]);

        return {
            success: true,
            role: 'orientation',
            data: {
                totalDemandes,
                enAttente,
                validees,
                rejetees,
                demandesRecentes: demandesRecentes.map(d => ({
                    id: d.id,
                    date: d.dateDemande,
                    matricule: d.matricule,
                })),
            }
        };
    }

    private static async getRHDashboard() {
        const todayName = DAYS[new Date().getDay()];

        const [plannings, totalEmployes] = await Promise.all([
            RhPlanningPersonnel.findAll({
                where: { jourSemaine: todayName },
                include: [{ association: 'employe', attributes: ['id', 'nom', 'prenoms'] }],
                order: [['heureDebut', 'ASC']],
                limit: 10,
            }),
            Utilisateur.count(),
        ]);

        return {
            success: true,
            role: 'rh',
            data: {
                totalEmployes,
                planning: plannings.map(p => ({
                    id: p.id,
                    tache: p.tache,
                    heureDebut: p.heureDebut,
                    heureFin: p.heureFin,
                })),
            }
        };
    }

    private static async getDefaultDashboard(utilisateurId: number) {
        const todayName = DAYS[new Date().getDay()];

        const seances = await Seance.findAll({
            where: { jourSemaine: todayName },
            include: [
                { association: 'cours', attributes: ['id', 'intitule'] },
                { association: 'salleDeClasse', attributes: ['id', 'libelle'] },
            ],
            order: [['heureDebut', 'ASC']],
            limit: 5,
        });

        const notifications = await Notification.findAll({
            where: { utilisateurId },
            order: [['date', 'DESC']],
            limit: 5,
        });

        return {
            success: true,
            role: 'default',
            data: {
                agenda: seances.map(s => ({
                    id: s.id,
                    titre: s.titre || s.cours?.intitule || 'Séance',
                    heureDebut: s.heureDebut,
                    heureFin: s.heureFin,
                    salle: s.salleDeClasse?.libelle || s.salle || '',
                })),
                notifications: notifications.map(n => ({
                    id: n.id,
                    message: n.message,
                    type: n.type,
                    lu: n.lu,
                    date: n.date,
                })),
            }
        };
    }
}

export default DashboardController;
