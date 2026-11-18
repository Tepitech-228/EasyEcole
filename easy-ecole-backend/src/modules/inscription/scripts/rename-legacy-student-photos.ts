import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import LegacyStudentPhotoService from "../services/LegacyStudentPhotoService";
import { EtudiantUploadStorageService } from "../services/EtudiantUploadStorageService";

type PhotoReference = {
    model: "dossier" | "apprenant" | "utilisateur";
    id: number;
    value: string;
};

type PhotoUsage = {
    ownerIds: Set<number>;
    references: PhotoReference[];
};

type RenamePlan = {
    sourceFilename: string;
    sourcePath: string;
    destinationFilename: string;
    destinationPath: string;
    references: PhotoReference[];
};

const applyChanges = process.argv.includes("--apply");
const usageByFilename = new Map<string, PhotoUsage>();
let renamed = 0;
let skipped = 0;
const failures: string[] = [];

function referenceWithFilename(reference: string, filename: string): string {
    const normalized = reference.replace(/\\/g, "/");
    const directory = path.posix.dirname(normalized);
    return directory === "." ? filename : `${directory}/${filename}`;
}

function withSuffix(filename: string, suffix: number): string {
    const extension = path.extname(filename);
    const basename = path.basename(filename, extension);
    return `${basename}_${suffix}${extension}`;
}

function addPhotoUsage(filename: string, ownerId: number, reference: PhotoReference): void {
    const usage = usageByFilename.get(filename) || {
        ownerIds: new Set<number>(),
        references: [],
    };
    usage.ownerIds.add(ownerId);
    usage.references.push(reference);
    usageByFilename.set(filename, usage);
}

async function collectPhotoUsages(legacyDirectory: string): Promise<void> {
    const [students, dossiers] = await Promise.all([
        Utilisateur.findAll({
            where: { role: RolesUtilisateur.APPRENANT },
            attributes: ["id", "nom", "prenoms", "identifiant", "photoDeProfil"],
            include: [{
                association: Utilisateur.associations.apprenant,
                attributes: ["id", "photo", "matriculeEtudiant"],
            }],
        }),
        DossierEtudiant.findAll({
            attributes: ["id", "utilisateurId", "photo", "matricule", "updatedAt"],
            order: [["updatedAt", "DESC"]],
        }),
    ]);

    const dossiersByStudent = new Map<number, DossierEtudiant[]>();
    for (const dossier of dossiers) {
        const ownerId = Number(dossier.utilisateurId);
        const studentDossiers = dossiersByStudent.get(ownerId) || [];
        studentDossiers.push(dossier);
        dossiersByStudent.set(ownerId, studentDossiers);
    }

    for (const student of students) {
        const ownerId = Number(student.id);
        const studentDossiers = dossiersByStudent.get(ownerId) || [];
        const references: PhotoReference[] = [
            ...studentDossiers
                .filter(dossier => Boolean(dossier.photo?.trim()))
                .map(dossier => ({
                    model: "dossier" as const,
                    id: Number(dossier.id),
                    value: dossier.photo,
                })),
            ...(student.apprenant?.photo?.trim()
                ? [{
                    model: "apprenant" as const,
                    id: Number(student.apprenant.id),
                    value: student.apprenant.photo,
                }]
                : []),
            ...(student.photoDeProfil?.trim()
                ? [{
                    model: "utilisateur" as const,
                    id: ownerId,
                    value: student.photoDeProfil,
                }]
                : []),
        ];

        for (const reference of references) {
            const filename = await LegacyStudentPhotoService.resolvePhotoReference(
                reference.value,
                legacyDirectory,
            );
            if (filename) addPhotoUsage(filename, ownerId, reference);
        }
    }
}

async function buildRenamePlans(legacyDirectory: string): Promise<RenamePlan[]> {
    const plans: RenamePlan[] = [];
    const reservedDestinations = new Set<string>();

    for (const [sourceFilename, usage] of usageByFilename) {
        if (usage.ownerIds.size !== 1) {
            console.warn(
                `[AMBIGU] ${sourceFilename} est référencée par ${usage.ownerIds.size} étudiants; fichier ignoré.`,
            );
            skipped++;
            continue;
        }

        const ownerId = [...usage.ownerIds][0];
        const student = await Utilisateur.findByPk(ownerId, {
            attributes: ["id", "nom", "prenoms", "identifiant"],
        });
        if (!student) {
            skipped++;
            continue;
        }

        const studentDossiers = await DossierEtudiant.findAll({
            where: { utilisateurId: ownerId },
            attributes: ["matricule", "updatedAt"],
            order: [["updatedAt", "DESC"]],
        });
        const learner = await Apprenant.findOne({
            where: { utilisateurId: ownerId },
            attributes: ["matriculeEtudiant"],
        });
        const identity = {
            id: ownerId,
            nom: student.nom,
            prenoms: student.prenoms,
            matricule: studentDossiers[0]?.matricule || learner?.matriculeEtudiant || student.identifiant,
        };
        const sourcePath = path.join(legacyDirectory, sourceFilename);
        const desiredFilename = EtudiantUploadStorageService.getStudentPhotoFilename(
            sourcePath,
            identity,
        );
        let destinationFilename = desiredFilename;
        let suffix = 2;
        while (
            (fs.existsSync(path.join(legacyDirectory, destinationFilename))
                && destinationFilename !== sourceFilename)
            || reservedDestinations.has(destinationFilename.toLowerCase())
        ) {
            destinationFilename = withSuffix(desiredFilename, suffix++);
        }
        reservedDestinations.add(destinationFilename.toLowerCase());

        plans.push({
            sourceFilename,
            sourcePath,
            destinationFilename,
            destinationPath: path.join(legacyDirectory, destinationFilename),
            references: usage.references,
        });
    }

    return plans;
}

