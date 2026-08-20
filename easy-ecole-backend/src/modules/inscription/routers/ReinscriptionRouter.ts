import express from "express"
import ReinscriptionController from "../controllers/ReinscriptionController"

const router = express.Router()

/**
 * @openapi
 * /inscription/reinscription/peut-se-reinscrire:
 *   get:
 *     tags: [Réinscription]
 *     summary: Vérifie si l'étudiant peut se réinscrire (pas de dette)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 */
router.get('/peut-se-reinscrire', ReinscriptionController.peutSeReinscrire)

export default router
