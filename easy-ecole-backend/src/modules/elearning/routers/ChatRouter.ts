import { Router } from "express";
import ChatController from "../controllers/ChatController";
import Authenticate from "../../../core/middlewares/Authenticate";

const ChatRouter = Router();

ChatRouter.get('/mes-salons', [Authenticate], ChatController.getMesSalons);
ChatRouter.get('/salons', [Authenticate], ChatController.getSalons);
ChatRouter.post('/salons', [Authenticate], ChatController.createSalon);
ChatRouter.get('/salons/:id', [Authenticate], ChatController.getSalon);
ChatRouter.get('/salons/:salonId/messages', [Authenticate], ChatController.getMessages);
ChatRouter.post('/salons/:salonId/messages', [Authenticate], ChatController.sendMessage);
ChatRouter.put('/salons/:salonId/messages/:msgId', [Authenticate], ChatController.updateMessage);
ChatRouter.delete('/salons/:salonId/messages/:msgId', [Authenticate], ChatController.deleteMessage);
ChatRouter.post('/salons/:salonId/participants', [Authenticate], ChatController.ajouterParticipant);
ChatRouter.get('/salons/:id/participants', [Authenticate], ChatController.getParticipants);
ChatRouter.post('/salons/:id/inviter', [Authenticate], ChatController.inviterSalon);
ChatRouter.post('/salons/rejoindre/:code', [Authenticate], ChatController.rejoindreSalon);
ChatRouter.put('/salons/:id/participants/:userId/role', [Authenticate], ChatController.updateParticipantRole);
ChatRouter.delete('/salons/:id/participants/:userId', [Authenticate], ChatController.removeParticipant);
ChatRouter.put('/salons/:id/messages/seen', [Authenticate], ChatController.marquerLu);
ChatRouter.get('/salons/:id/non-lues', [Authenticate], ChatController.getNonLues);

export default ChatRouter;
