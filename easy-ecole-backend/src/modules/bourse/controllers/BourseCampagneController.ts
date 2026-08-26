import { Request, Response } from "express";
import { Op, literal } from "sequelize";
import { BourseConfiguration } from "../models/BourseConfiguration";
import { BourseAttribution } from "../models/BourseAttribution";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Echeance } from "../../inscription/models/Echeance";
import { BourseService } from "../services/BourseService";

/**
 * BourseCampagneController — Page dédiée création de bourses.
 *
 * Flux :
 *  1. GET  /bourses/campagne/niveaux → liste des niveaux d'études avec nombre d'étudiants
 *  2. GET  /bourses/campagne/eligibles?niveauEtudeId=X → étudiants d'un niveau donné
 *  3. POST /bourses/campagne/attribuer → attribution en masse à un niveau entier
 *
 * ESA COMPTA peut :
 *  - Choisir une configuration existante (pas de création inline — c'est réservé Admin/Directeur)
 *  - Définir la durée (dateDebut / dateFin)
 *  - Sélectionner un niveau d'études (L1, M1, etc.)
 *  - Confirmer → bulk attribution sur TOUS les étudiants actifs de ce niveau + application échéances
 */
export default class BourseCampagneController {

    /**
     * GET /bourses/campagne/niveaux
     *
     * Retourne la liste des niveaux d'études avec :
     *  - Le nombre total d'étudiants actifs inscrits
     *  - Le nombre d'étudiants ayant déjà une bourse active
     */
    static async getNiveaux(req: Request, res: Response): Promise<Response> {
        try {
            // Tous les niveaux
            const niveaux = await NiveauEtude.findAll({
                attributes: ['id', 'libelle'],
                order: [['libelle', 'ASC']]
            });

            const result = [];

            for (const niveau of niveaux) {
                // Compter les étudiants actifs dans ce niveau via CursusApprenant
                const totalEtudiants = await CursusApprenant.count({
                    where: { niveauEtudeId: niveau.id },
                    include: [{
                        model: Utilisateur,
                        as: 'utilisateur',
                        attributes: [],
                        where: { role: 'apprenant' },
                        required: true
                    }]
                });

                // Compter ceux qui ont déjà une bourse active
                // (on récupère les userId de ce niveau, puis on cherche leurs dossiers avec bourse active)
                const cursusList = await CursusApprenant.findAll({
                    where: { niveauEtudeId: niveau.id },
                    attributes: ['utilisateurId'],
                    include: [{
                        model: Utilisateur,
                        as: 'utilisateur',
                        attributes: [],
                        where: { role: 'apprenant' },
                        required: true
                    }],
                    raw: true
                });

                const userIds = cursusList.map((c: any) => c.utilisateurId);

                let avecBourse = 0;
                if (userIds.length > 0) {
                    const dossiers = await DossierEtudiant.findAll({
                        where: { utilisateurId: { [Op.in]: userIds }, statut: 'actif' },
                        attributes: ['id'],
                        raw: true
                    });
                    const dossierIds = dossiers.map((d: any) => d.id);

                    if (dossierIds.length > 0) {
                        avecBourse = await BourseAttribution.count({
                            where: {
                                dossierEtudiantId: { [Op.in]: dossierIds },
                                statut: 'ACTIVE'
                            }
                        });
                    }
                }

                result.push({
                    id: niveau.id,
                    libelle: niveau.libelle,
                    totalEtudiants,
                    avecBourse,
                    sansBourse: totalEtudiants - avecBourse,
                });
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('[BourseCampagneController] Erreur getNiveaux:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors du chargement des niveaux',
                error: error.message
            });
        }
    }

