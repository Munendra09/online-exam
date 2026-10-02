const fs = require('fs');
const csv = require('csv-parser');
const { Question } = require('../models');

/**
 * Normalize answer value to uppercase A/B/C/D
 */
function normalizeAnswer(value) {
  const s = String(value || '').trim().toUpperCase();
  return ['A', 'B', 'C', 'D'].includes(s) ? s : null;
}

/* ============================================================
 * Upload CSV Questions for an Exam
 * CSV columns: question, optionA, optionB, optionC, optionD, correctAnswer
 * NO difficulty column needed — questions belong to exam which targets classes
 * ============================================================ */
exports.uploadCsv = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'CSV file required' });
  }

  const examId = req.params.examId;
  const rows = [];
  const errors = [];
  let line = 1;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      line++;

      const q = {
        examId,
        question: row.question?.trim(),
        optionA: row.optionA?.trim(),
        optionB: row.optionB?.trim(),
        optionC: row.optionC?.trim(),
        optionD: row.optionD?.trim(),
        correctAnswer: normalizeAnswer(row.correctAnswer),
      };

      // Validate required fields
      if (!q.question || !q.optionA || !q.optionB || !q.optionC || !q.optionD) {
        errors.push({ line, message: 'Question and all options (A-D) are required' });
      } else if (!q.correctAnswer) {
        errors.push({ line, message: 'correctAnswer must be A, B, C, or D' });
      } else {
        rows.push(q);
      }
    })
    .on('end', async () => {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      if (errors.length) {
        return res.status(400).json({
          success: false,
          message: `CSV validation failed: ${errors.length} errors found`,
          errors,
          validRows: rows.length,
        });
      }

      // Deduplicate within CSV itself (no repeat questions)
      const seen = new Set();
      const uniqueRows = [];
      for (const row of rows) {
        const key = row.question.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueRows.push(row);
        }
      }

      // Check for existing questions in DB (prevent re-upload duplicates)
      const existing = await Question.findAll({
        where: { examId },
        attributes: ['question'],
      });
      const existingSet = new Set(existing.map(q => q.question.toLowerCase().trim()));

      const newRows = uniqueRows.filter(r => !existingSet.has(r.question.toLowerCase().trim()));
      const skipped = uniqueRows.length - newRows.length;

      if (newRows.length > 0) {
        await Question.bulkCreate(newRows);
      }

      res.json({
        success: true,
        message: `${newRows.length} questions uploaded${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`,
        inserted: newRows.length,
        skipped,
      });
    })
    .on('error', (err) => {
      res.status(500).json({ success: false, message: err.message });
    });
};

/* ============================================================
 * List Questions (with filters)
 * ============================================================ */
exports.list = async (req, res) => {
  const where = {};

  if (req.query.examId) where.examId = req.query.examId;

  const questions = await Question.findAll({
    where,
    order: [['id', 'ASC']],
    limit: Number(req.query.limit || 500),
  });

  res.json({ success: true, questions, total: questions.length });
};

/* ============================================================
 * Update a Single Question
 * ============================================================ */
exports.update = async (req, res) => {
  const question = await Question.findByPk(req.params.id);
  if (!question) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  await question.update(req.body);
  res.json({ success: true, question });
};

/* ============================================================
 * Delete a Single Question
 * ============================================================ */
exports.remove = async (req, res) => {
  const question = await Question.findByPk(req.params.id);
  if (!question) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  await question.destroy();
  res.json({ success: true, message: 'Question deleted' });
};

/* ============================================================
 * Delete All Questions for an Exam (before re-upload)
 * ============================================================ */
exports.deleteByExam = async (req, res) => {
  const count = await Question.destroy({
    where: { examId: req.params.examId },
  });

  res.json({
    success: true,
    message: `${count} questions deleted`,
    deleted: count,
  });
};

/* ============================================================
 * Question Stats for an Exam
 * ============================================================ */
exports.stats = async (req, res) => {
  const examId = req.params.examId;
  const total = await Question.count({ where: { examId } });

  res.json({
    success: true,
    stats: { total },
  });
};
