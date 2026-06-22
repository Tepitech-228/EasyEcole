import express from "express"
import ChatController from "../controllers/ChatController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
    .get('/salons', [Authenticate], ChatController.getSalons)
    .post('/salons', [Authenticate], ChatController.createSalon)
    .get('/salons/:id', [Authenticate], ChatController.getSalon)
    .get('/salons/:salonId/messages', [Authenticate], ChatController.getMessages)
    .post('/salons/:salonId/messages', [Authenticate], ChatController.sendMessage)
    .post('/salons/:salonId/participants', [Authenticate], ChatController.ajouterParticipant)

export default router
