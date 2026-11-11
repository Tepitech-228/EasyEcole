import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { CursusApprenant } from "../models/CursusApprenant";
import { NiveauEtude } from "../models/NiveauEtude";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Session } from "../models/Session";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { currentAcademicYear, getOriginRoot } from "../../../core/services/DocumentStorageService";

export interface EtudiantUploadIdentity {
    id: number;
    nom: string;
    prenoms: string;
    matricule?: string | null;
}

export interface StudentUploadTreeOptions {
    sessionId?: number | string | null;
    anneeAcademiqueId?: number | string | null;
    etablissementId?: number | string | null;
    demandeId?: number | string | null;
    utilisateurId: number | string;
    typeDemande?: "inscription" | "reinscription" | null;
}

export class EtudiantUploadStorageService {
    private static readonly studentRoot = getOriginRoot("uploads");

    private static safeSegment(value: string, maxLength = 100): string {
        const segment = value
            .normalize("NFC")
            .replace(/[^\p{L}\p{N}._-]+/gu, "_")
            .replace(/^[_\.]+|[_\.]+$/g, "")
            .slice(0, maxLength);
        return segment || "sans_nom";
    }

    private static originalFilename(originalname: string): string {
        const basename = path.posix.basename(originalname.replace(/\\/g, "/"));
        const safeName = basename
            .replace(/[\u0000-\u001f<>:"|?*]/g, "_")
            .replace(/^\.+$/, "")
            .replace(/[. ]+$/g, "_");
        if (!safeName) {
            throw new Error("Nom de fichier original invalide");
        }
        return safeName;
    }

    static async resolveTreeFolders(options: StudentUploadTreeOptions): Promise<string[]> {
        const session = options.sessionId
            ? await Session.findByPk(options.sessionId, {
                include: [
                    { association: Session.associations.anneeAcademique },
                    { association: Session.associations.niveauEtude },
                ],
            })
            : null;
        const cursus = options.typeDemande === "reinscription" || !options.demandeId
            ? await CursusApprenant.findOne({
                where: { utilisateurId: options.utilisateurId },
                include: [
                    CursusApprenant.associations.parcours,
                    CursusApprenant.associations.niveauEtude,
                    CursusApprenant.associations.anneeAcademique,
                ],
                order: [["createdAt", "DESC"]],
            })
            : null;
        let academicYearLabel = session?.anneeAcademique?.libelle?.trim();
        if (!academicYearLabel && options.anneeAcademiqueId) {
            const academicYear = await AnneeAcademique.findByPk(options.anneeAcademiqueId, {
                attributes: ["id", "libelle"],
            });
            academicYearLabel = academicYear?.libelle?.trim();
        }
        if (!academicYearLabel) {
            academicYearLabel = cursus?.anneeAcademique?.libelle?.trim();
        }
        if (!academicYearLabel) {
            academicYearLabel = currentAcademicYear();
        }

        const siteId = options.etablissementId || session?.etablissementId || cursus?.etablissementId;
        if (!siteId) {
            throw new Error(`Site d'inscription introuvable pour l'étudiant ${options.utilisateurId}`);
        }
        const site = await Etablissement.findByPk(siteId, { attributes: ["id", "nom"] });
        if (!site?.nom?.trim()) {
            throw new Error(`Nom du site introuvable pour l'établissement ${siteId}`);
        }

        let parcours: { type?: string | null; titre?: string | null; niveauEtudeId?: number | null } | undefined = cursus?.parcours;
        if (options.demandeId && options.typeDemande !== "reinscription") {
            const choix = await ParcoursChoisi.findAll({
                where: { demandeInscriptionId: options.demandeId },
                include: [ParcoursChoisi.associations.parcours],
            });
            const parcoursFinal = choix.find(item => item.choixFinal)
                || (choix.length === 1 ? choix[0] : undefined);
            parcours = parcoursFinal?.parcours;
        }

        let niveau = session?.niveauEtude?.libelle || cursus?.niveauEtude?.libelle;
        const niveauEtudeId = parcours?.niveauEtudeId || cursus?.niveauEtudeId;
        if (niveauEtudeId) {
            const niveauParcours = await NiveauEtude.findByPk(niveauEtudeId, {
                attributes: ["id", "libelle"],
            });
            niveau = niveauParcours?.libelle || niveau;
        }

        return [
            this.safeSegment(academicYearLabel),
            this.safeSegment(site.nom),
            this.safeSegment(parcours?.type || "Parcours-en-attente"),
            this.safeSegment(niveau || "Niveau-en-attente"),
            this.safeSegment(parcours?.titre || "Filiere-en-attente"),
        ];
    }

    static store(
        file: Express.Multer.File,
        identity: EtudiantUploadIdentity,
        treeFolders: string[],
        category: "Dossiers" | "Bordereaux",
        subfolders: string[] = [],
    ): string {
        const sourcePath = file.path
            ? path.resolve(file.path)
            : path.resolve(process.cwd(), "public", "inscription", "dossiers", file.filename);
        return this.storeSource(sourcePath, file.originalname, identity, treeFolders, category, subfolders, true);
    }

    static copyExisting(
        sourcePath: string,
        identity: EtudiantUploadIdentity,
        treeFolders: string[],
        category: "Dossiers" | "Bordereaux",
        subfolders: string[] = [],
    ): string {
        const resolvedSource = path.resolve(sourcePath);
        return this.storeSource(
            resolvedSource,
            path.basename(resolvedSource),
            identity,
            treeFolders,
            category,
            subfolders,
            false,
        );
    }

    private static storeSource(
        sourcePath: string,
        originalname: string,
        identity: EtudiantUploadIdentity,
        treeFolders: string[],
        category: "Dossiers" | "Bordereaux",
        subfolders: string[],
        removeSource: boolean,
    ): string {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Fichier téléversé introuvable : ${path.basename(sourcePath)}`);
        }

        const studentName = [
            this.safeSegment(identity.nom, 70),
            this.safeSegment(identity.prenoms, 80),
            this.safeSegment(identity.matricule || `ID${identity.id}`, 80),
        ].join("_");
        const studentFolder = path.resolve(
            this.studentRoot,
            ...treeFolders.map(folder => this.safeSegment(folder)),
            "Etudiants",
            studentName,
        );
        if (!studentFolder.startsWith(`${this.studentRoot}${path.sep}`)) {
            throw new Error("Chemin de stockage étudiant invalide");
        }
        for (const sibling of ["Dossier-info-personelles", "Dossiers", "Bordereaux"]) {
            fs.mkdirSync(path.join(studentFolder, sibling), { recursive: true });
        }

        const destinationFolder = path.resolve(
            studentFolder,
            category,
            ...subfolders.map(folder => this.safeSegment(folder)),
        );
        const originalFilename = this.originalFilename(originalname);
        fs.mkdirSync(destinationFolder, { recursive: true });
        const existingVersions = fs.readdirSync(destinationFolder, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => /^Version_(\d+)$/.exec(entry.name))
            .filter((match): match is RegExpExecArray => match !== null)
            .map(match => Number(match[1]));
        if (!removeSource) {
            const sourceHash = createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
            for (const existingVersion of existingVersions) {
                const existingPath = path.join(
                    destinationFolder,
                    `Version_${String(existingVersion).padStart(2, "0")}`,
                    originalFilename,
                );
                if (
                    fs.existsSync(existingPath)
                    && createHash("sha256").update(fs.readFileSync(existingPath)).digest("hex") === sourceHash
                ) {
                    return path.relative(process.cwd(), existingPath).replace(/\\/g, "/");
                }
            }
        }
        let version = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
        let destination = "";
        while (true) {
            const versionFolder = `Version_${String(version).padStart(2, "0")}`;
            destination = path.join(destinationFolder, versionFolder, originalFilename);
            fs.mkdirSync(path.dirname(destination), { recursive: true });
            try {
                fs.copyFileSync(sourcePath, destination, fs.constants.COPYFILE_EXCL);
                break;
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
            }
            version += 1;
        }
        if (removeSource) {
            try {
                fs.unlinkSync(sourcePath);
            } catch (cleanupError) {
                fs.unlinkSync(destination);
                throw cleanupError;
            }
        }
        return path.relative(process.cwd(), destination).replace(/\\/g, "/");
    }

    static removeTemporaryUpload(file: Express.Multer.File): void {
        const candidates = [
            file.path ? path.resolve(file.path) : null,
            file.filename
                ? path.resolve(process.cwd(), "public", "inscription", "dossiers", file.filename)
                : null,
            file.filename
                ? path.resolve(process.cwd(), "public", "inscription", "reinscription", "dossiers", file.filename)
                : null,
            file.filename
                ? path.resolve(process.cwd(), "public", "inscription", "bordereaux", file.filename)
                : null,
        ].filter((candidate): candidate is string => candidate !== null);
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
        }
    }

    static removeStoredFile(reference: string, legacyDirectory?: string): void {
        const publicRoot = path.resolve(process.cwd(), "public");
        const storedPath = path.resolve(process.cwd(), reference);
        const isWithin = (candidate: string, root: string): boolean =>
            candidate.startsWith(`${root}${path.sep}`);
        const isAllowedStoredPath = (candidate: string): boolean =>
            isWithin(candidate, publicRoot) || isWithin(candidate, this.studentRoot);
        const candidates = [
            isAllowedStoredPath(storedPath) ? storedPath : null,
            legacyDirectory
                ? path.resolve(process.cwd(), legacyDirectory, path.basename(reference))
                : null,
        ].filter((candidate): candidate is string => candidate !== null);

        for (const candidate of candidates) {
            if (isAllowedStoredPath(candidate) && fs.existsSync(candidate)) {
                fs.unlinkSync(candidate);
                return;
            }
        }
    }
}
