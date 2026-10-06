import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { CursusApprenant } from "../models/CursusApprenant";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";

/**
 * Contrôleur pour la situation financière des étudiants.
 * Endpoint : GET /inscription/finance/situation-financiere
 *        : GET /inscription/finance/situation-financiere/:utilisateurId
 */
export default class SituationFinanciereController {

    constructor() { }

    /**
     * GET /inscription/finance/situation-financiere
     * Liste paginée des étudiants avec leur situation financière complète.
     * Query params : page, limit, anneeAcademiqueId, parcoursId, niveauEtudeId,
     *                classeId, periode (matin/soir/en_ligne), search, statutEcheance?
     */
    static async getSituation(req: Request, res: Response): Promise<Response> {
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

            // ── Construire le where pour Apprenant (filtre periode) ──
            const apprenantWhere: any = {};
            if (req.query.periode) {
                const periodeVal = String(req.query.periode).toLowerCase();
                if (['matin', 'soir', 'en_ligne'].includes(periodeVal)) {
                    apprenantWhere.periode = periodeVal;
                } else {
                    return res.status(400).json({ success: false, message: "Paramètre 'periode' invalide (matin/soir/en_ligne attendu)" });
                }
            }

            // ── Search : résoudre les utilisateurs par nom/prénom ou matricule ──
            const search = String(req.query.search || '').trim();
            if (search.length > 100) {
                return res.status(400).json({ success: false, message: "Le terme de recherche ne peut pas dépasser 100 caractères" });
            }
            if (search) {
                const searchTerm = `%${search}%`;
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

                const matchingUserIds = [...new Set([
                    ...matchingUsers.map((u: any) => Number(u.id)),
                    ...matchingDossiers.map((d: any) => Number(d.utilisateurId)),
                ].filter(id => Number.isInteger(id) && id > 0))];

                if (matchingUserIds.length === 0) {
                    return res.status(200).json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
                }
                cursusWhere.utilisateurId = { [Op.in]: matchingUserIds };
            }

            // ── Construire l'include complet ──
            const includeOptions: FindOptions<InferAttributes<CursusApprenant>>['include'] = [
                { association: CursusApprenant.associations.classe },
                { association: CursusApprenant.associations.niveauEtude },
                { association: CursusApprenant.associations.parcours },
                { association: CursusApprenant.associations.anneeAcademique },
                {
                    association: CursusApprenant.associations.utilisateur as any,
                    attributes: ['id', 'nom', 'prenoms', 'identifiant'],
                    include: [
                        {
                            association: Utilisateur.associations.apprenant as any,
                            attributes: ['periode'],
                            required: Object.keys(apprenantWhere).length > 0,
                            ...(Object.keys(apprenantWhere).length > 0 ? { where: apprenantWhere } : {}),
                        },
                        {
                            association: (Utilisateur as any).associations.dossiersEtudiants as any,
                            attributes: ['id', 'matricule'],
                            required: false,
                            include: [
                                {
                                    association: DossierEtudiant.associations.echeances as any,
                                    attributes: ['id', 'type', 'numeroEcheance', 'montant', 'montantPaye', 'statut'],
                                    order: [['numeroEcheance', 'ASC']],
                                    required: false,
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

                const totalDu = echeances.reduce((sum: number, e: any) => sum + (Number(e.montant) || 0), 0);
                const totalPaye = echeances.reduce((sum: number, e: any) => sum + (Number(e.montantPaye) || 0), 0);
                const resteAPayer = Math.max(0, Math.round((totalDu - totalPaye) * 100) / 100);
                const avancement = totalDu > 0 ? Math.round(totalPaye / totalDu * 100) : 0;

                const echeancesSoldees = echeances.filter((e: any) => e.statut === 'paye');
                const echeancesPartielles = echeances.filter((e: any) => e.statut === 'partiel');
                const echeancesImpayees = echeances.filter((e: any) => ['impaye', 'en_retard'].includes(e.statut));

                // Filtrer par statutEcheance si demandé (filtrage côté serveur après calcul)
                // Note : ce paramètre n'est pas utilisé pour le filtrage SQL ici
                // car on veut TOUTES les échéances pour les agrégats.
                // Si statutEcheance est précisé, on peut filtrer la liste retournée.
                const statutEcheanceFilter = req.query.statutEcheance as string | undefined;
                let echeancesFilter = echeances;
                if (statutEcheanceFilter && ['paye', 'partiel', 'impaye', 'en_retard'].includes(statutEcheanceFilter)) {
                    echeancesFilter = echeances.filter((e: any) => e.statut === statutEcheanceFilter);
                }

                const classe = ca.classe as any;
                const niveau = ca.niveauEtude as any;
                const parcours = ca.parcours as any;
                const anneeAcademique = ca.anneeAcademique as any;
                const periode = utilisateur?.apprenant?.periode || null;

                return {
                    etudiant: {
                        id: utilisateur?.id,
                        nom: utilisateur?.nom,
                        prenoms: utilisateur?.prenoms,
                        matricule: dossier?.matricule,
                        periode,
                    },
                    classe: classe ? { id: classe.id, libelle: classe.libelle, niveau: classe.niveau } : null,
                    niveau: niveau ? { id: niveau.id, libelle: niveau.libelle } : null,
                    parcours: parcours ? { id: parcours.id, titre: parcours.titre, type: parcours.type } : null,
                    anneeAcademique: anneeAcademique ? { id: anneeAcademique.id, libelle: anneeAcademique.libelle } : null,
                    totaux: {
                        totalDu: Math.round(totalDu * 100) / 100,
                        totalPaye: Math.round(totalPaye * 100) / 100,
                        resteAPayer,
                        avancement,
                    },
                    echeances: echeancesFilter,
                    echeancesSoldeesCount: echeancesSoldees.length,
                    echeancesPartiellesCount: echeancesPartielles.length,
                    echeancesImpayeesCount: echeancesImpayees.length,
                };
            });

            return res.status(200).json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            });

        } catch (error: any) {
            console.error('Erreur getSituationFinanciere:', error);
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }

    /**
     * GET /inscription/finance/situation-financiere/:utilisateurId
     * Détail complet de la situation financière d'un étudiant.
     * Retourne totaux + toutes échéances + historique bordereaux payés.
     */
    static async getSituationDetail(req: Request, res: Response): Promise<Response> {
        try {
            const { utilisateurId } = req.params;
            const userId = Number(utilisateurId);

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({ success: false, message: "ID utilisateur invalide" });
            }

            // Trouver le cursus apprenant et le dossier
            const cursusWhere: any = { utilisateurId: userId };
            for (const field of ['anneeAcademiqueId', 'niveauEtudeId', 'parcoursId', 'classeId']) {
                const value = req.query[field];
                if (value == null || value === '') continue;
                const parsed = Number(value);
                if (!Number.isInteger(parsed) || parsed <= 0) {
                    return res.status(400).json({ success: false, message: `Paramètre '${field}' invalide` });
                }
                cursusWhere[field] = parsed;
            }

            const cursusApprenant = await CursusApprenant.findOne({
                where: cursusWhere,
                include: [
                    { association: CursusApprenant.associations.classe },
                    { association: CursusApprenant.associations.niveauEtude },
                    { association: CursusApprenant.associations.parcours },
                    { association: CursusApprenant.associations.anneeAcademique },
                    {
                        association: CursusApprenant.associations.utilisateur as any,
                        include: [
                            {
                                association: Utilisateur.associations.apprenant as any,
                                attributes: ['periode'],
                            },
                            {
                                association: (Utilisateur as any).associations.dossiersEtudiants as any,
                                include: [
                                    {
                                        association: DossierEtudiant.associations.echeances as any,
                                        order: [['numeroEcheance', 'ASC']],
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            if (!cursusApprenant) {
                return res.status(404).json({ success: false, message: "Cursus apprenant non trouvé" });
            }

            const utilisateur = cursusApprenant.utilisateur as any;
            const dossier = utilisateur?.dossiersEtudiants?.[0] as any;
            const echeances = dossier?.echeances || [];

            const totalDu = echeances.reduce((sum: number, e: any) => sum + (Number(e.montant) || 0), 0);
            const totalPaye = echeances.reduce((sum: number, e: any) => sum + (Number(e.montantPaye) || 0), 0);
            const resteAPayer = Math.max(0, Math.round((totalDu - totalPaye) * 100) / 100);
            const avancement = totalDu > 0 ? Math.round(totalPaye / totalDu * 100) : 0;

            const echeancesSoldees = echeances.filter((e: any) => e.statut === 'paye');
            const echeancesPartielles = echeances.filter((e: any) => e.statut === 'partiel');
            const echeancesImpayees = echeances.filter((e: any) => ['impaye', 'en_retard'].includes(e.statut));

            const periode = utilisateur?.apprenant?.periode || null;
            const classe = cursusApprenant.classe as any;
            const niveau = cursusApprenant.niveauEtude as any;
            const parcours = cursusApprenant.parcours as any;
            const anneeAcademique = cursusApprenant.anneeAcademique as any;

            return res.status(200).json({
                success: true,
                data: {
                    etudiant: {
                        id: utilisateur?.id,
                        nom: utilisateur?.nom,
                        prenoms: utilisateur?.prenoms,
                        matricule: dossier?.matricule,
                        periode,
                    },
                    classe: classe ? { id: classe.id, libelle: classe.libelle } : null,
                    niveau: niveau ? { id: niveau.id, libelle: niveau.libelle } : null,
                    parcours: parcours ? { id: parcours.id, titre: parcours.titre } : null,
                    anneeAcademique: anneeAcademique ? { id: anneeAcademique.id, libelle: anneeAcademique.libelle } : null,
                    totaux: {
                        totalDu: Math.round(totalDu * 100) / 100,
                        totalPaye: Math.round(totalPaye * 100) / 100,
                        resteAPayer,
                        avancement,
                    },
                    echeances: echeances,
                    echeancesSoldeesCount: echeancesSoldees.length,
                    echeancesPartiellesCount: echeancesPartielles.length,
                    echeancesImpayeesCount: echeancesImpayees.length,
                }
            });

        } catch (error: any) {
            console.error('Erreur getSituationDetail:', error);
            return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
        }
    }
}
