/**
 * Script d'analyse : compare tous les modèles Sequelize avec les tables MySQL
 * et liste les colonnes manquantes.
 * 
 * Exécution : npx ts-node analyze_missing_columns.ts
 */
import { DatabaseConnection } from "./src/core/helpers/DatabaseConnection";
import { DataTypes, Model, ModelDefined } from "sequelize";

// Force-load ALL modules' _associations.ts so all models are registered
import "./src/modules/auth/AuthRoutes";
import "./src/modules/inscription/InscriptionRoutes";
import "./src/modules/achats/AchatsRoutes";
import "./src/modules/stock/StockRoutes";
import "./src/modules/comptabilite/ComptabiliteRoutes";
import "./src/modules/docgen/DocGenRoutes";
import "./src/modules/qualite/QualiteRoutes";
import "./src/modules/ged/GedRoutes";
import "./src/modules/rh/RhRoutes";
import "./src/modules/scolarite/ScolariteRoutes";
//import "./src/modules/bulletins/BulletinsRoutes"; // no routes file, only seed
import "./src/modules/communication/CommunicationRoutes";
import "./src/modules/elearning/ElearningRoutes";
import "./src/modules/etablissement/EtablissementRoutes";
import "./src/modules/immobilisation/ImmobilisationRoutes";
import "./src/modules/marche/MarcheRoutes";
import "./src/modules/orientation/OrientationRoutes";
import "./src/modules/parent/ParentRoutes";
import "./src/modules/reporting/ReportingRoutes";
import "./src/modules/stage/StageRoutes";

type ColumnDiff = {
  table: string;
  model: string;
  column: string;
  modelType: string;
};

async function analyze() {
  const db = DatabaseConnection.getInstance();
  await db.init();
  const sequelize = db.sequelize;
  const queryInterface = sequelize.getQueryInterface();

  // Get all registered models
  const modelNames = sequelize.modelManager?.models
    ? Array.from((sequelize.modelManager as any).models.keys() ?? []) as string[]
    : Object.keys((sequelize as any).models || {});

  // Fallback: iterate through all models
  let allModels: string[] = [];
  try {
    allModels = Array.from((sequelize as any).modelManager?.models?.keys?.() || []) as string[];
  } catch { }
  if (allModels.length === 0) {
    allModels = Object.keys((sequelize as any).models || {});
  }

  console.log(`\n=== ${allModels.length} models registered in Sequelize ===\n`);

  const missingColumns: ColumnDiff[] = [];

  for (const modelName of allModels) {
    try {
      const ModelClass = sequelize.model(modelName) as any;
      const tableName = ModelClass.tableName || modelName;
      const rawAttributes = ModelClass.rawAttributes || {};

      // Describe actual table from DB
      let tableInfo: any;
      try {
        tableInfo = await queryInterface.describeTable(tableName);
      } catch (err) {
        console.log(`  ⚠ Table '${tableName}' (model ${modelName}) n'existe pas en base`);
        continue;
      }

      const dbColumns = Object.keys(tableInfo);
      const modelColumns = Object.keys(rawAttributes);

      for (const col of modelColumns) {
        if (col === 'id') continue; // assume id always exists
        if (!dbColumns.includes(col)) {
          const colDef = rawAttributes[col];
          let colType = 'UNKNOWN';
          if (colDef.type) {
            colType = colDef.type.toString();
          }
          missingColumns.push({
            table: tableName,
            model: modelName,
            column: col,
            modelType: colType
          });
        }
      }
    } catch (err: any) {
      console.error(`  ✗ Error processing model ${modelName}: ${err.message}`);
    }
  }

  if (missingColumns.length === 0) {
    console.log("\n✅ Aucune colonne manquante détectée !");
  } else {
    console.log(`\n=== ${missingColumns.length} colonnes manquantes détectées ===\n`);
    for (const mc of missingColumns) {
      console.log(`  [${mc.table}] ${mc.column} (${mc.modelType}) — modèle: ${mc.model}`);
    }
  }

  console.log("\nAnalyse terminée.");
  process.exit(0);
}

analyze().catch(err => { console.error(err); process.exit(1); });
