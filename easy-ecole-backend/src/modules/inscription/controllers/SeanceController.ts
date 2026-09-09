import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op, literal, fn, col } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { JoursSemaine } from "../../../core/enums/JoursSemaine";
import { Seance } from "../models/Seance";
import { Cours } from "../models/Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { SalleDeClasse } from "../models/SalleDeClasse";
import { CursusApprenant } from "../models/CursusApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { NotificationHelper } from "../../../core/helpers/NotificationHelper";
import { ListeNoteEvaluation } from "../models/ListeNoteEvaluation";
import { NoteEvaluation } from "../models/NoteEvaluation";
import { CoursParticipant } from "../models/CoursParticipant";
import { PresenceCoursParticipant } from "../models/PresenceCoursParticipant";
import { Presence } from "../models/Presence";
import { RhEmploye } from "../../rh/models/RhEmploye";
import { RhContratEnseignant } from "../../rh/models/RhContratEnseignant";
import { Pointage } from "../models/Pointage";
import { Apprenant } from "../../auth/models/Apprenant";
import { ParentEnfant } from "../../parent/models/ParentEnfant";

export default class SeanceController {

    constructor() { }

    private static baseIncludes() {
        return [
            Seance.associations.cours,
            { association: Seance.associations.enseignant, include: [Enseignant.associations.utilisateur] },
            { association: Seance.associations.salleDeClasse, required: false },
            { association: Seance.associations.creneau, required: false },
            { association: Seance.associations.classeGroupe, required: false },
            { association: Seance.associations.niveauEtude, required: false },
            { association: Seance.associations.parcours, required: false },
            { association: Seance.associations.anneeAcademique, required: false },
            { association: Seance.associations.semestreAcademique, required: false },
        ];
    }

