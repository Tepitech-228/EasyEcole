/**
 * Script de migration : ajoute toutes les colonnes manquantes dans la base de données
 * en comparant dynamiquement les modèles Sequelize avec les tables réelles.
 * 
 * Exécution : npx ts-node fix_missing_columns.ts
 */
import 'dotenv/config'
import { DatabaseConnection } from "./src/core/helpers/DatabaseConnection";

async function fix() {
  const db = DatabaseConnection.getInstance();
  const sequelize = db.sequelize;
  await sequelize.authenticate();

  console.log('Connexion à:', sequelize.getDialect() + '://' + (sequelize.config.username || 'root') + '@' + (sequelize.config.host || 'localhost') + ':' + (sequelize.config.port || 3306) + '/' + (sequelize.config.database || 'unknown'));

  require('./src/modules/auth/models/_associations');
  require('./src/modules/orientation/models/_associations');
  require('./src/modules/inscription/models/_associations');
  require('./src/modules/stage/models/_associations');
  require('./src/modules/stock/models/_associations');
  require('./src/modules/immobilisation/models/_associations');
  require('./src/modules/bulletins/models/_associations');
  require('./src/modules/scolarite/models/_associations');
  require('./src/modules/rh/models/_associations');
  require('./src/modules/achats/models/_associations');
  require('./src/modules/comptabilite/models/_associations');
  require('./src/modules/communication/models/_associations');
  require('./src/modules/elearning/models/_associations');
  require('./src/modules/ged/models/_associations');
  require('./src/modules/etablissement/models/Etablissement');

  const models = sequelize.models;
  console.log(`Nombre de modèles trouvés: ${Object.keys(models).length}`);

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

  let totalAdded = 0;
  let totalDropped = 0;

  for (const [modelName, model] of Object.entries(models)) {
    const tableName = model.getTableName() as string;
    try {
      const [tables]: any = await sequelize.query(`SHOW TABLES LIKE '${tableName}'`);
      if (tables.length === 0) {
        console.log(`Table manquante pour ${modelName} (${tableName}). Création...`);
        await model.sync();
        continue;
      }

      const [columns]: any = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
      const existingColNames = new Set(columns.map((c: any) => c.Field));

      const rawAttributes = model.rawAttributes;
      for (const [attrName, attr] of Object.entries(rawAttributes)) {
        const colName = attr.field || attrName;
        if (!existingColNames.has(colName)) {
          console.log(`[AJOUT] Colonne manquante '${colName}' dans '${tableName}' (modèle: ${modelName})`);

          let typeSql = 'VARCHAR(255)';
          const type: any = attr.type;
          if (type) {
            try {
              typeSql = type.toSql ? type.toSql() : String(type);
            } catch {
              if (type.key === 'INTEGER' || type.key === 'BIGINT') typeSql = 'INT';
              else if (type.key === 'BOOLEAN') typeSql = 'TINYINT(1)';
              else if (type.key === 'DATE' || type.key === 'DATEONLY') typeSql = 'DATETIME';
              else if (type.key === 'TEXT') typeSql = 'TEXT';
              else if (type.key === 'FLOAT' || type.key === 'DOUBLE') typeSql = 'DOUBLE';
            }
          }

          const nullSql = attr.allowNull === false ? 'NOT NULL' : 'NULL';
          const defaultSql = attr.defaultValue !== undefined && typeof attr.defaultValue !== 'function' && typeof attr.defaultValue !== 'object'
            ? `DEFAULT ${sequelize.escape(attr.defaultValue as any)}`
            : '';

          const alterSql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${typeSql} ${nullSql} ${defaultSql};`;
          try {
            await sequelize.query(alterSql);
            console.log(`   --> Colonne \`${colName}\` ajoutée avec succès`);
            totalAdded++;
          } catch (alterErr: any) {
            console.error(`   --> ERREUR ajout \`${colName}\`: ${alterErr.message}`);
          }
        }
      }

      const [indexes]: any = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);
      const indexCount = new Set(indexes.map((idx: any) => idx.Key_name)).size;
      if (indexCount > 40) {
        console.log(`Table '${tableName}' a ${indexCount} indexes. Nettoyage des indexes en trop...`);
        const keyMap = new Map<string, string[]>();
        for (const idx of indexes) {
          if (idx.Key_name === 'PRIMARY') continue;
          if (!keyMap.has(idx.Key_name)) keyMap.set(idx.Key_name, []);
          keyMap.get(idx.Key_name)!.push(idx.Column_name);
        }

        const seenCombinations = new Set<string>();
        for (const [keyName, cols] of keyMap.entries()) {
          const combo = cols.join(',');
          if (seenCombinations.has(combo)) {
            try {
              await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${keyName}\``);
              console.log(`   --> Index en trop \`${keyName}\` supprimé sur \`${tableName}\``);
              totalDropped++;
            } catch (dropErr: any) {
              // ignoré si un FK dépend de l'index
            }
          } else {
            seenCombinations.add(combo);
          }
        }
      }

    } catch (err: any) {
      console.error(`Erreur sur ${modelName} (${tableName}): ${err.message}`);
    }
  }

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log(`\n=== RÉPARATION TERMINÉE ===`);
  console.log(`Colonnes manquantes ajoutées: ${totalAdded}`);
  console.log(`Indexes en trop supprimés: ${totalDropped}`);
  process.exit(0);
}

fix().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
