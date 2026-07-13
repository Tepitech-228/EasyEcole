import express from "express"

import BlocCahierDeTexteController from "../controllers/BlocCahierDeTexteController"

const router = express.Router()

/**
 * @openapi
 * /inscription/blocsCahierDeTexte:
 *   get:
 *     tags: [Blocs Cahier de Texte]
 *     summary: Liste tous les blocs de cahier de texte
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des blocs de cahier de texte
 */
router
    .get('/', BlocCahierDeTexteController.getAllBlocsCahierDeTextes)

/**
 * @openapi
 * /inscription/blocsCahierDeTexte:
 *   post:
 *     tags: [Blocs Cahier de Texte]
 *     summary: Crée un nouveau bloc de cahier de texte
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
 *         description: Bloc de cahier de texte créé
 */
    .post('/', [], BlocCahierDeTexteController.createBlocCahierDeTexte)

/**
 * @openapi
 * /inscription/blocsCahierDeTexte/{id}:
 *   get:
 *     tags: [Blocs Cahier de Texte]
 *     summary: Récupère un bloc de cahier de texte par ID
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
 *         description: Bloc de cahier de texte trouvé
 */
    .get('/:id', BlocCahierDeTexteController.getBlocCahierDeTexte)

/**
 * @openapi
 * /inscription/blocsCahierDeTexte/{id}:
 *   put:
 *     tags: [Blocs Cahier de Texte]
 *     summary: Met à jour un bloc de cahier de texte
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
 *         description: Bloc de cahier de texte mis à jour
 */
    .put('/:id', [], BlocCahierDeTexteController.updateBlocCahierDeTexte)

/**
 * @openapi
 * /inscription/blocsCahierDeTexte/{id}:
 *   delete:
 *     tags: [Blocs Cahier de Texte]
 *     summary: Supprime un bloc de cahier de texte
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
 *         description: Bloc de cahier de texte supprimé
 */
    .delete('/:id', [], BlocCahierDeTexteController.deleteBlocCahierDeTexte)

/**
 * @openapi
 * /inscription/blocsCahierDeTexte/statistics/count:
 *   get:
 *     tags: [Blocs Cahier de Texte]
 *     summary: Compte le nombre de blocs de cahier de texte
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de blocs de cahier de texte
 */
    .get('/statistics/count', [], BlocCahierDeTexteController.getCount)

export default router