const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
registrationId: {
  type: DataTypes.STRING,
  unique: true,
  allowNull: true,
  comment: 'Unique ID like LTA202600001',
},
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'STUDENT'),
    defaultValue: 'STUDENT',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sessionVersion: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  className: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fatherName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  registrationStatus: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'BLOCKED'),
    defaultValue: 'APPROVED',
  },
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['isActive'] },
    { fields: ['className'] },
    { fields: ['city'] },
  ],
});

module.exports = User;