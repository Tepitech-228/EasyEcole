import { Request, Response } from "express";
import { BourseConfiguration } from "../models/BourseConfiguration";

/**
 * BourseConfigurationController — CRUD configurations de bourses.
 *
 * RÈGLES DE VALIDATION :
 *  - TOTAL     : taux FORCÉ à 100 (ignoré côté client)
 *  - PARTIELLE : 0 < taux < 100
 *  - Le frontend ne doit JAMAIS être la seule couche de validation.
 */
export default class BourseConfigurationController {

    /** GET /bourses/configurations — Liste toutes les configurations */
    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const configurations = await BourseConfiguration.findAll({
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json(configurations);
        } catch (error: any) {
            console.error('[BourseConfigController] Erreur getAll:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors du chargement des configurations de bourse', error: error.message });
        }
    }

    /** GET /bourses/configurations/:id — Détail d'une configuration */
    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const config = await BourseConfiguration.findByPk(req.params.id);
            if (!config) {
                return res.status(404).json({ success: false, message: 'Configuration de bourse non trouvée' });
            }
            return res.status(200).json(config);
        } catch (error: any) {
            console.error('[BourseConfigController] Erreur get:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors du chargement de la configuration', error: error.message });
        }
    }

    /** POST /bourses/configurations — Créer une configuration */
    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const { nom, type, taux, description, statut } = req.body;

            // Validations backend obligatoires
            if (!nom || !nom.trim()) {
                return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
            }
            if (!type || !['TOTAL', 'PARTIELLE'].includes(type)) {
                return res.status(400).json({ success: false, message: 'Le type doit être TOTAL ou PARTIELLE' });
            }

            let tauxValide: number;
            if (type === 'TOTAL') {
                tauxValide = 100;
            } else {
                // PARTIELLE : 0 < taux < 100
                const tauxNum = parseFloat(taux);
                if (isNaN(tauxNum)) {
                    return res.status(400).json({ success: false, message: 'Le taux doit être un nombre valide' });
                }
                if (tauxNum <= 0 || tauxNum >= 100) {
                    return res.status(400).json({ success: false, message: 'Pour une bourse partielle, le taux doit être supérieur à 0 et inférieur à 100' });
                }
                tauxValide = tauxNum;
            }

            const configuration = await BourseConfiguration.create({
                nom: nom.trim(),
                type,
                taux: tauxValide,
                description: description || null,
                statut: statut || 'ACTIVE',
            });

            return res.status(201).json(configuration);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: 'Une configuration avec ce nom existe déjà' });
            }
            console.error('[BourseConfigController] Erreur create:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors de la création de la configuration', error: error.message });
        }
    }

    /** PUT /bourses/configurations/:id — Modifier une configuration */
    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const config = await BourseConfiguration.findByPk(req.params.id);
            if (!config) {
                return res.status(404).json({ success: false, message: 'Configuration de bourse non trouvée' });
            }

            const { nom, type, taux, description, statut } = req.body;

            // Validation du type
            const newType = type || config.type;
            if (!['TOTAL', 'PARTIELLE'].includes(newType)) {
                return res.status(400).json({ success: false, message: 'Le type doit être TOTAL ou PARTIELLE' });
            }

            // Validation du taux
            let newTaux = config.taux;
            if (taux !== undefined && taux !== null) {
                if (newType === 'TOTAL') {
                    newTaux = 100;
                } else {
                    const tauxNum = parseFloat(taux);
                    if (isNaN(tauxNum)) {
                        return res.status(400).json({ success: false, message: 'Le taux doit être un nombre valide' });
                    }
                    if (tauxNum <= 0 || tauxNum >= 100) {
                        return res.status(400).json({ success: false, message: 'Pour une bourse partielle, le taux doit être supérieur à 0 et inférieur à 100' });
                    }
                    newTaux = tauxNum;
                }
            }

            // Validation du statut
            if (statut && !['ACTIVE', 'INACTIVE'].includes(statut)) {
                return res.status(400).json({ success: false, message: 'Le statut doit être ACTIVE ou INACTIVE' });
            }

            await config.update({
                nom: nom?.trim() || config.nom,
                type: newType,
                taux: newTaux,
                description: description !== undefined ? description : config.description,
                statut: statut || config.statut,
            });

            return res.status(200).json(config);
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: 'Une configuration avec ce nom existe déjà' });
            }
            console.error('[BourseConfigController] Erreur update:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors de la modification de la configuration', error: error.message });
        }
    }

    /** PATCH /bourses/configurations/:id/statut — Activer / Désactiver */
    static async toggleStatut(req: Request, res: Response): Promise<Response> {
        try {
            const config = await BourseConfiguration.findByPk(req.params.id);
            if (!config) {
                return res.status(404).json({ success: false, message: 'Configuration de bourse non trouvée' });
            }

            const nouveauStatut = config.statut === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await config.update({ statut: nouveauStatut });

            return res.status(200).json({
                success: true,
                message: `Configuration ${nouveauStatut === 'ACTIVE' ? 'activée' : 'désactivée'}`,
                configuration: config
            });
        } catch (error: any) {
            console.error('[BourseConfigController] Erreur toggleStatut:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors du changement de statut', error: error.message });
        }
    }
}
