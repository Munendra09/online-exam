const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Answer Model
 * Stores a student's selected answer for each question within an attempt.
 */
const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  attemptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  selectedAnswer: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', ''),
    allowNull: true,
  },
  markForReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'answers',
  indexes: [
    { unique: true, fields: ['attemptId', 'questionId'] },
  ],
});

module.exports = Answer;
