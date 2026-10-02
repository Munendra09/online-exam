const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Exam Model — Merged ltaexam + ltaexam-pro-v2
 * - targetClasses: comma-separated (ek exam multiple classes ko assign)
 * - studentsPerShift: v2 shift logic
 * - Global registrationDeadline removed (now in Settings table)
 * - AdmitCard/AnswerKey tables removed (merged into ExamAssignment)
 */
const Exam = sequelize.define('Exam', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(160), allowNull: false },

  /* Multiple classes — comma separated e.g. "10th,12th,BCA" */
  targetClasses: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated class names e.g. "10th,12th,BCA"',
  },

  /* Scheduling */
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false, comment: 'Minutes' },
  totalQuestions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },

  /* Negative marking */
  negativeMarkingEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  negativeMarksPerQuestion: { type: DataTypes.FLOAT, defaultValue: 0.25 },

  /* Status */
  status: { type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'CLOSED'), defaultValue: 'DRAFT' },

  /* Manual release flags */
  admitCardReleased: { type: DataTypes.BOOLEAN, defaultValue: false },
  answerKeyReleased: { type: DataTypes.BOOLEAN, defaultValue: false },
  resultReleased: { type: DataTypes.BOOLEAN, defaultValue: false },

  /* Access toggle */
  examAccessEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },

  /* Center & geo */
  examCenter: { type: DataTypes.STRING(160), defaultValue: 'Lucky Tech Academy, Kasganj' },
  centerLatitude: { type: DataTypes.FLOAT, allowNull: true },
  centerLongitude: { type: DataTypes.FLOAT, allowNull: true },
  allowedRadiusMeters: { type: DataTypes.INTEGER, defaultValue: 500 },
  geoCheckEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },

  /* Shift config */
  studentsPerShift: { type: DataTypes.INTEGER, defaultValue: 25 },
  shiftName: { type: DataTypes.STRING(60), defaultValue: 'Morning Shift' },
}, {
  tableName: 'exams',
  indexes: [
    { fields: ['status'] },
    { fields: ['date'] },
  ],
});

module.exports = Exam;
