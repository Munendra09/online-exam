const { Op } = require('sequelize');
const {
  Exam, Question, ExamAttempt, Answer, Result, ExamAssignment, User,
} = require('../models');
const { calculateResult } = require('../services/scoringService');
const { ensureAssignmentsForClasses } = require('../services/shiftService');
const shuffle = require('../utils/shuffle');

function toNumber(v) {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v); return Number.isNaN(n) ? null : n;
}
function toTime(v) { return String(v || '').slice(0, 8); }
function toDateOnly(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().split('T')[0];
  return String(v).split('T')[0];
}
function examDateTimeIST(date, time) {
  return new Date(`${toDateOnly(date)}T${toTime(time)}+05:30`);
}

/* ===== Create Exam ===== */
exports.create = async (req, res) => {
  const data = {
    title: req.body.title,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    duration: toNumber(req.body.duration),
    totalQuestions: toNumber(req.body.totalQuestions) || 50,
    negativeMarkingEnabled: !!req.body.negativeMarkingEnabled,
    negativeMarksPerQuestion: toNumber(req.body.negativeMarksPerQuestion) || 0.25,
    studentsPerShift: toNumber(req.body.studentsPerShift) || 25,
    examCenter: req.body.examCenter || 'Lucky Tech Academy, Kasganj',
    centerLatitude: toNumber(req.body.centerLatitude),
    centerLongitude: toNumber(req.body.centerLongitude),
    allowedRadiusMeters: toNumber(req.body.allowedRadiusMeters) || 500,
    geoCheckEnabled: !!req.body.geoCheckEnabled,
    status: req.body.status || 'DRAFT',
    shiftName: req.body.shiftName || 'Morning Shift',
  };

  // targetClasses — accept array or comma-string
  if (Array.isArray(req.body.targetClasses)) {
    data.targetClasses = req.body.targetClasses.join(',');
  } else if (req.body.targetClasses) {
    data.targetClasses = req.body.targetClasses;
  }

  if (!data.targetClasses) {
    return res.status(400).json({ success: false, message: 'At least one target class is required' });
  }

  const exam = await Exam.create(data);
  const ensured = await ensureAssignmentsForClasses(exam.id);

  res.status(201).json({
    success: true, exam,
    message: `Exam created. ${ensured.created} students linked (classes: ${exam.targetClasses}). Shifts auto-assigned on admit card release.`,
    assignedCount: ensured.created,
  });
};

/* ===== List Exams ===== */
exports.list = async (req, res) => {
  if (req.user.role === 'ADMIN') {
    const exams = await Exam.findAll({
      order: [['date', 'DESC']],
      include: [{ model: Question, attributes: ['id'], required: false }],
    });
    return res.json({ success: true, exams });
  }

  const assignments = await ExamAssignment.findAll({
    where: { userId: req.user.id, canAttempt: true },
    include: [{ model: Exam }],
    order: [['assignedDate', 'ASC']],
  });

  const exams = assignments
    .filter((a) => a.Exam)
    .map((a) => ({
      ...a.Exam.toJSON(),
      assignment: a.toJSON(),
      date: a.assignedDate || a.Exam.date,
      startTime: a.startTime || a.Exam.startTime,
      endTime: a.endTime || a.Exam.endTime,
      shiftName: a.shiftName || a.Exam.shiftName,
    }));

  res.json({ success: true, exams });
};

/* ===== Update Exam ===== */
exports.update = async (req, res) => {
  const exam = await Exam.findByPk(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  const allowed = [
    'title', 'date', 'startTime', 'endTime', 'duration', 'totalQuestions',
    'negativeMarkingEnabled', 'negativeMarksPerQuestion', 'studentsPerShift',
    'examCenter', 'centerLatitude', 'centerLongitude', 'allowedRadiusMeters',
    'geoCheckEnabled', 'status', 'shiftName',
  ];
  const numericFields = ['duration', 'totalQuestions', 'studentsPerShift', 'centerLatitude', 'centerLongitude', 'allowedRadiusMeters', 'negativeMarksPerQuestion'];

  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      exam[k] = numericFields.includes(k) ? toNumber(req.body[k]) : req.body[k];
    }
  }

  if (req.body.targetClasses !== undefined) {
    exam.targetClasses = Array.isArray(req.body.targetClasses)
      ? req.body.targetClasses.join(',')
      : req.body.targetClasses;
  }

  await exam.save();
  res.json({ success: true, exam, message: 'Exam updated' });
};

