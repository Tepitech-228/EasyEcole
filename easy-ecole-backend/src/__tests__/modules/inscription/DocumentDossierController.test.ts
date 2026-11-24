import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { mockRequest, mockResponse } from "../../helpers/express-mocks";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

jest.mock("fs", () => ({
    ...jest.requireActual("fs"),
    createReadStream: jest.fn(),
}));

jest.mock("../../../modules/inscription/models/DemandeInscriptionDossier", () => ({
    DemandeInscriptionDossier: { findOne: jest.fn() },
}));

jest.mock("../../../modules/inscription/models/DemandeInscription", () => ({
    DemandeInscription: { findByPk: jest.fn() },
}));

describe("DocumentDossierController.download", () => {
    const previousDocumentsRoot = process.env.DOCUMENTS_STORAGE_DIR;
    const testDocumentsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyecole-document-download-"));
    process.env.DOCUMENTS_STORAGE_DIR = testDocumentsRoot;
    const { getOriginRoot } = require(
        "../../../core/services/DocumentStorageService",
    ) as typeof import("../../../core/services/DocumentStorageService");
    const { default: DocumentDossierController } = require(
        "../../../modules/inscription/controllers/DocumentDossierController",
    ) as typeof import("../../../modules/inscription/controllers/DocumentDossierController");
    const { DemandeInscriptionDossier } = require(
        "../../../modules/inscription/models/DemandeInscriptionDossier",
    );
    const { DemandeInscription } = require(
        "../../../modules/inscription/models/DemandeInscription",
    );

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    afterAll(() => {
        if (previousDocumentsRoot === undefined) {
            delete process.env.DOCUMENTS_STORAGE_DIR;
        } else {
            process.env.DOCUMENTS_STORAGE_DIR = previousDocumentsRoot;
        }
        fs.rmSync(testDocumentsRoot, { recursive: true, force: true });
    });

    it("serves a document from the shared uploads root", async () => {
        const filePath = path.join(getOriginRoot("uploads"), "2026-2027", "site", "piece.pdf");
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, "document");

        const reference = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
        const stream = { on: jest.fn().mockReturnThis(), pipe: jest.fn() };
        const createReadStream = fs.createReadStream as jest.MockedFunction<typeof fs.createReadStream>;
        createReadStream.mockReturnValue(stream as unknown as fs.ReadStream);
        DemandeInscription.findByPk.mockResolvedValue({ utilisateurId: 12 });
        DemandeInscriptionDossier.findOne.mockResolvedValue({ nomFichier: reference });

        const req = mockRequest({
            query: { demandeId: "7", dossierId: "3" },
            utilisateurRole: RolesUtilisateur.SECRETAIRE,
        } as any);
        const res = Object.assign(mockResponse(), { removeHeader: jest.fn() });

        await DocumentDossierController.download(req, res);

        expect(createReadStream).toHaveBeenCalledWith(filePath);
        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
        expect(stream.pipe).toHaveBeenCalledWith(res);
    });

    it("serves legacy flat documents from public/dossiers", async () => {
        const previousCwd = process.cwd();
        const legacyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyecole-legacy-documents-"));
        process.chdir(legacyRoot);
        const legacyDirectory = path.resolve(process.cwd(), "public", "dossiers");
        const legacyFilename = "legacy-document.pdf";
        const filePath = path.join(legacyDirectory, legacyFilename);
        fs.mkdirSync(legacyDirectory, { recursive: true });
        fs.writeFileSync(filePath, "legacy document");

        const stream = { on: jest.fn().mockReturnThis(), pipe: jest.fn() };
        const createReadStream = fs.createReadStream as jest.MockedFunction<typeof fs.createReadStream>;
        createReadStream.mockReturnValue(stream as unknown as fs.ReadStream);
        DemandeInscription.findByPk.mockResolvedValue({ utilisateurId: 12 });
        DemandeInscriptionDossier.findOne.mockResolvedValue({ nomFichier: legacyFilename });

        const req = mockRequest({
            query: { demandeId: "7", dossierId: "3" },
            utilisateurRole: RolesUtilisateur.SECRETAIRE,
        } as any);
        const res = Object.assign(mockResponse(), { removeHeader: jest.fn() });

        try {
            await DocumentDossierController.download(req, res);

            expect(createReadStream).toHaveBeenCalledWith(filePath);
            expect(stream.pipe).toHaveBeenCalledWith(res);
        } finally {
            process.chdir(previousCwd);
            fs.rmSync(legacyRoot, { recursive: true, force: true });
        }
    });
});
