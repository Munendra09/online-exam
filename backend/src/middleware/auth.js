const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );

    const userId = decoded.userId || decoded.id;

    const user = await User.findByPk(userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account disabled or not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  };
}

module.exports = { auth, requireRole };