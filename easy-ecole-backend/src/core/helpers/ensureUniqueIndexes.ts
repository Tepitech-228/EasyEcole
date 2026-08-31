import { QueryTypes, Sequelize } from 'sequelize';

/**
 * ============================================================================
 * ensureUniqueIndexes — Contraintes UNIQUE portées par des index nominatifs
 * ============================================================================
 * Élimine la cause racine des "index en double" (aut_utilisateurs.email_2,
 * aut_roles.nom_2..nom_45, etc.) générés par `sequelize.sync({ alter: true })`
 * à chaque boot :
 *
 *   Le sync émet `ALTER TABLE t CHANGE col col VARCHAR(255) UNIQUE` pour toute
 *   colonne déclarée `unique: true` dans un modèle. MySQL auto-suffixe alors un
 *   nouvel index unique (`col_2`, `col_3`, ...) à CHAQUE exécution, jusqu'au
 *   plafond de 64 index par table.
 *
 *   La stratégie (validée par test sur MySQL 8) :
 *   1. Chaque contrainte unique simple est portée par un index UNIQUE NOMINATIF
 *      et IDEMPOTENT (`uq_<table>_<colonne>` si absent, sinon tout index UNIQUE
 *      monocolonne existant sur (table, colonne) est conservé tel quel).
 *   2. Le `unique: true` est retiré des modèles Sequelize (voir MODELS.ts) :
 *      la colonne ne contient plus d'unique, le sync n'émet plus le
 *      `ALTER ... UNIQUE` destructeur, et l'index UNIQUE en base — géré ici —
 *      conserve la contrainte.
 *
 *   Le module s'exécute à CHAQUE boot, APRÈS les syncs de DatabaseConnection,
 *   en développement comme en production. Il est strictement IDEMPOTENT :
 *   relance sans effet dès que la contrainte existe.
 *
 *   Séquençage (ordre obligatoire) :
 *   1. `sequelize.sync({ alter: true })` crée/met à jour les tables.
 *      - Base existante : les index UNIQUE préexistants ne sont PAS supprimés
 *        par le sync (un `MODIFY` sans UNIQUE conserve l'index).
 *      - Installation fraîche : les tables sont créées SANS contraintes
 *        uniques (plus de `unique: true` dans les modèles).
 *   2. `ensureUniqueIndexes()` crée les index manquants (cas installation
 *      fraîche) et ne modifie rien sinon.
 *
 *   ⚠️ NE PAS déplacer : ce module est exécuté depuis
 *   `DatabaseConnection.init()` — voir src/core/helpers/DatabaseConnection.ts.
 * ============================================================================
 */

export interface UniqueIndexDef {
    /** Nom de la table MySQL (ex. `aut_utilisateurs`) */
    table: string;
    /** Nom de la colonne MySQL (ex. `email`) */
    column: string;
}

/**
 * Source de vérité statique des contraintes d'unicité (colonnes simples).
 * Une fois `unique: true` retiré des modèles, l'unicité ne peut plus être
 * déduite des modèles : c'est cette liste qui définit le contrat en base.
 *
 * Ne contient QUE des uniques sur colonne simple. Les uniques composites
 * (ex. `unique: 'nom-prenoms'`, `unique: 'session-utilisateur'`, ou
 * `indexes: [{ unique: true, fields: [...] }]`) restent gérés par Sequelize
 * au niveau index (idempotents par nom) et NE figurent PAS ici.
 */
