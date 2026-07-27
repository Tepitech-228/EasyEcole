/**
 * Seed : Crée l'arborescence de dossiers avec des étudiants factices
 * pour vérifier la nouvelle structure : public/dossiers/{annee}/{parcours}/{classe}/{niveau}/{matricule}/
 *
 * Usage : npx ts-node src/modules/inscription/seed-dossier-storage.ts
 */
import fs from "fs";
import path from "path";
import { DatabaseConnection } from "../../core/helpers/DatabaseConnection";
import { DossierStorageService } from "./services/DossierStorageService";
import { AnneeAcademique } from "./models/AnneeAcademique";
import { NiveauEtude } from "./models/NiveauEtude";
import { Parcours } from "./models/Parcours";
import { Classe } from "./models/Classe";

// ── Mini générateur PDF factice ──
function genererFauxPDF(chemin: string, contenu: string) {
    const safe = contenu.replace(/\(/g, "[").replace(/\)/g, "]");
    const stream = `BT /F1 12 Tf 72 720 Td (${safe}) Tj ET`;
    const pdf = `%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources<< /Font<< /F1 4 0 R>> >> /Contents 5 0 R >>endobj\n4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n5 0 obj<< /Length ${stream.length}>>stream\n${stream}\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000345 00000 n \ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n452\n%%EOF`;
    fs.writeFileSync(chemin, pdf, "utf8");
}

// ── Configuration des données de test ──
interface EtudiantFactice {
    nom: string;
    prenom: string;
    matricule: string;
}

interface ParcoursConfig {
    parcoursType: string;      // LICENCE, MASTER, BTS
    parcoursTitre: string;
    classeLibelle: string;      // INFORMATIQUE, GESTION, etc.
    niveauLibelle: string;      // Licence 1, Master 1, etc.
    etudiants: EtudiantFactice[];
}

