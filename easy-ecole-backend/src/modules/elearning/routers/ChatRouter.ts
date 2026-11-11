import { NextFunction, Request, Response, Router } from "express";
import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import path from "path";
import ChatController from "../controllers/ChatController";
import Authenticate from "../../../core/middlewares/Authenticate";

const ChatRouter = Router();
const CHAT_MEDIA_DIR = path.resolve(process.cwd(), "public", "elearning", "protected", "chat");
fs.mkdirSync(CHAT_MEDIA_DIR, { recursive: true });

const allowedMediaTypes: Record<string, string[]> = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
  ".gif": ["image/gif"],
  ".mp4": ["video/mp4"],
  ".webm": ["video/webm"],
  ".mov": ["video/quicktime"],
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, CHAT_MEDIA_DIR),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${extension}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, allowedMediaTypes[extension]?.includes(file.mimetype) === true);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

function uploadSingleMedia(req: Request, res: Response, next: NextFunction): void {
  mediaUpload.single("media")(req, res, error => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ success: false, message: "Le fichier ne doit pas dépasser 50 Mo." });
      return;
    }
    res.status(400).json({ success: false, message: "Format de fichier non pris en charge." });
  });
}

ChatRouter.get('/mes-salons', [Authenticate], ChatController.getMesSalons);
ChatRouter.get('/salons', [Authenticate], ChatController.getSalons);
ChatRouter.post('/salons', [Authenticate], ChatController.createSalon);
ChatRouter.get('/salons/:id', [Authenticate], ChatController.getSalon);
ChatRouter.get('/salons/:salonId/messages', [Authenticate], ChatController.getMessages);
ChatRouter.post('/salons/:salonId/messages', [Authenticate, uploadSingleMedia], ChatController.sendMessage);
ChatRouter.get('/salons/:salonId/messages/:msgId/media', [Authenticate], ChatController.downloadMedia);
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
