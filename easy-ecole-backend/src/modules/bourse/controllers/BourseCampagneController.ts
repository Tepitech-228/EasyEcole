import { Request, Response } from "express";
import { Op, literal } from "sequelize";
import { BourseConfiguration } from "../models/BourseConfiguration";
import { BourseAttribution } from "../models/BourseAttribution";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Echeance } from "../../inscription/models/Echeance";
import { BourseService } from "../services/BourseService";

/**
 * BourseCampagneController — Page dédiée création de bourses (vision Institution).
 *
 * Flux :
 *  1. GET  /bourses/campagne/eligibles → liste des étudiants actifs + leur statut boursier
 *  2. POST /bourses/campagne/attribuer → attribution en masse à une liste d'étudiants
 *
 * L'institution peut :
 *  - Choisir une configuration existante OU en créer une inline
 *  - Définir la durée (dateDebut / dateFin)
 *  - Sélectionner les étudiants concernés (la liste est pré-remplie avec les déclarants boursiers)
 *  - Confirmer → bulk attribution + application sur échéances
 */
export default class BourseCampagneController {

    /**
     * GET /bourses/campagne/eligibles
     *
     * Retourne la liste de tous les étudiants actifs avec :
     *  - Leurs informations (matricule, nom, prénoms, email)
     *  - Leur statut de déclaration boursière (estBoursier depuis DemandeInscription)
     *  - Leur bourse active éventuelle (configuration, taux)
     *  - Leurs frais de scolarité
     *
     * Query params optionnels :
     *  - search : filtre par nom/prénoms/matricule/email
     *  - estBoursier : 'true' | 'false' pour filtrer les déclarants
     *  - sansBourse : 'true' pour ne montrer que ceux sans bourse active
     */
    static async getEligibles(req: Request, res: Response): Promise<Response> {
        try {
            const { search, estBoursier, sansBourse } = req.query;

            // 1. Récupérer tous les dossiers actifs avec leur utilisateur
            const dossiers = await DossierEtudiant.findAll({
                where: { statut: 'actif' },
                attributes: ['id', 'matricule', 'fraisScolarite', 'modePaiement', 'nbMensualites', 'dateCreation'],
                include: [
                    {
                        model: Utilisateur,
                        as: 'utilisateur',
                        attributes: ['id', 'nom', 'prenoms', 'email'],
                        where: {
                            role: 'apprenant',
                            ...(search ? {
                                [Op.or]: [
                                    { nom: { [Op.like]: `%${search}%` } },
                                    { prenoms: { [Op.like]: `%${search}%` } },
                                    { email: { [Op.like]: `%${search}%` } },
                                ]
                            } : {})
                        },
                        required: true
                    }
                ],
                order: [[{ model: Utilisateur, as: 'utilisateur' }, 'nom', 'ASC']]
            });

            // 2. Récupérer toutes les bourses actives
            const boursesActives = await BourseAttribution.findAll({
                where: { statut: 'ACTIVE' },
                attributes: ['dossierEtudiantId', 'id', 'taux', 'type', 'dateDebut', 'dateFin'],
                include: [
                    { model: BourseConfiguration, as: 'configuration', attributes: ['id', 'nom', 'type', 'taux'] }
                ]
            });

            // Indexer les bourses par dossierEtudiantId
            const boursesMap = new Map<number, any>();
            for (const b of boursesActives) {
                boursesMap.set(b.dossierEtudiantId, b);
            }

            // 3. Récupérer les declarations estBoursier (dernière demande par utilisateur)
            // On utilise une requête raw pour obtenir la dernière demande de chaque utilisateur
            const declarationsRaw = await DossierEtudiant.sequelize!.query(`
                SELECT di.utilisateurId, di.estBoursier
                FROM ins_demandes_inscription di
                INNER JOIN (
                    SELECT utilisateurId, MAX(id) as maxId
                    FROM ins_demandes_inscription
                    WHERE deletedAt IS NULL
                    GROUP BY utilisateurId
                ) latest ON di.id = latest.maxId
                WHERE di.deletedAt IS NULL
            `, { type: 'SELECT' }) as any[];

            const declarationsMap = new Map<number, boolean>();
            for (const d of declarationsRaw) {
                declarationsMap.set(d.utilisateurId, d.estBoursier === true || d.estBoursier === 1);
            }

            // 4. Assembler les résultats
            let result = dossiers.map(d => {
                const utilisateur = (d as any).utilisateur;
                const bourse = boursesMap.get(d.id) || null;
                const declaredBoursier = declarationsMap.get(d.utilisateurId) || false;

                return {
                    dossierId: d.id,
                    matricule: d.matricule,
                    nom: utilisateur?.nom,
                    prenoms: utilisateur?.prenoms,
                    email: utilisateur?.email,
                    utilisateurId: d.utilisateurId,
                    fraisScolarite: d.fraisScolarite,
                    modePaiement: d.modePaiement,
                    dateCreation: d.dateCreation,
                    estBoursierDeclare: declaredBoursier,
                    bourseActive: bourse ? {
                        attributionId: bourse.id,
                        configuration: bourse.configuration,
                        taux: bourse.taux,
                        type: bourse.type,
                        dateDebut: bourse.dateDebut,
                        dateFin: bourse.dateFin,
                    } : null,
                };
            });

            // 5. Appliquer les filtres côté applicatif
            if (estBoursier === 'true') {
                result = result.filter(r => r.estBoursierDeclare === true);
            } else if (estBoursier === 'false') {
                result = result.filter(r => r.estBoursierDeclare === false);
            }

            if (sansBourse === 'true') {
                result = result.filter(r => r.bourseActive === null);
            }

            return res.status(200).json({
                total: result.length,
                etudiants: result,
            });
        } catch (error: any) {
            console.error('[BourseCampagneController] Erreur getEligibles:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors du chargement des étudiants éligibles',
                error: error.message
            });
        }
    }

    /**
     * POST /bourses/campagne/attribuer
     *
     * Attribution en masse de bourses.
     *
     * Body :
     *  - configurationId : number (optionnel si configData fourni)
     *  - configData : { nom, type, taux, description } (optionnel si configurationId fourni)
     *  - dateDebut : string (ISO date)
     *  - dateFin : string | null (ISO date)
     *  - motif : string | null
     *  - dossierIds : number[] (liste des dossierEtudiantId ciblés)
     *
     * Retourne le résumé de l'opération :
     *  - created : nombre d'attributions créées
     *  - skipped : nombre d'étudiants ignorés (bourse active existante)
     *  - errors : liste des erreurs éventuelles
     */
    static async bulkAttribuer(req: Request, res: Response): Promise<Response> {
        try {
            const { configurationId, configData, dateDebut, dateFin, motif, dossierIds } = req.body;
            const valideParId = (req as any).utilisateurId;

            // ── Validations ──
            if (!dateDebut) {
                return res.status(400).json({ success: false, message: 'La date de début est obligatoire' });
            }
            if (!dossierIds || !Array.isArray(dossierIds) || dossierIds.length === 0) {
                return res.status(400).json({ success: false, message: 'Sélectionnez au moins un étudiant' });
            }

            // Résoudre la configuration
            let config: BourseConfiguration;
            if (configurationId) {
                const found = await BourseConfiguration.findByPk(configurationId);
                if (!found) {
                    return res.status(404).json({ success: false, message: `Configuration #${configurationId} non trouvée` });
                }
                if (found.statut !== 'ACTIVE') {
                    return res.status(400).json({ success: false, message: `La configuration "${found.nom}" est désactivée` });
                }
                config = found;
            } else if (configData) {
                // Créer la configuration inline
                const { nom, type, taux, description } = configData;
                if (!nom || !type) {
                    return res.status(400).json({ success: false, message: 'Le nom et le type de la configuration sont obligatoires' });
                }
                let tauxValide: number;
                if (type === 'TOTAL') {
                    tauxValide = 100;
                } else {
                    const tauxNum = parseFloat(taux);
                    if (isNaN(tauxNum) || tauxNum <= 0 || tauxNum >= 100) {
                        return res.status(400).json({ success: false, message: 'Pour une bourse partielle, le taux doit être entre 0 et 100 (exclus)' });
                    }
                    tauxValide = tauxNum;
                }
                config = await BourseConfiguration.create({
                    nom: nom.trim(),
                    type,
                    taux: tauxValide,
                    description: description || null,
                    statut: 'ACTIVE',
                });
            } else {
                return res.status(400).json({ success: false, message: 'Fournissez une configuration existante ou les données d\'une nouvelle configuration' });
            }

            // ── Attribution en masse ──
            let created = 0;
            let skipped = 0;
            const errors: { dossierId: number; message: string }[] = [];

            for (const dossierId of dossierIds) {
                try {
                    // Vérifier le dossier
                    const dossier = await DossierEtudiant.findByPk(dossierId);
                    if (!dossier) {
                        errors.push({ dossierId, message: 'Dossier non trouvé' });
                        continue;
                    }

                    // Vérifier qu'il n'y a pas déjà une bourse ACTIVE
                    const existing = await BourseAttribution.findOne({
                        where: { dossierEtudiantId: dossierId, statut: 'ACTIVE' }
                    });
                    if (existing) {
                        skipped++;
                        continue;
                    }

                    // Créer l'attribution
                    const attribution = await BourseAttribution.create({
                        dossierEtudiantId: dossierId,
                        configurationId: config.id,
                        type: config.type,
                        taux: config.taux,
                        dateDebut: new Date(dateDebut),
                        dateFin: dateFin ? new Date(dateFin) : null,
                        motif: motif || null,
                        valideParId,
                        statut: 'ACTIVE',
                    });

                    // Appliquer la bourse sur les échéances scolarité
                    const taux = parseFloat(config.taux as any);
                    const nbModifiees = await (BourseService as any).appliquerBourseSurEcheances(dossierId, taux);
                    if (nbModifiees > 0) {
                        console.log(`[BourseCampagne] ${nbModifiees} échéance(s) réduite(s) de ${taux}% pour le dossier #${dossierId}`);
                    }

                    created++;
                } catch (err: any) {
                    errors.push({ dossierId, message: err.message || 'Erreur inconnue' });
                }
            }

            return res.status(201).json({
                success: true,
                message: `${created} bourse(s) attribuée(s), ${skipped} ignorée(s) (bourse active existante)`,
                configuration: {
                    id: config.id,
                    nom: config.nom,
                    type: config.type,
                    taux: config.taux,
                },
                created,
                skipped,
                errors,
                dateDebut,
                dateFin: dateFin || null,
            });
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: 'Une configuration avec ce nom existe déjà' });
            }
            console.error('[BourseCampagneController] Erreur bulkAttribuer:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'attribution en masse',
                error: error.message
            });
        }
    }
}
