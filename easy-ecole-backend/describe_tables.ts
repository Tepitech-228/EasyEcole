/**
 * Script simple pour décrire les tables clés de la base.
 * Exécution : npx ts-node describe_tables.ts
 */
import { DatabaseConnection } from "./src/core/helpers/DatabaseConnection";

async function describe() {
  const db = DatabaseConnection.getInstance();
  await db.init();
  const sequelize = db.sequelize;
  const queryInterface = sequelize.getQueryInterface();

  const tables = [
    'ins_dossiers_etudiants',
    'ins_bordereaux',
    'ins_echeances',
    'ins_salles_de_classes',
    'ins_cursus_apprenants',
    'ins_demandes_inscription',
    'ins_classes',
    'ins_sessions',
    'ins_seances',
    'ins_absences',
    'ins_presences',
    'ins_liste_presences',
    'ins_cours_participants',
    'stk_articles',
    'stk_mouvements_stock',
    'stk_fournisseur',
    'stk_categories_article',
    'cpt_ecritures_comptables',
    'cpt_comptes_bancaires',
    'cpt_releves_bancaires',
    'cpt_comptes',
    'cpt_journaux_comptables',
    'qua_actions_correctives',
    'qua_audits',
    'qua_non_conformites',
    'qua_enquetes_satisfaction',
    'qua_decisions_revue',
    'qua_audit_pistes',
    'qua_reponses_satisfaction',
    'qua_revues_direction',
    'docgen_cachets',
    'docgen_documents',
    'docgen_signatures',
    'docgen_templates',
    'docgen_types',
    'docgen_workflows',
    'ach_fournisseurs',
    'ach_budgets',
    'ach_commandes',
    'ach_demandes',
    'aut_utilisateurs',
    'aut_apprenants',
    'aut_enseignants',
    'aut_institutions',
    'rh_employes',
    'rh_departements',
  ];

  for (const table of tables) {
    try {
      const info = await queryInterface.describeTable(table);
      const columns = Object.keys(info).join(', ');
      console.log(`${table}: ${columns}`);
    } catch (err: any) {
      console.log(`${table}: TABLE NOT FOUND or ERROR - ${err.message.substring(0, 100)}`);
    }
  }

  console.log("\nTerminé.");
  process.exit(0);
}

describe().catch(err => { console.error(err); process.exit(1); });
