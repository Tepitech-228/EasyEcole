import fs from "fs";
import crypto from "crypto";
import path from "path";
import { DocumentGed } from "../../modules/ged/models/DocumentGed";
import { StorageFactory } from "./storage/StorageFactory";

export class IntegrityService {
  static calculateHash(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  static async calculateHashFromFile(filePath: string): Promise<string> {
    const fullPath = path.resolve(process.cwd(), filePath);
    const buffer = fs.readFileSync(fullPath);
    return this.calculateHash(buffer);
  }

  static async verifyIntegrity(document: DocumentGed): Promise<boolean> {
    if (!document.integrityHash) {
      return false;
    }

    try {
      const storage = StorageFactory.getStorage();
      const buffer = await storage.retrieve(document.fichier);
      const currentHash = this.calculateHash(buffer);
      return currentHash === document.integrityHash;
    } catch (err) {
      // Fichier introuvable / illisible : l'intégrité ne peut PAS être confirmée.
      // Renvoyer false est correct métier, mais la cause doit être traçable
      // (sinon une panne de stockage passerait pour une altération du document).
      console.error(`[INTEGRITY] vérification impossible pour le document #${document.id} (${document.fichier}):`,
        err instanceof Error ? err.message : err);
      return false;
    }
  }

  static async verifyAllDocuments(): Promise<{
    valid: number;
    invalid: number;
    errors: any[];
  }> {
    const result = { valid: 0, invalid: 0, errors: [] as any[] };
    const all = await DocumentGed.findAll();
    const documents = all.filter((d) => d.integrityHash != null);

    for (const doc of documents) {
      try {
        const isValid = await this.verifyIntegrity(doc);
        if (isValid) {
          result.valid++;
        } else {
          result.invalid++;
          result.errors.push({
            documentId: doc.id,
            reference: doc.reference,
            error: "Hash mismatch",
          });
        }
      } catch (err: any) {
        result.invalid++;
        result.errors.push({
          documentId: doc.id,
          reference: doc.reference,
          error: err.message,
        });
      }
    }

    return result;
  }
}