async function main() {
    // Connexion BDD
    require("./models/_associations");
    const db = DatabaseConnection.getInstance();
    await db.sequelize.authenticate();
    console.log("✅ Connecté à la base");

    // Récupérer ou créer les données de base
    const annee = await AnneeAcademique.findOrCreate({
        where: { libelle: "2025-2026" },
        defaults: { libelle: "2025-2026", description: "Année de test seed" },
    });
    const anneeId = annee[0].id;

    // Niveaux
    const niveaux: Record<string, NiveauEtude> = {};
    for (const nl of ["Licence 1", "Licence 2", "Master 1", "BTS 1"]) {
        const [n] = await NiveauEtude.findOrCreate({
            where: { libelle: nl },
            defaults: { libelle: nl },
        });
        niveaux[nl] = n;
    }

    // Parcours
    const parcoursData = [
        { titre: "INFORMATIQUE", type: "LICENCE" },
        { titre: "GESTION COMMERCIALE", type: "LICENCE" },
        { titre: "RESEAUX", type: "MASTER" },
        { titre: "COMPTABILITE", type: "LICENCE" }, // BTS non supporté par l'ENUM → fallback LICENCE
    ];
    const parcoursMap: Record<string, Parcours> = {};
    for (const p of parcoursData) {
        const defaults: any = { titre: p.titre };
        if (p.type) defaults.type = p.type;
        const [parc] = await Parcours.findOrCreate({
            where: { titre: p.titre },
            defaults,
        });
        parcoursMap[p.titre] = parc;
    }

    // Classes
    const classesData = [
        { libelle: "INFORMATIQUE", parcoursTitre: "INFORMATIQUE", niveauLibelle: "Licence 1" },
        { libelle: "GESCO", parcoursTitre: "GESTION COMMERCIALE", niveauLibelle: "Licence 1" },
        { libelle: "RESEAUX", parcoursTitre: "RESEAUX", niveauLibelle: "Master 1" },
        { libelle: "COMPTA", parcoursTitre: "COMPTABILITE", niveauLibelle: "BTS 1" },
    ];
    const classeMap: Record<string, Classe> = {};
    for (const c of classesData) {
        const defaults: any = { libelle: c.libelle };
        if (parcoursMap[c.parcoursTitre]?.id) defaults.parcoursId = parcoursMap[c.parcoursTitre]!.id;
        if (niveaux[c.niveauLibelle]?.id) defaults.niveauEtudeId = niveaux[c.niveauLibelle]!.id;
        const [cls] = await Classe.findOrCreate({
            where: { libelle: c.libelle },
            defaults,
        });
        classeMap[c.libelle] = cls;
    }

    // ── Configuration des étudiants à créer ──
    const configs: ParcoursConfig[] = [
        {
            parcoursType: "LICENCE",
            parcoursTitre: "INFORMATIQUE",
            classeLibelle: "INFORMATIQUE",
            niveauLibelle: "Licence 1",
            etudiants: [
                { nom: "KOUAME", prenom: "Jean", matricule: "ESA-2025-LI-INFO-A1B2C3" },
                { nom: "TRAORE", prenom: "Aminata", matricule: "ESA-2025-LI-INFO-D4E5F6" },
            ],
        },
        {
            parcoursType: "LICENCE",
            parcoursTitre: "GESTION COMMERCIALE",
            classeLibelle: "GESCO",
            niveauLibelle: "Licence 1",
            etudiants: [
                { nom: "DIALLO", prenom: "Mamadou", matricule: "ESA-2025-LI-GESCO-G7H8I9" },
            ],
        },
        {
            parcoursType: "MASTER",
            parcoursTitre: "RESEAUX",
            classeLibelle: "RESEAUX",
            niveauLibelle: "Master 1",
            etudiants: [
                { nom: "KONAN", prenom: "Marie", matricule: "ESA-2025-MA-RESX-J0K1L2" },
            ],
        },
        {
            parcoursType: "LICENCE",
            parcoursTitre: "COMPTABILITE",
            classeLibelle: "COMPTA",
            niveauLibelle: "BTS 1",
            etudiants: [
                { nom: "N'GUESSAN", prenom: "Paul", matricule: "ESA-2025-BT-COMP-M3N4O5" },
                { nom: "YAO", prenom: "Christelle", matricule: "ESA-2025-BT-COMP-P6Q7R8" },
            ],
        },
    ];

    let totalEtudiants = 0;

    for (const cfg of configs) {
        const anneeLabel = "2025-2026";
        const parcoursNom = cfg.parcoursType;
        const classeNom = cfg.classeLibelle;
        const niveauNom = cfg.niveauLibelle;

        // Créer d'abord le squelette via le service
        console.log(`\n📁 Création structure : ${anneeLabel}/${parcoursNom}/${classeNom}/${niveauNom}`);

        // Créer manuellement la base car creerSqueletteClasse a besoin des modèles
        const cheminBase = DossierStorageService.getChemin(anneeLabel, parcoursNom, classeNom, niveauNom);
        DossierStorageService.creerDossier(cheminBase);

        for (const etudiant of cfg.etudiants) {
            console.log(`  👤 ${etudiant.nom} ${etudiant.prenom} (${etudiant.matricule})`);

            // Créer le dossier étudiant complet avec tous les sous-dossiers
            DossierStorageService.creerDossierEtudiant(
                anneeLabel,
                parcoursNom,
                classeNom,
                niveauNom,
                etudiant.matricule,
            );

            // Créer des fichiers factices dans chaque sous-dossier
            const sousFichiers: Record<string, string[]> = {
                autorisations: ["autorisation_provisoire.pdf"],
                bordereaux: ["bordereau_inscription.pdf"],
                bulletins: ["bulletin_semestre1.pdf", "bulletin_semestre2.pdf"],
                cartes: [`carte_${etudiant.matricule}.pdf`],
                diplomes: [] as string[],
                dossiers: ["piece_identite.pdf", "diplome_bac.pdf", "releve_notes.pdf"],
                paiements: ["quitus_inscription.pdf"],
                pv: ["pv_notes_semestre1.pdf"],
            };

            // Diplôme seulement pour BTS et MASTER
            if (cfg.parcoursType === "MASTER" || cfg.parcoursType === "BTS") {
                sousFichiers.diplomes = ["diplome.pdf"];
            }

            for (const [sousDossier, fichiers] of Object.entries(sousFichiers)) {
                for (const fichier of fichiers) {
                    const cheminComplet = path.resolve(
                        DossierStorageService.getChemin(anneeLabel, parcoursNom, classeNom, niveauNom, etudiant.matricule, sousDossier as any),
                        fichier,
                    );
                    const label = `${etudiant.nom} ${etudiant.prenom} - ${fichier.replace(".pdf", "")}`;
                    genererFauxPDF(cheminComplet, label);
                }
            }

            totalEtudiants++;
        }
    }

    // Afficher l'arborescence créée
    const racine = path.resolve("public/dossiers/2025-2026");
    console.log("\n📂 Arborescence créée :");
    afficherArborescence(racine, "");

    console.log(`\n✅ Seed terminé : ${totalEtudiants} étudiants, ${configs.length} parcours`);
    console.log(`📂 Base : ${racine}`);

    process.exit(0);
}

function afficherArborescence(dir: string, prefix: string) {
    if (!fs.existsSync(dir)) return;
    const entrees = fs.readdirSync(dir, { withFileTypes: true });
    for (let i = 0; i < entrees.length; i++) {
        const e = entrees[i];
        const estDernier = i === entrees.length - 1;
        const trait = estDernier ? "└── " : "├── ";
        const traitSuite = estDernier ? "    " : "│   ";
        console.log(prefix + trait + e.name);
        if (e.isDirectory()) {
            const cheminEnfant = path.join(dir, e.name);
            // Limiter à 3 niveaux de profondeur pour les dossiers sans fichier
            const enfants = fs.readdirSync(cheminEnfant, { withFileTypes: true });
            const aSousDossiers = enfants.some((f) => f.isDirectory());
            if (aSousDossiers && prefix.length < 20) {
                afficherArborescence(cheminEnfant, prefix + traitSuite);
            } else if (!aSousDossiers && enfants.length > 0 && prefix.length < 30) {
                // Afficher les fichiers uniquement si pas trop profond
                for (let j = 0; j < Math.min(enfants.length, 3); j++) {
                    const f = enfants[j];
                    const fd = j === enfants.length - 1 ? "└── " : "├── ";
                    console.log(prefix + traitSuite + fd + f.name);
                }
                if (enfants.length > 3) {
                    console.log(prefix + traitSuite + `└── ... (${enfants.length - 3} fichiers de plus)`);
                }
            }
        }
    }
}

main().catch((err) => {
    console.error("❌ Erreur seed :", err);
    process.exit(1);
});
