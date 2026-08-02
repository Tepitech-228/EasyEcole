import express from "express"
import ExerciceComptableController from "../controllers/ExerciceComptableController"

const router = express.Router()

/**
 * @openapi
 * /comptabilite/exercices:
 *   get:
 *     tags: [Exercices Comptables]
 *     summary: Liste tous les exercices comptables
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des exercices comptables
 */
router
  .get('/', ExerciceComptableController.getAll)

/**
 * @openapi
 * /comptabilite/exercices/en-cours:
 *   get:
 *     tags: [Exercices Comptables]
 *     summary: Récupère l'exercice comptable actif
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exercice comptable actif trouvé
 *       404:
 *         description: Aucun exercice actif
 */
  .get('/en-cours', ExerciceComptableController.getEnCours)

/**
 * @openapi
 * /comptabilite/exercices/{id}:
 *   get:
 *     tags: [Exercices Comptables]
 *     summary: Récupère un exercice comptable par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Exercice comptable trouvé
 *       404:
 *         description: Exercice non trouvé
 */
  .get('/:id', ExerciceComptableController.getById)

/**
 * @openapi
 * /comptabilite/exercices:
 *   post:
 *     tags: [Exercices Comptables]
 *     summary: Crée un nouvel exercice comptable
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - libelle
 *               - dateDebut
 *               - dateFin
 *             properties:
 *               code:
 *                 type: string
 *               libelle:
 *                 type: string
 *               dateDebut:
 *                 type: string
 *                 format: date
 *               dateFin:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Exercice comptable créé
 *       400:
 *         description: Erreur de validation
 */
  .post('/', ExerciceComptableController.create)

/**
 * @openapi
 * /comptabilite/exercices/{id}:
 *   put:
 *     tags: [Exercices Comptables]
 *     summary: Met à jour un exercice comptable
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               libelle:
 *                 type: string
 *               dateDebut:
 *                 type: string
 *                 format: date
 *               dateFin:
 *                 type: string
 *                 format: date
 *               actif:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Exercice comptable mis à jour
 *       400:
 *         description: Erreur de validation (exercice clôturé)
 *       404:
 *         description: Exercice non trouvé
 */
  .put('/:id', ExerciceComptableController.update)

export default router
