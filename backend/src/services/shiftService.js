/**
 * Shift Service — auto shift allocation for multi-class exams.
 *
 * Logic:
 *  - Each shift holds N students (studentsPerShift, default 25).
 *  - 3 shifts per day (Shift I, II, III).
 *  - Once a day is full, rolls to next day Shift I, II, III ...
 *  - Triggered when admin clicks "Release Admit Cards".
 *  - Supports targetClasses (comma-separated) — links all matching students.
 */
const { ExamAssignment, User, Exam } = require('../models');
const { Op } = require('sequelize');

const SHIFTS_PER_DAY = 3;
const DEFAULT_SHIFT_NAMES = ['Shift I', 'Shift II', 'Shift III'];

function decodeShiftNumber(n) {
  const zero = n - 1;
  const dayIndex = Math.floor(zero / SHIFTS_PER_DAY);
  const shiftNameIndex = zero % SHIFTS_PER_DAY;
  return { dayIndex, shiftNameIndex, shiftName: DEFAULT_SHIFT_NAMES[shiftNameIndex] };
}

function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeShiftTimes(startTimeStr, durationMinutes, shiftNameIndex) {
  const shiftGapMinutes = Number(process.env.SHIFT_GAP_MINUTES || 60);

  const [h, m] = String(startTimeStr).split(':').map(Number);

  const duration = Number(durationMinutes || 120);
  const startMinutes =
    h * 60 + m + shiftNameIndex * (duration + shiftGapMinutes);

  const endMinutes = startMinutes + duration;

  const fmt = (mins) => {
    const total = ((mins % 1440) + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`;
  };

  return { startTime: fmt(startMinutes), endTime: fmt(endMinutes) };
}

function makeRollNumber(examId, shiftNumber, seq) {
  return `LTA-${examId}-${String(shiftNumber).padStart(2, '0')}-${String(seq).padStart(3, '0')}`;
}

/**
 * Ensure assignments exist for all eligible students of an exam's targetClasses.
 * Creates missing rows (without shift yet).
 */
async function ensureAssignmentsForClasses(examId) {
  const exam = await Exam.findByPk(examId);
  if (!exam) throw new Error('Exam not found');

  const where = { role: 'STUDENT', isActive: true };

  if (exam.targetClasses) {
    const classList = exam.targetClasses
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (classList.length > 0) {
      where.className = { [Op.in]: classList };
    }
  }

  const students = await User.findAll({ where, attributes: ['id'] });
  let created = 0;

  for (const s of students) {
    const [, wasCreated] = await ExamAssignment.findOrCreate({
      where: { userId: s.id, examId: exam.id },
      defaults: { canAttempt: true, admitCardReleased: false },
    });
    if (wasCreated) created++;
  }

  return { created, total: students.length };
}

/**
 * Auto-assign shifts for a given exam.
 * Called when admin releases admit cards.
 */
async function allocateShiftsForExam(examId) {
  const exam = await Exam.findByPk(examId);
  if (!exam) throw new Error('Exam not found');

  const capacity = Math.max(1, Number(exam.studentsPerShift || 25));

  const existing = await ExamAssignment.findAll({
    where: { examId },
    include: [
      {
        model: User,
        attributes: ['id', 'registrationId', 'name', 'className'],
      },
    ],
    order: [
      [{ model: User }, 'registrationId', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  const examDate =
    typeof exam.date === 'string'
      ? exam.date
      : exam.date.toISOString().slice(0, 10);

  let assigned = 0;
  let highestShift = 0;

  for (let i = 0; i < existing.length; i++) {
    const a = existing[i];

    const groupIndex = Math.floor(i / capacity);
    const shiftNameIndex = groupIndex % SHIFTS_PER_DAY;
    const dayIndex = Math.floor(groupIndex / SHIFTS_PER_DAY);
    const shiftNumber = groupIndex + 1;

    const shiftName = DEFAULT_SHIFT_NAMES[shiftNameIndex];
    const assignedDate = addDays(examDate, dayIndex);

    const { startTime, endTime } = computeShiftTimes(
      exam.startTime,
      exam.duration,
      shiftNameIndex
    );

    const seq = (i % capacity) + 1;

    await a.update({
      shiftNumber,
      shiftName,
      shiftDayIndex: dayIndex,
      assignedDate,
      startTime,
      endTime,
      rollNumber: makeRollNumber(exam.id, shiftNumber, seq),
      admitCardReleased: true,
    });

    highestShift = shiftNumber;
    assigned++;
  }

  exam.admitCardReleased = true;
  await exam.save();

  return {
    assigned,
    totalShifts: highestShift,
    capacity,
    examId: exam.id,
  };
}

module.exports = {
  allocateShiftsForExam,
  ensureAssignmentsForClasses,
  decodeShiftNumber,
  computeShiftTimes,
  addDays,
};
