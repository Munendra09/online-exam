const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  User, Exam, Question, ExamAttempt, Answer, Result, ExamAssignment,
} = require('../models');
const {
  allocateShiftsForExam, ensureAssignmentsForClasses,
} = require('../services/shiftService');
const { sendReleaseMail } = require('../services/mailService');
const cache = require('../services/cacheService');

async function notifyAssignedStudents(exam, type) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const links = {
    admit: `${frontendUrl}/admit-card`,
    answerKey: `${frontendUrl}/answer-key`,
    result: `${frontendUrl}/results`,
  };

  const assignments = await ExamAssignment.findAll({
    where: { examId: exam.id },
    include: [
      {
        model: User,
        attributes: ['id', 'name', 'email', 'isActive'],
        where: {
          role: 'STUDENT',
          isActive: true,
        },
      },
    ],
  });

  const students = assignments
    .map((a) => a.User)
    .filter((s) => s && s.email);

  const uniqueStudents = Array.from(
    new Map(students.map((s) => [s.email, s])).values()
  );

  await Promise.allSettled(
    uniqueStudents.map((student) =>
      sendReleaseMail({
        to: student.email,
        name: student.name,
        examTitle: exam.title,
        type,
        link: links[type],
      })
    )
  );

  return uniqueStudents.length;
}

/* ===== Dashboard (cached 2 min) ===== */
exports.dashboard = async (req, res) => {
  const data = await cache.getOrSet('admin:dashboard', async () => {
    const seq = User.sequelize;
    const [students, activeStudents, exams, questions, attempts, classDist, cityDist, resultDist, topStudents] = await Promise.all([
      User.count({ where: { role: 'STUDENT' } }),
      User.count({ where: { role: 'STUDENT', isActive: true } }),
      Exam.count(),
      Question.count(),
      ExamAttempt.count({ where: { status: ['SUBMITTED', 'AUTO_SUBMITTED'] } }),

      /* Class distribution */
      User.findAll({
        attributes: ['className', [seq.fn('COUNT', seq.col('id')), 'count']],
        where: { role: 'STUDENT', className: { [Op.ne]: null } },
        group: ['className'],
        order: [[seq.fn('COUNT', seq.col('id')), 'DESC']],
        raw: true,
      }),

      /* City distribution */
      User.findAll({
        attributes: ['city', [seq.fn('COUNT', seq.col('id')), 'count']],
        where: { role: 'STUDENT', city: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
        group: ['city'],
        order: [[seq.fn('COUNT', seq.col('id')), 'DESC']],
        limit: 10,
        raw: true,
      }),

      /* Result grade distribution */
      Result.findAll({
        attributes: ['grade', [seq.fn('COUNT', seq.col('Result.id')), 'count']],
        group: ['grade'],
        order: [['grade', 'ASC']],
        raw: true,
      }),

      /* Top 10 students */
      Result.findAll({
        include: [{ model: User, attributes: ['name', 'className', 'city'] }],
        order: [['score', 'DESC']],
        limit: 10,
      }),
    ]);

    return {
      stats: { students, activeStudents, exams, questions, attempts },
      classDistribution: classDist.map((r) => ({ className: r.className, count: Number(r.count) })),
      cityDistribution: cityDist.map((r) => ({ city: r.city || 'Unknown', count: Number(r.count) })),
      resultDistribution: resultDist.map((r) => ({ grade: r.grade || 'NA', count: Number(r.count) })),
      topStudents,
    };
  }, 120); // 2 minute cache

  res.json({ success: true, ...data });
};


/* ===== Filter Options (cached 10 min) ===== */
exports.filterOptions = async (req, res) => {
  const data = await cache.getOrSet('admin:filterOptions', async () => {
    const classes = await User.findAll({
      attributes: ['className'],
      where: { role: 'STUDENT', className: { [Op.ne]: null } },
      group: ['className'],
      order: [['className', 'ASC']],
      raw: true,
    });
    const cities = await User.findAll({
      attributes: ['city'],
      where: { role: 'STUDENT', city: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
      group: ['city'],
      order: [['city', 'ASC']],
      raw: true,
    });
    return {
      classes: classes.map((c) => c.className),
      cities: cities.map((c) => c.city).filter(Boolean),
    };
  }, 600); // 10 minute cache

  res.json({ success: true, ...data });
};

/* ===== Students List ===== */
exports.students = async (req, res) => {
  const {
    page = 1, limit = 20, search = '', className, city, isActive,
    sortBy = 'createdAt', sortOrder = 'DESC',
  } = req.query;

  const where = { role: 'STUDENT' };
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { mobile: { [Op.like]: `%${search}%` } },
      { registrationId: { [Op.like]: `%${search}%` } },
    ];
  }
  if (className) where.className = className;
  if (city) where.city = city;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const data = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    order: [[sortBy, sortOrder]],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({
    success: true, total: data.count, students: data.rows,
    page: Number(page), pages: Math.ceil(data.count / Number(limit)),
  });
};