export const UNIQUE_INDEX_DEFS: readonly UniqueIndexDef[] = [
    // ---------- auth ----------
    { table: 'aut_utilisateurs', column: 'email' },
    { table: 'aut_utilisateurs', column: 'identifiant' },
    { table: 'aut_apprenants', column: 'photo' },
    { table: 'aut_apprenants', column: 'qrCode' },
    { table: 'aut_apprenants', column: 'cni' },
    { table: 'aut_enseignants', column: 'photo' },
    { table: 'aut_enseignants', column: 'qrCode' },
    { table: 'aut_enseignants', column: 'matricule' },
    { table: 'aut_enseignants', column: 'cni' },
    { table: 'aut_roles', column: 'nom' },
    { table: 'aut_permissions', column: 'key' },
    { table: 'aut_personnel_administratif', column: 'utilisateurId' },
    { table: 'aut_personnel_administratif', column: 'matricule' },
    { table: 'aut_personnel_administratif', column: 'cni' },
    { table: 'aut_banques', column: 'nom' },
    { table: 'aut_banques', column: 'logo' },
    // ---------- etablissement ----------
    { table: 'eta_etablissements', column: 'code' },
    // ---------- comptabilite ----------
    { table: 'cpt_exercices', column: 'code' },
    { table: 'cpt_parametres_frais', column: 'cle' },
    { table: 'cpt_journaux_comptables', column: 'code' },
    { table: 'cpt_ecritures_comptables', column: 'numeroEcriture' },
    { table: 'cpt_comptes', column: 'numero' },
    // ---------- inscription ----------
    { table: 'ins_types_note_evaluation', column: 'libelle' },
    { table: 'ins_salles_de_classes', column: 'libelle' },
    { table: 'ins_quitus', column: 'code' },
    { table: 'ins_parcours', column: 'titre' },
    { table: 'ins_paiements_inscription', column: 'numero' },
    { table: 'ins_niveaux_etudes', column: 'libelle' },
    { table: 'ins_matieres_prerequis', column: 'libelle' },
    { table: 'ins_frais_scolarites', column: 'sessionId' },
    { table: 'ins_etapes_inscription', column: 'libelle' },
    { table: 'ins_etapes_inscription', column: 'ordre' },
    { table: 'ins_dossiers_etudiants', column: 'matricule' },
    { table: 'ins_demandes_inscription', column: 'matricule' },
    { table: 'ins_classes', column: 'libelle' },
    { table: 'ins_annees_academiques', column: 'libelle' },
    { table: 'ins_absences', column: 'noteEvaluationId' },
    // ---------- elearning ----------
    { table: 'elearning_salons', column: 'codeInvitation' },
    // ---------- docgen ----------
    { table: 'docgen_types', column: 'code' },
    { table: 'docgen_documents', column: 'reference' },
    // ---------- ged ----------
    { table: 'ged_tags', column: 'nom' },
    { table: 'ged_document_types', column: 'code' },
    { table: 'ged_processus', column: 'code' },
    { table: 'ged_domains', column: 'code' },
    // ---------- immobilisation ----------
    { table: 'imm_departement', column: 'nom' },
    { table: 'imm_localisation', column: 'code' },
    { table: 'imm_assurance', column: 'policeNumber' },
    { table: 'imm_immobilisation', column: 'reference' },
    // ---------- scolarite ----------
    { table: 'scol_types_document', column: 'libelle' },
    { table: 'scol_diplomes', column: 'numeroDiplome' },
    // ---------- orientation ----------
    { table: 'ori_parcours', column: 'titre' },
    { table: 'ori_niveaux_etudes', column: 'libelle' },
    { table: 'ori_categories', column: 'libelle' },
    { table: 'ori_matieres_prerequis', column: 'libelle' },
    // ---------- rh ----------
    { table: 'rh_types_contrat', column: 'code' },
    { table: 'rh_rubriques_paie', column: 'code' },
    { table: 'rh_departements', column: 'nom' },
    { table: 'rh_categories_professionnelles', column: 'code' },
    // ---------- stock ----------
    { table: 'stk_article', column: 'reference' },
    { table: 'stk_categorie_article', column: 'nom' },
    { table: 'stk_inventaire_stock', column: 'reference' },
    // ---------- achats ----------
    { table: 'ach_categories', column: 'nom' },
];

/** Nom d'index nominatif (± 64 caractères max côté MySQL). */
export const buildIndexName = (table: string, column: string): string =>
    `uq_${table}_${column}`.slice(0, 64);

export interface EnsureUniqueIndexesResult {
    /** (table.colonne) pour lesquels un index `uq_...` a été créé */
    created: string[];
    /** (table.colonne) déjà couverts par un index UNIQUE monocolonne */
    alreadyPresent: string[];
    /** (table.colonne) dont la table n'existe pas encore (ignorés) */
    tableMissing: string[];
}

/**
 * Garantit qu'une contrainte UNIQUE existe sur (table, colonne) pour chaque
 * entrée de {@link UNIQUE_INDEX_DEFS}, en créant un index nominatif
 * `uq_<table>_<colonne>` si aucun index UNIQUE monocolonne n'existe déjà.
 *
 * Idempotent : exécution répétée = no-op. Sûr en dev ET en production.
 */
