import express from "express"
import ReinscriptionController from "../controllers/ReinscriptionController"

const router = express.Router()

/**
 * @openapi
 * /inscription/reinscription/peut-se-reinscrire:
 *   get:
 *     tags: [Réinscription]
 *     summary: Vérifie la solvabilité de l'étudiant (dette affichée, non bloquante)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 */
router.get('/peut-se-reinscrire', ReinscriptionController.peutSeReinscrire)

/**
 * @openapi
 * /inscription/reinscription/eligibilite:
 *   get:
 *     tags: [Réinscription]
 *     summary: Éligibilité à la réinscription planifiée (cursus actuel + dette + déjà inscrit)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Éligibilité
 */
router.get('/eligibilite', ReinscriptionController.getEligibilite)

/**
 * @openapi
 * /inscription/reinscription/planifier:
 *   post:
 *     tags: [Réinscription]
 *     summary: Crée une planification de réinscription (en_attente)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Planification créée
 */
router.post('/planifier', ReinscriptionController.creerPlanification)

/**
 * @openapi
 * /inscription/reinscription/planifications:
 *   get:
 *     tags: [Réinscription]
 *     summary: Liste les planifications de l'apprenant connecté (suivi)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des planifications
 */
router.get('/planifications', ReinscriptionController.getMesPlanifications)

/**
 * @openapi
 * /inscription/reinscription/planifications/{id}/annuler:
 *   post:
 *     tags: [Réinscription]
 *     summary: Annule une planification (en_attente -> abandon)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Planification annulée
 */
router.post('/planifications/:id/annuler', ReinscriptionController.annulerPlanification)

/**
 * @openapi
 * /inscription/reinscription/planifications/{id}/confirmer:
 *   post:
 *     tags: [Réinscription]
 *     summary: Confirme une planification (réservé admin/institution)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Planification confirmée
 */
router.post('/planifications/:id/confirmer', ReinscriptionController.confirmerPlanification)

export default router
