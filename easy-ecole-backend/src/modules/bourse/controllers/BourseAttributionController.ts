import { Request, Response } from "express";
import { BourseService } from "../services/BourseService";

/**
 * BourseAttributionController — Gestion opérationnelle des bourses.
 *
 * Endpoints :
 *  - GET    /bourses/etudiants/:dossierId/bourse        → bourse active d'un étudiant
 *  - POST   /bourses/etudiants/:dossierId/bourse        → attribuer une bourse
 *  - PUT    /bourses/attributions/:id                   → modifier une attribution
 *  - PATCH  /bourses/attributions/:id/suspendre         → suspendre
 *  - PATCH  /bourses/attributions/:id/reactiver         → réactiver
 *  - GET    /bourses/etudiants/:dossierId/bourses/historique → historique
 *  - GET    /bourses/etudiants/:dossierId/frais         → résumé financier avec bourse
 */
export default class BourseAttributionController {

    /** GET /bourses/etudiants/:dossierId/bourse — Bourse active de l'étudiant */
    static async getBourseActive(req: Request, res: Response): Promise<Response> {
        try {
            const dossierId = parseInt(req.params.dossierId, 10);
            if (isNaN(dossierId)) {
                return res.status(400).json({ success: false, message: 'Identifiant de dossier invalide' });
            }

            const bourse = await BourseService.getBourseActive(dossierId);
            return res.status(200).json(bourse);
        } catch (error: any) {
            console.error('[BourseAttrController] Erreur getBourseActive:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors du chargement de la bourse', error: error.message });
        }
    }

    /** POST /bourses/etudiants/:dossierId/bourse — Attribuer une bourse */
    static async attribuer(req: Request, res: Response): Promise<Response> {
        try {
            const dossierId = parseInt(req.params.dossierId, 10);
            if (isNaN(dossierId)) {
                return res.status(400).json({ success: false, message: 'Identifiant de dossier invalide' });
            }

            const { configurationId, dateDebut, dateFin, motif } = req.body;
            if (!configurationId) {
                return res.status(400).json({ success: false, message: 'La configuration de bourse est obligatoire' });
            }
            if (!dateDebut) {
                return res.status(400).json({ success: false, message: 'La date de début est obligatoire' });
            }

            const valideParId = (req as any).utilisateurId;
            const bourse = await BourseService.attribuer(dossierId, configurationId, dateDebut, dateFin || null, motif || null, valideParId);

            return res.status(201).json(bourse);
        } catch (error: any) {
            if (error.message?.includes(' déjà une bourse active')) {
                return res.status(409).json({ success: false, message: error.message });
            }
            if (error.message?.includes('non trouvé')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message?.includes('désactivée')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            console.error('[BourseAttrController] Erreur attribuer:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors de l\'attribution de la bourse', error: error.message });
        }
    }

    /** PUT /bourses/attributions/:id — Modifier une attribution */
    static async modifier(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'Identifiant invalide' });
            }

            const { configurationId, dateDebut, dateFin, motif } = req.body;
            const bourse = await BourseService.modifier(id, { configurationId, dateDebut, dateFin, motif });

            return res.status(200).json(bourse);
        } catch (error: any) {
            if (error.message?.includes('non trouvée')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            console.error('[BourseAttrController] Erreur modifier:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors de la modification', error: error.message });
        }
    }

    /** PATCH /bourses/attributions/:id/suspendre — Suspendre une bourse */
    static async suspendre(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'Identifiant invalide' });
            }

            const motif = req.body?.motif || null;
            const bourse = await BourseService.suspendre(id, motif);

            return res.status(200).json({
                success: true,
                message: 'Bourse suspendue',
                attribution: bourse
            });
        } catch (error: any) {
            if (error.message?.includes('non trouvée')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            console.error('[BourseAttrController] Erreur suspendre:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors de la suspension', error: error.message });
        }
    }

    /** PATCH /bourses/attributions/:id/reactiver — Réactiver une bourse */
    static async reactiver(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'Identifiant invalide' });
            }

            const bourse = await BourseService.reactiver(id);

            return res.status(200).json({
                success: true,
                message: 'Bourse réactivée',
                attribution: bourse
            });
        } catch (error: any) {
            if (error.message?.includes('non trouvée')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message?.includes('déjà une bourse active')) {
                return res.status(409).json({ success: false, message: error.message });
            }
            if (error.message?.includes('expirée')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            console.error('[BourseAttrController] Erreur reactiver:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors de la réactivation', error: error.message });
        }
    }

    /** GET /bourses/etudiants/:dossierId/bourses/historique — Historique des bourses */
    static async historique(req: Request, res: Response): Promise<Response> {
        try {
            const dossierId = parseInt(req.params.dossierId, 10);
            if (isNaN(dossierId)) {
                return res.status(400).json({ success: false, message: 'Identifiant de dossier invalide' });
            }

            const historique = await BourseService.getHistorique(dossierId);
            return res.status(200).json(historique);
        } catch (error: any) {
            console.error('[BourseAttrController] Erreur historique:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors du chargement de l\'historique', error: error.message });
        }
    }

    /** GET /bourses/etudiants/:dossierId/frais — Résumé financier avec bourse */
    static async resumeFinancier(req: Request, res: Response): Promise<Response> {
        try {
            const dossierId = parseInt(req.params.dossierId, 10);
            if (isNaN(dossierId)) {
                return res.status(400).json({ success: false, message: 'Identifiant de dossier invalide' });
            }

            const resume = await BourseService.getResumeFinancier(dossierId);
            return res.status(200).json(resume);
        } catch (error: any) {
            if (error.message?.includes('non trouvé')) {
                return res.status(404).json({ success: false, message: error.message });
            }
            console.error('[BourseAttrController] Erreur resumeFinancier:', error);
            return res.status(500).json({ success: false, message: 'Erreur lors du calcul financier', error: error.message });
        }
    }
}
