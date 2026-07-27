import { Request, Response } from "express";
import path from "path";
import fs from "fs";

const CONFIG_PATH = path.resolve(process.cwd(), "config", "storage.json");

function ensureConfigDir() {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readConfig(): any {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaults = {
      provider: "local",
      basePath: "public/ged",
      options: {}
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function writeConfig(data: any) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

export default class StorageConfigController {

  static async getConfig(req: Request, res: Response): Promise<Response> {
    try {
      const config = readConfig();
      return res.status(200).json(config);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async updateConfig(req: Request, res: Response): Promise<Response> {
    try {
      const current = readConfig();
      const updated = {
        provider: req.body.provider || current.provider,
        basePath: req.body.basePath || current.basePath,
        options: req.body.options || current.options || {}
      };
      writeConfig(updated);
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async testConnection(req: Request, res: Response): Promise<Response> {
    try {
      const { provider, host, port, bucket, accessKey } = req.body;

      if (provider === "local" || !provider) {
        const testPath = path.resolve(process.cwd(), "public/ged");
        const ok = fs.existsSync(testPath);
        return res.status(200).json({
          success: ok,
          message: ok ? "Connexion locale OK" : "Répertoire introuvable"
        });
      }

      // Pour les providers distants (s3, ftp, etc.) — simulation
      return res.status(200).json({
        success: true,
        message: `Connexion à ${provider} simulée avec succès`
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async listLocations(req: Request, res: Response): Promise<Response> {
    try {
      const locations = [
        { code: "local", label: "Stockage local", default: true },
        { code: "s3", label: "Amazon S3", default: false },
        { code: "ftp", label: "Serveur FTP", default: false },
        { code: "webdav", label: "WebDAV", default: false },
        { code: "azure", label: "Azure Blob Storage", default: false },
        { code: "gcs", label: "Google Cloud Storage", default: false }
      ];
      return res.status(200).json(locations);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
