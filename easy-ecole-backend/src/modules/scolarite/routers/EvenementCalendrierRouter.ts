import express from "express"
import EvenementCalendrierController from "../controllers/EvenementCalendrierController"

const router = express.Router()

/**
 * @openapi
 * /scolarite/calendrier:
 *   get:
 *     tags: [Événements du Calendrier]
 *     summary: Liste tous les événements du calendrier
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des événements du calendrier
 */
router
    .get('/', EvenementCalendrierController.getAll)

/**
 * @openapi
 * /scolarite/calendrier:
 *   post:
 *     tags: [Événements du Calendrier]
 *     summary: Crée un nouvel événement du calendrier
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
 *         description: Événement du calendrier créé
 */
    .post('/', EvenementCalendrierController.create)

/**
 * @openapi
 * /scolarite/calendrier/{id}:
 *   get:
 *     tags: [Événements du Calendrier]
 *     summary: Récupère un événement du calendrier par ID
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
 *         description: Événement du calendrier trouvé
 */
    .get('/:id', EvenementCalendrierController.getOne)

/**
 * @openapi
 * /scolarite/calendrier/{id}:
 *   put:
 *     tags: [Événements du Calendrier]
 *     summary: Met à jour un événement du calendrier
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
 *         description: Événement du calendrier mis à jour
 */
    .put('/:id', EvenementCalendrierController.update)

/**
 * @openapi
 * /scolarite/calendrier/{id}:
 *   delete:
 *     tags: [Événements du Calendrier]
 *     summary: Supprime un événement du calendrier
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
 *         description: Événement du calendrier supprimé
 */
    .delete('/:id', EvenementCalendrierController.delete)

export default router