/* ===== Create Student ===== */
exports.createStudent = async (req, res) => {
  const { name, email, password, mobile, className, isActive = true, fatherName, dob, photo, city, state, pincode, address } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });

  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });

  const year = new Date().getFullYear();
  const last = await User.findOne({
    where: { role: 'STUDENT', registrationId: { [Op.like]: `LTA${year}%` } },
    order: [['registrationId', 'DESC']],
  });
  let nextN = 1;
  if (last?.registrationId) nextN = (parseInt(last.registrationId.slice(-5), 10) || 0) + 1;
  const registrationId = `LTA${year}${String(nextN).padStart(5, '0')}`;

  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 10));
  const user = await User.create({
    name, email, registrationId, password: hash,
    mobile, className, isActive, role: 'STUDENT',
    fatherName, dob: dob && !isNaN(new Date(dob).getTime()) ? dob : null,
    photo, emailVerified: true,
    city: city || null,
    state: state || null,
    pincode: pincode || null,
    address: address || null,
  });

  // Invalidate admin caches after student creation
  cache.invalidatePrefix('admin:');

  res.status(201).json({
    success: true,
    message: `Student created (ID: ${user.registrationId})`,
    user: { id: user.id, registrationId: user.registrationId, name: user.name, email: user.email },
  });
};

/* ===== Update / Delete Student ===== */
exports.updateStudent = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Not found' });

  const allowed = ['name', 'email', 'mobile', 'className', 'isActive', 'fatherName', 'dob', 'photo', 'emailVerified', 'city', 'state', 'pincode', 'address'];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      user[k] = k === 'dob'
        ? (req.body[k] && !isNaN(new Date(req.body[k]).getTime()) ? req.body[k] : null)
        : req.body[k];
    }
  }
  if (req.body.password) {
    user.password = await bcrypt.hash(req.body.password, Number(process.env.BCRYPT_ROUNDS || 10));
    user.sessionVersion += 1;
  }
  await user.save();
  cache.invalidatePrefix('admin:');
  res.json({ success: true, message: 'Updated', user });
};

exports.deleteStudent = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Not found' });
  await user.destroy();
  cache.invalidatePrefix('admin:');
  res.json({ success: true, message: 'Deleted' });
};

exports.studentDetails = async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] },
    include: [
      { model: ExamAssignment, include: [Exam] },
      { model: Result, include: [Exam] },
    ],
  });
  if (!user) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, student: user });
};

/* ===== Reset Exam ===== */
exports.resetExam = async (req, res) => {
  const studentId = req.params.id;
  const examId = req.body.examId;
  if (!examId) return res.status(400).json({ success: false, message: 'examId required' });

  const attempt = await ExamAttempt.findOne({ where: { userId: studentId, examId } });
  if (attempt) {
    await Answer.destroy({ where: { attemptId: attempt.id } });
    await attempt.destroy();
  }
  await Result.destroy({ where: { userId: studentId, examId } });
  res.json({ success: true, message: 'Reset successful. Student can re-attempt.' });
};

/* ===== Exam Control Data ===== */
exports.controlData = async (req, res) => {
  const exam = await Exam.findByPk(req.params.examId, {
    include: [
      Question,
      { model: ExamAssignment, include: [{ model: User, attributes: ['id', 'name', 'email', 'className', 'registrationId'] }] },
    ],
  });
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  const byShift = {};
  for (const a of exam.ExamAssignments || []) {
    const k = a.shiftNumber || 'unassigned';
    (byShift[k] = byShift[k] || []).push(a);
  }

  res.json({
    success: true,
    exam: {
      ...exam.toJSON(),
      questionCount: exam.Questions?.length || 0,
      assignmentCount: exam.ExamAssignments?.length || 0,
    },
    shiftGroups: byShift,
  });
};

