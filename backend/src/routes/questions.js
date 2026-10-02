const router = require('express').Router();
const multer = require('multer');
const controller = require('../controllers/questionController');
const asyncHandler = require('../utils/asyncHandler');
const { auth, requireRole } = require('../middleware/auth');

/* ---- Multer config for CSV upload ---- */
const upload = multer({ dest: 'src/uploads/' });

/* ---- All question routes require admin ---- */
router.use(auth, requireRole('ADMIN'));

/* ---- CSV Upload ---- */
router.post('/upload/:examId', upload.single('file'), asyncHandler(controller.uploadCsv));

/* ---- CRUD ---- */
router.get('/', asyncHandler(controller.list));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

/* ---- Exam-level operations ---- */
router.delete('/exam/:examId', asyncHandler(controller.deleteByExam));
router.get('/stats/:examId', asyncHandler(controller.stats));

module.exports = router;
