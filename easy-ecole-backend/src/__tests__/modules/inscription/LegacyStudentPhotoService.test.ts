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
});
