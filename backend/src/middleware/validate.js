/**
 * validate.js — Centralized validation middleware
 * Uses express-validator (already available in most Node/Express setups).
 * Fallback to manual checks if express-validator is not installed.
 */

let checkFn;
let validationResultFn;

try {
  const ev = require('express-validator');
  checkFn           = ev.check;
  validationResultFn = ev.validationResult;
} catch (_) {
  // express-validator not installed — use manual checks
  checkFn           = null;
  validationResultFn = null;
}

/* ─────────────────────────────────────────
   Simple manual validation middleware
   (used as fallback or standalone)
───────────────────────────────────────── */

/**
 * Returns a middleware that checks req.body for basic rules.
 * @param {Record<string, (value: any, body: any) => string|null>} rules
 */
function validate(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, ruleFn] of Object.entries(rules)) {
      const value = req.body[field];
      const error = ruleFn(value, req.body);
      if (error) errors.push({ field, message: error });
    }
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: errors[0].message,   // Show first error
        errors,
      });
    }
    next();
  };
}

/* ─────────────────────────────────────────
   Reusable rule functions
───────────────────────────────────────── */
const rules = {
  required: (label) => (v) =>
    !v || !String(v).trim() ? `${label} is required.` : null,

  email: () => (v) => {
    if (!v?.trim()) return 'Email is required.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Please enter a valid email address.';
  },

  password: (minLen = 6) => (v) => {
    if (!v) return 'Password is required.';
    return v.length >= minLen ? null : `Password must be at least ${minLen} characters.`;
  },

  confirmPassword: () => (v, body) => {
    if (!v) return 'Please confirm your password.';
    return v === body.password ? null : 'Passwords do not match.';
  },

  mobile: (optional = true) => (v) => {
    if (!v?.trim()) return optional ? null : 'Mobile number is required.';
    return /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''))
      ? null
      : 'Please enter a valid 10-digit mobile number.';
  },

  pincode: (optional = true) => (v) => {
    if (!v?.trim()) return optional ? null : 'Pincode is required.';
    return /^\d{6}$/.test(v) ? null : 'Pincode must be exactly 6 digits.';
  },

  otp: () => (v) => {
    if (!v) return 'OTP is required.';
    return /^\d{6}$/.test(v) ? null : 'OTP must be exactly 6 digits.';
  },

  minLen: (len, label) => (v) => {
    if (!v?.trim()) return `${label} is required.`;
    return v.trim().length >= len ? null : `${label} must be at least ${len} characters.`;
  },
};

/* ─────────────────────────────────────────
   Pre-built validators for routes
───────────────────────────────────────── */
const validateRegister = validate({
  name:     rules.minLen(2, 'Full name'),
  email:    rules.email(),
  password: rules.password(6),
  className: rules.required('Class / Course'),
  otp:       rules.otp(),
  mobile:    rules.mobile(true),
  pincode:   rules.pincode(true),
});

const validateLogin = validate({
  email: (v) => (!v?.trim() ? 'Email or Registration ID is required.' : null),
  password: rules.password(6),
});

const validateForgotSendOtp = validate({
  email: (v) => (!v?.trim() ? 'Email or Registration ID is required.' : null),
});

const validateResetPassword = validate({
  email: (v) => (!v?.trim() ? 'Email or Registration ID is required.' : null),
  otp:         rules.otp(),
  newPassword: rules.password(6),
});

/* ─────────────────────────────────────────
   Generic error response helper
   (call anywhere in controllers)
───────────────────────────────────────── */
function sendValidationError(res, message, field = null) {
  return res.status(422).json({
    success: false,
    message,
    ...(field ? { field } : {}),
  });
}

module.exports = {
  validate,
  rules,
  validateRegister,
  validateLogin,
  validateForgotSendOtp,
  validateResetPassword,
  sendValidationError,
};
