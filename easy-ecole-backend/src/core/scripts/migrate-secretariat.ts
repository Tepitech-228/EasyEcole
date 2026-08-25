/**
 * Migration 009 — MODULE SECRÉTARIAT (idempotente).
 *   npx ts-node src/core/scripts/migrate-secretariat.ts
 */
import 'dotenv/config'

async function columnExists(seq: any, table: string, column: string): Promise<boolean> {
    const [rows]: any[] = await seq.query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c`,
        { replacements: { t: table, c: column } })
    return Number(rows[0].n) > 0
}

async function tableExists(seq: any, table: string): Promise<boolean> {
    const [rows]: any[] = await seq.query(
        `SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t`,
        { replacements: { t: table } })
    return Number(rows[0].n) > 0
}

async function main() {
    const { DatabaseConnection } = require('../helpers/DatabaseConnection');
    const db = DatabaseConnection.getInstance();
    await db.init();
    const seq = db.sequelize;

    // 0. Rôle secretaire dans l'ENUM MySQL
    const [cols]: any[] = await seq.query(`SHOW COLUMNS FROM aut_utilisateurs LIKE 'role'`);
    const type: string = cols[0].Type;
    if (!type.includes("'secretaire'")) {
        const valeurs = type.match(/enum\((.*)\)/i)?.[1];
        if (!valeurs) throw new Error('ENUM role introuvable');
        await seq.query(`ALTER TABLE aut_utilisateurs MODIFY COLUMN role ENUM(${valeurs},'secretaire') NOT NULL`);
        console.log("✓ ENUM role + 'secretaire'");
    } else {
        console.log('• role: secretaire déjà présent');
    }

    // 1. Catalogue enrichi
    for (const [col, ddl] of [
        ['categorie', 'ADD COLUMN categorie VARCHAR(80) NULL'],
        ['delaiTraitement', "ADD COLUMN delaiTraitement INT NULL COMMENT 'délai indicatif en heures'"],
        ['paiementObligatoire', 'ADD COLUMN paiementObligatoire TINYINT(1) NOT NULL DEFAULT 1'],
        ['generationAuto', 'ADD COLUMN generationAuto TINYINT(1) NOT NULL DEFAULT 1'],
        ['actif', 'ADD COLUMN actif TINYINT(1) NOT NULL DEFAULT 1'],
    ] as const) {
        if (!(await columnExists(seq, 'scol_types_document', col))) {
            await seq.query(`ALTER TABLE scol_types_document ${ddl}`);
            console.log(`✓ scol_types_document.${col}`);
        }
    }

    // 2. Demandes de documents
    {
        const [rows]: any[] = await seq.query(`SHOW COLUMNS FROM scol_demandes_document LIKE 'statut'`);
        if (!String(rows[0].Type).includes('document_pret')) {
            await seq.query(`ALTER TABLE scol_demandes_document MODIFY COLUMN statut ENUM('soumise','en_attente_paiement','paye','en_preparation','document_pret','remise','rejetee','annulee','validee','delivree') NOT NULL DEFAULT 'soumise'`);
            console.log('✓ scol_demandes_document.statut étendu');
        }
        for (const ddl of [
            'ADD COLUMN numeroDemande VARCHAR(40) NULL',
            'ADD COLUMN datePaiement DATETIME NULL',
            'ADD COLUMN modePaiement VARCHAR(20) NULL',
            'ADD COLUMN numeroRecu VARCHAR(40) NULL',
            'ADD COLUMN datePreparation DATETIME NULL',
            'ADD COLUMN dateGeneration DATETIME NULL',
            'ADD COLUMN fichierPDF VARCHAR(255) NULL',
            'ADD COLUMN dateImpression DATETIME NULL',
            'ADD COLUMN nbImpressions INT NOT NULL DEFAULT 0',
            'ADD COLUMN dateRemise DATETIME NULL',
            'ADD COLUMN remisParId INT UNSIGNED NULL',
            'ADD COLUMN motifRejet VARCHAR(255) NULL',
        ]) {
            const col = ddl.replace('ADD COLUMN ', '').split(' ')[0];
            if (!(await columnExists(seq, 'scol_demandes_document', col))) {
                await seq.query(`ALTER TABLE scol_demandes_document ${ddl}`);
                console.log(`✓ scol_demandes_document.${col}`);
            }
        }
        const [idx]: any[] = await seq.query(
            `SELECT COUNT(*) AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='scol_demandes_document' AND INDEX_NAME='uk_scol_dd_numero'`);
        if (Number(idx[0].n) === 0) {
            await seq.query('ALTER TABLE scol_demandes_document ADD UNIQUE INDEX uk_scol_dd_numero (numeroDemande)');
            console.log('✓ uk_scol_dd_numero');
        }
    }

    // 3. Tables créées par le SQL brut (déjà IF NOT EXISTS)
    for (const t of ['scol_recus_caisse', 'scol_clotures_caisse', 'scol_journal_secretariat']) {
        console.log(`${await tableExists(seq, t) ? '•' : '✗'} ${t}`);
        if (!(await tableExists(seq, t))) throw new Error(`Table ${t} absente — exécuter migrations/009_secretariat.sql`);
    }

    // 4. Catalogue de démonstration (si vide)
    const [count]: any[] = await seq.query('SELECT COUNT(*) AS n FROM scol_types_document');
    if (Number(count[0].n) === 0) {
        await seq.query(`INSERT INTO scol_types_document (libelle, frais, categorie, delaiTraitement, paiementObligatoire, generationAuto, actif, createdAt, updatedAt) VALUES
            ('Attestation de scolarité', 1000, 'Scolarité', 24, 1, 1, 1, NOW(), NOW()),
            ('Certificat de scolarité', 1000, 'Scolarité', 24, 1, 1, 1, NOW(), NOW()),
            ('Relevé de notes', 2000, 'Évaluations', 48, 1, 1, 1, NOW(), NOW()),
            ('Attestation de réussite', 2500, 'Examens', 48, 1, 1, 1, NOW(), NOW()),
            ('Certificat de réussite', 2500, 'Examens', 48, 1, 1, 1, NOW(), NOW()),
            ('Attestation de diplôme', 5000, 'Diplômes', 72, 1, 1, 1, NOW(), NOW()),
            ('Duplicata de carte étudiant', 3000, 'Cartes', 24, 1, 1, 1, NOW(), NOW()),
            ('Attestation de transfert', 4000, 'Administratif', 48, 1, 1, 1, NOW(), NOW()),
            ('Autre document administratif', 1500, 'Administratif', 24, 1, 1, 1, NOW(), NOW())`);
        console.log('✓ catalogue types de documents seedé (9)');
    }

    console.log('\nMigration 009 secretariat terminée ✔');
    process.exit(0);
}

main().catch(e => { console.error('Erreur migration:', e.message || e); process.exit(1); });
