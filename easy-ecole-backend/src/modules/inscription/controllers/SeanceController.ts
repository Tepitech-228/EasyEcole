import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { JoursSemaine } from "../../../core/enums/JoursSemaine";
import { Seance } from "../models/Seance";
import { Cours } from "../models/Cours";
import { Enseignant } from "../../auth/models/Enseignant";
import { SalleDeClasse } from "../models/SalleDeClasse";
import { CursusApprenant } from "../models/CursusApprenant";

export default class SeanceController {

    constructor() { }

    private static baseIncludes() {
        return [
            Seance.associations.cours,
            { association: Seance.associations.enseignant, include: [Enseignant.associations.utilisateur] },
            Seance.associations.salleDeClasse,
        ];
    }

    static async getAllSeances(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Seance>> = { include: this.baseIncludes() }

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
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getSeance(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Seance>> = {}
        options = { where: { id: req.params.id }, include: this.baseIncludes() }

        try {
            const seance: Seance | null = await Seance.findOne(options);

            if (seance == null)
                return res.status(404).json({ success: false, message: "Seance non trouvée" });

            return res.status(200).send(seance);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getPlanning(req: Request, res: Response): Promise<Response> {
        const semaineDebut = req.query.semaineDebut as string;
        const semaineFin = req.query.semaineFin as string;
        const filtreEnseignantId = req.query.enseignantId as string | undefined;
        const filtreClasseId = req.query.classeId as string | undefined;

        if (!semaineDebut || !semaineFin) {
            return res.status(400).json({ success: false, message: "Paramètres semaineDebut et semaineFin requis" });
        }

        const debut = new Date(semaineDebut);
        const fin = new Date(semaineFin);

        try {
            let options: FindOptions<InferAttributes<Seance>> = {
                include: this.baseIncludes(),
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
                const seanceDebut = new Date(seance.dateDebut);
                const seanceFin = new Date(seance.dateFin);

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
                            enseignantId: seance.enseignantId,
                            enseignant: seance.enseignant,
                        });
                    }
                    current.setDate(current.getDate() + 1);
                }
            }

            return res.status(200).send(events);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async checkConflits(req: Request, res: Response): Promise<Response> {
        try {
            const conflits = await SeanceController.verifierConflits(req.body, req.body.excludeId);
            return res.status(200).send(conflits);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
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

        // Class conflict
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
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION) {
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
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION) {
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
            })
                .then(async (seance) => {
                    return res.status(200).send(seance);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Seance non trouvée" });
        }

        return null
    }

    static async deleteSeance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        let seance: Seance | null = await Seance.findOne({ where: { id: req.params.id } });
        if (seance) {
            await seance.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Seance supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Seance non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Seance>> = {}

        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        await Seance.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
