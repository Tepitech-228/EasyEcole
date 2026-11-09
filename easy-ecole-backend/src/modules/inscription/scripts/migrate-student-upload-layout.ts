import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Bordereau } from "../models/Bordereau";
import { DemandeInscription } from "../models/DemandeInscription";
import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DossierInscription } from "../models/DossierInscription";
import { PreInscription } from "../models/PreInscription";
import { EtudiantUploadStorageService } from "../services/EtudiantUploadStorageService";
import { getOriginRoot } from "../../../core/services/DocumentStorageService";

const publicRoot = path.resolve(process.cwd(), "public");
const docgenRoot = path.resolve(process.cwd(), "storage", "docgen");
const studentUploadsRoot = getOriginRoot("uploads");
const migrationKey = "student_upload_layout_v2";
const applyChanges = process.argv.includes("--apply");
const failures: string[] = [];
let migrated = 0;
let skipped = 0;

function isWithinPublic(candidate: string): boolean {
    return candidate.startsWith(`${publicRoot}${path.sep}`);
}

function isWithinStudentUploads(candidate: string): boolean {
    return candidate.startsWith(`${studentUploadsRoot}${path.sep}`);
}

function isAlreadyOrganized(reference: string): boolean {
    const candidate = path.resolve(process.cwd(), reference.replace(/\\/g, "/"));
    if (!isWithinStudentUploads(candidate)) return false;
    return path.relative(studentUploadsRoot, candidate).split(path.sep).includes("Etudiants");
}

