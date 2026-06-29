import express from "express"
import ChatController from "../controllers/ChatController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

/**
 * @openapi
 * /elearning/chat/salons:
 *   get:
 *     tags: [Chat]
 *     summary: Liste tous les salons de chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des salons de chat
 */
router
    .get('/salons', [Authenticate], ChatController.getSalons)

/**
 * @openapi
 * /elearning/chat/salons:
 *   post:
 *     tags: [Chat]
 *     summary: Crée un nouveau salon de chat
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
 *         description: Salon de chat créé
 */
    .post('/salons', [Authenticate], ChatController.createSalon)

/**
 * @openapi
 * /elearning/chat/salons/{id}:
 *   get:
 *     tags: [Chat]
 *     summary: Récupère un salon de chat par ID
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
 *         description: Salon de chat trouvé
 */
    .get('/salons/:id', [Authenticate], ChatController.getSalon)

/**
 * @openapi
 * /elearning/chat/salons/{salonId}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Récupère les messages d'un salon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages du salon
 */
    .get('/salons/:salonId/messages', [Authenticate], ChatController.getMessages)

/**
 * @openapi
 * /elearning/chat/salons/{salonId}/messages:
 *   post:
 *     tags: [Chat]
 *     summary: Envoie un message dans un salon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
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
 *       201:
 *         description: Message envoyé
 */
    .post('/salons/:salonId/messages', [Authenticate], ChatController.sendMessage)

/**
 * @openapi
 * /elearning/chat/salons/{salonId}/participants:
 *   post:
 *     tags: [Chat]
 *     summary: Ajoute un participant à un salon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
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
 *       201:
 *         description: Participant ajouté
 */
    .post('/salons/:salonId/participants', [Authenticate], ChatController.ajouterParticipant)

export default router
