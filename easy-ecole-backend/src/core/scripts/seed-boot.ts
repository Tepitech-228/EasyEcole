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

/**
 * Contrôle ciblé — incident FK « uploaderId » (saisie de bordereau bloquée).
 *
 * Détecte à CHAQUE démarrage :
 *  1. documents GED / traces d'audit dont l'auteur n'existe plus
 *     (`uploaderId`/`userId` NULL ou absent d'aut_utilisateurs)
 *     → la migration 034_ged_reparation_uploader_id n'a pas été appliquée ;
 *  2. absence totale de compte utilisable pour l'archivage GED
 *     (`system-ged` ou `admin` actif) → chaque nouvel archivage échouerait.
 *
 * Avertissements non bloquants, visibles dans les logs de chaque boot :
 * le décalage se voit immédiatement, au lieu d'une erreur 400 surprise à l'usage.
 */
async function controleAuteursGED(sequelize: any): Promise<void> {
    console.log("[seed-boot] Contrôle des auteurs d'archivage GED…");
    let alertes = 0;

    const controles: Array<{ sql: string; alerte: string }> = [
        {
            sql: `SELECT COUNT(*) AS n FROM ged_documents d
                  LEFT JOIN aut_utilisateurs u ON u.id = d.uploaderId
                  WHERE d.uploaderId IS NULL OR u.id IS NULL`,
            alerte: "document(s) GED sans compte auteur valide — migration 034 non appliquée ?",
        },
        {
            sql: `SELECT COUNT(*) AS n FROM ged_audit_logs l
                  LEFT JOIN aut_utilisateurs u ON u.id = l.userId
                  WHERE l.userId IS NULL OR u.id IS NULL`,
            alerte: "trace(s) d'audit GED sans compte valide — migration 034 non appliquée ?",
        },
    ];

    for (const { sql, alerte } of controles) {
        try {
            const [[{ n }]] = await sequelize.query(sql);
            if (Number(n) > 0) {
                alertes++;
                console.warn(`[seed-boot] ⚠ ${n} ${alerte}`);
            }
        } catch (e: any) {
            // Tables GED absentes (module non déployé, base fraîche) : on signale et on passe.
            console.warn(`[seed-boot] ⚠ Contrôle GED impossible (${e?.message}) — tables absentes ?`);
        }
    }

    try {
        const [[{ comptes }]] = await sequelize.query(
            `SELECT COUNT(*) AS comptes FROM aut_utilisateurs
             WHERE deletedAt IS NULL AND (identifiant = 'system-ged' OR role = 'admin')`
        );
        if (Number(comptes) === 0) {
            alertes++;
            console.warn("[seed-boot] ⚠ Aucun compte utilisable pour l'archivage GED (ni system-ged ni admin actif) — tout archivage échouera");
        }
    } catch (e: any) {
        alertes++;
        console.warn(`[seed-boot] ⚠ Impossible de vérifier les comptes utilisables : ${e?.message}`);
    }

    if (alertes === 0) {
        console.log("[seed-boot] ✓ Auteurs GED OK (auteurs valides, aucun compte de repli manquant)");
    } else {
        console.warn(`[seed-boot] ⚠ ${alertes} anomalie(s) GED — voir ci-dessus`);
    }
}

async function main(): Promise<void> {
    console.log("[seed-boot] Début des seeds fonctionnels (idempotents)…");
    const db = DatabaseConnection.getInstance();
    // ⚠️ NE PAS appeler db.init() ici : c'est un DUPLICATA du travail lourd de
    // schéma (sync des ~100 modèles + ensures/ALTER) que l'application exécute
    // DÉJÀ sur son événement `listening` (src/app.ts). Sur le chemin critique de
    // démarrage (l'entrypoint, AVANT que l'API n'écoute), ce doublon rallongeait
    // le boot de plusieurs minutes et pouvait faire dépasser la fenêtre de santé
    // Docker → « dependency failed to start: container easyecole-backend is
    // unhealthy ».
    // Le schéma est garanti en amont par l'entrypoint : §0c (setup-production,
    // création des tables manquantes) puis §1 (migrations SQL). Ici on se
    // contente d'ouvrir/valider la connexion ; les seeds restent idempotents et
    // non bloquants, et le schéma est entretenu une seule fois par l'app.
    await db.sequelize.authenticate();

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
    await controleAuteursGED(db.sequelize);

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
