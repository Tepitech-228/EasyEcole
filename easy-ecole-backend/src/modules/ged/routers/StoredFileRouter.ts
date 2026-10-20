import express from "express";
import multer from "multer";
import Authenticate from "../../../core/middlewares/Authenticate";
import StoredFileController from "../controllers/StoredFileController";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 }
});

router.get("/", Authenticate, StoredFileController.list);
router.get("/options", Authenticate, StoredFileController.options);
router.get("/export", Authenticate, StoredFileController.exportCsv);
router.post("/", Authenticate, upload.single("file"), StoredFileController.upload);
router.get("/:id/content", Authenticate, StoredFileController.content);
router.get("/:id/verify", Authenticate, StoredFileController.verify);

export default router;
