/**
 * authController.js — Enhanced with full server-side validation
 * Lucky Tech Academy Exam Portal
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User, Setting } = require('../models');
const otpService  = require('../services/otpService');
const mailService = require('../services/mailService');
const { Op }      = require('sequelize');

/* ─────────────────────────────────────────
   Validation Helpers
───────────────────────────────────────── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\s/g, ''));
}
function isValidPincode(pin) {
  return /^\d{6}$/.test(pin);
}
function isValidPassword(password) {
  return password && password.length >= 6;
}
function generateRegId(seq) {
  const year = new Date().getFullYear();
  return `LTA${year}${String(seq).padStart(5, '0')}`;
}

/**
 * Mask an email for safe display: m*****1@gmail.com
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}

/* ─────────────────────────────────────────
   POST /auth/register
───────────────────────────────────────── */
async function register(req, res) {
  const {
    name, email, password, confirmPassword, mobile,
    className, fatherName, dob, city, state, pincode,
    address, otp,
  } = req.body;

  // ── Required field checks ──
  const missing = [];
  if (!name?.trim())     missing.push('name');
  if (!email?.trim())    missing.push('email');
  if (!password)         missing.push('password');
  if (!className?.trim()) missing.push('className');
  if (!otp)              missing.push('otp');
  if (missing.length) {
    return res.status(422).json({
      success: false,
      message: `Required fields missing: ${missing.join(', ')}`,
      fields: missing,
    });
  }

  // ── Format checks ──
  if (!isValidEmail(email)) {
    return res.status(422).json({ success: false, message: 'Please enter a valid email address.' });
  }
  if (!isValidPassword(password)) {
    return res.status(422).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  if (confirmPassword && password !== confirmPassword) {
    return res.status(422).json({ success: false, message: 'Passwords do not match.' });
  }
  if (mobile && !isValidMobile(mobile)) {
    return res.status(422).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
  }
  if (pincode && !isValidPincode(pincode)) {
    return res.status(422).json({ success: false, message: 'Pincode must be exactly 6 digits.' });
  }
  if (name.trim().length < 2) {
    return res.status(422).json({ success: false, message: 'Name must be at least 2 characters.' });
  }

  // ── DOB / age check ──
  if (dob) {
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) {
      return res.status(422).json({ success: false, message: 'Please enter a valid date of birth.' });
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    if (age < 5 || age > 80) {
      return res.status(422).json({ success: false, message: 'Please enter a valid date of birth.' });
    }
  }

  // ── Registration open? ──
  try {
    const { isOpen, message } = await require('../services/settingsService').getAllRegistration();
    if (!isOpen) {
      return res.status(403).json({ success: false, message: message || 'Student registration is currently closed.' });
    }
  } catch (_) { /* settings check is non-blocking */ }

  // ── OTP verification ──
  const otpResult = otpService.verifyOtp(email.toLowerCase().trim(), otp);
  if (!otpResult.valid) {
    return res.status(422).json({
      success: false,
      message: otpResult.reason === 'expired' ? 'OTP has expired. Please request a new one.' : 'Invalid OTP. Please check and try again.',
    });
  }

  // ── Duplicate check ──
  const existing = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  // ── Create user ──
  const count = await User.count();
  const registrationId = generateRegId(count + 1);
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    registrationId,
    name:           name.trim(),
    email:          email.toLowerCase().trim(),
    password:       hashedPassword,
    role:           'STUDENT',
    className:      className.trim(),
    mobile:         mobile?.trim() || null,
    fatherName:     fatherName?.trim() || null,
    dob:            dob || null,
    city:           city?.trim() || null,
    state:          state?.trim() || null,
    pincode:        pincode?.trim() || null,
    address:        address?.trim() || null,
    emailVerified:  true,
    isActive:       true,
    registrationStatus: 'APPROVED',
  });

  // Send welcome email (non-blocking)
  mailService.sendWelcome?.(user).catch(() => {});

  return res.status(201).json({
    success: true,
    message: 'Registration successful!',
    user: {
      id: user.id,
      registrationId: user.registrationId,
      name: user.name,
      email: user.email,
      className: user.className,
    },
  });
}

/* ─────────────────────────────────────────
   POST /auth/login
───────────────────────────────────────── */
async function login(req, res) {
  const { email, password } = req.body;

  // ── Basic presence checks ──
  if (!email?.trim()) {
    return res.status(422).json({ success: false, message: 'Email or Registration ID is required.' });
  }
  if (!password) {
    return res.status(422).json({ success: false, message: 'Password is required.' });
  }
  if (password.length < 6) {
    return res.status(422).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const identifier = email.trim().toLowerCase();

  // ── Find user by email OR registrationId ──
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { email: identifier },
        { registrationId: email.trim().toUpperCase() },
      ],
    },
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'No account found with that email or Registration ID.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the admin.' });
  }

  if (user.registrationStatus === 'BLOCKED') {
    return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact the admin.' });
  }

  // ── Password check ──
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
  }

