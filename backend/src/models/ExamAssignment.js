const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ExamAssignment — links student to exam with shift info & roll number.
 * Replaces old AdmitCard table. Admit card data lives here.
 * Per-row answerKeyReleased/resultReleased removed — release is exam-level.
 */
const ExamAssignment = sequelize.define('ExamAssignment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  examId: { type: DataTypes.INTEGER, allowNull: false },

  /* Shift assignment */
  shiftNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '1=Day1 ShiftI, 2=Day1 ShiftII, 3=Day1 ShiftIII, 4=Day2 ShiftI...',
  },
  shiftName: { type: DataTypes.STRING(40), allowNull: true },
  shiftDayIndex: { type: DataTypes.INTEGER, allowNull: true },

  /* Student shift timing */
  assignedDate: { type: DataTypes.DATEONLY, allowNull: true },
  startTime: { type: DataTypes.TIME, allowNull: true },
  endTime: { type: DataTypes.TIME, allowNull: true },

  /* Admit card */
  rollNumber: { type: DataTypes.STRING(40), allowNull: true, unique: true },
  admitCardReleased: { type: DataTypes.BOOLEAN, defaultValue: false },

  canAttempt: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'exam_assignments',
  indexes: [
    { unique: true, fields: ['userId', 'examId'] },
    { fields: ['examId'] },
    { fields: ['userId'] },
    { fields: ['shiftNumber'] },
  ],
});

module.exports = ExamAssignment;