    static async getAllSeances(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Seance>> = { include: SeanceController.baseIncludes() }

        try {
            let seances: Seance[];
            const role = (req as any).utilisateurRole;

            if (role === RolesUtilisateur.APPRENANT) {
                const cursus = await CursusApprenant.findAll({
                    where: { utilisateurId: (req as any).utilisateurId },
                    include: [{ association: 'demandeInscription', include: [{ association: 'cours' }] }]
                });
                const coursIds = cursus.flatMap(c =>
                    (c as any).demandeInscription?.cours?.map((dc: any) => dc.id) ?? []
                );
                if (options.where) {
                    (options.where as any).coursId = { [Op.in]: coursIds };
                } else {
                    options.where = { coursId: { [Op.in]: coursIds } } as any;
                }
            } else if (role === RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId: (req as any).utilisateurId } });
                if (enseignant) {
                    if (options.where) {
                        (options.where as any).enseignantId = enseignant.id;
                    } else {
                        options.where = { enseignantId: enseignant.id } as any;
                    }
                }
            }

            seances = await Seance.findAll(options);
            return res.status(200).send(seances);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getSeance(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Seance>> = {}
        options = { where: { id: req.params.id }, include: SeanceController.baseIncludes() }

        // Un enseignant ne peut voir que ses propres séances
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            const enseignant = await Enseignant.findOne({ where: { utilisateurId: (req as any).utilisateurId } });
            if (enseignant) {
                (options.where as any).enseignantId = enseignant.id;
            }
        }

        try {
            const seance: Seance | null = await Seance.findOne(options);

            if (seance == null)
                return res.status(404).json({ success: false, message: "Seance non trouvée" });

            return res.status(200).send(seance);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getPlanning(req: Request, res: Response): Promise<Response> {
        const semaineDebut = req.query.semaineDebut as string;
        const semaineFin = req.query.semaineFin as string;
        const filtreEnseignantId = req.query.enseignantId as string | undefined;
        const filtreClasseId = req.query.classeId as string | undefined;
        const filtreCreneauId = req.query.creneauId as string | undefined;
        const filtreRegime = req.query.regime as string | undefined;
        const filtreAnneeAcademiqueId = req.query.anneeAcademiqueId as string | undefined;
        const filtreClasseGroupeId = req.query.classeGroupeId as string | undefined;

        if (!semaineDebut || !semaineFin) {
            return res.status(400).json({ success: false, message: "Paramètres semaineDebut et semaineFin requis" });
        }

        const debut = new Date(semaineDebut);
        const fin = new Date(semaineFin);

        if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
            return res.status(400).json({ success: false, message: "Paramètres semaineDebut et semaineFin invalides" });
        }

        try {
            let options: FindOptions<InferAttributes<Seance>> = {
                include: SeanceController.baseIncludes(),
                where: {
                    dateDebut: { [Op.lte]: fin },
                    dateFin: { [Op.gte]: debut }
                }
            };

            const role = (req as any).utilisateurRole;
            if (role === RolesUtilisateur.APPRENANT) {
                const cursus = await CursusApprenant.findAll({
                    where: { utilisateurId: (req as any).utilisateurId },
                    include: [{ association: 'demandeInscription', include: [{ association: 'cours' }] }]
                });
                const coursIds = cursus.flatMap(c =>
                    (c as any).demandeInscription?.cours?.map((dc: any) => dc.id) ?? []
                );
                (options.where as any).coursId = { [Op.in]: coursIds };
            } else if (role === RolesUtilisateur.ENSEIGNANT) {
                const enseignant = await Enseignant.findOne({ where: { utilisateurId: (req as any).utilisateurId } });
                if (enseignant) {
                    if (filtreEnseignantId) {
                        (options.where as any).enseignantId = filtreEnseignantId;
                    } else {
                        (options.where as any).enseignantId = enseignant.id;
                    }
                }
            } else {
                if (filtreEnseignantId) {
                    (options.where as any).enseignantId = filtreEnseignantId;
                }
                if (filtreCreneauId) {
                    (options.where as any).creneauId = filtreCreneauId;
                }
                if (filtreRegime) {
                    (options.where as any).regime = filtreRegime;
                }
                if (filtreAnneeAcademiqueId) {
                    (options.where as any).anneeAcademiqueId = filtreAnneeAcademiqueId;
                }
                if (filtreClasseGroupeId) {
                    (options.where as any).classeGroupeId = filtreClasseGroupeId;
                }
                if (filtreClasseId) {
                    const coursDeLaClasse = await Cours.findAll({ where: { classeId: filtreClasseId }, attributes: ['id'] });
                    if (coursDeLaClasse.length > 0) {
                        const coursIds = coursDeLaClasse.map(c => c.id);
                        (options.where as any).coursId = { [Op.in]: coursIds };
                    }
                }
            }

            const seances = await Seance.findAll(options);
            const events: any[] = [];

            const dayMap: Record<string, number> = {
                [JoursSemaine.LUNDI]: 1,
                [JoursSemaine.MARDI]: 2,
                [JoursSemaine.MERCREDI]: 3,
                [JoursSemaine.JEUDI]: 4,
                [JoursSemaine.VENDREDI]: 5,
                [JoursSemaine.SAMEDI]: 6,
            };

            for (const seance of seances) {
                const targetDay = dayMap[seance.jourSemaine];
                // Ignorer les séances dont le jour n'est pas reconnu
                if (targetDay === undefined) continue;

                const seanceDebut = new Date(seance.dateDebut);
                const seanceFin = new Date(seance.dateFin);

                if (isNaN(seanceDebut.getTime()) || isNaN(seanceFin.getTime())) continue;

                let current = new Date(Math.max(debut.getTime(), seanceDebut.getTime()));
                const end = new Date(Math.min(fin.getTime(), seanceFin.getTime()));

                while (current <= end) {
                    if (current.getDay() === targetDay) {
                        events.push({
                            id: seance.id + '-' + current.toISOString().split('T')[0],
                            seanceId: seance.id,
                            titre: seance.titre,
                            date: current.toISOString().split('T')[0],
                            jourSemaine: seance.jourSemaine,
                            heureDebut: seance.heureDebut,
                            heureFin: seance.heureFin,
                            salle: seance.salle,
                            salleDeClasseId: seance.salleDeClasseId,
                            salleDeClasse: seance.salleDeClasse,
                            description: seance.description,
                            coursId: seance.coursId,
                            cours: seance.cours,
                            volumeHoraire: (seance as any).cours?.volumeHoraire ?? null,
                            enseignantId: seance.enseignantId,
                            enseignant: seance.enseignant,
                            regime: seance.regime,
                            creneauId: seance.creneauId,
                            creneau: seance.creneau,
                            classeGroupeId: seance.classeGroupeId,
                            classeGroupe: seance.classeGroupe,
                            niveauEtudeId: seance.niveauEtudeId,
                            niveauEtude: seance.niveauEtude,
                            parcoursId: seance.parcoursId,
                            parcours: seance.parcours,
                            anneeAcademiqueId: seance.anneeAcademiqueId,
                            anneeAcademique: seance.anneeAcademique,
                            semestreAcademiqueId: seance.semestreAcademiqueId,
                            semestreAcademique: seance.semestreAcademique,
                        });
                    }
                    current.setDate(current.getDate() + 1);
                }
            }

            return res.status(200).send(events);
        } catch (error) {
            console.error('[Planning] Erreur lors de la récupération du planning:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération du planning', error });
        }
    }

    /** Volume prévu, consommé et restant par UE pour le pilotage SG. */
    static async getVolumesHoraires(req: Request, res: Response): Promise<Response> {
        try {
            const coursWhere: any = {}
            if (req.query.coursId) coursWhere.id = req.query.coursId
            if (req.query.classeId) coursWhere.classeId = req.query.classeId
            const cours = await Cours.findAll({ where: coursWhere, attributes: ['id', 'code', 'intitule', 'volumeHoraire'] })
            const result = await Promise.all(cours.map(async (ue) => {
                const seances = await Seance.findAll({ where: { coursId: ue.id }, attributes: ['enseignantId', 'jourSemaine', 'dateDebut', 'dateFin', 'heureDebut', 'heureFin'] })
                const consomme = await SeanceController.heuresEffectuees(seances)
                const prevu = Number(ue.volumeHoraire || 0)
                return {
                    coursId: ue.id,
                    code: ue.code,
                    intitule: ue.intitule,
                    volumeHoraire: prevu,
                    volumeConsomme: Math.round(consomme * 100) / 100,
                    volumeRestant: Math.max(0, Math.round((prevu - consomme) * 100) / 100),
                    depassement: consomme > prevu && prevu > 0
                }
            }))
            return res.status(200).json(result)
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors du calcul des volumes horaires' })
        }
    }

    /** Suivi SG des prestataires : contrat mensuel, heures planifiées et pointages. */
    static async getVolumesEnseignants(req: Request, res: Response): Promise<Response> {
        try {
            const month = String(req.query.mois || new Date().toISOString().slice(0, 7))
            const semestre = req.query.semestre ? String(req.query.semestre) : null
            const debut = `${month}-01`
            const fin = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10)
            const seances = await Seance.findAll({
                where: { dateDebut: { [Op.lte]: fin }, dateFin: { [Op.gte]: debut } },
                include: [{ association: Seance.associations.enseignant, include: [Enseignant.associations.utilisateur] }, { association: Seance.associations.cours }]
            })
            const result = new Map<number, any>()
            for (const seance of seances) {
                if (semestre && String((seance as any).cours?.semestre) !== semestre) continue
                const enseignant = (seance as any).enseignant
                if (!enseignant) continue
                const utilisateurId = Number(enseignant.utilisateurId)
                const current = result.get(utilisateurId) || { enseignantId: enseignant.id, utilisateurId, nom: enseignant.utilisateur ? `${enseignant.utilisateur.prenoms} ${enseignant.utilisateur.nom}` : '', heuresPlanifiees: 0, heuresEffectuees: 0, seances: 0, seancesPointees: 0 }
                const heures = await SeanceController.heuresEffectuees([seance])
                current.heuresPlanifiees += SeanceController.dureeEnHeures(seance.heureDebut, seance.heureFin)
                current.heuresEffectuees += heures
                current.seances++
                if (heures > 0) current.seancesPointees++
                result.set(utilisateurId, current)
            }
            const rows = await Promise.all(Array.from(result.values()).map(async row => {
                const employe = await RhEmploye.findOne({ where: { utilisateurId: row.utilisateurId } })
                const contrat = employe ? await RhContratEnseignant.findOne({ where: { employeId: employe.id, statut: 'actif' }, order: [['dateDebut', 'DESC']] }) : null
                const contratHeures = Number(contrat?.volumeHoraireMensuel || 0)
                return { ...row, heuresPlanifiees: Math.round(row.heuresPlanifiees * 100) / 100, heuresEffectuees: Math.round(row.heuresEffectuees * 100) / 100, volumeHoraireMensuel: contratHeures, heuresRestantes: Math.max(0, Math.round((contratHeures - row.heuresEffectuees) * 100) / 100), pointages: row.seancesPointees, absences: Math.max(0, row.seances - row.seancesPointees) }
            }))
            return res.status(200).json({ mois: month, semestre, data: rows })
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors du suivi horaire des enseignants' })
        }
    }

    /** Séances commencées sans pointage enseignant : suivi SG en temps réel. */
    static async getRetardsEnseignants(req: Request, res: Response): Promise<Response> {
        try {
            const now = new Date()
            const today = now.toISOString().split('T')[0]
            const heure = now.toTimeString().split(' ')[0]
            const seances = await Seance.findAll({
                where: { dateDebut: { [Op.lte]: today }, dateFin: { [Op.gte]: today }, heureDebut: { [Op.lte]: heure } },
                include: [{ association: Seance.associations.cours }, { association: Seance.associations.enseignant, include: [Enseignant.associations.utilisateur] }]
            })
            const pointages = await (await import('../models/Pointage')).Pointage.findAll({ where: { date: today }, attributes: ['utilisateurId', 'heureArrivee'] })
            const pointagesParUtilisateur = new Map(pointages.map(p => [Number(p.utilisateurId), p]))
            const result = seances.map(seance => {
                const utilisateurId = Number((seance as any).enseignant?.utilisateur?.id)
                const pointage = pointagesParUtilisateur.get(utilisateurId)
                const fin = String(seance.heureFin)
                const statut = pointage ? 'pointe' : (heure > fin ? 'absent' : 'en_retard')
                return { seanceId: seance.id, cours: (seance as any).cours?.intitule, enseignant: (seance as any).enseignant?.utilisateur, heureDebut: seance.heureDebut, heureFin: seance.heureFin, statut }
            }).filter(item => item.statut !== 'pointe')
            return res.status(200).json(result)
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors du suivi des retards' })
        }
    }

    private static dureeEnHeures(debut: any, fin: any): number {
        const toMinutes = (value: any) => {
            const parts = String(value).slice(0, 5).split(':').map(Number)
            return parts[0] * 60 + parts[1]
        }
        return Math.max(0, (toMinutes(fin) - toMinutes(debut)) / 60)
    }

    /** Compte uniquement le chevauchement d'une séance avec un pointage QR complet. */
    private static async heuresEffectuees(seances: any[]): Promise<number> {
        if (!seances.length) return 0
        const dates = seances.flatMap(seance => [new Date(seance.dateDebut), new Date(seance.dateFin)])
        const debut = new Date(Math.min(...dates.map(date => date.getTime()))).toISOString().slice(0, 10)
        const fin = new Date(Math.max(...dates.map(date => date.getTime()))).toISOString().slice(0, 10)
        const utilisateurIds = Array.from(new Set(seances.map(seance => Number(seance.enseignant?.utilisateurId || seance.enseignantId)).filter(Boolean)))
        const pointages = await Pointage.findAll({ where: { utilisateurId: { [Op.in]: utilisateurIds }, date: { [Op.between]: [debut, fin] } }, attributes: ['utilisateurId', 'date', 'heureArrivee', 'heureDepart'] })
        const index = new Map(pointages.map(pointage => [`${pointage.utilisateurId}|${new Date(pointage.date).toISOString().slice(0, 10)}`, pointage]))
        let total = 0
        for (const seance of seances) {
            for (const date = new Date(seance.dateDebut); date <= new Date(seance.dateFin); date.setUTCDate(date.getUTCDate() + 1)) {
                const jour = String(((date.getUTCDay() + 6) % 7) + 1)
                if (jour !== String(seance.jourSemaine)) continue
                const cle = `${seance.enseignant?.utilisateurId || seance.enseignantId}|${date.toISOString().slice(0, 10)}`
                const pointage = index.get(cle) as any
                if (pointage?.heureArrivee && pointage?.heureDepart) {
                    const debutEffectif = Math.max(SeanceController.minutes(pointage.heureArrivee), SeanceController.minutes(seance.heureDebut))
                    const finEffective = Math.min(SeanceController.minutes(pointage.heureDepart), SeanceController.minutes(seance.heureFin))
                    if (finEffective > debutEffectif) total += (finEffective - debutEffectif) / 60
                }
            }
        }
        return total
    }

    private static minutes(value: any): number {
        const [heures, minutes] = String(value).slice(0, 5).split(':').map(Number)
        return heures * 60 + minutes
    }

    static async checkConflits(req: Request, res: Response): Promise<Response> {
        try {
            const conflits = await SeanceController.verifierConflits(req.body, req.body.excludeId);
            return res.status(200).send(conflits);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    private static async verifierConflits(data: any, excludeId?: string): Promise<any[]> {
        const conflits: any[] = [];
        const jourSemaine = data.jourSemaine;
        const heureDebut = data.heureDebut;
        const heureFin = data.heureFin;
        const dateDebut = data.dateDebut;
        const dateFin = data.dateFin;
        const salle = data.salle;
        const enseignantId = data.enseignantId;
        const coursId = data.coursId;
        const creneauId = data.creneauId;
        const classeGroupeId = data.classeGroupeId;

        const whereOverlap: any = {
            jourSemaine: jourSemaine,
            heureDebut: { [Op.lt]: heureFin },
            heureFin: { [Op.gt]: heureDebut },
            dateDebut: { [Op.lte]: dateFin },
            dateFin: { [Op.gte]: dateDebut },
        };

        if (excludeId) {
            whereOverlap.id = { [Op.ne]: excludeId };
        }

        const includes = [
            Seance.associations.cours,
            { association: Seance.associations.enseignant, include: [Enseignant.associations.utilisateur] },
            Seance.associations.salleDeClasse,
        ];

        // Enseignant conflict
        if (enseignantId) {
            const enseignantConflits = await Seance.findAll({
                where: { ...whereOverlap, enseignantId },
                include: includes
            });
            for (const s of enseignantConflits) {
                conflits.push({
                    type: 'enseignant',
                    message: `L'enseignant est déjà occupé : ${s.titre || 'Séance'} le ${s.jourSemaine} de ${s.heureDebut} à ${s.heureFin}`,
                    seance: s
                });
            }
        }

        // Room conflict
        if (salle) {
            const salleConflits = await Seance.findAll({
                where: { ...whereOverlap, salle },
                include: includes
            });
            for (const s of salleConflits) {
                conflits.push({
                    type: 'salle',
                    message: `La salle "${s.salle}" est déjà réservée : ${s.titre || 'Séance'} de ${s.heureDebut} à ${s.heureFin}`,
                    seance: s
                });
            }
        }

        // Créneau conflict : même créneau horaire (temps identique) — renforce la détection basée sur heures
        if (creneauId) {
            const creneauConflits = await Seance.findAll({
                where: { ...whereOverlap, creneauId },
                include: includes
            });
            for (const s of creneauConflits) {
                conflits.push({
                    type: 'creneau',
                    message: `Créneau déjà utilisé : ${s.titre || 'Séance'} le ${s.jourSemaine} de ${s.heureDebut} à ${s.heureFin}`,
                    seance: s
                });
            }
        }

        // Groupe/classe conflict via classeGroupeId (le groupe = une Classe)
        if (classeGroupeId) {
            const groupeConflits = await Seance.findAll({
                where: { ...whereOverlap, classeGroupeId },
                include: includes
            });
            for (const s of groupeConflits) {
                conflits.push({
                    type: 'classe',
                    message: `Conflit pour le groupe/classe : ${s.titre || 'Séance'} (${s.cours?.intitule || '?'}) de ${s.heureDebut} à ${s.heureFin}`,
                    seance: s
                });
            }
        }

        // Class conflict (via le cours → classe)
        if (coursId) {
            const cours = await Cours.findByPk(coursId, { attributes: ['classeId'] });
            if (cours && cours.classeId) {
                const coursMemeClasse = await Cours.findAll({
                    where: { classeId: cours.classeId },
                    attributes: ['id']
                });
                const coursIds = coursMemeClasse.map(c => c.id);
                if (coursIds.length > 0) {
                    const classeConflits = await Seance.findAll({
                        where: { ...whereOverlap, coursId: { [Op.in]: coursIds } },
                        include: includes
                    });
                    for (const s of classeConflits) {
                        conflits.push({
                            type: 'classe',
                            message: `Conflit pour la classe : ${s.titre || 'Séance'} (${s.cours?.intitule || '?'}) de ${s.heureDebut} à ${s.heureFin}`,
                            seance: s
                        });
                    }
                }
            }
        }

        return conflits;
    }

    static async createSeance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        const conflits = await SeanceController.verifierConflits(req.body);
        if (conflits.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Conflits détectés",
                conflits
            });
        }

        let seance: Seance = new Seance();
        seance.titre = req.body.titre
        seance.jourSemaine = req.body.jourSemaine
        seance.salle = req.body.salle
        seance.dateDebut = req.body.dateDebut
        seance.dateFin = req.body.dateFin
        seance.heureDebut = req.body.heureDebut
        seance.heureFin = req.body.heureFin
        seance.description = req.body.description
        seance.coursId = req.body.coursId
        seance.enseignantId = req.body.enseignantId
        seance.salleDeClasseId = req.body.salleDeClasseId || null
        // Nouveaux champs de la planification
        seance.regime = req.body.regime ?? null
        seance.creneauId = req.body.creneauId ?? null
        seance.classeGroupeId = req.body.classeGroupeId ?? null
        seance.niveauEtudeId = req.body.niveauEtudeId ?? null
        seance.parcoursId = req.body.parcoursId ?? null
        seance.anneeAcademiqueId = req.body.anneeAcademiqueId ?? null
        seance.semestreAcademiqueId = req.body.semestreAcademiqueId ?? null

        await seance.save()
            .then((seance) => {
                return res.status(201).send(seance);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateSeance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        let seance: Seance | null = await Seance.findOne({ where: { id: req.params.id } });
        if (seance != null) {
            const conflits = await SeanceController.verifierConflits(req.body, req.params.id);
            if (conflits.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Conflits détectés",
                    conflits
                });
            }

            await seance.update({
                titre: req.body.titre,
                jourSemaine: req.body.jourSemaine,
                salle: req.body.salle,
                dateDebut: req.body.dateDebut,
                dateFin: req.body.dateFin,
                heureDebut: req.body.heureDebut,
                heureFin: req.body.heureFin,
                description: req.body.description,
                coursId: req.body.coursId,
                enseignantId: req.body.enseignantId,
                salleDeClasseId: req.body.salleDeClasseId || null,
                // Nouveaux champs de la planification
                regime: req.body.regime ?? seance.regime,
                creneauId: req.body.creneauId ?? seance.creneauId,
                classeGroupeId: req.body.classeGroupeId ?? seance.classeGroupeId,
                niveauEtudeId: req.body.niveauEtudeId ?? seance.niveauEtudeId,
                parcoursId: req.body.parcoursId ?? seance.parcoursId,
                anneeAcademiqueId: req.body.anneeAcademiqueId ?? seance.anneeAcademiqueId,
                semestreAcademiqueId: req.body.semestreAcademiqueId ?? seance.semestreAcademiqueId,
            })
            await SeanceController.notifierModification(seance)
            return res.status(200).send(seance)
        }
        else {
            return res.status(404).json({ success: false, message: "Seance non trouvée" });
        }

        return null
    }

    private static async notifierModification(seance: Seance): Promise<void> {
        const full = await Seance.findByPk(seance.id, {
            include: [
                { association: Seance.associations.cours },
                { association: Seance.associations.enseignant, include: [Enseignant.associations.utilisateur] }
            ]
        })
        const userIds = new Set<number>()
        const enseignantUtilisateurId = Number((full as any)?.enseignant?.utilisateur?.id)
        if (enseignantUtilisateurId) userIds.add(enseignantUtilisateurId)
        const classeId = Number((full as any)?.cours?.classeId)
        if (classeId) {
            const cursus = await CursusApprenant.findAll({ where: { classeId }, attributes: ['utilisateurId'] })
            for (const item of cursus) {
                userIds.add(Number(item.utilisateurId))
                const apprenant = await Apprenant.findOne({ where: { utilisateurId: item.utilisateurId }, attributes: ['id'] })
                if (apprenant) {
                    const parents = await ParentEnfant.findAll({ where: { apprenantId: apprenant.id }, attributes: ['parentUtilisateurId'] })
                    parents.forEach(parent => userIds.add(Number(parent.parentUtilisateurId)))
                }
            }
        }
        if (userIds.size) {
            await NotificationHelper.envoyerNotificationMultiples(
                Array.from(userIds),
                'edt_modifie',
                'Emploi du temps modifié',
                `La séance ${(full as any)?.cours?.intitule || full?.titre || ''} a été modifiée. Consultez votre planning.`,
                false
            )
        }
    }

    static async deleteSeance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        let seance: Seance | null = await Seance.findOne({ where: { id: req.params.id } });
        if (seance) {
            await seance.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Seance supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Seance non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Seance>> = {}

        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        await Seance.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }

    static async publierEmploiDuTemps(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        try {
            const seances = await Seance.findAll({
                include: [
                    { association: Seance.associations.cours },
                    { association: Seance.associations.enseignant, include: [Enseignant.associations.utilisateur] }
                ]
            });

            const enseignantsNotifies = new Set<number>();
            const enseignantsNotifications: { id: number; nom: string; nbSeances: number }[] = [];
            const etudiantsNotifications: { id: number; nom: string; nbSeances: number }[] = [];

            for (const seance of seances) {
                const enseignant = (seance as any).enseignant;
                if (enseignant?.utilisateur?.id && !enseignantsNotifies.has(enseignant.utilisateur.id)) {
                    enseignantsNotifies.add(enseignant.utilisateur.id);
                    enseignantsNotifications.push({
                        id: enseignant.utilisateur.id,
                        nom: `${enseignant.utilisateur.prenoms} ${enseignant.utilisateur.nom}`,
                        nbSeances: 1
                    });
                }

                const cours = (seance as any).cours;
                if (cours?.classeId) {
                    const cursusList = await CursusApprenant.findAll({
                        where: { classeId: cours.classeId },
                        include: [{ association: CursusApprenant.associations.utilisateur }]
                    });
                    for (const cursus of cursusList) {
                        const user = (cursus as any).utilisateur;
                        if (user?.id) {
                            const existing = etudiantsNotifications.find(e => e.id === user.id);
                            if (existing) {
                                existing.nbSeances++;
                            } else {
                                etudiantsNotifications.push({
                                    id: user.id,
                                    nom: `${user.prenoms} ${user.nom}`,
                                    nbSeances: 1
                                });
                            }
                        }
                    }
                }
            }

            const enseignantIds = enseignantsNotifications.map(e => e.id);
            const etudiantIds = etudiantsNotifications.map(e => e.id);
            const apprenants = await Apprenant.findAll({ where: { utilisateurId: { [Op.in]: etudiantIds } }, attributes: ['id', 'utilisateurId'] });
            const parents = apprenants.length
                ? await ParentEnfant.findAll({ where: { apprenantId: { [Op.in]: apprenants.map(a => a.id) } }, attributes: ['parentUtilisateurId'] })
                : [];
            const parentIds = Array.from(new Set(parents.map(parent => Number(parent.parentUtilisateurId))));

            if (enseignantIds.length > 0) {
                await NotificationHelper.envoyerNotificationMultiples(
                    enseignantIds,
                    'edt_publie',
                    'Emploi du temps publié',
                    `Votre emploi du temps a été mis à jour. ${enseignantsNotifications.length > 0 ? `Vous avez ${enseignantsNotifications.find(e => enseignantIds.includes(e.id))?.nbSeances || 0} séance(s).` : ''}`,
                    false
                );
            }

            if (etudiantIds.length > 0) {
                await NotificationHelper.envoyerNotificationMultiples(
                    etudiantIds,
                    'edt_publie',
                    'Emploi du temps publié',
                    `Votre emploi du temps a été mis à jour. Consultez-le dans la rubrique Cours.`,
                    false
                );
            }

            if (parentIds.length > 0) {
                await NotificationHelper.envoyerNotificationMultiples(
                    parentIds,
                    'edt_publie',
                    'Emploi du temps publié',
                    'L’emploi du temps de votre enfant a été publié ou mis à jour. Consultez son planning.',
                    false
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Emploi du temps publié avec succès',
                enseignantsNotifies: enseignantIds.length,
                etudiantsNotifies: etudiantIds.length,
                parentsNotifies: parentIds.length
            });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getTeacherDashboard(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const enseignant = await Enseignant.findOne({ where: { utilisateurId } });
            if (!enseignant) {
                return res.status(403).json({ success: false, message: "Enseignant non trouvé" });
            }

            const enseignantId = enseignant.id as any;

            const nbCoursAssignes = await Cours.count({ where: { enseignantId } });

            const now = new Date();
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() + mondayOffset);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const seancesASemaine = await Seance.findAll({
                where: {
                    enseignantId,
                    dateDebut: { [Op.lte]: weekEnd },
                    dateFin: { [Op.gte]: weekStart }
                },
                include: [
                    { association: Seance.associations.cours },
                    Seance.associations.salleDeClasse
                ],
                order: [['jourSemaine', 'ASC'], ['heureDebut', 'ASC']]
            });

            const coursIds = await Cours.findAll({
                where: { enseignantId },
                attributes: ['id']
            }).then(c => c.map(c => c.id));

            const evaluationsSansNotes: any[] = [];
            if (coursIds.length > 0) {
                const listes = await ListeNoteEvaluation.findAll({
                    where: { coursId: { [Op.in]: coursIds } },
                    include: [
                        { association: ListeNoteEvaluation.associations.cours },
                        {
                            association: ListeNoteEvaluation.associations.notesEvaluation,
                            required: false,
                            where: { note: null }
                        }
                    ]
                });
                for (const liste of listes) {
                    if ((liste as any).notesEvaluation && (liste as any).notesEvaluation.length > 0) {
                        evaluationsSansNotes.push(liste);
                    }
                }
            }

            const listeIds = await ListeNoteEvaluation.findAll({
                where: { coursId: { [Op.in]: coursIds } },
                attributes: ['id']
            }).then(l => l.map(l => l.id));

            const dernieresNotesSaisies = await NoteEvaluation.findAll({
                where: {
                    note: { [Op.ne]: null },
                    listeNoteEvaluationId: { [Op.in]: listeIds }
                },
                include: [
                    { association: NoteEvaluation.associations.listeNoteEvaluation, include: [{ association: ListeNoteEvaluation.associations.cours }] },
                    { association: NoteEvaluation.associations.coursParticipant }
                ],
                order: [['createdAt', 'DESC']],
                limit: 5
            });

            const tauxAbsenteisme: any[] = [];
            for (const coursId of coursIds) {
                const cours = await Cours.findByPk(coursId, { attributes: ['id', 'intitule', 'code'] });
                if (!cours) continue;

                const coursParticipantIds = await CoursParticipant.findAll({
                    where: { coursId },
                    attributes: ['id']
                }).then(cp => cp.map(c => c.id));

                if (coursParticipantIds.length === 0) continue;

                const totalPresences = await PresenceCoursParticipant.count({
                    where: { coursParticipantId: { [Op.in]: coursParticipantIds } }
                });

                const absences = await PresenceCoursParticipant.count({
                    where: {
                        coursParticipantId: { [Op.in]: coursParticipantIds },
                        etatDePresence: { [Op.in]: ['absent', 'absence_justifiee'] }
                    }
                });

                const taux = totalPresences > 0 ? Math.round((absences / totalPresences) * 100 * 100) / 100 : 0;
                tauxAbsenteisme.push({
                    coursId: cours.id,
                    coursCode: (cours as any).code,
                    coursIntitule: (cours as any).intitule,
                    totalPresences,
                    absences,
                    taux
                });
            }

            return res.status(200).json({
                nbCoursAssignes,
                seancesASemaine,
                evaluationsSansNotes: evaluationsSansNotes.length,
                dernieresNotesSaisies,
                tauxAbsenteisme
            });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}
