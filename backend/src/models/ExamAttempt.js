const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * ExamAttempt Model
 * Tracks a student's exam attempt including start/end time,
 * status (in progress, submitted, etc.), and security events.
 */
const ExamAttempt = sequelize.define('ExamAttempt', {
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
  startTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'DISQUALIFIED'),
    defaultValue: 'IN_PROGRESS',
  },
  tabSwitchCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times student switched tabs during exam',
  },
  disconnectCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'exam_attempts',
  indexes: [
    { unique: true, fields: ['userId', 'examId'] },
    { fields: ['status'] },
  ],
});

module.exports = ExamAttempt;
