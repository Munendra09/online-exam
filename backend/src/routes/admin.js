const router = require('express').Router();
const c = require('../controllers/adminController');
const ah = require('../utils/asyncHandler');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('ADMIN'));

router.get('/dashboard', ah(c.dashboard));
router.get('/filter-options', ah(c.filterOptions));

router.get('/students', ah(c.students));
router.post('/students', ah(c.createStudent));
router.get('/students/:id', ah(c.studentDetails));
router.put('/students/:id', ah(c.updateStudent));
router.delete('/students/:id', ah(c.deleteStudent));
router.patch('/students/:id/reset-exam', ah(c.resetExam));

router.get('/exams/:examId/control-data', ah(c.controlData));
router.post('/exams/:examId/sync-assignments', ah(c.syncAssignments));
router.post('/exams/:examId/release-admit', ah(c.releaseAdmitCards));
router.patch('/exams/:examId/release-answer-key', ah(c.releaseAnswerKey));
router.patch('/exams/:examId/release-result', ah(c.releaseResult));
router.patch('/exams/:examId/toggle-admit', ah(c.toggleAdmitRelease));

router.patch('/assignments/:id', ah(c.updateAssignment));
router.delete('/assignments/:id', ah(c.deleteAssignment));

router.get('/results', ah(c.results));
router.patch('/exams/:examId/enable-student/:userId', ah(c.enableStudent));

module.exports = router;

// extra: reset student attempt from security panel
const examCtrl = require('../controllers/examController');
const ah2 = require('../utils/asyncHandler');
router.patch('/exams/:examId/reset-student/:userId', ah2(async (req, res) => {
  const { ExamAttempt, Answer, Result } = require('../models');
  const attempt = await ExamAttempt.findOne({ where: { userId: req.params.userId, examId: req.params.examId } });
  if (attempt) { await Answer.destroy({ where: { attemptId: attempt.id } }); await attempt.destroy(); }
  await Result.destroy({ where: { userId: req.params.userId, examId: req.params.examId } });
  res.json({ success: true, message: 'Reset done' });
}));
