const router = require('express').Router();
const controller = require('../controllers/classController');
const asyncHandler = require('../utils/asyncHandler');
const { auth, requireRole } = require('../middleware/auth');

/* ---- Public: list classes (for registration dropdown) ---- */
router.get('/', asyncHandler(controller.list));

/* ---- Admin only: add, update, delete classes ---- */
router.post('/', auth, requireRole('ADMIN'), asyncHandler(controller.add));
router.put('/:name', auth, requireRole('ADMIN'), asyncHandler(controller.update));
router.delete('/:name', auth, requireRole('ADMIN'), asyncHandler(controller.remove));

module.exports = router;
