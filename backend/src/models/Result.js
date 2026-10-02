const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Result Model
 * Stores computed result for a student's exam attempt.
 * Created after exam submission via the scoring service.
 */
const Result = sequelize.define('Result', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  correctCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  wrongCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  unattemptedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  grade: {
    type: DataTypes.STRING,
    comment: 'A (>=80%), B (>=60%), C (>=40%), D (<40%)',
  },
}, {
  tableName: 'results',
  indexes: [
    { fields: ['userId', 'examId'] },
    { fields: ['score'] },
  ],
});

module.exports = Result;