// ── Issue JWT (httpOnly cookie) ──
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET || 'secret',
  { expiresIn: '7d' }
);
const isProduction = process.env.NODE_ENV === 'production';
res.cookie('token', token, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

  return res.json({
    success: true,
    message: 'Login successful',
    user: {
      id:             user.id,
      registrationId: user.registrationId,
      name:           user.name,
      email:          user.email,
      role:           user.role,
      className:      user.className,
      fatherName:     user.fatherName,
      mobile:         user.mobile,
      dob:            user.dob,
      city:           user.city,
      state:          user.state,
      pincode:        user.pincode,
      address:        user.address,
    },
  });
}

/* ─────────────────────────────────────────
   POST /auth/send-otp
───────────────────────────────────────── */
async function sendOtp(req, res) {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(422).json({ success: false, message: 'Email is required to send OTP.' });
  }
  if (!isValidEmail(email)) {
    return res.status(422).json({ success: false, message: 'Please enter a valid email address.' });
  }

  // Check duplicate
  const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const result = await otpService.generateAndSendOtp(email.toLowerCase().trim());
  // Never leak OTP in server mode; return masked email
  return res.json({
    success: true,
    otp: result.mode === 'server' ? null : result.otp,
    expiresAt: result.expiresAt,
    expiresIn: result.expiresIn,
    mode: result.mode,
    sent: result.sent,
    maskedEmail: maskEmail(email.toLowerCase().trim()),
  });
}

/* ─────────────────────────────────────────
   POST /auth/forgot-password/send-otp
───────────────────────────────────────── */
async function forgotPasswordSendOtp(req, res) {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(422).json({ success: false, message: 'Email or Registration ID is required.' });
  }

  const identifier = email.trim();
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { email: identifier.toLowerCase() },
        { registrationId: identifier.toUpperCase() },
      ],
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with that email or Registration ID.' });
  }

  const result = await otpService.generateAndSendOtp(user.email, 'forgot');
  // Return masked email — never expose full email in API response
  return res.json({
    success: true,
    maskedEmail: maskEmail(user.email),
    otp: result.mode === 'server' ? null : result.otp,
    expiresAt: result.expiresAt,
    expiresIn: result.expiresIn,
    mode: result.mode,
    sent: result.sent,
  });
}

/* ─────────────────────────────────────────
   POST /auth/forgot-password/reset
───────────────────────────────────────── */
async function resetPassword(req, res) {
  const { email, otp, newPassword, confirmNewPassword } = req.body;

  // ── Validation ──
  if (!email?.trim())  return res.status(422).json({ success: false, message: 'Email is required.' });
  if (!otp)            return res.status(422).json({ success: false, message: 'OTP is required.' });
  if (!/^\d{6}$/.test(otp)) return res.status(422).json({ success: false, message: 'OTP must be 6 digits.' });
  if (!isValidPassword(newPassword)) {
    return res.status(422).json({ success: false, message: 'New password must be at least 6 characters.' });
  }
  if (confirmNewPassword && newPassword !== confirmNewPassword) {
    return res.status(422).json({ success: false, message: 'Passwords do not match.' });
  }

  // ── Find & update user ──
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { email: email.toLowerCase().trim() },
        { registrationId: email.trim().toUpperCase() },
      ],
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found.' });
  }

  // ── OTP verify ──
  const otpResult = otpService.verifyOtp(user.email, otp);
  if (!otpResult.valid) {
    return res.status(422).json({
      success: false,
      message: otpResult.reason === 'expired' ? 'OTP has expired. Please request a new one.' : 'Invalid OTP.',
    });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await user.update({ password: hashed });

  return res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });
}

/* ─────────────────────────────────────────
   GET /auth/registration-status
───────────────────────────────────────── */
async function registrationStatus(req, res) {
  try {
    const status = await require('../services/settingsService').getAllRegistration();
    return res.json(status);
  } catch (_) {
    return res.json({ isOpen: true, registrationOpen: true, deadline: null, message: '' });
  }
}

/* ─────────────────────────────────────────
   POST /auth/logout
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   POST /auth/toggle-registration
───────────────────────────────────────── */
async function toggleRegistration(req, res) {
  const { open, message, deadline } = req.body;

  await Setting.setValue?.('registrationOpen', open === true ? 'true' : 'false');
  await Setting.setValue?.('registrationClosedMessage', message || '');
  await Setting.setValue?.('registrationDeadline', deadline || '');

  return res.json({
    success: true,
    message: 'Registration settings updated successfully.',
  });
}

function logout(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });

  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

module.exports = { register, login, sendOtp, forgotPasswordSendOtp, resetPassword, registrationStatus, toggleRegistration, logout };
