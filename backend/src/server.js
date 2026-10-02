require('dotenv').config();

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const { sequelize } = require('./models');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);

/* ===== CORS ===== */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

/* ===== Security & Compression ===== */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());

/* ===== Body Parsing ===== */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ===== Rate Limiting ===== */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
});

app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 15 minutes and try again.',
  },
});

/* ===== Health Check ===== */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date(),
    uptime: process.uptime(),
  });
});

/* ===== Safe Route Loader ===== */
function loadRouter(path) {
  const route = require(path);

  if (typeof route === 'function') {
    return route;
  }

  if (route && typeof route.router === 'function') {
    return route.router;
  }

  if (route && typeof route.default === 'function') {
    return route.default;
  }

  console.error(`❌ Invalid router export in: ${path}`);
  console.error('Expected: module.exports = router;');
  console.error('Received type:', typeof route);
  console.error('Received value:', route);

  throw new TypeError(`${path} must export an Express router`);
}

/* ===== Routes ===== */
const authRouter = loadRouter('./routes/auth');
const adminRouter = loadRouter('./routes/admin');
const examsRouter = loadRouter('./routes/exams');
const questionsRouter = loadRouter('./routes/questions');
const resultsRouter = loadRouter('./routes/results');
const admitCardsRouter = loadRouter('./routes/admitCards');
const classesRouter = loadRouter('./routes/classes');

app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/forgot-password/send-otp', otpLimiter);

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/exams', examsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/admit-cards', admitCardsRouter);
app.use('/api/classes', classesRouter);

/* ===== Error Handling ===== */
app.use(notFound);
app.use(errorHandler);

/* ===== Start Server ===== */
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    try {
      await sequelize.sync({ alter: true });
    } catch (syncErr) {
      console.log('⚠ Alter sync failed, using regular sync...');
      console.log(syncErr.message);
      await sequelize.sync();
    }

    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`);
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
}

startServer();