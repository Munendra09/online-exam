const sequelize = require('../config/database');

const User = require('./User');
const Setting = require('./Setting');
const Exam = require('./Exam');
const Question = require('./Question');
const ExamAssignment = require('./ExamAssignment');
const ExamAttempt = require('./ExamAttempt');
const Answer = require('./Answer');
const Result = require('./Result');
const Class = require('./Class');

/* Associations */
User.hasMany(ExamAttempt, { foreignKey: 'userId', onDelete: 'CASCADE' });
ExamAttempt.belongsTo(User, { foreignKey: 'userId' });

Exam.hasMany(Question, { foreignKey: 'examId', onDelete: 'CASCADE' });
Question.belongsTo(Exam, { foreignKey: 'examId' });

Exam.hasMany(ExamAttempt, { foreignKey: 'examId', onDelete: 'CASCADE' });
ExamAttempt.belongsTo(Exam, { foreignKey: 'examId' });

ExamAttempt.hasMany(Answer, { foreignKey: 'attemptId', onDelete: 'CASCADE' });
Answer.belongsTo(ExamAttempt, { foreignKey: 'attemptId' });

Question.hasMany(Answer, { foreignKey: 'questionId', onDelete: 'CASCADE' });
Answer.belongsTo(Question, { foreignKey: 'questionId' });

User.hasMany(Result, { foreignKey: 'userId', onDelete: 'CASCADE' });
Result.belongsTo(User, { foreignKey: 'userId' });

Exam.hasMany(Result, { foreignKey: 'examId', onDelete: 'CASCADE' });
Result.belongsTo(Exam, { foreignKey: 'examId' });

User.hasMany(ExamAssignment, { foreignKey: 'userId', onDelete: 'CASCADE' });
ExamAssignment.belongsTo(User, { foreignKey: 'userId' });

Exam.hasMany(ExamAssignment, { foreignKey: 'examId', onDelete: 'CASCADE' });
ExamAssignment.belongsTo(Exam, { foreignKey: 'examId' });

module.exports = {
  sequelize,
  User,
  Setting,
  Exam,
  Question,
  ExamAssignment,
  ExamAttempt,
  Answer,
  Result,
  Class,
};
