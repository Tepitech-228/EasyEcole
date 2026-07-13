import express from "express"
import ModuleController from "../controllers/ModuleController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

/**
 * @openapi
 * /elearning/modules:
 *   get:
 *     tags: [Modules Elearning]
 *     summary: Liste tous les modules elearning
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des modules elearning
 */
router
    .get('/', [Authenticate], ModuleController.getAll)

/**
 * @openapi
 * /elearning/modules:
 *   post:
 *     tags: [Modules Elearning]
 *     summary: Crée un nouveau module elearning
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Module elearning créé
 */
    .post('/', [Authenticate], ModuleController.create)

/**
 * @openapi
 * /elearning/modules/{id}:
 *   get:
 *     tags: [Modules Elearning]
 *     summary: Récupère un module elearning par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module elearning trouvé
 */
    .get('/:id', [Authenticate], ModuleController.get)

/**
 * @openapi
 * /elearning/modules/{id}:
 *   put:
 *     tags: [Modules Elearning]
 *     summary: Met à jour un module elearning
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Module elearning mis à jour
 */
    .put('/:id', [Authenticate], ModuleController.update)

/**
 * @openapi
 * /elearning/modules/{id}:
 *   delete:
 *     tags: [Modules Elearning]
 *     summary: Supprime un module elearning
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module elearning supprimé
 */
    .delete('/:id', [Authenticate], ModuleController.delete)

export default router
