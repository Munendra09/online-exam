const router = require('express').Router();
const controller = require('../controllers/resultController');
const asyncHandler = require('../utils/asyncHandler');
const { auth, requireRole } = require('../middleware/auth');

/* ---- All result routes require authentication ---- */
router.use(auth);

/* ---- Student routes ---- */
router.get('/me', requireRole('STUDENT'), asyncHandler(controller.myResults));
router.get('/leaderboard', asyncHandler(controller.leaderboard));
router.get('/answer-key/:examId', asyncHandler(controller.answerKey));
router.get('/:examId', requireRole('STUDENT'), asyncHandler(controller.detail));

/* ---- Admin routes ---- */
router.get('/admin/all', requireRole('ADMIN'), asyncHandler(controller.adminAll));
router.get(
  '/admin/student/:userId/exam/:examId',
  requireRole('ADMIN'),
  asyncHandler(controller.adminStudentExam)
);

module.exports = router;
