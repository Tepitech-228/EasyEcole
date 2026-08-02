import express from "express"
import ArborescenceController from "../controllers/ArborescenceController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

/**
 * @openapi
 * /elearning/arborescence:
 *   get:
 *     tags: [Arborescence E-learning]
 *     summary: Arborescence académique complète (Année → Parcours → Niveau → Classe → Cours → Cours en ligne) avec compteurs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arborescence avec compteurs de cours en ligne et rubrique "Non rattaché"
 *       403:
 *         description: Accès réservé à l'administration
 */
router
    .get('/', [Authenticate], ArborescenceController.getArborescence)

export default router
