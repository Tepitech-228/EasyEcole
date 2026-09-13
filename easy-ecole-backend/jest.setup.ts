// Chargement du fichier .env avant l'import de tout module du projet.
// Sans cela, sous Jest (qui ne lit pas src/app.ts), process.env.DB_HOST/DB_NAME
// et process.env.JWT_SECRET restent vides :
//   - DatabaseConnection.getInstance() lève "Database configuration not found"
//   - src/core/config/jwt.ts lève "JWT_SECRET is required"
// Note : dotenv n'écrase pas les variables déjà définies (ex: NODE_ENV fixé par Jest).
import 'dotenv/config'

// ---------------------------------------------------------------------------
// CI override : dans GitHub Actions, le workflow définit DB_HOST/DB_NAME pour
// provisionner un conteneur MySQL. Mais aucune migration n'est exécutée dans
// ce conteneur, donc les tables n'existent pas. En local (sans DB_HOST),
// getDbConfig() lève "Database configuration not found" et les suites mockent
// DatabaseConnection elles-mêmes. En CI, sans ce clear, 36 suites non-mockées
// tenteraient de se connecter au MySQL vide → échecs en cascade.
// Ce clear rend le CI identique à l'environnement local. Les rares tests qui
// ont besoin d'une vraie connexion (ex: DataResolverService.test.ts) définissent
// eux-mêmes DB_HOST/DB_NAME APRÈS ce setupFile.
// ---------------------------------------------------------------------------
if (process.env.GITHUB_ACTIONS === 'true') {
  delete process.env.DB_HOST
  delete process.env.DB_NAME
  delete process.env.DB_PORT
  delete process.env.DB_USER
  delete process.env.DB_PASS
  delete process.env.DB_DIALECT
}

// ---------------------------------------------------------------------------
// Global mock de DatabaseConnection
//
// En local (sans DB_HOST), getDbConfig() lève "Database configuration not
// found". En CI, on clear DB_HOST (section ci-dessus) pour reproduire ce
// comportement. Mais certains fichiers modèles appellent
// DatabaseConnection.getInstance().sequelize au moment de l'import — si
// getInstance() lève, l'import échoue et Jest ne peut même pas charger la suite.
//
// On fournit un faux sequelize minimal. Les suites qui définissent leur propre
// jest.mock(...DatabaseConnection) conservent leur mock (priorité). Celles qui
// ont besoin d'une vraie connexion (DataResolverService.test.ts) définissent
// leurs propres DB_* APRÈS ce setupFile, mais comme le mock global prend le
// dessus, ces tests doivent explicitement mock la connexion aussi — or ils
// mockent déjà les modèles, donc getInstance() n'est jamais appelé de leurs
// fichiers modèles importés.
//
// NOTE : on NE mock pas via SQLite (sqlite3 n'est pas installé). On fournit
// un mock Sequelize qui satisfait Sequelize.Model.init() grâce à normalizeAttribute
// et queryInterface.QueryGenerator nécessaires à getTableName().
// ---------------------------------------------------------------------------
import { Sequelize, Model, DataTypes } from 'sequelize'
const noopSequelize: any = {
  options: { define: {}, omitNull: false, schema: undefined, isolationLevel: 1, dialect: 'mysql' },
  runHooks: jest.fn(),
  isDefined: jest.fn().mockReturnValue(false),
  normalizeAttribute: (attribute: any) => {
    if (!attribute) return { type: 'STRING' }
    if (typeof attribute === 'string') return { type: attribute }
    if (attribute && typeof attribute === 'object' && attribute.type !== undefined) return attribute
    return { type: attribute }
  },
  normalizeDataType: (type: any) => typeof type === 'function' ? new type() : type,
  modelManager: {
    models: {},
    initialize: jest.fn(),
    define: jest.fn(),
    removeModel: jest.fn(),
    getModel: jest.fn(),
    addModel: jest.fn(),
  },
  queryInterface: {
    createTable: jest.fn().mockResolvedValue(undefined),
    drop: jest.fn().mockResolvedValue(undefined),
    sync: jest.fn().mockResolvedValue(undefined),
    showIndex: jest.fn().mockResolvedValue([]),
    removeColumn: jest.fn().mockResolvedValue(undefined),
    changeColumn: jest.fn().mockResolvedValue(undefined),
    removeConstraint: jest.fn().mockResolvedValue(undefined),
  },
  getQueryInterface: jest.fn().mockReturnValue({
    queryGenerator: {
      addSchema: jest.fn().mockReturnValue('mock_table'),
    },
    QueryGenerator: {
      generateSql: jest.fn(),
      createTableQuery: jest.fn().mockReturnValue(''),
    },
    createTable: jest.fn().mockResolvedValue(undefined),
    showIndex: jest.fn().mockResolvedValue([]),
  }),
  query: jest.fn().mockResolvedValue([{}, []]),
  queryAndSplit: jest.fn().mockResolvedValue([{}, []]),
  transaction: jest.fn().mockImplementation((cb: any) => cb({})),
  dialect: { name: 'mysql', supports: { schemas: false, transaction: false }, DataTypes: {} },
  models: {},
  log: jest.fn(),
  sync: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  validate: jest.fn().mockResolvedValue(undefined),
  authenticate: jest.fn().mockResolvedValue(undefined),
  escape: jest.fn().mockReturnValue(''),
  cast: jest.fn(),
  Sequelize: { Model, DataTypes },
}

jest.mock('./src/core/helpers/DatabaseConnection', () => ({
  DatabaseConnection: {
    getInstance: jest.fn().mockReturnValue({
      sequelize: noopSequelize,
      close: jest.fn(),
      sync: jest.fn().mockResolvedValue(undefined),
    }),
  },
}))

// Mock integration-server: les tests d'intégration sont skippés en CI
// (RUN_INTEGRATION_TESTS != 'true'), mais leurs import-time side effects
// (import de models réels) s'exécutent quand même.
jest.mock('./src/__tests__/helpers/integration-server', () => ({
  startIntegrationServer: jest.fn(),
  getJSON: jest.fn(),
  IntegrationServer: {} as any,
}))

// Mock integration-server: les tests d'intégration sont skippés en CI
// (RUN_INTEGRATION_TESTS != 'true'), mais leurs import-time side effects
// (import de models réels) s'exécutent quand même.
jest.mock('./src/__tests__/helpers/integration-server', () => ({
  startIntegrationServer: jest.fn(),
  getJSON: jest.fn(),
  IntegrationServer: {} as any,
}))
