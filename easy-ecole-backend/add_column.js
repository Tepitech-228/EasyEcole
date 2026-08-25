const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('easyecole', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

sequelize.getQueryInterface().addColumn('ins_demandes_inscription', 'soumissionComite', {
  type: Sequelize.DataTypes.BOOLEAN,
  defaultValue: false,
  field: 'soumissionComite'
}).then(() => {
  console.log('Column added successfully');
  process.exit(0);
}).catch(err => {
  console.error('Error adding column:', err);
  process.exit(1);
});