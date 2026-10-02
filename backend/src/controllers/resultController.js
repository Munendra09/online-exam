const { Result, Exam, User, Question, Answer, ExamAttempt, ExamAssignment } = require('../models');

/**
 * Result/AnswerKey are now exam-level flags (not per-assignment).
 * Admin sets exam.resultReleased / exam.answerKeyReleased globally.
 */
function releaseAllowed(exam) {
  return !!exam.resultReleased;
}

function keyAllowed(exam, role) {
  if (role === 'ADMIN') return true;
  return !!exam.answerKeyReleased;
}

exports.myResults = async (req, res) => {
  const results = await Result.findAll({
    where: { userId: req.user.id },
    include: [Exam],
    order: [['createdAt', 'DESC']],
  });
  const released = results.filter((r) => r.Exam && releaseAllowed(r.Exam));
  res.json({ success: true, results: released });
};

exports.detail = async (req, res) => {
  const result = await Result.findOne({
    where: { userId: req.user.id, examId: req.params.examId },
    include: [Exam],
  });
  if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
  if (!releaseAllowed(result.Exam))
    return res.status(403).json({ success: false, message: 'Result not yet released by admin' });

  const attempt = await ExamAttempt.findOne({
    where: { userId: req.user.id, examId: req.params.examId },
    include: [{ model: Answer, include: [{ model: Question, attributes: ['id','question','optionA','optionB','optionC','optionD','correctAnswer'] }] }],
  });
  res.json({ success: true, result, attempt });
};

exports.adminAll = async (req, res) => {
  const results = await Result.findAll({
    include: [
      { model: User, attributes: ['id','name','email','className','city','registrationId'] },
      Exam,
    ],
    order: [['score', 'DESC']],
  });
  res.json({ success: true, results });
};

exports.leaderboard = async (req, res) => {
  const limit = Number(req.query.limit || 5);
  const results = await Result.findAll({
    include: [
      { model: User, attributes: ['name','registrationId'] },
      { model: Exam, attributes: ['title'] },
    ],
    order: [['score', 'DESC']],
    limit,
  });
  res.json({ success: true, leaderboard: results });
};

exports.answerKey = async (req, res) => {
  const exam = await Exam.findByPk(req.params.examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  if (!keyAllowed(exam, req.user.role))
    return res.status(403).json({ success: false, message: 'Answer key not yet released by admin' });

  const attempt = await ExamAttempt.findOne({
    where: { userId: req.user.id, examId: exam.id },
    include: [{ model: Answer, include: [{ model: Question, attributes: ['id','question','optionA','optionB','optionC','optionD','correctAnswer'] }] }],
  });
  if (!attempt) return res.status(404).json({ success: false, message: 'You have not attempted this exam' });

  const questions = (attempt.Answers || [])
    .filter((a) => a.Question)
    .map((a) => ({
      id: a.Question.id, question: a.Question.question,
      optionA: a.Question.optionA, optionB: a.Question.optionB,
      optionC: a.Question.optionC, optionD: a.Question.optionD,
      correctAnswer: a.Question.correctAnswer,
      studentAnswer: a.selectedAnswer || null,
      isCorrect: a.selectedAnswer === a.Question.correctAnswer,
      isAttempted: !!a.selectedAnswer,
    }));

  res.json({ success: true, exam, questions });
};

exports.adminStudentExam = async (req, res) => {
  const [attempt, result] = await Promise.all([
    ExamAttempt.findOne({
      where: { userId: req.params.userId, examId: req.params.examId },
      include: [Exam, { model: Answer, include: [{ model: Question, attributes: ['id','question','optionA','optionB','optionC','optionD','correctAnswer'] }] }],
    }),
    Result.findOne({
      where: { userId: req.params.userId, examId: req.params.examId },
      include: [User, Exam],
    }),
  ]);
  res.json({ success: true, attempt, result });
};
