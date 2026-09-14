import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { CursusApprenant } from "../models/CursusApprenant";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { Parcours } from "../models/Parcours";
import { SemestreAcademique } from "../models/SemestreAcademique";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { NiveauEtude } from "../models/NiveauEtude";
import { Classe } from "../models/Classe";

const STATUTS_IRREGULIERS = ['impaye', 'partiel', 'en_retard'] as const;

export default class FinanceEcheanceController {

    constructor() { }

    /**
     * GET /inscription/finance/irreguliers
     * Liste des étudiants ayant au moins une échéance non soldée (impaye/partiel/en_retard).
     * Filtrage par année, cycle, parcours, niveau, semestre, classe, mois, recherche.
     */
    static async getEtudiantsIrreguliers(req: Request, res: Response): Promise<Response> {
        try {
            const page = Math.max(1, parseInt(String(req.query.page)) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 20));
            const offset = (page - 1) * limit;

            // ── Construire le where pour CursusApprenant ──
            const cursusWhere: any = {};

            if (req.query.anneeAcademiqueId) {
                cursusWhere.anneeAcademiqueId = req.query.anneeAcademiqueId;
            }
            if (req.query.parcoursId) {
                cursusWhere.parcoursId = req.query.parcoursId;
            }
            if (req.query.niveauEtudeId) {
                cursusWhere.niveauEtudeId = req.query.niveauEtudeId;
            }
            if (req.query.classeId) {
                cursusWhere.classeId = req.query.classeId;
            }

            // Si semestreId fourni, on filtre par le parcours du semestre
            if (req.query.semestreId) {
                const semestreId = parseInt(String(req.query.semestreId));
                const semestre = await SemestreAcademique.findByPk(semestreId, {
                    attributes: ['parcoursId']
                });
                if (semestre) {
                    cursusWhere.parcoursId = semestre.parcoursId;
                }
            }

            // ── Construire le where pour Echeance (statut + mois) ──
            const echeanceWhere: any = {
                statut: { [Op.in]: STATUTS_IRREGULIERS }
            };

            if (req.query.mois) {
                const moisNum = parseInt(String(req.query.mois));
                if (isNaN(moisNum) || moisNum < 1 || moisNum > 12) {
                    return res.status(400).json({ success: false, message: "Paramètre 'mois' invalide (1-12 requis)" });
                }
                // moisConcerne est au format "YYYY-MM", on filtre par la fin de la chaîne
                echeanceWhere.moisConcerne = { [Op.like]: `%-${String(moisNum).padStart(2, '0')}` };
            }

            // ── Search : trouver les dossierEtudiantIds ou utilisateurIds correspondants ──
            let whereDossierEtudiantIds: number[] | undefined;
            if (req.query.search) {
                const searchTerm = `%${req.query.search}%`;
                const whereOrDossier: any = { matricule: { [Op.like]: searchTerm } };
                const whereOrUser: any = {
                    [Op.or]: [
                        { nom: { [Op.like]: searchTerm } },
                        { prenoms: { [Op.like]: searchTerm } },
                    ]
                };

                const [matchingDossiers, matchingUsers] = await Promise.all([
                    DossierEtudiant.findAll({ attributes: ['id', 'utilisateurId'], where: whereOrDossier }),
                    Utilisateur.findAll({ attributes: ['id'], where: whereOrUser }),
                ]);

                const dossierIdsFromSearch = matchingDossiers.map((d: any) => d.id);
                const userIdsFromSearch = matchingUsers.map((u: any) => u.id);
                const dossierIdsFromUsers = await DossierEtudiant.findAll({
                    attributes: ['id'],
                    where: { utilisateurId: { [Op.in]: userIdsFromSearch } }
                });

                const allDossierIds = [
                    ...dossierIdsFromSearch,
                    ...dossierIdsFromUsers.map((d: any) => d.id)
                ];
                whereDossierEtudiantIds = [...new Set(allDossierIds)];

                if (whereDossierEtudiantIds.length === 0) {
                    return res.status(200).json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 }, semestres: [] });
                }
            }

            // ── Construire l'include complet ──
            const includeOptions: FindOptions<InferAttributes<CursusApprenant>>['include'] = [
                {
                    association: CursusApprenant.associations.parcours as any,
                    include: [
                        {
                            association: (Parcours as any).associations.semestresAcademiques as any,
                            where: { statut: 'cloture' },
                            required: false,
                        }
                    ]
                },
                { association: CursusApprenant.associations.niveauEtude },
                { association: CursusApprenant.associations.classe },
                { association: CursusApprenant.associations.anneeAcademique },
                {
                    association: CursusApprenant.associations.utilisateur as any,
                    attributes: ['id', 'nom', 'prenoms', 'identifiant'],
                    include: [
                        {
                            association: (Utilisateur as any).associations.dossiersEtudiants as any,
                            attributes: ['id', 'matricule'],
                            where: whereDossierEtudiantIds ? { id: { [Op.in]: whereDossierEtudiantIds } } : undefined,
                            include: [
                                {
                                    association: DossierEtudiant.associations.echeances as any,
                                    where: echeanceWhere,
                                    required: true,
                                    attributes: ['id', 'type', 'numeroEcheance', 'moisConcerne', 'dateLimite', 'montant', 'montantPaye', 'statut'],
                                    order: [['numeroEcheance', 'ASC']],
                                }
                            ]
                        }
                    ]
                }
            ];

            const { rows: cursusApprenants, count: total } = await CursusApprenant.findAndCountAll({
                where: cursusWhere,
                include: includeOptions,
                distinct: true,
                limit,
                offset,
                order: [[{ model: Utilisateur, as: 'utilisateur' }, 'nom', 'ASC']]
            });

            // ── Transformer les résultats ──
            const data = cursusApprenants.map((ca: any) => {
                const utilisateur = ca.utilisateur as any;
                const dossier = utilisateur?.dossiersEtudiants?.[0] as any;
                const echeances = dossier?.echeances || [];

                const totalRestant = echeances.reduce(
                    (sum: number, e: any) => sum + Math.max(0, (e.montant || 0) - (e.montantPaye || 0)),
                    0
                );

                const classe = ca.classe as any;
                const niveau = ca.niveauEtude as any;
                const parcours = ca.parcours as any;
                const anneeAcademique = ca.anneeAcademique as any;

                return {
                    etudiant: {
                        id: utilisateur?.id,
                        nom: utilisateur?.nom,
                        prenoms: utilisateur?.prenoms,
                        matricule: dossier?.matricule,
                    },
                    classe: classe ? { id: classe.id, libelle: classe.libelle } : null,
                    niveau: niveau ? { id: niveau.id, libelle: niveau.libelle } : null,
                    parcours: parcours ? { id: parcours.id, titre: parcours.titre, type: parcours.type } : null,
                    anneeAcademique: anneeAcademique ? { id: anneeAcademique.id, libelle: anneeAcademique.libelle } : null,
                    echeancesNonSoldees: echeances.map((e: any) => ({
                        id: e.id,
                        type: e.type,
                        numeroEcheance: e.numeroEcheance,
                        moisConcerne: e.moisConcerne,
                        dateLimite: e.dateLimite,
                        montant: e.montant,
                        montantPaye: e.montantPaye,
                        statut: e.statut,
                    })),
                    totalRestant: Math.round(totalRestant * 100) / 100,
                };
            });

            // ── Semestres du parcours/année filtrés ──
            const semestresQuery: any = {};
            if (cursusWhere.parcoursId) semestresQuery.parcoursId = cursusWhere.parcoursId;
            if (cursusWhere.anneeAcademiqueId) semestresQuery.anneeAcademiqueId = cursusWhere.anneeAcademiqueId;

            const semestres = await SemestreAcademique.findAll({
                where: semestresQuery,
                attributes: ['id', 'codeSemestre', 'libelle', 'statut', 'parcoursId', 'anneeAcademiqueId'],
                order: [['codeSemestre', 'ASC']],
            });

            const semestresResponse = semestres.map((s: any) => ({
                id: s.id,
                codeSemestre: s.codeSemestre,
                libelle: s.libelle,
                statut: s.statut,
                parcoursId: s.parcoursId,
                anneeAcademiqueId: s.anneeAcademiqueId,
            }));

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                semestres: semestresResponse,
            });

        } catch (error: any) {
            console.error('Erreur getEtudiantsIrreguliers:', error);
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }
}
