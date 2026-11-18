import "dotenv/config";
import * as path from "path";
import { Op } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import LegacyStudentPhotoService from "../services/LegacyStudentPhotoService";
import { EtudiantUploadStorageService } from "../services/EtudiantUploadStorageService";
import { DossierEtudiant } from "../models/DossierEtudiant";

const applyChanges = process.argv.includes("--apply");
const legacyDirectory = process.env.LEGACY_STUDENT_PHOTO_DIRECTORY?.trim()
    ? path.resolve(process.env.LEGACY_STUDENT_PHOTO_DIRECTORY)
    : LegacyStudentPhotoService.getLegacyPhotoDirectory();
let copied = 0;
let skipped = 0;
const failures: string[] = [];

async function main(): Promise<void> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    try {
        require("../../auth/models/_associations");
        require("../models/_associations");
        await sequelize.authenticate();

        const [students, dossiers] = await Promise.all([
            Utilisateur.findAll({
                where: { role: RolesUtilisateur.APPRENANT },
                attributes: ["id", "nom", "prenoms", "identifiant", "etablissementId", "photoDeProfil"],
                include: [{
                    association: Utilisateur.associations.apprenant,
                    attributes: ["photo", "matriculeEtudiant"],
                }],
            }),
            DossierEtudiant.findAll({
                where: { photo: { [Op.ne]: "" } },
                attributes: ["utilisateurId", "photo", "matricule", "etablissementId", "updatedAt"],
                order: [["updatedAt", "DESC"]],
            }),
        ]);
        const dossiersByStudent = new Map<number, DossierEtudiant[]>();
        for (const dossier of dossiers) {
            const studentId = Number(dossier.utilisateurId);
            const studentDossiers = dossiersByStudent.get(studentId) || [];
            studentDossiers.push(dossier);
            dossiersByStudent.set(studentId, studentDossiers);
        }

        console.log(applyChanges
            ? "Copie des anciennes photos étudiantes : MODE APPLICATION (les originaux sont conservés)."
            : "Copie des anciennes photos étudiantes : aperçu uniquement. Ajoutez --apply pour copier.");
        console.log(`Dossier source des photos : ${legacyDirectory}`);

        for (const student of students) {
            try {
                const studentDossiers = dossiersByStudent.get(Number(student.id)) || [];
                const learner = student.apprenant;
                const photoReferences = [
                    ...studentDossiers.map(dossier => dossier.photo),
                    learner?.photo,
                    student.photoDeProfil,
                ].filter((reference): reference is string => Boolean(reference?.trim()));

                let sourcePath: string | null = null;
                for (const reference of photoReferences) {
                    const filename = await LegacyStudentPhotoService.resolvePhotoReference(
                        reference,
                        legacyDirectory,
                    );
                    if (filename) {
                        sourcePath = path.join(legacyDirectory, filename);
                        break;
                    }
                }
                if (!sourcePath) {
                    skipped++;
                    continue;
                }

                const latestDossier = studentDossiers[0];
                const identity = {
                    id: Number(student.id),
                    nom: student.nom,
                    prenoms: student.prenoms,
                    matricule: latestDossier?.matricule || learner?.matriculeEtudiant || student.identifiant,
                };
                const treeFolders = await EtudiantUploadStorageService.resolveTreeFolders({
                    utilisateurId: student.id,
                    etablissementId: latestDossier?.etablissementId || student.etablissementId,
                });
                const destination = EtudiantUploadStorageService.getStudentPhotoDestination(
                    sourcePath,
                    identity,
                    treeFolders,
                );

                if (applyChanges) {
                    const storedPath = EtudiantUploadStorageService.copyLegacyStudentPhoto(
                        sourcePath,
                        identity,
                        treeFolders,
                    );
                    console.log(`COPIÉ ${storedPath}`);
                } else {
                    console.log(`À COPIER ${path.basename(sourcePath)} -> ${path.relative(process.cwd(), destination)}`);
                }
                copied++;
            } catch (error) {
                const message = `étudiant ${student.id}: ${error instanceof Error ? error.message : String(error)}`;
                failures.push(message);
                console.error(`[ÉCHEC] ${message}`);
            }
        }

        console.log(
            `Terminé : ${copied} photo(s) ${applyChanges ? "copiée(s)" : "à copier"}, `
            + `${skipped} étudiant(s) sans référence legacy et ${failures.length} erreur(s).`,
        );
        if (copied === 0 && failures.length === 0) {
            console.log("Aucune copie de photo legacy nécessaire ou possible pour les étudiants référencés.");
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