async function updateReferences(
    sequelize: ReturnType<typeof DatabaseConnection.getInstance>["sequelize"],
    plan: RenamePlan,
): Promise<void> {
    await sequelize.transaction(async transaction => {
        for (const reference of plan.references) {
            const newValue = referenceWithFilename(reference.value, plan.destinationFilename);
            if (reference.value === newValue) continue;

            if (reference.model === "dossier") {
                await DossierEtudiant.update(
                    { photo: newValue },
                    { where: { id: reference.id }, transaction },
                );
            } else if (reference.model === "apprenant") {
                await Apprenant.update(
                    { photo: newValue },
                    { where: { id: reference.id }, transaction },
                );
            } else {
                await Utilisateur.update(
                    { photoDeProfil: newValue },
                    { where: { id: reference.id }, transaction },
                );
            }
        }
    });
}

async function main(): Promise<void> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    try {
        require("../../auth/models/_associations");
        require("../models/_associations");
        await sequelize.authenticate();

        const legacyDirectory = process.env.LEGACY_STUDENT_PHOTO_DIRECTORY?.trim()
            ? path.resolve(process.env.LEGACY_STUDENT_PHOTO_DIRECTORY)
            : path.resolve(process.cwd(), "public", "auth", "apprenants", "photos");
        await fs.promises.access(legacyDirectory);
        await collectPhotoUsages(legacyDirectory);
        const plans = await buildRenamePlans(legacyDirectory);

        console.log(applyChanges
            ? "Renommage des photos legacy : MODE APPLICATION."
            : "Renommage des photos legacy : aperçu uniquement. Ajoutez --apply pour appliquer.");
        console.log(`Dossier des photos : ${legacyDirectory}`);
        for (const plan of plans) {
            if (plan.sourceFilename === plan.destinationFilename) {
                console.log(`DÉJÀ NOMMÉ ${plan.sourceFilename}`);
                skipped++;
                continue;
            }

            if (!applyChanges) {
                console.log(
                    `À RENOMMER ${plan.sourceFilename} -> ${plan.destinationFilename} `
                    + `(${plan.references.length} référence(s) en base)`,
                );
                renamed++;
                continue;
            }

            let destinationCreated = false;
            try {
                fs.copyFileSync(plan.sourcePath, plan.destinationPath, fs.constants.COPYFILE_EXCL);
                destinationCreated = true;
                try {
                    await updateReferences(sequelize, plan);
                } catch (error) {
                    fs.unlinkSync(plan.destinationPath);
                    destinationCreated = false;
                    throw error;
                }
                try {
                    fs.unlinkSync(plan.sourcePath);
                } catch (error) {
                    const message = `${plan.sourceFilename}: références mises à jour, mais l'original n'a pas pu être supprimé : `
                        + `${error instanceof Error ? error.message : String(error)}`;
                    failures.push(message);
                    console.error(`[ÉCHEC] ${message}`);
                    destinationCreated = false;
                    continue;
                }
                console.log(
                    `RENOMMÉ ${plan.sourceFilename} -> ${plan.destinationFilename} `
                    + `(${plan.references.length} référence(s) mise(s) à jour)`,
                );
                renamed++;
            } catch (error) {
                if (destinationCreated && fs.existsSync(plan.destinationPath)) {
                    fs.unlinkSync(plan.destinationPath);
                }
                const message = `${plan.sourceFilename}: ${error instanceof Error ? error.message : String(error)}`;
                failures.push(message);
                console.error(`[ÉCHEC] ${message}`);
            }
        }

        console.log(
            `Terminé : ${renamed} photo(s) ${applyChanges ? "renommée(s)" : "à renommer"}, `
            + `${skipped} ignorée(s), ${failures.length} erreur(s).`,
        );
        if (renamed === 0 && failures.length === 0) {
            console.log("Aucune photo legacy à renommer; les photos référencées sont déjà nommées ou non associables.");
        }
        if (failures.length > 0) process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

main().catch(error => {
    console.error("[MIGRATION][FATALE]", error);
    process.exitCode = 1;
});
