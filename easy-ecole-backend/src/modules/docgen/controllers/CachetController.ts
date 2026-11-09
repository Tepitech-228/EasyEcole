import { Request, Response } from "express";
import { DocGenCachet } from "../models/DocGenCachet";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  resolveStoredDocumentPath,
  saveDocument,
} from "../../../core/services/DocumentStorageService";

const CACHET_DIR = "public/docgen/cachets";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Format non supporté'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default class CachetController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const cachets = await DocGenCachet.findAll({ order: [['createdAt', 'DESC']] });
      return res.status(200).json(cachets);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getActive(req: Request, res: Response): Promise<Response> {
    try {
      const cachet = await DocGenCachet.findOne({ where: { isActive: true } });
      if (!cachet) return res.status(404).json({ success: false, message: 'Aucun cachet actif' });
      return res.status(200).json(cachet);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async upload(req: Request, res: Response): Promise<Response> {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
      const ext = path.extname(file.originalname).toLowerCase();
      const saved = saveDocument(file.buffer, {
        origin: 'created',
        category: 'docgen',
        subcategory: 'cachets',
        fileName: `cachet_${Date.now()}${ext}`,
      });
      const cachet = await DocGenCachet.create({
        libelle: req.body.libelle || file.originalname,
        imagePath: saved.relativePath,
      });
      return res.status(201).json(cachet);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const cachet = await DocGenCachet.findByPk(req.params.id);
      if (!cachet) return res.status(404).json({ success: false, message: 'Cachet non trouvé' });
      await cachet.update(req.body);
      return res.status(200).json(cachet);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async setActive(req: Request, res: Response): Promise<Response> {
    try {
      const cachet = await DocGenCachet.findByPk(req.params.id);
      if (!cachet) return res.status(404).json({ success: false, message: 'Cachet non trouvé' });
      await DocGenCachet.update({ isActive: false }, { where: { isActive: true } });
      await cachet.update({ isActive: true });
      return res.status(200).json(cachet);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const cachet = await DocGenCachet.findByPk(req.params.id);
      if (!cachet) return res.status(404).json({ success: false, message: 'Cachet non trouvé' });
      const filePath = resolveStoredDocumentPath(cachet.imagePath, [
        path.resolve(process.cwd(), CACHET_DIR),
      ]);
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await cachet.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
