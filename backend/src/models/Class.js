const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  minAge: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  maxAge: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
  },
}, {
  tableName: 'classes',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
  ],
});

module.exports = Class;