export async function ensureUniqueIndexes(sequelize: Sequelize): Promise<EnsureUniqueIndexesResult> {
    const result: EnsureUniqueIndexesResult = { created: [], alreadyPresent: [], tableMissing: [] };

    if (UNIQUE_INDEX_DEFS.length === 0) {
        return result;
    }

    // 1. Tables existantes (une table absente est simplement ignorée :
    //    l'installation fraîche / le sync la créera avant un futur boot).
    const tables = await sequelize.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`,
        { type: QueryTypes.SELECT }
    );
    const existingTables = new Set<string>((tables as Array<{ TABLE_NAME: string }>).map(t => t.TABLE_NAME));

    // 2. Index UNIQUE monocolonne déjà présents, par (table, colonne).
    //    (Un index UNIQUE composite n'enferme pas l'unicité d'une colonne
    //    seule : il n'est donc pas considéré comme satisfaisant.)
    //    NB: MAX(COLUMN_NAME) rend la requête compatible sql_mode=ONLY_FULL_GROUP_BY ;
    //    HAVING COUNT(*) = 1 garantit une seule ligne par groupe, MAX est donc exacte.
    const stats = await sequelize.query(
        `SELECT TABLE_NAME, MAX(COLUMN_NAME) AS COLUMN_NAME
           FROM information_schema.statistics
          WHERE TABLE_SCHEMA = DATABASE()
            AND NON_UNIQUE = 0
          GROUP BY TABLE_NAME, INDEX_NAME
         HAVING COUNT(*) = 1`,
        { type: QueryTypes.SELECT }
    );
    const existing = new Map<string, Set<string>>();
    for (const row of stats as Array<{ TABLE_NAME: string; COLUMN_NAME: string }>) {
        const set = existing.get(row.TABLE_NAME) ?? new Set<string>();
        set.add(row.COLUMN_NAME);
        existing.set(row.TABLE_NAME, set);
    }

    // 3. Boucle idempotente
    for (const def of UNIQUE_INDEX_DEFS) {
        if (!existingTables.has(def.table)) {
            result.tableMissing.push(`${def.table}.${def.column}`);
            continue;
        }
        if (existing.get(def.table)?.has(def.column)) {
            result.alreadyPresent.push(`${def.table}.${def.column}`);
            continue;
        }
        const indexName = buildIndexName(def.table, def.column);
        try {
            await sequelize.query(
                `CREATE UNIQUE INDEX \`${indexName}\` ON \`${def.table}\` (\`${def.column}\`)`
            );
            result.created.push(`${def.table}.${def.column} (${indexName})`);
        } catch (err: any) {
            if (err?.parent?.code === 'ER_DUP_KEYNAME' || err?.parent?.code === 'ER_DUP_ENTRY') {
                // Course au boot concurrent ou contrainte créée entre-temps : OK.
                result.alreadyPresent.push(`${def.table}.${def.column} (${indexName})`);
            } else {
                console.warn(`[ensureUniqueIndexes] erreur ${def.table}.${def.column}:`, err?.message || err);
                throw err;
            }
        }
    }

    console.log(
        `[ensureUniqueIndexes] terminé — créés: ${result.created.length}, déjà présents: ${result.alreadyPresent.length}, tables absentes: ${result.tableMissing.length}`
    );
    return result;
}

/**
 * ============================================================================
 * ensurePerformanceIndexes — Index NON-UNIQUE recommandés (fiabilité/perf)
 * ============================================================================
 * Les colonnes ci-dessous ne sont PAS uniques : elles supportent les filtres
 * fréquents (crons, listes, agrégations) sans contrainte d'unicité.
 * Les index sont créés HORS modèles (aucun `indexes:` dans les modèles — le
 * `sync({ alter: true })` n'émet ainsi aucun ALTER destructeur).
 *
 * MySQL ne supportant pas `CREATE INDEX IF NOT EXISTS`, l'idempotence est
 * assurée par une vérification information_schema préalable (même stratégie
 * que les index uniques ci-dessus) : un index existant dont les colonnes de
 * tête couvrent la définition est conservé tel quel.
 * ============================================================================
 */
export interface PerformanceIndexDef {
    /** Nom de la table MySQL (ex. `ins_seances`) */
    table: string;
    /** Suffixe du nom d'index (le nom complet est préfixé par `idx_`) */
    name: string;
    /** Colonnes MySQL dans l'ordre de l'index */
    columns: string[];
}

/** Nom d'index nominatif (≤ 64 caractères max côté MySQL). */
export const buildPerformanceIndexName = (def: PerformanceIndexDef): string =>
    `idx_${def.table}_${def.name}`.slice(0, 64);