    /**
     * GET /bourses/campagne/eligibles?niveauEtudeId=X
     *
     * Retourne les étudiants d'un niveau donné avec :
     *  - Leurs informations (matricule, nom, prénoms, email)
     *  - Leur statut de déclaration boursière
     *  - Leur bourse active éventuelle
     *  - Leurs frais de scolarité
     */
    static async getEligibles(req: Request, res: Response): Promise<Response> {
        try {
            const { niveauEtudeId, search, estBoursier, sansBourse } = req.query;

            if (!niveauEtudeId) {
                return res.status(400).json({ success: false, message: 'Le paramètre niveauEtudeId est obligatoire' });
            }

            // 1. Trouver les utilisateurs de ce niveau via CursusApprenant
            const cursusList = await CursusApprenant.findAll({
                where: { niveauEtudeId: Number(niveauEtudeId) },
                attributes: ['utilisateurId'],
                include: [{
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
                }],
                raw: false
            });

            const userIds = cursusList.map((c: any) => c.utilisateurId);

            if (userIds.length === 0) {
                return res.status(200).json({ total: 0, etudiants: [] });
            }

            // 2. Récupérer les dossiers de ces utilisateurs
            const dossiers = await DossierEtudiant.findAll({
                where: {
                    utilisateurId: { [Op.in]: userIds },
                    statut: 'actif'
                },
                attributes: ['id', 'utilisateurId', 'matricule', 'fraisScolarite', 'modePaiement', 'nbMensualites', 'dateCreation'],
                include: [
                    {
                        model: Utilisateur,
                        as: 'utilisateur',
                        attributes: ['id', 'nom', 'prenoms', 'email'],
                        required: true
                    }
                ],
                order: [[{ model: Utilisateur, as: 'utilisateur' }, 'nom', 'ASC']]
            });

            // 3. Récupérer les bourses actives
            const boursesActives = await BourseAttribution.findAll({
                where: { statut: 'ACTIVE' },
                attributes: ['dossierEtudiantId', 'id', 'taux', 'type', 'dateDebut', 'dateFin'],
                include: [
                    { model: BourseConfiguration, as: 'configuration', attributes: ['id', 'nom', 'type', 'taux'] }
                ]
            });

            const boursesMap = new Map<number, any>();
            for (const b of boursesActives) {
                boursesMap.set(b.dossierEtudiantId, b);
            }

            // 4. Déclarations estBoursier
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

            // 5. Assembler
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

            // 6. Filtres
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
     * Attribution en masse de bourses PAR NIVEAU D'ÉTUDES.
     *
     * Body :
     *  - configurationId : number (obligatoire — ESA COMPTA ne crée pas de configs)
     *  - niveauEtudeId : number (obligatoire — L1, M1, etc.)
     *  - dateDebut : string (ISO date)
     *  - dateFin : string | null (ISO date)
     *  - motif : string | null
     *
     * Résout automatiquement tous les dossiers actifs du niveau et attribue la bourse.
     */
    static async bulkAttribuer(req: Request, res: Response): Promise<Response> {
        try {
            const { configurationId, niveauEtudeId, dateDebut, dateFin, motif } = req.body;
            const valideParId = (req as any).utilisateurId;

            // ── Validations ──
            if (!configurationId) {
                return res.status(400).json({ success: false, message: 'La configuration de bourse est obligatoire' });
            }
            if (!niveauEtudeId) {
                return res.status(400).json({ success: false, message: 'Le niveau d\'études est obligatoire' });
            }
            if (!dateDebut) {
                return res.status(400).json({ success: false, message: 'La date de début est obligatoire' });
            }

            // Résoudre la configuration
            const config = await BourseConfiguration.findByPk(configurationId);
            if (!config) {
                return res.status(404).json({ success: false, message: `Configuration #${configurationId} non trouvée` });
            }
            if (config.statut !== 'ACTIVE') {
                return res.status(400).json({ success: false, message: `La configuration "${config.nom}" est désactivée` });
            }

            // Résoudre le niveau
            const niveau = await NiveauEtude.findByPk(niveauEtudeId);
            if (!niveau) {
                return res.status(404).json({ success: false, message: `Niveau d'études #${niveauEtudeId} non trouvé` });
            }

            // Trouver tous les dossiers actifs de ce niveau
            const cursusList = await CursusApprenant.findAll({
                where: { niveauEtudeId: Number(niveauEtudeId) },
                attributes: ['utilisateurId'],
                include: [{
                    model: Utilisateur,
                    as: 'utilisateur',
                    attributes: [],
                    where: { role: 'apprenant' },
                    required: true
                }],
                raw: true
            });

            const userIds = cursusList.map((c: any) => c.utilisateurId);

            if (userIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Aucun étudiant trouvé dans ce niveau',
                    created: 0,
                    skipped: 0,
                    errors: [],
                });
            }

            const dossiers = await DossierEtudiant.findAll({
                where: {
                    utilisateurId: { [Op.in]: userIds },
                    statut: 'actif'
                },
                attributes: ['id'],
                raw: true
            });

            const dossierIds = dossiers.map((d: any) => d.id);

            // ── Attribution en masse ──
            let created = 0;
            let skipped = 0;
            const errors: { dossierId: number; message: string }[] = [];

            for (const dossierId of dossierIds) {
                try {
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
                        niveauEtudeId: niveau.id,
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
                        console.log(`[BourseCampagne] ${nbModifiees} échéance(s) réduite(s) de ${taux}% pour le dossier #${dossierId} (niveau: ${niveau.libelle})`);
                    }

                    created++;
                } catch (err: any) {
                    errors.push({ dossierId, message: err.message || 'Erreur inconnue' });
                }
            }

            return res.status(201).json({
                success: true,
                message: `${created} bourse(s) attribuée(s) au niveau "${niveau.libelle}", ${skipped} ignorée(s) (bourse active existante)`,
                configuration: {
                    id: config.id,
                    nom: config.nom,
                    type: config.type,
                    taux: config.taux,
                },
                niveau: {
                    id: niveau.id,
                    libelle: niveau.libelle,
                },
                created,
                skipped,
                errors,
                totalDossiers: dossierIds.length,
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
