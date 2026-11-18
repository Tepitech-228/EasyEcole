import fs from "fs";
import os from "os";
import path from "path";
import LegacyStudentPhotoService from "../../../modules/inscription/services/LegacyStudentPhotoService";

describe("LegacyStudentPhotoService", () => {
  let photoDirectory: string;

  beforeEach(() => {
    photoDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "easy-ecole-legacy-students-"));
  });

  afterEach(() => {
    fs.rmSync(photoDirectory, { recursive: true, force: true });
  });

  it("finds a legacy student photo by full name while ignoring accents and filename spacing", async () => {
    fs.writeFileSync(path.join(photoDirectory, "Doe Jane.jpg"), "");

    await expect(LegacyStudentPhotoService.findByStudentName("DOE", "Jánë", photoDirectory))
      .resolves.toBe("Doe Jane.jpg");
  });

  it("does not choose a photo when multiple files match the same student name", async () => {
    fs.writeFileSync(path.join(photoDirectory, "Doe Jane.jpg"), "");
    fs.writeFileSync(path.join(photoDirectory, "Jane Doe.png"), "");

    await expect(LegacyStudentPhotoService.findByStudentName("Doe", "Jane", photoDirectory))
      .resolves.toBeNull();
  });

  it("resolves a hash-named legacy photo using the stored database reference", async () => {
    fs.writeFileSync(path.join(photoDirectory, "a1b2c3d4e5f6"), "photo");

    await expect(LegacyStudentPhotoService.resolvePhotoReference(
      "uploads/legacy/auth/etudiants/a1b2c3d4e5f6",
      photoDirectory,
    )).resolves.toBe("a1b2c3d4e5f6");
  });

  it("does not resolve a path whose file is outside the legacy photo folder", async () => {
    const outsideDirectory = path.join(photoDirectory, "outside");
    fs.mkdirSync(outsideDirectory);
    fs.writeFileSync(path.join(outsideDirectory, "a1b2c3d4e5f6"), "photo");

    await expect(LegacyStudentPhotoService.resolvePhotoReference(
      "outside/a1b2c3d4e5f6",
      photoDirectory,
    )).resolves.toBeNull();
  });
});
