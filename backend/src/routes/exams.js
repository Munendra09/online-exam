const router = require('express').Router();
const c = require('../controllers/examController');
const ah = require('../utils/asyncHandler');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth);

router.post('/', requireRole('ADMIN'), ah(c.create));
router.put('/:id', requireRole('ADMIN'), ah(c.update));
router.delete('/:id', requireRole('ADMIN'), ah(c.remove));
router.patch('/:id/status', requireRole('ADMIN'), ah(c.publish));
router.patch('/:id/toggle-access', requireRole('ADMIN'), ah(c.toggleAccess));
router.get('/:id/security-report', requireRole('ADMIN'), ah(c.securityReport));

router.get('/', ah(c.list));
router.post('/:id/start', requireRole('STUDENT'), ah(c.start));
router.post('/answers/save', requireRole('STUDENT'), ah(c.saveAnswer));
router.post('/submit', requireRole('STUDENT'), ah(c.submit));
router.post('/security-event', requireRole('STUDENT'), ah(c.securityEvent));

module.exports = router;
