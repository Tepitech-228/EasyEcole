/**
 * SEED BOOT — point d'entrée UNIQUE des seeds fonctionnels en production.
 *
 * Exécuté à chaque démarrage du conteneur (docker-entrypoint.sh), après les
 * migrations SQL et le sync de schéma. Objectif : plus JAMAIS de décalage
 * dev ↔ prod sur les données de référence.
 *
 * RÈGLES (valables pour toute contribution) :
 *  1. Nouvelle TABLE ou CHAMP      → migration SQL (migrations/*.sql) ou
 *                                    modèle Sequelize ; le schéma est couvert
 *                                    au boot (migrations + DB_SYNC_ON_BOOT).
 *  2. Nouvelles DONNÉES fonctionnelles (listes, types, permissions, comptes,
 *     templates…)                  → seed idempotent BRANCHÉ ICI.
 *                                    Un seed non branché ici n'existera
 *                                    JAMAIS en prod.
 *  3. Données de démo / test       → JAMAIS ici (scripts dédiés, dev seul).
 *  4. ICI : pas de TRUNCATE/DROP, uniquement create/findOrCreate idempotent.
 *
 * Comportement :
 *  - Chaque étape est non bloquante : une erreur est loguée ([seed-boot] ⚠)
 *    mais n'empêche pas l'application de démarrer.
 *  - Phase finale « santé » : signale les tables critiques MANQUANTES ou
 *    VIDES → le décalage est visible dans les logs au boot, au lieu d'une
 *    erreur 400 surprise à l'usage.
 */
import { DatabaseConnection } from "../helpers/DatabaseConnection";

interface Etape {
    nom: string;
    run: () => Promise<void>;
}

const ETAPES: Etape[] = [
    {
        nom: "comptes système + rôles RBAC",
        run: async () => {
            const { seedComptesParRole } = require("./seed-comptes-par-role");
            await seedComptesParRole();
        },
    },
    {
        nom: "docgen (types + templates de documents)",
        run: async () => {
            const { seedDocGen } = require("../../modules/docgen/seed/seed");
            await seedDocGen();
        },
    },
    {
        nom: "GED (domaines, types documentaires, processus, permissions)",
        run: async () => {
            const { seedGed } = require("../../modules/ged/seed");
            await seedGed();
        },
    },
    {
        nom: "GED — hiérarchie de dossiers",
        run: async () => {
            const { seedGedFolders } = require("./seed-ged-folders");
            await seedGedFolders();
        },
    },
    {
        nom: "documents requis par niveau d'inscription",
        run: async () => {
            const { seedDocumentsRequisNiveau } = require("./seed-documents-requis-niveau");
            await seedDocumentsRequisNiveau();
        },
    },
    {
        nom: "paramètres de frais par défaut",
        run: async () => {
            const { seedParametresFrais } = require("../../modules/comptabilite/seed-parametres-frais");
            await seedParametresFrais();
        },
    },
];

/**
 * Tables critiques : leur présence + contenu est vérifié après les seeds.
 * « consequence » = ce qui casse côté application quand la table est vide.
 */
const TABLES_CRITIQUES: Array<{ table: string; consequence: string }> = [
    { table: "docgen_types", consequence: "validation comité → 400 « Type de document non trouvé »" },
    { table: "docgen_templates", consequence: "génération PDF de documents officiels impossible" },
    { table: "aut_roles", consequence: "RBAC absent → droits de connexion incohérents" },
    { table: "aut_permissions", consequence: "permissions invisibles → menus/boutons mal affichés" },
    { table: "aut_role_permissions", consequence: "rôles sans permissions → 403 à l'usage" },
    { table: "ged_domains", consequence: "GED sans domaines → dépôt de documents impossible" },
    { table: "ged_document_types", consequence: "GED sans types documentaires → dépôt bloqué" },
    { table: "ged_folders", consequence: "GED sans dossiers racine → arborescence vide" },
    { table: "ins_document_requis_niveau", consequence: "référentiel des pièces à fournir vide → dossiers d'inscription incomplets" },
];

async function controleSante(sequelize: any): Promise<void> {
    console.log("[seed-boot] Contrôle de santé des tables critiques…");
    let alertes = 0;

    for (const { table, consequence } of TABLES_CRITIQUES) {
        try {
            const [[{ existe }]] = await sequelize.query(
                `SELECT COUNT(*) > 0 AS existe FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = :table`,
                { replacements: { table } }
            );
            if (!existe) {
                alertes++;
                console.warn(`[seed-boot] ⚠ TABLE MANQUANTE : ${table} — ${consequence}`);
                continue;
            }
            const [[{ n }]] = await sequelize.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
            if (Number(n) === 0) {
                alertes++;
                console.warn(`[seed-boot] ⚠ TABLE VIDE : ${table} — ${consequence}`);
            }
        } catch (e: any) {
            alertes++;
            console.warn(`[seed-boot] ⚠ Impossible de vérifier ${table} : ${e?.message}`);
        }
    }

    if (alertes === 0) {
        console.log(`[seed-boot] ✓ Santé OK (${TABLES_CRITIQUES.length} tables critiques peuplées)`);
    } else {
        console.warn(`[seed-boot] ⚠ ${alertes} anomalie(s) — voir ci-dessus (décalage dev ↔ prod ?)`);
    }
}

async function main(): Promise<void> {
    console.log("[seed-boot] Début des seeds fonctionnels (idempotents)…");
    const db = DatabaseConnection.getInstance();
    await db.init();

    let echecs = 0;
    for (const etape of ETAPES) {
        try {
            await etape.run();
            console.log(`[seed-boot] ✓ ${etape.nom}`);
        } catch (e: any) {
            echecs++;
            console.warn(`[seed-boot] ⚠ ÉCHEC « ${etape.nom} » (non bloquant) : ${e?.message}`);
        }
    }

    await controleSante(db.sequelize);

    if (echecs > 0) {
        console.warn(`[seed-boot] Terminé AVEC ${echecs} échec(s) sur ${ETAPES.length} étapes.`);
    } else {
        console.log(`[seed-boot] Terminé : ${ETAPES.length}/${ETAPES.length} étapes OK.`);
    }
    await db.sequelize.close();
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error("[seed-boot] Erreur fatale :", e);
            process.exit(1);
        });
}
