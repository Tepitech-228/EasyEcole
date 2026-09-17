/* Migration de rattrapage PROD — colonnes manquantes sur scol_demandes_document.
 *
 * Problème corrigé :
 *   POST /comite-validations/dossiers/:id/decider → 400
 *   "Unknown column 'referencePaiement' in 'field list'"
 * La table scol_demandes_document de la base est plus ancienne que le modèle
 * DemandeDocument. Toute requête Sequelize (findOne/create) échoue.
 *
 * Ce script est 100% autonome (mysql2 uniquement) :
 *   - se connecte avec les variables d'environnement du serveur (DB_HOST, DB_PORT,
 *     DB_USER, DB_PASS, DB_NAME) ou le .env de l'app si présent,
 *   - IDEMPOTENT : n'ajoute que les colonnes manquantes, ignore celles déjà présentes,
 *   - n'altère aucune donnée, seulement le schéma.
 *
 * Exécution sur le serveur (depuis le dossier backend de l'app, pour mysql2) :
 *   node migration-fix-demande-document-prod.js
 */
const mysql = require('mysql2/promise');

try { require('dotenv').config(); } catch (_e) { /* dotenv absent : variables système */ }

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'easyecole',
};

const TABLE = 'scol_demandes_document';

// Types alignés sur src/modules/scolarite/models/DemandeDocument.ts
const COLUMNS = [
  { name: 'statut', definition: "ENUM('soumise','en_attente_paiement','paye','en_preparation','document_pret','remise','rejetee','annulee','validee','delivree') NOT NULL DEFAULT 'soumise'" },
  { name: 'date', definition: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' },
  { name: 'fraisPayes', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
  { name: 'source', definition: "ENUM('automatique','demande_etudiant') NOT NULL DEFAULT 'demande_etudiant'" },
  { name: 'montant', definition: 'FLOAT NULL DEFAULT 0' },
  { name: 'paiementId', definition: 'INT UNSIGNED NULL' },
  { name: 'compteProduit', definition: "VARCHAR(255) NULL DEFAULT '704'" },
  { name: 'parcoursId', definition: 'INT UNSIGNED NULL' },
  { name: 'niveauEtudeId', definition: 'INT UNSIGNED NULL' },
  { name: 'classeId', definition: 'INT UNSIGNED NULL' },
  { name: 'anneeAcademiqueId', definition: 'INT UNSIGNED NULL' },
  { name: 'numeroDemande', definition: 'VARCHAR(40) NULL' },
  { name: 'datePaiement', definition: 'DATETIME NULL' },
  { name: 'modePaiement', definition: "ENUM('especes','mobile_money','autre') NULL" },
  { name: 'numeroRecu', definition: 'VARCHAR(40) NULL' },
  { name: 'referencePaiement', definition: 'VARCHAR(100) NULL' },
  { name: 'recuCaisseId', definition: 'INT UNSIGNED NULL' },
  { name: 'caissierId', definition: 'INT UNSIGNED NULL' },
  { name: 'datePreparation', definition: 'DATETIME NULL' },
  { name: 'dateGeneration', definition: 'DATETIME NULL' },
  { name: 'fichierPDF', definition: 'VARCHAR(255) NULL' },
  { name: 'dateImpression', definition: 'DATETIME NULL' },
  { name: 'nbImpressions', definition: 'INT NOT NULL DEFAULT 0' },
  { name: 'dateRemise', definition: 'DATETIME NULL' },
  { name: 'remisParId', definition: 'INT UNSIGNED NULL' },
  { name: 'motifRejet', definition: 'VARCHAR(255) NULL' },
];

(async () => {
  const c = await mysql.createConnection(DB);
  console.log(`Connexion : ${DB.host}:${DB.port}/${DB.database}`);

  const [existingRows] = await c.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [TABLE]
  );
  const existing = new Set(existingRows.map((r) => r.COLUMN_NAME));

  if (!existing.has('id')) {
    console.error(`✖ La table \`${TABLE}\` n'existe pas dans cette base. Abandon.`);
    await c.end();
    process.exit(1);
  }

  let added = 0;
  let skipped = 0;

  for (const col of COLUMNS) {
    if (existing.has(col.name)) {
      console.log(`  - \`${col.name}\` déjà présent, ignoré`);
      skipped++;
      continue;
    }
    try {
      await c.execute(`ALTER TABLE \`${TABLE}\` ADD COLUMN \`${col.name}\` ${col.definition}`);
      console.log(`  ✓ \`${col.name}\` ajouté`);
      added++;
    } catch (e) {
      if (e && e.code === 'ER_DUP_FIELDNAME') {
        console.log(`  - \`${col.name}\` déjà présent (race), ignoré`);
        skipped++;
      } else {
        throw e;
      }
    }
  }

  console.log(`\nMigration terminée : ${added} colonne(s) ajoutée(s), ${skipped} déjà présente(s).`);

  // Vérification finale
  const [checkRows] = await c.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'referencePaiement'`,
    [TABLE]
  );
  console.log(`Vérification referencePaiement : ${checkRows.length ? 'PRÉSENTE ✓' : 'ABSENTE ✖'}`);

  await c.end();
})().catch((e) => {
  console.error('Erreur migration:', e && e.message ? e.message : e);
  process.exit(1);
});