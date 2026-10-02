/**
 * auth.js — Auth routes with validation middleware
 */

const express = require('express');
const router  = express.Router();

const authCtrl = require('../controllers/authController');
const { auth, requireRole } = require('../middleware/auth');

const {
  validateRegister,
  validateLogin,
  validateForgotSendOtp,
  validateResetPassword,
} = require('../middleware/validate');

const asyncHandler = require('../utils/asyncHandler');

// ── Public Routes ──
router.post('/register', validateRegister, asyncHandler(authCtrl.register));
router.post('/login', validateLogin, asyncHandler(authCtrl.login));
router.post('/send-otp', asyncHandler(authCtrl.sendOtp));
router.post('/forgot-password/send-otp', validateForgotSendOtp, asyncHandler(authCtrl.forgotPasswordSendOtp));
router.post('/forgot-password/reset', validateResetPassword, asyncHandler(authCtrl.resetPassword));
router.get('/registration-status', asyncHandler(authCtrl.registrationStatus));
router.post('/toggle-registration', auth, requireRole('ADMIN'), asyncHandler(authCtrl.toggleRegistration));
router.post('/logout', asyncHandler(authCtrl.logout));

// ── Protected Route ──
router.get('/me', auth, asyncHandler((req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      registrationId: req.user.registrationId,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      className: req.user.className,
      fatherName: req.user.fatherName,
      mobile: req.user.mobile,
      dob: req.user.dob,
      city: req.user.city,
      state: req.user.state,
      pincode: req.user.pincode,
      address: req.user.address,
    },
  });
}));

module.exports = router;