/* ===== Sync Assignments ===== */
exports.syncAssignments = async (req, res) => {
  const result = await ensureAssignmentsForClasses(req.params.examId);
  res.json({
    success: true,
    message: `${result.created} new assignments created (total matching students: ${result.total})`,
    ...result,
  });
};

/* ===== Release Admit Cards (auto-allocate shifts) ===== */
exports.releaseAdmitCards = async (req, res) => {
  await ensureAssignmentsForClasses(req.params.examId);
  const result = await allocateShiftsForExam(req.params.examId);

  const exam = await Exam.findByPk(req.params.examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  exam.admitCardReleased = true;
  await exam.save();

  await ExamAssignment.update(
    { admitCardReleased: true },
    { where: { examId: exam.id, shiftNumber: { [Op.ne]: null } } }
  );

  const mailed = await notifyAssignedStudents(exam, 'admit');

  res.json({
    success: true,
    message: `Admit cards released. ${result.assigned} students placed into shifts. Mail sent to ${mailed} students.`,
    ...result,
  });
};

/* ===== Release Answer Key ===== */
exports.releaseAnswerKey = async (req, res) => {
  const exam = await Exam.findByPk(req.params.examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Not found' });

  exam.answerKeyReleased = !!req.body.value;
  await exam.save();

  let mailed = 0;

  if (exam.answerKeyReleased) {
    mailed = await notifyAssignedStudents(exam, 'answerKey');
  }

  res.json({
    success: true,
    exam,
    message: `Answer key ${exam.answerKeyReleased ? `released. Mail sent to ${mailed} students.` : 'hidden'}`,
  });
};

/* ===== Release Result ===== */
exports.releaseResult = async (req, res) => {
  const exam = await Exam.findByPk(req.params.examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Not found' });

  exam.resultReleased = !!req.body.value;
  await exam.save();

  let mailed = 0;

  if (exam.resultReleased) {
    mailed = await notifyAssignedStudents(exam, 'result');
  }

  res.json({
    success: true,
    exam,
    message: `Result ${exam.resultReleased ? `released. Mail sent to ${mailed} students.` : 'hidden'}`,
  });
};

/* ===== Toggle Admit Release (bulk flag) ===== */
exports.toggleAdmitRelease = async (req, res) => {
  const exam = await Exam.findByPk(req.params.examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
  exam.admitCardReleased = !!req.body.value;
  await exam.save();
  await ExamAssignment.update(
    { admitCardReleased: exam.admitCardReleased },
    { where: { examId: exam.id, shiftNumber: { [Op.ne]: null } } }
  );
  res.json({ success: true, exam });
};

/* ===== Update Single Assignment ===== */
exports.updateAssignment = async (req, res) => {
  const row = await ExamAssignment.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  await row.update(req.body);
  res.json({ success: true, assignment: row });
};

exports.deleteAssignment = async (req, res) => {
  const row = await ExamAssignment.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  await row.destroy();
  res.json({ success: true, message: 'Removed' });
};

/* ===== Results ===== */
exports.results = async (req, res) => {
  const { examId, className, grade, search } = req.query;
  const resultWhere = {};
  if (examId) resultWhere.examId = examId;
  if (grade) resultWhere.grade = grade;

  const userWhere = { role: 'STUDENT' };
  if (className) userWhere.className = className;
  if (search) {
    userWhere[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { registrationId: { [Op.like]: `%${search}%` } },
    ];
  }

  const results = await Result.findAll({
    where: resultWhere,
    include: [
      { model: User, attributes: ['id', 'name', 'email', 'className', 'registrationId'], where: userWhere },
      Exam,
    ],
    order: [['score', 'DESC']],
  });

  res.json({ success: true, results });
};

/* ===== Re-enable disqualified student ===== */
exports.enableStudent = async (req, res) => {
  const { examId, userId } = req.params;
  const attempt = await ExamAttempt.findOne({ where: { userId, examId } });
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.status !== 'DISQUALIFIED')
    return res.status(400).json({ success: false, message: `Status: ${attempt.status}` });
  attempt.status = 'IN_PROGRESS';
  attempt.tabSwitchCount = 0;
  attempt.disconnectCount = 0;
  attempt.endTime = null;
  await attempt.save();
  res.json({ success: true, message: 'Student re-enabled' });
};
