import { Sequelize } from 'sequelize';

// Mock manuel de DatabaseConnection, utilisé automatiquement par Jest quand un
// test appelle `jest.mock('../../../core/helpers/DatabaseConnection')` sans factory
// (ex: PresenceController.test.ts, SeanceController.test.ts).
//
// Pourquoi : l'automock de Jest transforme `getInstance()` en `jest.fn()` qui ne
// retourne pas d'instance Sequelize valide. Les modèles exécutent pourtant
// `CoursParticipant.init({ ..., sequelize: DatabaseConnection.getInstance().sequelize })`
// au moment de l'import, ce qui déclenche
//   TypeError: Cannot read properties of undefined (reading 'define')
// dans sequelize/lib/model.js (Model.init accède à `this.sequelize.options.define`).
//
// Ce mock retourne une VRAIE instance Sequelize (aucune connexion au constructeur :
// Sequelize est paresseux), ce qui permet à Model.init() de s'exécuter normalement.
const sequelize = new Sequelize({
  database: 'easyecole_test',
  username: 'root',
  password: '',
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  logging: false,
});

export const DatabaseConnection = {
  instance: null,
  getInstance: jest.fn().mockReturnValue({ sequelize }),
};
