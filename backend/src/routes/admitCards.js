const router = require('express').Router();
const ah = require('../utils/asyncHandler');
const { auth, requireRole } = require('../middleware/auth');
const { myAdmitCard } = require('../controllers/admitController');

router.get('/:examId', auth, requireRole('STUDENT'), ah(myAdmitCard));

module.exports = router;
