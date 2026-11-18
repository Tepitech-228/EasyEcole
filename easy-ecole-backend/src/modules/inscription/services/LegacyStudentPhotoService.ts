import fs from "fs";
import path from "path";
import { getDocumentsRoot } from "../../../core/services/DocumentStorageService";

const PHOTO_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const PHOTO_INDEX_TTL_MS = 60_000;

function normaliserNom(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export default class LegacyStudentPhotoService {
  private static readonly photoIndexes = new Map<string, {
    expiresAt: number;
    filesByName: Map<string, string[]>;
  }>();

  private static getPhotoDirectory(): string {
    return path.join(getDocumentsRoot(), "uploads", "legacy", "auth", "etudiants");
  }

  static getLegacyPhotoDirectory(): string {
    return LegacyStudentPhotoService.getPhotoDirectory();
  }

  static async resolvePhotoReference(
    photoReference: string | null | undefined,
    photoDirectory: string = LegacyStudentPhotoService.getPhotoDirectory()
  ): Promise<string | null> {
    if (!photoReference?.trim()) return null;
    const filename = path.basename(photoReference.trim().replace(/\\/g, "/"));
    if (!filename || filename === "." || filename === "..") return null;
    const sourcePath = path.join(photoDirectory, filename);
    try {
      const stats = await fs.promises.stat(sourcePath);
      return stats.isFile() ? filename : null;
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        console.error("[LegacyStudentPhotoService] Impossible de vérifier une référence photo :", error);
      }
      return null;
    }
  }

  static async findByStudentName(
    nom: string,
    prenoms: string,
    photoDirectory: string = LegacyStudentPhotoService.getPhotoDirectory()
  ): Promise<string | null> {
    const nomNormalise = normaliserNom(nom);
    const prenomsNormalises = normaliserNom(prenoms);
    if (!nomNormalise || !prenomsNormalises) return null;

    try {
      let index = LegacyStudentPhotoService.photoIndexes.get(photoDirectory);
      if (!index || index.expiresAt <= Date.now()) {
        const files = await fs.promises.readdir(photoDirectory, { withFileTypes: true });
        const filesByName = new Map<string, string[]>();
        for (const file of files) {
          if (!file.isFile() || !PHOTO_EXTENSIONS.has(path.extname(file.name).toLowerCase())) continue;
          const normalizedFileName = normaliserNom(path.basename(file.name, path.extname(file.name)));
          if (!normalizedFileName) continue;
          const matches = filesByName.get(normalizedFileName) || [];
          matches.push(file.name);
          filesByName.set(normalizedFileName, matches);
        }
        index = { expiresAt: Date.now() + PHOTO_INDEX_TTL_MS, filesByName };
        LegacyStudentPhotoService.photoIndexes.set(photoDirectory, index);
      }

      const nameCandidates = new Set([
        `${nomNormalise}${prenomsNormalises}`,
        `${prenomsNormalises}${nomNormalise}`,
      ]);
      const matches = [...nameCandidates]
        .flatMap(candidate => index!.filesByName.get(candidate) || []);
      return matches.length === 1 ? matches[0] : null;
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        console.error("[LegacyStudentPhotoService] Impossible de rechercher une photo étudiante :", error);
      }
      return null;
    }
  }
}
