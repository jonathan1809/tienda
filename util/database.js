const Sequelize = require('sequelize');

const sequelize = new Sequelize('tienda_perrona', 'root', 'WannaCry1809.', {
  dialect: 'mysql',
  host: 'localhost',
  logging:false
});

module.exports = sequelize;
