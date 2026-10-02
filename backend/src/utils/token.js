const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * Includes user id, role, and sessionVersion for session management.
 */
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      sessionVersion: user.sessionVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { signToken };