function findSource(reference: string, legacyDirectories: string[]): string | null {
    const normalized = reference.replace(/\\/g, "/");
    const directPath = path.resolve(process.cwd(), normalized);
    if (isWithinPublic(directPath) && fs.existsSync(directPath)) {
        return directPath;
    }

    const basename = path.basename(normalized);
    for (const directory of legacyDirectories) {
        const candidate = path.resolve(process.cwd(), directory, basename);
        if (isWithinPublic(candidate) && fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function findAuthorizationSource(reference: string): string | null {
    const normalized = reference.replace(/\\/g, "/");
    const directPath = path.resolve(process.cwd(), normalized);
    if (
        (isWithinPublic(directPath) || directPath.startsWith(`${docgenRoot}${path.sep}`))
        && fs.existsSync(directPath)
    ) {
        return directPath;
    }

    const basename = path.basename(normalized);
    const filenames = path.extname(basename) ? [basename] : [basename, `${basename}.pdf`];
    for (const directory of ["storage/docgen", "public/inscription/autorisations"]) {
        for (const filename of filenames) {
            const candidate = path.resolve(process.cwd(), directory, filename);
            if (
                (isWithinPublic(candidate) || candidate.startsWith(`${docgenRoot}${path.sep}`))
                && fs.existsSync(candidate)
            ) {
                return candidate;
            }
        }
    }
    return null;
}

async function getIdentity(utilisateurId: number, matricule?: string | null) {
    const utilisateur = await Utilisateur.findByPk(utilisateurId, {
        attributes: ["id", "nom", "prenoms"],
    });
    if (!utilisateur) {
        throw new Error(`Compte étudiant introuvable : ${utilisateurId}`);
    }
    return {
        id: Number(utilisateur.id),
        nom: utilisateur.nom,
        prenoms: utilisateur.prenoms,
        matricule,
    };
}

async function migrateDemandeDocuments(): Promise<void> {
    const documents = await DemandeInscriptionDossier.findAll();
    for (const document of documents) {
        const reference = document.nomFichier;
        if (isAlreadyOrganized(reference)) {
            skipped++;
            continue;
        }

        try {
            const demande = await DemandeInscription.findByPk(document.demandeId);
            if (!demande) throw new Error(`Demande ${document.demandeId} introuvable`);
            const source = findSource(reference, [
                "public/inscription/dossiers",
                "public/inscription/reinscription/dossiers",
            ]);
            if (!source) throw new Error(`Fichier source introuvable : ${reference}`);

            const [dossier, identity] = await Promise.all([
                DossierInscription.findByPk(document.dossierId),
                getIdentity(
                    Number(demande.utilisateurId),
                    demande.matriculeEtudiant || demande.matricule,
                ),
            ]);
            const treeFolders = await EtudiantUploadStorageService.resolveTreeFolders({
                sessionId: demande.sessionId,
                etablissementId: demande.etablissementId,
                demandeId: demande.id,
                utilisateurId: demande.utilisateurId,
                typeDemande: demande.typeDemande,
            });
            const title = dossier?.titre || `PIECE_${document.dossierId}`;
            const estBordereau = /bordereau/i.test(title);
            const category = estBordereau ? "Bordereaux" : "Dossiers";
            const subfolders = estBordereau
                ? [
                    demande.typeDemande === "reinscription" ? "REINSCRIPTION" : "INSCRIPTION",
                    `DEMANDE_${demande.id}`,
                ]
                : [
                    demande.typeDemande === "reinscription" ? "REINSCRIPTION" : "INSCRIPTION",
                    `DEMANDE_${demande.id}`,
                    "PIECES",
                    `${document.dossierId}_${title}`,
                ];

            if (applyChanges) {
                document.nomFichier = EtudiantUploadStorageService.copyExisting(
                    source,
                    identity,
                    treeFolders,
                    category,
                    subfolders,
                );
                await document.save();
            } else {
                console.log(`[APERÇU] dossier#${document.demandeId}/${document.dossierId} : ${source} -> ${path.relative(process.cwd(), studentUploadsRoot).replace(/\\/g, "/")}/${treeFolders.join("/")}/Etudiants/${identity.nom}_${identity.prenoms}_${identity.matricule || `ID${identity.id}`}/${category}/${subfolders.join("/")}/Version_01/${path.basename(source)}`);
            }
            migrated++;
        } catch (error) {
            const message = `Pièce demande ${document.demandeId}/dossier ${document.dossierId}: ${(error as Error).message}`;
            failures.push(message);
            console.error(`[ERREUR] ${message}`);
        }
    }
}

async function migrateBordereaux(): Promise<void> {
    const bordereaux = await Bordereau.findAll();
    for (const bordereau of bordereaux) {
        const reference = bordereau.fichier;
        if (isAlreadyOrganized(reference)) {
            skipped++;
            continue;
        }

        try {
            const source = findSource(reference, [
                "public/inscription/bordereaux",
                "public/inscription/reinscription/bordereaux",
            ]);
            if (!source) throw new Error(`Fichier source introuvable : ${reference}`);

            const demande = await DemandeInscription.findOne({
                where: { utilisateurId: bordereau.utilisateurId },
                order: [["createdAt", "DESC"]],
            });
            const dossierEtudiant = await DossierEtudiant.findOne({
                where: { utilisateurId: bordereau.utilisateurId },
                attributes: ["matricule"],
            });
            const identity = await getIdentity(
                Number(bordereau.utilisateurId),
                demande?.matriculeEtudiant || dossierEtudiant?.matricule || demande?.matricule,
            );
            const treeFolders = await EtudiantUploadStorageService.resolveTreeFolders({
                sessionId: demande?.sessionId,
                etablissementId: demande?.etablissementId || bordereau.etablissementId,
                demandeId: demande?.id,
                utilisateurId: bordereau.utilisateurId,
                typeDemande: demande?.typeDemande,
            });
            const type = bordereau.type || "bordereau";
            const subfolders = [
                type === "inscription" ? "INSCRIPTION" : type.toUpperCase(),
                `DEMANDE_${demande?.id || bordereau.id}`,
            ];

            if (applyChanges) {
                bordereau.fichier = EtudiantUploadStorageService.copyExisting(
                    source,
                    identity,
                    treeFolders,
                    "Bordereaux",
                    subfolders,
                );
                await bordereau.save();
            } else {
                console.log(`[APERÇU] bordereau#${bordereau.id} : ${source} -> ${path.relative(process.cwd(), studentUploadsRoot).replace(/\\/g, "/")}/${treeFolders.join("/")}/Etudiants/${identity.nom}_${identity.prenoms}_${identity.matricule || `ID${identity.id}`}/Bordereaux/${subfolders.join("/")}/Version_01/${path.basename(source)}`);
            }
            migrated++;
        } catch (error) {
            const message = `Bordereau ${bordereau.id}: ${(error as Error).message}`;
            failures.push(message);
            console.error(`[ERREUR] ${message}`);
        }
    }
}

async function migrateAuthorisations(): Promise<void> {
    const authorisations = await PreInscription.findAll();
    for (const preInscription of authorisations) {
        const reference = preInscription.autorisationPDF;
        if (!reference) {
            skipped++;
            continue;
        }
        if (isAlreadyOrganized(reference)) {
            skipped++;
            continue;
        }

        try {
            const demande = await DemandeInscription.findByPk(preInscription.demandeInscriptionId);
            if (!demande) throw new Error(`Demande ${preInscription.demandeInscriptionId} introuvable`);
            const source = findAuthorizationSource(reference);
            if (!source) throw new Error(`Fichier source introuvable : ${reference}`);
            const identity = await getIdentity(
                Number(demande.utilisateurId),
                demande.matriculeEtudiant || demande.matricule,
            );
            const treeFolders = await EtudiantUploadStorageService.resolveTreeFolders({
                sessionId: demande.sessionId,
                etablissementId: demande.etablissementId,
                demandeId: demande.id,
                utilisateurId: demande.utilisateurId,
                typeDemande: demande.typeDemande,
            });
            const subfolders = [
                demande.typeDemande === "reinscription" ? "REINSCRIPTION" : "INSCRIPTION",
                `DEMANDE_${demande.id}`,
                "AUTORISATIONS",
            ];

            if (applyChanges) {
                preInscription.autorisationPDF = EtudiantUploadStorageService.copyExisting(
                    source,
                    identity,
                    treeFolders,
                    "Dossiers",
                    subfolders,
                );
                await preInscription.save();
            } else {
                console.log(`[APERÇU] autorisation#${preInscription.id} : ${source} -> ${path.relative(process.cwd(), studentUploadsRoot).replace(/\\/g, "/")}/${treeFolders.join("/")}/Etudiants/${identity.nom}_${identity.prenoms}_${identity.matricule || `ID${identity.id}`}/Dossiers/${subfolders.join("/")}/Version_01/${path.basename(source)}`);
            }
            migrated++;
        } catch (error) {
            const message = `Autorisation préinscription ${preInscription.id}: ${(error as Error).message}`;
            failures.push(message);
            console.error(`[ERREUR] ${message}`);
        }
    }
}

async function main(): Promise<void> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    try {
        require("../../auth/models/_associations");
        require("../models/_associations");
        await sequelize.authenticate();

        if (applyChanges) {
            const [completedRows] = await sequelize.query(
                `SELECT migration_key FROM ins_student_upload_layout_migrations WHERE migration_key = '${migrationKey}' LIMIT 1`,
            );
            if (Array.isArray(completedRows) && completedRows.length > 0) {
                console.log("Migration vers le stockage documentaire déjà terminée ; aucune copie à refaire.");
                return;
            }
        }

        console.log(applyChanges
            ? "Migration des fichiers étudiants vers documents/uploads : MODE APPLICATION (les originaux sont conservés)."
            : "Migration des fichiers étudiants vers documents/uploads : aperçu uniquement. Ajoutez --apply pour appliquer.");
        await migrateDemandeDocuments();
        await migrateBordereaux();
        await migrateAuthorisations();
        console.log(`Terminé : ${migrated} fichier(s) ${applyChanges ? "migré(s)" : "à migrer"}, ${skipped} déjà organisé(s), ${failures.length} erreur(s).`);
        if (failures.length > 0) {
            process.exitCode = 1;
        } else if (applyChanges) {
            await sequelize.query(
                `INSERT INTO ins_student_upload_layout_migrations (migration_key, completed_at) VALUES ('${migrationKey}', NOW()) ON DUPLICATE KEY UPDATE completed_at = VALUES(completed_at)`,
            );
        }
    } finally {
        await sequelize.close();
    }
}

main().catch(error => {
    console.error("[MIGRATION][FATALE]", error);
    process.exitCode = 1;
});
