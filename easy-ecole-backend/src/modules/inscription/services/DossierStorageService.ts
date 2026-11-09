import fs from "fs";
import path from "path";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { Parcours } from "../models/Parcours";
import { Classe } from "../models/Classe";
import { NiveauEtude } from "../models/NiveauEtude";
import { getOriginRoot } from "../../../core/services/DocumentStorageService";

const BASE_DOSSIERS = getOriginRoot("uploads");

export const SOUS_DOSSIERS = [
    "autorisations",
    "bordereaux",
    "bulletins",
    "cartes",
    "diplomes",
    "dossiers",
    "paiements",
    "pv",
] as const;

export type TypeSousDossier = typeof SOUS_DOSSIERS[number];

export class DossierStorageService {

    /**
     * Construit le chemin sous documents/uploads/{annee}/{parcours}/{classe}/{niveau}/{matricule}/{sousDossier}/
     * Si matricule est null, s'arrête au niveau.
     */
    static getChemin(
        annee: string,
        parcours: string,
        classe: string,
        niveau: string,
        matricule?: string | null,
        sousDossier?: TypeSousDossier | null,
    ): string {
        const parts = [annee, parcours, classe, niveau];
        if (matricule) parts.push(matricule);
        if (sousDossier) parts.push(sousDossier);
        const resolvedPath = path.resolve(BASE_DOSSIERS, ...parts);
        const relativePath = path.relative(BASE_DOSSIERS, resolvedPath);
        if (
            !relativePath
            || relativePath === ".."
            || relativePath.startsWith(`..${path.sep}`)
            || path.isAbsolute(relativePath)
        ) {
            throw new Error("Chemin de dossier étudiant hors de la racine documentaire");
        }
        return resolvedPath;
    }

    /**
     * Crée un dossier (et ses parents) s'il n'existe pas.
     * Retourne le chemin absolu.
     */
    static creerDossier(chemin: string): string {
        if (!fs.existsSync(chemin)) {
            fs.mkdirSync(chemin, { recursive: true });
        }
        return chemin;
    }

    /**
     * Crée l'arborescence au niveau année uniquement.
     * documents/uploads/{annee}/
     */
    static creerSqueletteAnnee(annee: AnneeAcademique): string {
        const chemin = DossierStorageService.getChemin(annee.libelle, "", "", "");
        return DossierStorageService.creerDossier(path.dirname(chemin));
    }

    /**
     * Crée l'arborescence pour une classe:
     * documents/uploads/{annee}/{parcours.type}/{classe.libelle}/{niveau.libelle}/
     */
    static creerSqueletteClasse(
        annee: AnneeAcademique,
        parcours: Parcours,
        classe: Classe,
        niveau: NiveauEtude,
    ): string {
        const chemin = DossierStorageService.getChemin(
            annee.libelle,
            parcours.type || parcours.titre,
            classe.libelle,
            niveau.libelle,
        );
        return DossierStorageService.creerDossier(chemin);
    }

    /**
     * Crée l'arborescence complète pour un étudiant validé:
     * documents/uploads/{annee}/{parcours}/{classe}/{niveau}/{matricule}/
     *     + tous les sous-dossiers (autorisations, bordereaux, bulletins, etc.)
     * Retourne le chemin du dossier matricule.
     */
    static creerDossierEtudiant(
        annee: string,
        parcours: string,
        classe: string,
        niveau: string,
        matricule: string,
    ): string {
        const cheminMatricule = DossierStorageService.getChemin(annee, parcours, classe, niveau, matricule);
        DossierStorageService.creerDossier(cheminMatricule);

        for (const sousDossier of SOUS_DOSSIERS) {
            const cheminSous = path.join(cheminMatricule, sousDossier);
            DossierStorageService.creerDossier(cheminSous);
        }

        return cheminMatricule;
    }

    /**
     * Déplace un fichier vers le dossier matricule de l'étudiant.
     * sourcePath: chemin absolu du fichier source
     * annee, parcours, classe, niveau, matricule: identifiants
     * sousDossier: type de document (autorisations, dossiers, etc.)
     * Retourne le nouveau chemin absolu.
     */
    static deplacerFichier(
        sourcePath: string,
        annee: string,
        parcours: string,
        classe: string,
        niveau: string,
        matricule: string,
        sousDossier: TypeSousDossier,
    ): string {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Fichier source introuvable: ${sourcePath}`);
        }

        const dossierCible = DossierStorageService.getChemin(annee, parcours, classe, niveau, matricule, sousDossier);
        DossierStorageService.creerDossier(dossierCible);

        const nomFichier = path.basename(sourcePath);
        const cheminCible = path.join(dossierCible, nomFichier);

        // Éviter d'écraser si déjà présent
        if (fs.existsSync(cheminCible)) {
            const ext = path.extname(nomFichier);
            const base = path.basename(nomFichier, ext);
            const timestamp = Date.now();
            const nouveauNom = `${base}_${timestamp}${ext}`;
            fs.renameSync(sourcePath, path.join(dossierCible, nouveauNom));
            return path.join(dossierCible, nouveauNom);
        }

        fs.renameSync(sourcePath, cheminCible);
        return cheminCible;
    }

    /**
     * Copie un fichier vers le dossier matricule (conserve la source).
     */
    static copierFichier(
        sourcePath: string,
        annee: string,
        parcours: string,
        classe: string,
        niveau: string,
        matricule: string,
        sousDossier: TypeSousDossier,
    ): string {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Fichier source introuvable: ${sourcePath}`);
        }

        const dossierCible = DossierStorageService.getChemin(annee, parcours, classe, niveau, matricule, sousDossier);
        DossierStorageService.creerDossier(dossierCible);

        const nomFichier = path.basename(sourcePath);
        const cheminCible = path.join(dossierCible, nomFichier);

        if (fs.existsSync(cheminCible)) {
            const ext = path.extname(nomFichier);
            const base = path.basename(nomFichier, ext);
            const nouveauNom = `${base}_${Date.now()}${ext}`;
            fs.copyFileSync(sourcePath, path.join(dossierCible, nouveauNom));
            return path.join(dossierCible, nouveauNom);
        }

        fs.copyFileSync(sourcePath, cheminCible);
        return cheminCible;
    }

    /**
     * Résout le chemin relatif depuis la racine du projet pour le stocker en base.
     */
    static cheminRelatif(cheminAbsolu: string): string {
        const cwd = path.resolve(process.cwd());
        const rel = path.relative(cwd, cheminAbsolu);
        return rel.replace(/\\/g, "/");
    }
}