export const PERFORMANCE_INDEX_DEFS: readonly PerformanceIndexDef[] = [
    // ---------- comptabilite : écritures (agrégations par compte débit/crédit) ----------
    { table: 'cpt_ecritures_comptables', name: 'ecritures_comptables_compte_debit', columns: ['compteDebitId'] },
    { table: 'cpt_ecritures_comptables', name: 'ecritures_comptables_compte_credit', columns: ['compteCreditId'] },
    // ---------- inscription : séances (cron RappelSalleCron "chaque minute", filtres fréquents) ----------
    { table: 'ins_seances', name: 'seances_jour_semaine_dates', columns: ['jourSemaine', 'dateDebut', 'dateFin'] },
    { table: 'ins_seances', name: 'seances_cours', columns: ['coursId'] },
    { table: 'ins_seances', name: 'seances_enseignant', columns: ['enseignantId'] },
    // ---------- inscription : échéances (cron quotidien statut/dateLimite, listes par dossier) ----------
    { table: 'ins_echeances', name: 'echeances_statut_date_limite', columns: ['statut', 'dateLimite'] },
    { table: 'ins_echeances', name: 'echeances_dossier', columns: ['dossierEtudiantId'] },
    // ---------- bulletins : filtre classe/année/semestre (délibérations), recherche par apprenant ----------
    { table: 'ins_bulletins', name: 'bulletins_classe_annee_semestre', columns: ['classeId', 'anneeAcademiqueId', 'semestre'] },
    { table: 'ins_bulletins', name: 'bulletins_cursus', columns: ['cursusApprenantId'] },
    // ---------- listes de notes : filtres fréquents (cours, enseignant, année académique) ----------
    { table: 'ins_listes_notes_evaluation', name: 'listes_notes_cours', columns: ['coursId'] },
    { table: 'ins_listes_notes_evaluation', name: 'listes_notes_enseignant', columns: ['enseignantId'] },
    { table: 'ins_listes_notes_evaluation', name: 'listes_notes_annee', columns: ['anneeAcademiqueId'] },
];

export interface EnsurePerformanceIndexesResult {
    /** Index créés (nom complet) */
    created: string[];
    /** Index déjà couverts par un index existant (préfixe de colonnes) */
    alreadyPresent: string[];
    /** Définitions dont la table n'existe pas encore (ignorées) */
    tableMissing: string[];
}

/**
 * Crée les index {@link PERFORMANCE_INDEX_DEFS} s'ils sont absents.
 * Idempotent : une seconde exécution ne crée rien. Sûr en dev ET en production.
 */
export async function ensurePerformanceIndexes(sequelize: Sequelize): Promise<EnsurePerformanceIndexesResult> {
    const result: EnsurePerformanceIndexesResult = { created: [], alreadyPresent: [], tableMissing: [] };

    if (PERFORMANCE_INDEX_DEFS.length === 0) {
        return result;
    }

    const tables = await sequelize.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`,
        { type: QueryTypes.SELECT }
    );
    const existingTables = new Set<string>((tables as Array<{ TABLE_NAME: string }>).map(t => t.TABLE_NAME));

    // Index existants (uniques ET non-uniques), colonnes dans l'ordre.
    const stats = await sequelize.query(
        `SELECT TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME
           FROM information_schema.statistics
          WHERE TABLE_SCHEMA = DATABASE()
          ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
        { type: QueryTypes.SELECT }
    );
    const existing = new Map<string, Array<string[]>>();
    const seenIndexes = new Set<string>();
    for (const row of stats as Array<{ TABLE_NAME: string; INDEX_NAME: string; SEQ_IN_INDEX: number; COLUMN_NAME: string }>) {
        const key = `${row.TABLE_NAME}.${row.INDEX_NAME}`;
        const list = existing.get(row.TABLE_NAME) ?? [];
        if (seenIndexes.has(key)) {
            list[list.length - 1].push(row.COLUMN_NAME);
        } else {
            seenIndexes.add(key);
            list.push([row.COLUMN_NAME]);
        }
        existing.set(row.TABLE_NAME, list);
    }

    // Un index existant dont les colonnes de tête couvrent la définition suffit.
    const isCovered = (table: string, columns: string[]): boolean => {
        const list = existing.get(table);
        if (!list) return false;
        return list.some(cols =>
            columns.length <= cols.length &&
            columns.every((c, i) => cols[i] === c)
        );
    };

    for (const def of PERFORMANCE_INDEX_DEFS) {
        if (!existingTables.has(def.table)) {
            result.tableMissing.push(`${def.table} (${def.columns.join(',')})`);
            continue;
        }
        const indexName = buildPerformanceIndexName(def);
        if (isCovered(def.table, def.columns)) {
            result.alreadyPresent.push(`${def.table} (${indexName})`);
            continue;
        }
        const colsList = def.columns.map(c => `\`${c}\``).join(', ');
        try {
            await sequelize.query(
                `CREATE INDEX \`${indexName}\` ON \`${def.table}\` (${colsList})`
            );
            result.created.push(`${def.table} (${indexName})`);
        } catch (err: any) {
            if (err?.parent?.code === 'ER_DUP_KEYNAME') {
                // Course au boot concurrent ou index créé entre-temps : OK.
                result.alreadyPresent.push(`${def.table} (${indexName})`);
            } else {
                console.warn(`[ensurePerformanceIndexes] erreur ${def.table}:`, err?.message || err);
                throw err;
            }
        }
    }

    console.log(
        `[ensurePerformanceIndexes] terminé — créés: ${result.created.length}, déjà présents: ${result.alreadyPresent.length}, tables absentes: ${result.tableMissing.length}`
    );
    return result;
}