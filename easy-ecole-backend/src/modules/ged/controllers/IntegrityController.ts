import { Request, Response } from "express";
import { DocumentGed } from "../models/DocumentGed";
import BackupRecord from "../models/BackupRecord";
import { AuditService } from "../../../core/services/AuditService";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Op, Sequelize } from "sequelize";
import { GED_CONFIG } from "../../../core/config/GedConfig";

const UPLOAD_DIR = GED_CONFIG.UPLOAD_DIR;

function computeHash(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buffer).digest("hex");
  } catch {
    return null;
  }
}

export default class IntegrityController {

  static async verifyDocument(req: Request, res: Response): Promise<Response> {
    try {
      const document = await DocumentGed.findByPk(req.params.id);
      if (!document) {
        return res.status(404).json({ success: false, message: "Document non trouvé" });
      }

      const filePath = path.resolve(process.cwd(), UPLOAD_DIR, document.fichier);
      const currentHash = computeHash(filePath);
      const storedHash = document.integrityHash;

      const valid = currentHash !== null && currentHash === storedHash;

      await AuditService.log(document.id, (req as any).utilisateurId, "verification_integrite", {
        valid,
        storedHash,
        currentHash
      });

      return res.status(200).json({
        documentId: document.id,
        titre: document.titre,
        valid,
        storedHash,
        currentHash,
        fileExists: currentHash !== null
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async verifyAll(req: Request, res: Response): Promise<Response> {
    try {
      const documents = await DocumentGed.findAll({
        where: Sequelize.where(
          Sequelize.col("integrityHash"),
          Op.ne,
          null
        ) as any,
        attributes: ["id", "titre", "fichier", "integrityHash"]
      });

      const results: any[] = [];
      let validCount = 0;
      let invalidCount = 0;
      let missingCount = 0;

      for (const doc of documents) {
        const filePath = path.resolve(process.cwd(), UPLOAD_DIR, doc.fichier);
        const currentHash = computeHash(filePath);
        const valid = currentHash !== null && currentHash === doc.integrityHash;

        results.push({
          documentId: doc.id,
          titre: doc.titre,
          valid,
          fileExists: currentHash !== null
        });

        if (!currentHash) missingCount++;
        else if (valid) validCount++;
        else invalidCount++;
      }

      return res.status(200).json({
        total: documents.length,
        validCount,
        invalidCount,
        missingCount,
        details: results
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async backup(req: Request, res: Response): Promise<Response> {
    try {
      const documents = await DocumentGed.findAll({ attributes: ["id", "titre", "fichier", "taille"] });

      const backupDir = path.resolve(process.cwd(), "backups", `ged_${Date.now()}`);
      fs.mkdirSync(backupDir, { recursive: true });

      const manifest: any[] = [];
      let totalSize = 0;

      for (const doc of documents) {
        const srcPath = path.resolve(process.cwd(), UPLOAD_DIR, doc.fichier);
        if (fs.existsSync(srcPath)) {
          const destPath = path.resolve(backupDir, String(doc.id) + "_" + path.basename(doc.fichier));
          fs.copyFileSync(srcPath, destPath);
          const stat = fs.statSync(destPath);
          totalSize += stat.size;
          manifest.push({ id: doc.id, titre: doc.titre, fichier: doc.fichier, copied: true });
        } else {
          manifest.push({ id: doc.id, titre: doc.titre, fichier: doc.fichier, copied: false });
        }
      }

      fs.writeFileSync(path.resolve(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2));

      const record = await BackupRecord.create({
        path: backupDir,
        totalDocuments: documents.length,
        totalSize,
        status: "completed",
        startedBy: (req as any).utilisateurId,
        completedAt: new Date()
      });

      return res.status(201).json(record);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async listBackups(req: Request, res: Response): Promise<Response> {
    try {
      const backups = await BackupRecord.findAll({
        order: [["createdAt", "DESC"]]
      });
      return res.status(200).json(backups);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async restoreBackup(req: Request, res: Response): Promise<Response> {
    try {
      const record = await BackupRecord.findByPk(req.params.id);
      if (!record) {
        return res.status(404).json({ success: false, message: "Backup non trouvé" });
      }

      const backupDir = record.path;
      if (!fs.existsSync(backupDir)) {
        return res.status(404).json({ success: false, message: "Répertoire de backup introuvable" });
      }

      const manifestPath = path.resolve(backupDir, "manifest.json");
      if (!fs.existsSync(manifestPath)) {
        return res.status(404).json({ success: false, message: "Manifeste de backup introuvable" });
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      let restored = 0;

      for (const entry of manifest) {
        if (!entry.copied) continue;
        const srcPath = path.resolve(backupDir, String(entry.id) + "_" + path.basename(entry.fichier));
        const destPath = path.resolve(process.cwd(), UPLOAD_DIR, entry.fichier);
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          restored++;
        }
      }

      await record.update({ status: "restored" });

      return res.status(200).json({
        success: true,
        message: `Restauration terminée : ${restored}/${manifest.length} fichiers restaurés`,
        totalManifest: manifest.length,
        restored
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
