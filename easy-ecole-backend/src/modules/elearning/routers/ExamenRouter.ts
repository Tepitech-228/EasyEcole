import crypto from "crypto";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import Authenticate from "../../../core/middlewares/Authenticate";
import ExamenController from "../controllers/ExamenController";

const EXAMEN_DIR = path.resolve(process.cwd(), "public", "elearning", "protected", "examens");
fs.mkdirSync(EXAMEN_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, EXAMEN_DIR),
    filename: (_req, _file, callback) => callback(null, `${Date.now()}-${crypto.randomBytes(10).toString("hex")}.pdf`),
  }),
  fileFilter: (_req, file, callback) => {
    const isPdf = file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf";
    callback(null, isPdf);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = express.Router();
router
  .get("/", [Authenticate], ExamenController.getAll)
  .post("/", [Authenticate, upload.single("sujet")], ExamenController.create)
  .get("/:id/sujet", [Authenticate], ExamenController.sujet)
  .get("/:id/impression", [Authenticate], ExamenController.impression)
  .post("/:id/notes", [Authenticate], ExamenController.noter);

export default router;
