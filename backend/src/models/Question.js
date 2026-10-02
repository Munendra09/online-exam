const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Question Model
 * Stores individual questions for an exam.
 * Each question has 4 options (A-D) and a correct answer.
 * Questions are uploaded via CSV by admin — no difficulty level needed.
 * Exams are class-based; questions belong to an exam which targets specific classes.
 */
const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  optionA: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  optionB: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  optionC: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  optionD: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  correctAnswer: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: false,
  },
}, {
  tableName: 'questions',
  indexes: [
    { fields: ['examId'] },
  ],
});

module.exports = Question;