/* ===== Delete Exam ===== */
exports.remove = async (req, res) => {
  const exam = await Exam.findByPk(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  await exam.destroy();
  res.json({ success: true, message: 'Exam deleted' });
};

/* ===== Publish / Status ===== */
exports.publish = async (req, res) => {
  const exam = await Exam.findByPk(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  exam.status = req.body.status || 'PUBLISHED';
  await exam.save();
  res.json({ success: true, exam });
};

/* ===== Toggle Exam Access ===== */
exports.toggleAccess = async (req, res) => {
  const exam = await Exam.findByPk(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  exam.examAccessEnabled = !!req.body.enabled;
  await exam.save();
  res.json({ success: true, exam, message: `Exam access ${exam.examAccessEnabled ? 'enabled' : 'disabled'}` });
};

/* ===== Start Exam (student) ===== */
exports.start = async (req, res) => {
  const exam = await Exam.findByPk(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  if (exam.status !== 'PUBLISHED')
    return res.status(403).json({ success: false, message: 'Exam is not available' });

  if (!exam.examAccessEnabled)
    return res.status(403).json({ success: false, message: 'Exam access not enabled by admin yet. Please wait.' });

  const assignment = await ExamAssignment.findOne({ where: { examId: exam.id, userId: req.user.id } });

  if (!assignment)
    return res.status(403).json({ success: false, message: 'This exam is not assigned to you' });
  if (!assignment.canAttempt)
    return res.status(403).json({ success: false, message: 'Your attempt permission was revoked' });
  if (!assignment.admitCardReleased)
    return res.status(403).json({ success: false, message: 'Admit card not released for your shift yet' });

  const shiftDate = assignment.assignedDate || exam.date;
  const shiftStart = assignment.startTime || exam.startTime;
  const shiftEnd = assignment.endTime || exam.endTime;

  const now = new Date();
  const start = examDateTimeIST(shiftDate, shiftStart);
  const end = examDateTimeIST(shiftDate, shiftEnd);

  if (now < start)
    return res.status(403).json({ success: false, message: `Your exam starts at ${toTime(shiftStart)} on ${toDateOnly(shiftDate)} (${assignment.shiftName || 'your shift'}).` });
  if (now > end)
    return res.status(403).json({ success: false, message: 'Your exam time window has ended' });

  const existing = await ExamAttempt.findOne({ where: { userId: req.user.id, examId: exam.id } });

  if (existing && existing.status !== 'IN_PROGRESS')
    return res.status(403).json({ success: false, message: 'You have already submitted this exam' });

  let attempt = existing;
  let questions;

  if (attempt) {
    const answers = await Answer.findAll({
      where: { attemptId: attempt.id },
      attributes: ['questionId', 'selectedAnswer', 'markForReview'],
    });
    const qIds = answers.map((a) => a.questionId);
    const qList = await Question.findAll({
      where: { id: qIds },
      attributes: { exclude: ['correctAnswer', 'createdAt', 'updatedAt'] },
    });
    const aMap = Object.fromEntries(answers.map((a) => [a.questionId, a]));
    questions = qList.map((q) => ({
      ...q.toJSON(),
      savedAnswer: aMap[q.id]?.selectedAnswer || '',
      markForReview: aMap[q.id]?.markForReview || false,
    }));
  } else {
    const all = await Question.findAll({
      where: { examId: exam.id },
      attributes: { exclude: ['correctAnswer', 'createdAt', 'updatedAt'] },
    });
    const limit = exam.totalQuestions || all.length;
    const picked = shuffle([...all]).slice(0, limit);

    attempt = await ExamAttempt.create({ userId: req.user.id, examId: exam.id, startTime: now });
    await Answer.bulkCreate(picked.map((q) => ({ attemptId: attempt.id, questionId: q.id })));

    questions = picked.map((q) => ({ ...q.toJSON(), savedAnswer: '', markForReview: false }));
  }

  res.json({
    success: true,
    exam: {
      id: exam.id, title: exam.title, duration: exam.duration,
      totalQuestions: exam.totalQuestions,
      negativeMarkingEnabled: exam.negativeMarkingEnabled,
      negativeMarksPerQuestion: exam.negativeMarksPerQuestion,
    },
    questions, attemptId: attempt.id,
    serverTime: new Date().toISOString(),
    shiftEndsAt: end.toISOString(),
  });
};

/* ===== Save Answer ===== */
exports.saveAnswer = async (req, res) => {
  const { attemptId, questionId, selectedAnswer, markForReview } = req.body;
  await Answer.upsert({ attemptId, questionId, selectedAnswer: selectedAnswer || '', markForReview: !!markForReview });
  res.json({ success: true });
};

/* ===== Submit Exam ===== */
exports.submit = async (req, res) => {
  const { attemptId, answers = [], auto = false } = req.body;
  const attempt = await ExamAttempt.findByPk(attemptId, { include: [Exam] });
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your attempt' });

  for (const a of answers) {
    await Answer.upsert({ attemptId: attempt.id, questionId: a.questionId, selectedAnswer: a.selectedAnswer || '' });
  }

  attempt.status = auto ? 'AUTO_SUBMITTED' : 'SUBMITTED';
  attempt.endTime = new Date();
  await attempt.save();
  await calculateResult(attempt, attempt.Exam);

  res.json({ success: true, message: auto ? 'Exam auto-submitted (time over)' : 'Exam submitted successfully' });
};

/* ===== Security Event ===== */
exports.securityEvent = async (req, res) => {
  const { attemptId, type } = req.body;
  const attempt = await ExamAttempt.findByPk(attemptId);
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your attempt' });
  if (attempt.status === 'DISQUALIFIED') return res.json({ success: true, disqualified: true });

  if (type === 'TAB_SWITCH') attempt.tabSwitchCount += 1;
  else if (type === 'DISCONNECT') attempt.disconnectCount += 1;

  let disqualified = false;
  if (attempt.tabSwitchCount >= 3) {
    attempt.status = 'DISQUALIFIED';
    attempt.endTime = new Date();
    disqualified = true;
  }
  await attempt.save();

  res.json({
    success: true,
    tabSwitchCount: attempt.tabSwitchCount,
    disconnectCount: attempt.disconnectCount,
    remainingWarnings: Math.max(0, 3 - attempt.tabSwitchCount),
    disqualified,
    message: disqualified
      ? 'Exam terminated due to 3 tab switch violations.'
      : `Warning ${attempt.tabSwitchCount}/3. ${3 - attempt.tabSwitchCount} remaining.`,
  });
};

/* ===== Security Report ===== */
exports.securityReport = async (req, res) => {
  const attempts = await ExamAttempt.findAll({
    where: { examId: req.params.id },
    include: [{ model: User, attributes: ['id', 'name', 'registrationId', 'className', 'email'] }],
    order: [['tabSwitchCount', 'DESC']],
  });
  res.json({
    success: true,
    attempts: attempts.map((a) => ({
      studentId: a.userId, studentName: a.User?.name,
      registrationId: a.User?.registrationId, className: a.User?.className,
      status: a.status, tabSwitchCount: a.tabSwitchCount,
      disconnectCount: a.disconnectCount, startTime: a.startTime, endTime: a.endTime,
    })),
  });
};
