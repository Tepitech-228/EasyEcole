import * as fs from "fs";
import * as os from "os";
import * as path from "path";

describe("EtudiantUploadStorageService", () => {
    const previousDocumentsRoot = process.env.DOCUMENTS_STORAGE_DIR;
    const testDocumentsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyecole-document-root-"));
    process.env.DOCUMENTS_STORAGE_DIR = testDocumentsRoot;
    const { EtudiantUploadStorageService } = require(
        "../../../modules/inscription/services/EtudiantUploadStorageService",
    ) as typeof import("../../../modules/inscription/services/EtudiantUploadStorageService");
    const { getOriginRoot } = require(
        "../../../core/services/DocumentStorageService",
    ) as typeof import("../../../core/services/DocumentStorageService");
    const temporaryDirectories: string[] = [];
    const studentRoot = path.resolve(
        getOriginRoot("uploads"),
        "2026-2027", "Site", "LICENCE", "L1", "Informatique", "Etudiants",
        "Diallo_Aminata_ESA-123",
    );
    const studentDirectory = path.join(
        studentRoot, "Dossiers", "INSCRIPTION", "DEMANDE_42", "PIECES", "DIPLOME",
    );

    afterEach(() => {
        fs.rmSync(studentRoot, { recursive: true, force: true });
        for (const directory of temporaryDirectories.splice(0)) {
            fs.rmSync(directory, { recursive: true, force: true });
        }
    });

    afterAll(() => {
        if (previousDocumentsRoot === undefined) {
            delete process.env.DOCUMENTS_STORAGE_DIR;
        } else {
            process.env.DOCUMENTS_STORAGE_DIR = previousDocumentsRoot;
        }
        fs.rmSync(testDocumentsRoot, { recursive: true, force: true });
    });

    it("stores an uploaded file under the student folder with its original filename", () => {
        const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "easyecole-upload-"));
        temporaryDirectories.push(temporaryDirectory);
        const temporaryPath = path.join(temporaryDirectory, "generated-random-name.pdf");
        fs.writeFileSync(temporaryPath, "document");

        const reference = EtudiantUploadStorageService.store(
            {
                path: temporaryPath,
                filename: "generated-random-name.pdf",
                originalname: "Relevé de notes.pdf",
            } as Express.Multer.File,
            {
                id: 21,
                nom: "Diallo",
                prenoms: "Aminata",
                matricule: "ESA-123",
            },
            ["2026-2027", "Site", "LICENCE", "L1", "Informatique"],
            "Dossiers",
            ["INSCRIPTION", "DEMANDE_42", "PIECES", "DIPLOME"],
        );

        expect(reference).toContain("Diallo_Aminata_ESA-123");
        expect(reference.replace(/\\/g, "/")).toContain("uploads/2026-2027/Site/LICENCE/L1/Informatique/");
        expect(reference).toContain("/Version_01/Relevé de notes.pdf");
        expect(reference).toContain("/Etudiants/Diallo_Aminata_ESA-123/Dossiers/");
        expect(fs.existsSync(path.join(studentRoot, "Dossier-info-personelles"))).toBe(true);
        expect(fs.existsSync(path.join(studentRoot, "Bordereaux"))).toBe(true);
        expect(fs.readFileSync(path.resolve(process.cwd(), reference), "utf8")).toBe("document");
        expect(fs.existsSync(temporaryPath)).toBe(false);
    });

    it("stores a replacement in the next numbered version folder", () => {
        const previousVersion = path.join(
            studentDirectory,
            "Version_01",
            "Relevé de notes.pdf",
        );
        fs.mkdirSync(path.dirname(previousVersion), { recursive: true });
        fs.writeFileSync(previousVersion, "previous");
        const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "easyecole-upload-"));
        temporaryDirectories.push(temporaryDirectory);
        const temporaryPath = path.join(temporaryDirectory, "another-generated-name.pdf");
        fs.writeFileSync(temporaryPath, "replacement");

        const reference = EtudiantUploadStorageService.store(
            {
                path: temporaryPath,
                filename: "another-generated-name.pdf",
                originalname: "Relevé de notes.pdf",
            } as Express.Multer.File,
            {
                id: 21,
                nom: "Diallo",
                prenoms: "Aminata",
                matricule: "ESA-123",
            },
            ["2026-2027", "Site", "LICENCE", "L1", "Informatique"],
            "Dossiers",
            ["INSCRIPTION", "DEMANDE_42", "PIECES", "DIPLOME"],
        );

        expect(reference).toContain("/Version_02/Relevé de notes.pdf");
        expect(fs.readFileSync(path.resolve(process.cwd(), reference), "utf8")).toBe("replacement");
    });

    it("copies existing files without deleting the source and reuses an identical copy", () => {
        const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "easyecole-upload-migration-"));
        temporaryDirectories.push(temporaryDirectory);
        const sourcePath = path.join(temporaryDirectory, "ancien-nom.pdf");
        fs.writeFileSync(sourcePath, "document historique");

        const options = [
            {
                id: 21,
                nom: "Diallo",
                prenoms: "Aminata",
                matricule: "ESA-123",
            },
            ["2026-2027", "Site", "LICENCE", "L1", "Informatique"],
            "Dossiers" as const,
            ["INSCRIPTION", "DEMANDE_42", "PIECES", "DIPLOME"],
        ] as const;
        const firstReference = EtudiantUploadStorageService.copyExisting(
            sourcePath,
            options[0],
            [...options[1]],
            options[2],
            [...options[3]],
        );
        const secondReference = EtudiantUploadStorageService.copyExisting(
            sourcePath,
            options[0],
            [...options[1]],
            options[2],
            [...options[3]],
        );

        expect(secondReference).toBe(firstReference);
        expect(fs.existsSync(sourcePath)).toBe(true);
        expect(fs.readFileSync(path.resolve(process.cwd(), firstReference), "utf8")).toBe("document historique");
    });

    it("removes a stored student document from the shared uploads root", () => {
        const storedPath = path.join(studentRoot, "Dossiers", "document.pdf");
        fs.mkdirSync(path.dirname(storedPath), { recursive: true });
        fs.writeFileSync(storedPath, "document");

        EtudiantUploadStorageService.removeStoredFile(
            path.relative(process.cwd(), storedPath),
        );

        expect(fs.existsSync(storedPath)).toBe(false);
    });

    it("uses only the basename when an uploaded filename contains path components", () => {
        const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "easyecole-upload-"));
        temporaryDirectories.push(temporaryDirectory);
        const temporaryPath = path.join(temporaryDirectory, "generated-random-name.pdf");
        fs.writeFileSync(temporaryPath, "document");

        const reference = EtudiantUploadStorageService.store(
            {
                path: temporaryPath,
                filename: "generated-random-name.pdf",
                originalname: "../secret.pdf",
            } as Express.Multer.File,
            {
                id: 21,
                nom: "Diallo",
                prenoms: "Aminata",
                matricule: "ESA-123",
            },
            ["2026-2027", "Site", "LICENCE", "L1", "Informatique"],
            "Dossiers",
            ["INSCRIPTION", "DEMANDE_42", "PIECES", "DIPLOME"],
        );

        expect(reference).toMatch(/\/Version_01\/secret\.pdf$/);
        expect(path.resolve(process.cwd(), reference)).toContain(studentDirectory);
    });
});
